package main

import (
	"bytes"
	"context"
	"errors"
	"fmt"
	"mime"
	"os"
	"strings"
	"time"

	// "os"

	ll "github.com/ewen-lbh/label-logger-go"

	"gwen.works/miel/db"

	"github.com/emersion/go-imap/v2"
	"github.com/emersion/go-imap/v2/imapclient"
	"github.com/emersion/go-message/charset"
	"github.com/k3a/parsemail"
)

var prisma *db.PrismaClient

func init() {
	prisma = db.NewClient()
	if err := prisma.Connect(); err != nil {
		panic(fmt.Sprintf("could not connect to database: %v", err))
	}
}

type LoggedInAccount struct {
	imap     *imapclient.Client
	trashbox *db.MailboxModel
}

func main() {
	accountId := "cm44sxv0g00001lqc84qgi0yh"
	c, err := SyncInboxes(accountId)
	if err != nil {
		ll.ErrorDisplay("could not sync inboxes for %s", err, accountId)
		return
	}

	inboxes, err := prisma.Mailbox.FindMany(db.Mailbox.AccountID.Equals(accountId)).Exec(context.Background())
	if err != nil {
		ll.ErrorDisplay("could not get mailboxes for %s from db: %w", err, accountId)
		return
	}

	for _, inbox := range inboxes {
		err = c.SyncMails(inbox.ID)
		if err != nil {
			ll.WarnDisplay("could not sync mails for %s: %w", err, inbox.ID)
		}
	}

	ll.Log("Done", "green", "syncing inboxes and mails")
}

func SyncInboxes(accountId string) (c LoggedInAccount, err error) {
	acct, err := prisma.Account.FindUnique(db.Account.ID.Equals(accountId)).With(
		db.Account.ReceiverServer.Fetch(),
		db.Account.Trashbox.Fetch(),
	).Exec(context.Background())

	options := &imapclient.Options{
		WordDecoder: &mime.WordDecoder{CharsetReader: charset.Reader},
		// DebugWriter: os.Stderr,
	}

	client, err := imapclient.DialTLS(
		fmt.Sprintf("%s:%d", acct.ReceiverServer().Host, acct.ReceiverServer().Port),
		options,
	)

	c = LoggedInAccount{imap: client}
	if trashbox, ok := acct.Trashbox(); ok {
		c.trashbox = trashbox
	}

	if err != nil {
		err = fmt.Errorf("could not dial tls: %w", err)
		return
	}

	password, hasPassword := acct.ReceiverServer().Password()
	if !hasPassword {
		err = fmt.Errorf("non-password servers are not supported")
		return
	}

	err = client.Login(acct.ReceiverServer().Username, password).Wait()
	if err != nil {
		err = fmt.Errorf("could not login: %w", err)
		return
	}

	boxes, err := client.List("", "%", &imap.ListOptions{
		ReturnStatus: &imap.StatusOptions{
			NumMessages: true,
			NumUnseen:   true,
		},
	}).Collect()

	if err != nil {
		err = fmt.Errorf("while listing mailboxes for %s: %w", acct.ReceiverServer().Host, err)
		return
	}

	for _, box := range boxes {
		if box == nil {
			break
		}
		ll.Log("Upserting", "magenta", "mailbox %s", box.Mailbox)
		ll.Debug("box: %+v", box)

		if _, ok := acct.Trashbox(); (box.Mailbox == "Trash" || box.Mailbox == "Junk") && !ok {
			var trashbox *db.MailboxModel
			trashbox, err = prisma.Mailbox.UpsertOne(
				db.Mailbox.AccountIDNameInternalUIDValidity(
					db.Mailbox.AccountID.Equals(accountId),
					db.Mailbox.Name.Equals(box.Mailbox),
					db.Mailbox.InternalUIDValidity.Equals(int(box.Status.UIDValidity)),
				),
			).Update(
				db.Mailbox.Trashbox.Link(db.Account.ID.Equals(accountId)),
			).Create(
				db.Mailbox.InternalUIDValidity.Set(int(box.Status.UIDValidity)),
				db.Mailbox.Account.Link(db.Account.ID.Equals(accountId)),
				db.Mailbox.Type.Set(db.MailboxTypeTrashbox),
				db.Mailbox.Name.Set(box.Mailbox),
				db.Mailbox.Trashbox.Link(db.Account.ID.Equals(accountId)),
			).Exec(context.Background())
			if err != nil {
				err = fmt.Errorf("while storing trashbox for account %s: %w", acct.Address, err)
				return
			}
			c.trashbox = trashbox
			continue

		}

		_, err = prisma.Mailbox.UpsertOne(
			db.Mailbox.AccountIDNameInternalUIDValidity(
				db.Mailbox.AccountID.Equals(accountId),
				db.Mailbox.Name.Equals(box.Mailbox),
				db.Mailbox.InternalUIDValidity.Equals(int(box.Status.UIDValidity)),
			),
		).Create(
			db.Mailbox.InternalUIDValidity.Set(int(box.Status.UIDValidity)),
			db.Mailbox.Account.Link(db.Account.ID.Equals(accountId)),
			db.Mailbox.Type.Set(db.MailboxTypeInbox), // TODO
			db.Mailbox.Name.Set(box.Mailbox),
		).Update(
			db.Mailbox.Name.Set(box.Mailbox),
		).Exec(context.Background())

		if err != nil {
			err = fmt.Errorf("could not upsert mailbox %s to DB: %w", box.Mailbox, err)
			return
		}
	}

	return
}

