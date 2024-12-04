package main

import (
	"fmt"
	"strings"

	ll "github.com/ewen-lbh/label-logger-go"

	"github.com/ewen-lbh/miel/db"

	"github.com/emersion/go-imap/v2"
)

const SCREENER_MAILBOX_NAME = "Miel_Screener"

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
