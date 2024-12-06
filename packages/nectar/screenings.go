package main

import (
	"encoding/json"
	"fmt"
	"strings"
	"time"

	ll "github.com/ewen-lbh/label-logger-go"
	"github.com/redis/go-redis/v9"

	"github.com/ewen-lbh/miel/db"

	"github.com/emersion/go-imap/v2"
)

const SCREENER_MAILBOX_NAME = "Miel_Screener"

type DecisionPayload struct {
	Address string `json:"address"`
	InboxID string `json:"inboxId"`
}

func (c *LoggedInAccount) StartDecisionsListener() error {
	ll.Log("Listening", "magenta", "for screening decisions from Invertase")
	sub := redisClient.Subscribe(ctx, "screenings:decisions")

	err := sub.Ping(ctx)
	if err != nil {
		return fmt.Errorf("can't ping redis pubsub: %w", err)
	}

	go func(sub *redis.PubSub) {
		for msg := range sub.Channel() {
			// payload should contain address and inboxId
			var payload DecisionPayload
			err := json.Unmarshal([]byte(msg.Payload), &payload)
			if err != nil {
				ll.ErrorDisplay("while unmarshalling payload %q", err, msg.Payload)
				continue
			}

			// Find all email uids from this payload.Address
			emails, err := prisma.Email.FindMany(
				db.Email.Sender.Where(db.Address.Address.Equals(payload.Address)),
			).Exec(ctx)
			if err != nil {
				ll.ErrorDisplay("while getting all emails from %s", err, payload.Address)
				continue
			}

			// Find inbox name
			inbox, err := prisma.Mailbox.FindUnique(db.Mailbox.ID.Equals(payload.InboxID)).Exec(ctx)
			if err != nil {
				ll.ErrorDisplay("while getting inbox %s", err, payload.InboxID)
				continue
			}

			ll.Log("Screening", "blue", "%s to %s", payload.Address, inbox.Name)

			// Move all emails to the inbox
			_, err = c.imap.Select(inbox.Name, nil).Wait()
			if err != nil {
				ll.ErrorDisplay("while selecting mailbox %s", err, inbox.Name)
				continue
			}

			toMoveUids := imap.UIDSetNum()
			for _, email := range emails {
				toMoveUids.AddNum(imap.UID(email.InternalUID))
			}

			// Get seqnums
			results, err := c.imap.Search(&imap.SearchCriteria{
				UID: []imap.UIDSet{toMoveUids},
			}, &imap.SearchOptions{
				ReturnAll:   true,
				ReturnMin:   true,
				ReturnMax:   true,
				ReturnCount: true,
			}).Wait()

			if err != nil {
				ll.ErrorDisplay("while getting seqnums for uids to move (%#v)", err, toMoveUids)
				continue
			}

			err = c.Move(imap.SeqSetNum(results.AllSeqNums()...), inbox.Name, 2*time.Second)
			if err != nil {
				ll.ErrorDisplay("while moving emails from %q to %s", err, payload.Address, inbox.Name)
			}

		}
	}(sub)

	return nil
}

