package main

import (
	"context"
	"errors"
	"fmt"
	"mime"
	"os"
	"strconv"
	"strings"
	"sync"
	"time"

	ll "github.com/ewen-lbh/label-logger-go"

	"github.com/ewen-lbh/miel/db"

	"github.com/emersion/go-imap/v2"
	"github.com/emersion/go-imap/v2/imapclient"
	"github.com/emersion/go-message/charset"
)

const SCREENER_MAILBOX_NAME = "Miel_Screener"

var prisma *db.PrismaClient

var ctx = context.Background()

func init() {
	prisma = db.NewClient()
	if err := prisma.Connect(); err != nil {
		panic(fmt.Sprintf("could not connect to database: %v", err))
	}
}

type LoggedInAccount struct {
	sync.Mutex

	imap    *imapclient.Client
	account db.AccountModel
}

func CreateIMAPClient(accountId string) (*LoggedInAccount, error) {
	client := LoggedInAccount{}

	err := client.ResyncAccount(accountId)
	if err != nil {
		return nil, fmt.Errorf("while getting account: %w", err)
	}

	imapClient, err := ConnectToIMAP(client.account.ReceiverServer(), client.account.ReceiverAuth(), nil)
	if err != nil {
		return nil, fmt.Errorf("while connecting to imap: %w", err)
	}

	client.imap = imapClient
	return &client, nil
}

func (c *LoggedInAccount) ResyncAccount(accountId string) error {
	acct, err := prisma.Account.FindUnique(db.Account.ID.Equals(accountId)).With(
		db.Account.ReceiverServer.Fetch(),
		db.Account.ReceiverAuth.Fetch(),
		db.Account.Mainbox.Fetch(),
		db.Account.Trashbox.Fetch(),
		db.Account.Draftsbox.Fetch(),
		db.Account.Sentbox.Fetch(),
		db.Account.ScreenerBox.Fetch(),
	).Exec(ctx)
	if err != nil {
		return fmt.Errorf("while resyncing db account %q on client: %w", accountId, err)
	}

	c.Lock()
	defer c.Unlock()
	c.account = *acct
	return nil
}

func (c *LoggedInAccount) Reconnect(options *imapclient.Options) error {
	c.Lock()
	defer c.Unlock()
	_, err, timedout := timeout(200*time.Millisecond, func() (any, error) { err := c.imap.Close(); return nil, err })
	if err != nil {
		return fmt.Errorf("couldn't close connection: %w", err)
	}
	if timedout {
		return fmt.Errorf("couldn't close connection: timed out")
	}

	c.imap, err = ConnectToIMAP(c.account.ReceiverServer(), c.account.ReceiverAuth(), options)
	if err != nil {
		return fmt.Errorf("while reconnecting: %w", err)
	}

	return nil
}

func ConnectToIMAP(server *db.ServerModel, auth *db.ServerAuthModel, options *imapclient.Options) (*imapclient.Client, error) {
	if options == nil {
		options = &imapclient.Options{
			WordDecoder: &mime.WordDecoder{CharsetReader: charset.Reader},
		}
	}

	if os.Getenv("DEBUG") == "1" {
		options.DebugWriter = os.Stderr
	}

	client, err, timedout := timeout(5*time.Second, func() (*imapclient.Client, error) {
		client, err := imapclient.DialTLS(
			fmt.Sprintf("%s:%d", server.Host, server.Port),
			options,
		)
		if err != nil {
			return nil, fmt.Errorf("while contacting IMAP server %s port %d: %w", server.Host, server.Port, err)
		}

		password, hasPassword := auth.Password()
		if !hasPassword {
			return nil, fmt.Errorf("non-password servers are not supported")
		}

		err = client.Login(auth.Username, password).Wait()
		if err != nil {
			return nil, fmt.Errorf("could not login: %w", err)
		}

		return client, nil
	})

	if timedout {
		return nil, fmt.Errorf("could not connect to server: timed out")
	}
	return *client, err
}

