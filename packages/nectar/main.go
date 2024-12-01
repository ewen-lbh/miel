package main

import (
	"context"
	"errors"
	"fmt"
	"mime"

	// "os"

	ll "github.com/ewen-lbh/label-logger-go"

	"gwen.works/miel/db"

	"github.com/emersion/go-imap/v2"
	"github.com/emersion/go-imap/v2/imapclient"
	"github.com/emersion/go-message/charset"
)

var prisma *db.PrismaClient

func init() {
	prisma = db.NewClient()
	if err := prisma.Connect(); err != nil {
		panic(fmt.Sprintf("could not connect to database: %v", err))
	}
}

type LoggedInAccount struct {
	imap *imapclient.Client
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

	server, err := prisma.Account.FindUnique(db.Account.ID.Equals(accountId)).With(
		db.Account.ReceiverServer.Fetch(),
	).Exec(context.Background())

	options := &imapclient.Options{
		WordDecoder: &mime.WordDecoder{CharsetReader: charset.Reader},
		// DebugWriter: os.Stderr,
	}

	client, err := imapclient.DialTLS(
		fmt.Sprintf("%s:%d", server.ReceiverServer().Host, server.ReceiverServer().Port),
		options,
	)

	c = LoggedInAccount{imap: client}

	if err != nil {
		err = fmt.Errorf("could not dial tls: %w", err)
		return
	}

	password, hasPassword := server.ReceiverServer().Password()
	if !hasPassword {
		err = fmt.Errorf("non-password servers are not supported")
		return
	}

	err = client.Login(server.ReceiverServer().Username, password).Wait()
	if err != nil {
		err = fmt.Errorf("could not login: %w", err)
		return
	}

	list := client.List("", "%", &imap.ListOptions{
		ReturnStatus: &imap.StatusOptions{
			NumMessages: true,
			NumUnseen:   true,
		},
	})

	for {
		box := list.Next()
		if box == nil {
			break
		}
		ll.Log("Upserting", "magenta", "mailbox %s", box.Mailbox)

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

func (c LoggedInAccount) SyncMails(inboxId string) error {
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
						Start: imap.UID(lastEmail.InternalUID),
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

	if result.Count == 0 {
		ll.Log("Up-to-date", "blue", "in %s (out of %d)", box.Name, data.NumMessages)
		return nil
	}

	ll.Log("Fetching", "cyan", "%d emails in %s (out of %d)", result.Count, box.Name, data.NumMessages)

	mails := c.imap.Fetch(seqset, &imap.FetchOptions{
		Envelope: true,
		Flags:    true,
		// BodyStructure: &imap.FetchItemBodyStructure{
		// 	Extended: true,
		// },
		InternalDate: true,
		UID:          true,
		BodySection: []*imap.FetchItemBodySection{
			{Specifier: imap.PartSpecifierHeader},
			// {Specifier: imap.PartSpecifierText},
			// {Specifier: imap.PartSpecifierMIME, Peek: true},
		},
	})

	headers := make([]string, 0)
	ms, _ := mails.Collect()
	for _, m := range ms {
		headers = append(headers, m.Envelope.Subject)
	}

	fmt.Printf("Headers: %v\n", headers)
	return nil

	defer mails.Close()

	ll.StartProgressBar(seqsetSize(seqset), "Saving", "cyan")
	defer ll.StopProgressBar()
	for mailbuf := mails.Next(); mailbuf != nil; noop() {
		mail, err := mailbuf.Collect()
		if err != nil {
			return fmt.Errorf("while getting data for mailbuf %v: %w", mailbuf.SeqNum, err)
		}
		if mail == nil || mail.Envelope == nil {
			break
		}
		envelope := mail.Envelope

		// ll.UpdateProgressBar("Saving", "cyan", "email", envelope.Subject)

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

		prisma.Email.CreateOne(
			db.Email.InternalUID.Set(int(mail.UID)),
			db.Email.Sender.Link(db.Address.ID.Equals(sender.ID)),
			db.Email.Recipient.Link(db.Address.ID.Equals(recipient.ID)),
			db.Email.Subject.Set(envelope.Subject),
			db.Email.TextBody.Set(""),
			db.Email.HTMLBody.Set(""),
			db.Email.RawBody.Set(""),
			db.Email.Inbox.Link(db.Mailbox.ID.Equals(inboxId)),
			db.Email.Trusted.Set(contains(mail.Flags, imap.FlagNotJunk)),
		)
		if !ll.ProgressBarFinished() {
			ll.IncrementProgressBar()
		}
	}

	return nil

}