func (c *LoggedInAccount) SyncScreenings() error {
	ll.Log("Syncing", "magenta", "screenings")
	addresses, err := prisma.Address.FindMany(
		db.Address.DefaultInboxID.IsNull(),
		db.Address.SentEmails.Some(db.Email.Inbox.Where(db.Mailbox.Type.Not(db.MailboxTypeScreener))),
	).Exec(ctx)

	if err != nil {
		return fmt.Errorf("while getting all inboxes from DB: %w", err)
	}

	toScreen := make([]db.EmailModel, 0)

	ll.StartProgressBar(len(addresses), "Analyzing", "cyan")
	for _, address := range addresses {
		screenableMails, err := prisma.Email.FindMany(
			db.Email.SenderID.Equals(address.ID),
			db.Email.Inbox.Where(
				db.Mailbox.Type.NotIn([]db.MailboxType{
					// It makes no sense to screen emails from drafts, sent box or trash
					db.MailboxTypeDrafts,
					db.MailboxTypeSentbox,
					db.MailboxTypeTrashbox,
					db.MailboxTypeScreener,
				}),
			),
		).With(db.Email.Inbox.Fetch()).Exec(ctx)

		if err != nil {
			return fmt.Errorf("while getting screenable mails from %+v: %w", address, err)
		}

		toScreen = append(toScreen, screenableMails...)
		ll.IncrementProgressBar()
	}
	ll.StopProgressBar()

	changedMailboxes := make([]string, 0)

	ll.Info("%d to screen", len(toScreen))
	if len(toScreen) > 0 {
		toScreenByMailbox := groupby(toScreen, func(email db.EmailModel) string {
			return email.InboxID + ":" + email.Inbox().Name
		})

		ll.StartProgressBar(len(toScreenByMailbox), "Screening", "blue")

		for mboxAndBoxId, mails := range toScreenByMailbox {
			boxId := strings.SplitN(mboxAndBoxId, ":", 2)[0]
			mbox := strings.SplitN(mboxAndBoxId, ":", 2)[1]
			_, err = c.imap.Select(mbox, nil).Wait()
			if err != nil {
				return fmt.Errorf("while selecting mailbox %s: %w", mbox, err)
			}

			toScreenUids := imap.UIDSetNum()
			for _, mail := range mails {
				toScreenUids.AddNum(imap.UID(mail.InternalUID))
			}

			results, err := c.imap.Search(&imap.SearchCriteria{
				UID: []imap.UIDSet{toScreenUids},
			}, &imap.SearchOptions{
				ReturnAll:   true,
				ReturnMin:   true,
				ReturnMax:   true,
				ReturnCount: true,
			}).Wait()

			ll.Debug("results: %+v", results)
			if err != nil {
				return fmt.Errorf("while getting seqnums for uids to screen (%#v): %w", toScreenUids, err)
			}

			if results.Count > 0 {
				err = c.Screen(imap.SeqSetNum(results.AllSeqNums()...))
				if err != nil {
					return fmt.Errorf("while screening emails: %w", err)
				}

				changedMailboxes = append(changedMailboxes, boxId)
			}

			ll.IncrementProgressBar()

		}

		ll.StopProgressBar()
	}

	screenerInboxId, ok := c.account.ScreenerBoxID()
	if ok {
		err := c.SyncMails(screenerInboxId)
		if err != nil {
			return fmt.Errorf("while re-syncing screenbox after screenings sync: %w", err)
		}
		redisClient.Publish(ctx, fmt.Sprintf("screenings:updates:%s", c.account.ID), "updated")
	}

	for _, boxId := range changedMailboxes {
		if err != nil {
			return fmt.Errorf("while getting id from mailbox name %q: %w", boxId, err)
		}

		err = c.SyncMails(boxId)
		if err != nil {
			return fmt.Errorf("while re-syncing %s after screenings sync: %w", boxId, err)
		}
	}

	return nil
}

func (c *LoggedInAccount) EnsureHasScreenerBox() error {
	boxes, err := c.imap.List("", SCREENER_MAILBOX_NAME, &imap.ListOptions{}).Collect()
	if err != nil {
		return fmt.Errorf("while listing existing mailboxes: %w", err)
	}

	if len(boxes) > 0 {
		return nil
	}

	ll.Log("Creating", "magenta", "mailbox for the Screener")

	err = c.imap.Create(SCREENER_MAILBOX_NAME, &imap.CreateOptions{}).Wait()
	if err != nil {
		return fmt.Errorf("while creating Screener inbox: %w", err)
	}

	err = c.Reconnect(nil)
	if err != nil {
		return fmt.Errorf("while reconnecting after creating Screener inbox: %w", err)
	}

	return nil
}