func main() {
	if os.Getenv("VACUUM") == "YESPLZ" {
		prisma.Email.FindMany().Delete().Exec(ctx)
		prisma.Address.FindMany().Delete().Exec(ctx)
		prisma.Mailbox.FindMany().Delete().Exec(ctx)
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
		).Exec(ctx)
		if err != nil {
			ll.ErrorDisplay("couldn't create Server", err)
		}

		auth, err := prisma.ServerAuth.CreateOne(
			db.ServerAuth.Username.Set(os.Args[6]),
			db.ServerAuth.Password.Set(os.Args[7]),
		).Exec(ctx)
		if err != nil {
			ll.ErrorDisplay("couldn't create ServerAuth", err)
		}

		_, err = prisma.Account.CreateOne(
			db.Account.Address.Set(os.Args[6]),
			db.Account.Name.Set(os.Args[3]),
			db.Account.ReceiverServer.Link(db.Server.ID.Equals(receiver.ID)),
			db.Account.ReceiverAuth.Link(db.ServerAuth.ID.Equals(auth.ID)),
		).Exec(ctx)
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
	).Exec(ctx)

	if err != nil {
		if errors.Is(err, db.ErrNotFound) {
			ll.Log("Nothing", "red", "to sync (no accounts exist)")
			return
		}
		ll.ErrorDisplay("while getting all accounts", err)
		return
	}

	accountId := acct.ID

	c, err := CreateIMAPClient(accountId)
	if err != nil {
		ll.ErrorDisplay("while creating imap client", err)
		return
	}

	err = c.EnsureHasScreenerBox()
	if err != nil {
		ll.ErrorDisplay("while ensuring screener box exists", err)
		return
	}

	err = c.SyncInboxes()
	if err != nil {
		ll.ErrorDisplay("could not sync inboxes for %s", err, accountId)
		return
	}

	inboxes, err := prisma.Mailbox.FindMany(db.Mailbox.AccountID.Equals(accountId)).Exec(ctx)
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

	err = c.SyncScreenings()
	if err != nil {
		ll.ErrorDisplay("could not sync screenings for %s: %w", err, accountId)
	}

	ll.Log("Done", "green", "syncing inboxes and mails")
	ll.Log("Starting", "cyan", "idle listener")

	err = c.StartIdleListener()
	if err != nil {
		ll.ErrorDisplay("while starting idle listener", err)
	}
}

func (c *LoggedInAccount) SyncInboxes() (err error) {
	acct, err := prisma.Account.FindUnique(db.Account.ID.Equals(c.account.ID)).With(
		db.Account.ReceiverServer.Fetch(),
		db.Account.Trashbox.Fetch(),
	).Exec(ctx)

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
		).Exec(ctx)

		if _, ok := acct.Mainbox(); !ok && inferIsMainInbox(box) {
			_, err = prisma.Account.FindUnique(db.Account.ID.Equals(c.account.ID)).Update(
				db.Account.Mainbox.Link(db.Mailbox.ID.Equals(dbBox.ID)),
			).Exec(ctx)
			if err != nil {
				err = fmt.Errorf("while linking mainbox %s to account: %w", box.Mailbox, err)
				return
			}
		}

		if _, ok := acct.Trashbox(); !ok && dbBox.Type == db.MailboxTypeTrashbox {
			_, err = prisma.Account.FindUnique(db.Account.ID.Equals(c.account.ID)).Update(
				db.Account.Trashbox.Link(db.Mailbox.ID.Equals(dbBox.ID)),
			).Exec(ctx)
			if err != nil {
				err = fmt.Errorf("while linking trashbox %s to account: %w", box.Mailbox, err)
				return
			}
		}

		if _, ok := acct.Draftsbox(); !ok && dbBox.Type == db.MailboxTypeDrafts {
			_, err = prisma.Account.FindUnique(db.Account.ID.Equals(c.account.ID)).Update(
				db.Account.Draftsbox.Link(db.Mailbox.ID.Equals(dbBox.ID)),
			).Exec(ctx)
			if err != nil {
				err = fmt.Errorf("while linking draftsbox %s to account: %w", box.Mailbox, err)
				return
			}
		}

		if _, ok := acct.Sentbox(); !ok && dbBox.Type == db.MailboxTypeSentbox {
			_, err = prisma.Account.FindUnique(db.Account.ID.Equals(c.account.ID)).Update(
				db.Account.Sentbox.Link(db.Mailbox.ID.Equals(dbBox.ID)),
			).Exec(ctx)
			if err != nil {
				err = fmt.Errorf("while linking sentbox %s to account: %w", box.Mailbox, err)
			}
		}

		if _, ok := acct.ScreenerBox(); !ok && dbBox.Type == db.MailboxTypeScreener {
			_, err = prisma.Account.FindUnique(db.Account.ID.Equals(c.account.ID)).Update(
				db.Account.ScreenerBox.Link(db.Mailbox.ID.Equals(dbBox.ID)),
			).Exec(ctx)
			if err != nil {
				err = fmt.Errorf("while linking screenerbox %s to account: %w", box.Mailbox, err)
			}
		}

		if err != nil {
			err = fmt.Errorf("could not upsert mailbox %s to DB: %w", box.Mailbox, err)
			return
		}
	}

	c.ResyncAccount(c.account.ID)
	return
}

func inferIsMainInbox(mailbox *imap.ListData) bool {
	return mailbox.Mailbox == "INBOX"
}

func inferMailboxType(mailbox *imap.ListData) db.MailboxType {
	switch mailbox.Mailbox {
	case "Trash", "Junk", "Archive":
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
