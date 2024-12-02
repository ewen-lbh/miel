package main

import (
	"bytes"
	"context"
	"errors"
	"fmt"
	"mime"
	"os"
	"strconv"
	"strings"
	"time"

	// "os"

	ll "github.com/ewen-lbh/label-logger-go"

	"github.com/ewen-lbh/miel/db"

	"github.com/emersion/go-imap/v2"
	"github.com/emersion/go-imap/v2/imapclient"
	"github.com/emersion/go-message/charset"
	"github.com/ewen-lbh/parsemail"
)

const SCREENER_MAILBOX_NAME = "Miel_Screener"

var prisma *db.PrismaClient

func init() {
	prisma = db.NewClient()
	if err := prisma.Connect(); err != nil {
		panic(fmt.Sprintf("could not connect to database: %v", err))
	}
}

type LoggedInAccount struct {
	imap    *imapclient.Client
	account *db.AccountModel
}

func main() {
	if os.Getenv("VACUUM") == "YESPLZ" {
		prisma.Email.FindMany().Delete().Exec(context.Background())
		prisma.Address.FindMany().Delete().Exec(context.Background())
		prisma.Mailbox.FindMany().Delete().Exec(context.Background())
	}

	// Create account via CLI: account create <host> <port> <secure|insecure> <username> <password>
	if len(os.Args) == 8 && os.Args[1] == "account" && os.Args[2] == "create" {
		portNum, err := strconv.Atoi(os.Args[4])
		if err != nil {
			ll.ErrorDisplay("invalid port number", err)
			return
		}

		receiver, err := prisma.Server.CreateOne(
			db.Server.Host.Set(os.Args[3]),
			db.Server.Port.Set(portNum),
			db.Server.Secure.Set(os.Args[5] == "secure"),
			db.Server.Username.Set(os.Args[6]),
			db.Server.Type.Set(db.ServerTypeImap),
		).Exec(context.Background())
		if err != nil {
			ll.ErrorDisplay("couldn't create Server", err)
		}

		auth, err := prisma.ServerAuth.CreateOne(
			db.ServerAuth.Username.Set(os.Args[6]),
			db.ServerAuth.Password.Set(os.Args[7]),
		).Exec(context.Background())
		if err != nil {
			ll.ErrorDisplay("couldn't create ServerAuth", err)
		}

		_, err = prisma.Account.CreateOne(
			db.Account.Address.Set(os.Args[3]),
			db.Account.Name.Set(os.Args[3]),
			db.Account.ReceiverServer.Link(db.Server.ID.Equals(receiver.ID)),
			db.Account.ReceiverAuth.Link(db.ServerAuth.ID.Equals(auth.ID)),
		).Exec(context.Background())
		if err != nil {
			ll.ErrorDisplay("couldn't create Account", err)
		}

	}

	ll.Debug("Syncing first account")

	acct, err := prisma.Account.FindFirst().With(
		db.Account.ReceiverServer.Fetch(),
		db.Account.ReceiverAuth.Fetch(),
		db.Account.Mainbox.Fetch(),
		db.Account.Trashbox.Fetch(),
		db.Account.Draftsbox.Fetch(),
		db.Account.Sentbox.Fetch(),
		db.Account.ScreenerBox.Fetch(),
	).Exec(context.Background())

	if err != nil {
		if errors.Is(err, db.ErrNotFound) {
			ll.Log("Nothing", "red", "to sync (no accounts exist)")
			return
		}
		ll.ErrorDisplay("while getting all accounts", err)
	}

	accountId := acct.ID

	options := &imapclient.Options{
		WordDecoder: &mime.WordDecoder{CharsetReader: charset.Reader},
	}

	if os.Getenv("DEBUG") == "1" {
		options.DebugWriter = os.Stderr
	}

	client, err := imapclient.DialTLS(
		fmt.Sprintf("%s:%d", acct.ReceiverServer().Host, acct.ReceiverServer().Port),
		options,
	)

	password, hasPassword := acct.ReceiverAuth().Password()
	if !hasPassword {
		err = fmt.Errorf("non-password servers are not supported")
		return
	}

	err = client.Login(acct.ReceiverAuth().Username, password).Wait()
	if err != nil {
		err = fmt.Errorf("could not login: %w", err)
		return
	}

	c := LoggedInAccount{imap: client, account: acct}

	err = c.EnsureHasScreenerBox()
	if err != nil {
		ll.ErrorDisplay("while ensuring screener box exists", err)
	}

	err = c.SyncInboxes()
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

func (c LoggedInAccount) SyncInboxes() (err error) {
	acct, err := prisma.Account.FindUnique(db.Account.ID.Equals(c.account.ID)).With(
		db.Account.ReceiverServer.Fetch(),
		db.Account.Trashbox.Fetch(),
	).Exec(context.Background())

	if err != nil {
		err = fmt.Errorf("could not dial tls: %w", err)
		return
	}

	boxes, err := c.imap.List("", "%", &imap.ListOptions{
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

		var dbBox *db.MailboxModel
		dbBox, err = prisma.Mailbox.UpsertOne(
			db.Mailbox.AccountIDNameInternalUIDValidity(
				db.Mailbox.AccountID.Equals(c.account.ID),
				db.Mailbox.Name.Equals(box.Mailbox),
				db.Mailbox.InternalUIDValidity.Equals(int(box.Status.UIDValidity)),
			),
		).Create(
			db.Mailbox.InternalUIDValidity.Set(int(box.Status.UIDValidity)),
			db.Mailbox.Account.Link(db.Account.ID.Equals(c.account.ID)),
			db.Mailbox.Type.Set(inferMailboxType(box)), // TODO
			db.Mailbox.Name.Set(box.Mailbox),
		).Update(
			db.Mailbox.Name.Set(box.Mailbox),
		).Exec(context.Background())

		if _, ok := acct.Mainbox(); !ok && inferIsMainInbox(box) {
			_, err = prisma.Account.FindUnique(db.Account.ID.Equals(c.account.ID)).Update(
				db.Account.Mainbox.Link(db.Mailbox.ID.Equals(dbBox.ID)),
			).Exec(context.Background())
			if err != nil {
				err = fmt.Errorf("while linking mainbox %s to account: %w", box.Mailbox, err)
				return
			}
		}

		if _, ok := acct.Trashbox(); !ok && dbBox.Type == db.MailboxTypeTrashbox {
			_, err = prisma.Account.FindUnique(db.Account.ID.Equals(c.account.ID)).Update(
				db.Account.Trashbox.Link(db.Mailbox.ID.Equals(dbBox.ID)),
			).Exec(context.Background())
			if err != nil {
				err = fmt.Errorf("while linking trashbox %s to account: %w", box.Mailbox, err)
				return
			}
		}

		if _, ok := acct.Draftsbox(); !ok && dbBox.Type == db.MailboxTypeDrafts {
			_, err = prisma.Account.FindUnique(db.Account.ID.Equals(c.account.ID)).Update(
				db.Account.Draftsbox.Link(db.Mailbox.ID.Equals(dbBox.ID)),
			).Exec(context.Background())
			if err != nil {
				err = fmt.Errorf("while linking draftsbox %s to account: %w", box.Mailbox, err)
				return
			}
		}

		if _, ok := acct.Sentbox(); !ok && dbBox.Type == db.MailboxTypeSentbox {
			_, err = prisma.Account.FindUnique(db.Account.ID.Equals(c.account.ID)).Update(
				db.Account.Sentbox.Link(db.Mailbox.ID.Equals(dbBox.ID)),
			).Exec(context.Background())
			if err != nil {
				err = fmt.Errorf("while linking sentbox %s to account: %w", box.Mailbox, err)
			}
		}

		if _, ok := acct.ScreenerBox(); !ok && dbBox.Type == db.MailboxTypeScreener {
			_, err = prisma.Account.FindUnique(db.Account.ID.Equals(c.account.ID)).Update(
				db.Account.ScreenerBox.Link(db.Mailbox.ID.Equals(dbBox.ID)),
			).Exec(context.Background())
			if err != nil {
				err = fmt.Errorf("while linking screenerbox %s to account: %w", box.Mailbox, err)
			}
		}

		if err != nil {
			err = fmt.Errorf("could not upsert mailbox %s to DB: %w", box.Mailbox, err)
			return
		}
	}

	updatedAcct, _ := prisma.Account.FindUnique(db.Account.ID.Equals(c.account.ID)).With(
		db.Account.Mainbox.Fetch(),
		db.Account.Trashbox.Fetch(),
		db.Account.Draftsbox.Fetch(),
		db.Account.Sentbox.Fetch(),
		db.Account.ScreenerBox.Fetch(),
	).Exec(context.Background())

	*c.account = *updatedAcct

	return
}

func inferIsMainInbox(mailbox *imap.ListData) bool {
	return mailbox.Mailbox == "INBOX"
}

func inferMailboxType(mailbox *imap.ListData) db.MailboxType {
	switch mailbox.Mailbox {
	case "Trash", "Junk":
		return db.MailboxTypeTrashbox
	case "Drafts":
		return db.MailboxTypeDrafts
	case "Sent":
		return db.MailboxTypeSentbox
	case SCREENER_MAILBOX_NAME:
		return db.MailboxTypeScreener
	default:
		return db.MailboxTypeInbox
	}
}

func (c LoggedInAccount) Move(mailseq imap.NumSet, inbox string) error {

	_, err, timedout := timeout(3*time.Second, func() (*imapclient.MoveData, error) {
		return c.imap.Move(mailseq, inbox).Wait()
	})
	if timedout {
		return fmt.Errorf("timed out while moving email to trash")
	}
	return err
}

func (c LoggedInAccount) Trash(mailseq imap.NumSet) error {
	trashbox, ok := c.account.Trashbox()
	if !ok {
		return fmt.Errorf("no trashbox for this account")
	}

	return c.Move(mailseq, trashbox.Name)
}

func (c LoggedInAccount) Screen(mailseq imap.NumSet) error {
	screenerBox, ok := c.account.ScreenerBox()
	if !ok {
		return fmt.Errorf("no screenerbox for this account")
	}

	return c.Move(mailseq, screenerBox.Name)
}

func (c LoggedInAccount) SyncMails(inboxId string) error {
	box, err := prisma.Mailbox.FindUnique(db.Mailbox.ID.Equals(inboxId)).Exec(context.Background())

	if err != nil {
		return fmt.Errorf("while getting inbox %s: %w", inboxId, err)
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
			ll.Warn("email %+v has no sender or recipient, deleting", mail.Envelope)
			c.Trash(imap.SeqSetNum(mail.SeqNum))
			ll.IncrementProgressBar()
			continue
		}

		screeningSender := false
		if screenerBoxId, ok := c.account.ScreenerBoxID(); ok {
			_, err := prisma.Address.FindFirst(
				db.Address.Address.Equals(envelope.From[0].Addr()),
				db.Address.SentEmails.Some(db.Email.InboxID.Equals(screenerBoxId)),
			).Exec(context.Background())

			screeningSender = err != nil && errors.Is(err, db.ErrNotFound)
		}

		if screeningSender {
			ll.Log("Screening", "blue", "email from %s", envelope.From[0].Addr())
			err := c.Screen(imap.SeqSetNum(mail.SeqNum))
			if err != nil {
				ll.WarnDisplay("could not move email to screener: %w", err)
			}
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
		bodyRaw := ""

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
			bodyRaw = string(body)
			parsed, err := parsemail.Parse(bytes.NewReader(body))
			if err != nil {
				ll.WarnDisplay("could not parse email body for %q: %w", err, envelope.Subject)
				mail.BodyStructure.Walk(func(path []int, part imap.BodyStructure) (walkChildren bool) {
					ll.Debug("part: %+v", part)
					return true
				})
				os.WriteFile("body.eml", body, 0644)
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

			actualInboxId := inboxId
			if screeningSender {
				actualInboxId, _ = c.account.ScreenerBoxID()
			}

			_, err = prisma.Email.CreateOne(
				db.Email.InternalUID.Set(int(mail.UID)),
				db.Email.ReceivedAt.Set(envelope.Date),
				db.Email.Sender.Link(db.Address.ID.Equals(sender.ID)),
				db.Email.Recipient.Link(db.Address.ID.Equals(recipient.ID)),
				db.Email.Subject.Set(envelope.Subject),
				db.Email.OriginalSubject.Set(envelope.Subject),
				db.Email.TextBody.Set(bodyText),
				db.Email.HTMLBody.Set(bodyHTML),
				db.Email.RawBody.Set(bodyRaw),
				db.Email.Inbox.Link(db.Mailbox.ID.Equals(actualInboxId)),
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

func (c LoggedInAccount) EnsureHasScreenerBox() error {
	if _, ok := c.account.ScreenerBoxID(); ok {
		return nil
	}

	ll.Log("Creating", "magenta", "mailbox for the Screener")

	err := c.imap.Create(SCREENER_MAILBOX_NAME, &imap.CreateOptions{}).Wait()
	if err != nil {
		return fmt.Errorf("while creating Screener inbox: %w", err)
	}

	return nil
}