func (c LoggedInAccount) Trash(mailseq imap.NumSet) error {
	if c.trashbox == nil {
		return fmt.Errorf("no trashbox for this account")
	}

	_, err, timedout := timeout(3*time.Second, func() (*imapclient.MoveData, error) {
		return c.imap.Move(mailseq, c.trashbox.Name).Wait()
	})
	if timedout {
		return fmt.Errorf("timed out while moving email to trash")
	}
	return err
}

func (c LoggedInAccount) SyncMails(inboxId string) error {
	if os.Getenv("VACUUM") == "YESPLZ" {
		prisma.Email.FindMany(db.Email.InboxID.Equals(inboxId)).
			// OrderBy(db.Email.InternalUID.Order(db.SortOrderDesc)).
			// Take(30).
			Delete().
			Exec(context.Background())
	}

	box, err := prisma.Mailbox.FindUnique(db.Mailbox.ID.Equals(inboxId)).Exec(context.Background())

	if err != nil {
		return fmt.Errorf("while getting inbox %s: %w", box.Name, err)
	}

	inboxIsEmpty := false
	lastEmail, err := prisma.Email.FindFirst(
		db.Email.InboxID.Equals(inboxId),
	).OrderBy(
		db.Email.InternalUID.Order(db.DESC),
	).Exec(context.Background())
	if err != nil {
		if errors.Is(err, db.ErrNotFound) {
			inboxIsEmpty = true
		} else {
			return fmt.Errorf("while getting last email: %w", err)
		}
	}

	data, err := c.imap.Select(box.Name, &imap.SelectOptions{}).Wait()

	if err != nil {
		return fmt.Errorf("while selecting mailbox %s: %w", box.Name, err)
	}

	var uidSearchCriteria *imap.SearchCriteria

	if inboxIsEmpty {
		uidSearchCriteria = &imap.SearchCriteria{}
	} else {
		uidSearchCriteria = &imap.SearchCriteria{
			UID: []imap.UIDSet{
				[]imap.UIDRange{
					{
						Start: imap.UID(lastEmail.InternalUID - 1),
						Stop:  imap.UID(0),
					},
				},
			},
		}
	}

	result, err := c.imap.Search(uidSearchCriteria, &imap.SearchOptions{
		ReturnAll:   true,
		ReturnCount: true,
		ReturnMin:   true,
		ReturnMax:   true,
	}).Wait()

	if err != nil {
		return fmt.Errorf("while getting seqset: while getting new UIDs from range \"%v:*\": %w", lastEmail.InternalUID, err)
	}

	seqset := imap.SeqSet{imap.SeqRange{Start: result.Min, Stop: result.Max}}

	if result.Count == 0 || result.Count == 1 {
		ll.Log("Up-to-date", "blue", "in %s (out of %d)", box.Name, data.NumMessages)
		return nil
	}

	ll.Log("Fetching", "cyan", "%d emails in %s (out of %d)", result.Count, box.Name, data.NumMessages)

	ll.Debug("seqset: %+v", seqset)

	mails := c.imap.Fetch(seqset, &imap.FetchOptions{
		Envelope: true,
		Flags:    true,
		BodyStructure: &imap.FetchItemBodyStructure{
			Extended: true,
		},
		InternalDate: true,
		UID:          true,
		BodySection:  []*imap.FetchItemBodySection{{}},
	})

	defer mails.Close()

	ll.StartProgressBar(seqsetSize(seqset), "Saving", "cyan")
	i := 0
	for {
		i++
		mailbuf := mails.Next()
		if mailbuf == nil {
			break
		}
		mail, err := mailbuf.Collect()
		if err != nil {
			return fmt.Errorf("could not collect mail: %w", err)
		}

		if mail == nil || mail.Envelope == nil {
			break
		}

		envelope := mail.Envelope
		if i == 1813 {
			ll.Log("Blocked on", "red", "%+v", envelope)
		}

		// // TODO remove (its for testing)
		// if envelope.MessageID != "2fd860f05783dc425d4134b7aa06910a@ewen.works" {
		// 	continue
		// }

		// ll.UpdateProgressBar("Saving", "cyan", "email", "")

		ccEmailAddrs := make([]string, 0, len(envelope.Cc))
		for _, cc := range envelope.Cc {
			ccEmailAddrs = append(ccEmailAddrs, cc.Addr())
		}

		ccAddresses, err := prisma.Address.FindMany(
			db.Address.Address.In(ccEmailAddrs),
		).Exec(context.Background())

		for _, cc := range envelope.Cc {
			found := false
			for _, ccAddress := range ccAddresses {
				if ccAddress.Address == cc.Addr() {
					found = true
					break
				}
			}

			if !found {
				a, err := prisma.Address.CreateOne(
					db.Address.Address.Set(cc.Addr()),
					db.Address.Name.Set(cc.Name),
					db.Address.Type.Set(db.AddressTypeRecipient),
				).Exec(context.Background())
				if err != nil {
					return fmt.Errorf("while creating db-address for cc %s: %w", cc.Addr(), err)
				}

				ccAddresses = append(ccAddresses, *a)
			}
		}

		if len(envelope.To) == 0 && len(ccAddresses) > 0 {
			envelope.To = append(envelope.To, imap.Address{
				Name:    ccAddresses[0].Name,
				Mailbox: strings.SplitN(ccAddresses[0].Address, "@", 2)[0],
				Host:    strings.SplitN(ccAddresses[0].Address, "@", 2)[1],
			})
		}

		if len(envelope.To) == 0 || len(envelope.From) == 0 {
			if c.trashbox != nil && c.trashbox.ID == inboxId {
				ll.IncrementProgressBar()
				continue
			}
			ll.Warn("email %+v has no sender or recipient, deleting", mail.Envelope)
			c.Trash(imap.SeqSetNum(mail.SeqNum))
			ll.IncrementProgressBar()
			continue
		}

		// fmt.Printf("Flags: %v\n", mail.Flags)
		// fmt.Printf("Date: %s\n", envelope.Date)
		sender, err := prisma.Address.UpsertOne(
			db.Address.Address.Equals(envelope.From[0].Addr()),
		).Create(
			db.Address.Address.Set(envelope.From[0].Addr()),
			db.Address.Name.Set(envelope.From[0].Name),
			db.Address.Type.Set(db.AddressTypeSender),
		).Update(
			db.Address.Name.Set(envelope.From[0].Name),
		).Exec(context.Background())

		if err != nil {
			return fmt.Errorf("while upserting db-address for sender %s: %w", envelope.From, err)
		}

		recipient, err := prisma.Address.UpsertOne(
			db.Address.Address.Equals(envelope.To[0].Addr()),
		).Create(
			db.Address.Address.Set(envelope.To[0].Addr()),
			db.Address.Name.Set(envelope.To[0].Name),
			db.Address.Type.Set(db.AddressTypeRecipient),
		).Update(
			db.Address.Name.Set(envelope.To[0].Name),
		).Exec(context.Background())

		if err != nil {
			return fmt.Errorf("while upserting db-address for recipient %s: %w", envelope.To, err)
		}

		bodyText := ""
		bodyHTML := ""

		messageidOrNull := &envelope.MessageID
		if envelope.MessageID == "" {
			messageidOrNull = nil
		}

		dbEmail, err := prisma.Email.FindFirst(
			db.Email.Or(
				db.Email.And(
					db.Email.InboxID.Equals(inboxId),
					db.Email.InternalUID.Equals(int(mail.UID)),
				),
				db.Email.MessageID.EqualsIfPresent(messageidOrNull),
			),
		).Exec(context.Background())

		if err != nil && !errors.Is(err, db.ErrNotFound) {
			return fmt.Errorf("while checking if email exists: %w", err)
		}

		mailReferences := make([]string, 0)

		if len(mail.BodySection) > 1 {
			return fmt.Errorf("mail has more than one body section: %v", mail.BinarySection)
		}

		if len(mail.BodySection) == 1 {
			_, body := firstmapEntry(mail.BodySection)
			parsed, err := parsemail.Parse(bytes.NewReader(body))
			if err != nil {
				ll.WarnDisplay("could not parse email body for %q: %w", err, envelope.Subject)
			}

			bodyText = parsed.TextBody
			bodyHTML = parsed.HTMLBody
			mailReferences = append(mailReferences, parsed.References...)
			mailReferences = append(mailReferences, parsed.InReplyTo...)
		}

		ll.Debug("references: %+v", mailReferences)

		// Keep references that actually exist in the database
		mails, err := prisma.Email.FindMany(
			db.Email.MessageID.In(mailReferences),
		).Select(
			db.Email.MessageID.Field(),
		).Exec(context.Background())

		mailReferencesQuery := make([]db.EmailWhereParam, 0, len(mailReferences))

		for _, ref := range mailReferences {
			for _, mail := range mails {
				if msgid, ok := mail.MessageID(); ok && msgid == ref {
					mailReferencesQuery = append(mailReferencesQuery, db.Email.MessageID.Equals(ref))
					break
				}
			}
		}

		linkReferences := make([]db.EmailSetParam, 0)
		if len(mailReferencesQuery) > 0 {
			linkReferences = append(linkReferences, db.Email.ThreadReferences.Link(mailReferencesQuery...))
		}

		if dbEmail == nil {
			_, err = prisma.Email.CreateOne(
				db.Email.InternalUID.Set(int(mail.UID)),
				db.Email.Sender.Link(db.Address.ID.Equals(sender.ID)),
				db.Email.Recipient.Link(db.Address.ID.Equals(recipient.ID)),
				db.Email.Subject.Set(envelope.Subject),
				db.Email.TextBody.Set(bodyText),
				db.Email.HTMLBody.Set(bodyHTML),
				db.Email.RawBody.Set(""),
				db.Email.Inbox.Link(db.Mailbox.ID.Equals(inboxId)),
				db.Email.Trusted.Set(contains(mail.Flags, imap.FlagNotJunk)),
				append([]db.EmailSetParam{
					db.Email.MessageID.SetOptional(messageidOrNull),
				}, linkReferences...)...,
			).Exec(context.Background())

			if err != nil {
				ll.WarnDisplay("could not save new email %q: %w", err, envelope.Subject)
			}
		} else {
			_, err = prisma.Email.FindUnique(db.Email.ID.Equals(dbEmail.ID)).Update(
				append([]db.EmailSetParam{
					db.Email.MessageID.SetIfPresent(messageidOrNull),
				}, linkReferences...)...,
			).Exec(context.Background())
			if err != nil {
				ll.WarnDisplay("could not update email %q: %w", err, envelope.Subject)
			}

		}

		if !ll.ProgressBarFinished() {
			ll.IncrementProgressBar()
		}
	}
	ll.StopProgressBar()

	return nil

}
