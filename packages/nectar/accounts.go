package main

import (
	"context"
	"fmt"
	"mime"
	"os"
	"strconv"
	"sync"
	"time"

	ll "github.com/ewen-lbh/label-logger-go"
	"github.com/ewen-lbh/miel/db"

	"github.com/emersion/go-imap/v2/imapclient"
	"github.com/emersion/go-message/charset"
)

type LoggedInAccount struct {
	sync.Mutex

	imap    *imapclient.Client
	account db.AccountModel
}

func CreateIMAPClient(accountId string) (*LoggedInAccount, error) {
	client := LoggedInAccount{}

	err := client.RefetchAccount(accountId)
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

func (c *LoggedInAccount) Reconnect(options *imapclient.Options) error {
	c.Lock()
	defer c.Unlock()
	if c.imap != nil {
		_, err, timedout := timeout(200*time.Millisecond, func() (any, error) { err := c.imap.Close(); return nil, err })
		if err != nil {
			ll.WarnDisplay("couldn't close connection", err)
		}
		if timedout {
			return fmt.Errorf("couldn't close connection: timed out")
		}
	}

	ctx = context.Background()

	var err error
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

func (c *LoggedInAccount) RefetchAccount(accountId string) error {
	acct, err := prisma.Account.FindUnique(db.Account.ID.Equals(accountId)).With(
		db.Account.ReceiverServer.Fetch(),
		db.Account.ReceiverAuth.Fetch(),
		db.Account.Mainbox.Fetch(),
		db.Account.Trashbox.Fetch(),
		db.Account.Draftsbox.Fetch(),
		db.Account.Sentbox.Fetch(),
	).Exec(ctx)
	if err != nil {
		return fmt.Errorf("while resyncing db account %q on client: %w", accountId, err)
	}

	c.Lock()
	defer c.Unlock()
	c.account = *acct
	return nil
}

func CreateAccount(args []string) {
	// Create account via CLI: account create <host> <sender port> <receiver port> <secure|insecure> <username> <password> <user id>
	if len(args) == 10 && args[1] == "account" && args[2] == "create" {
		senderPort, err := strconv.Atoi(args[4])
		if err != nil {
			ll.ErrorDisplay("invalid sender port number", err)
			return
		}

		receiverPort, err := strconv.Atoi(args[5])
		if err != nil {
			ll.ErrorDisplay("invalid receiver port number", err)
			return
		}

		receiver, err := prisma.Server.CreateOne(
			db.Server.Host.Set(args[3]),
			db.Server.Port.Set(receiverPort),
			db.Server.Secure.Set(args[6] == "secure"),
			db.Server.Username.Set(args[7]),
			db.Server.Type.Set(ServerTypeIMAP),
		).Exec(ctx)
		if err != nil {
			ll.ErrorDisplay("couldn't create ReceiverServer", err)
			return
		}

		sender, err := prisma.Server.CreateOne(
			db.Server.Host.Set(args[3]),
			db.Server.Port.Set(senderPort),
			db.Server.Secure.Set(args[6] == "secure"),
			db.Server.Username.Set(args[7]),
			db.Server.Type.Set(ServerTypeSMTP),
		).Exec(ctx)
		if err != nil {
			ll.ErrorDisplay("couldn't create SenderServer", err)
			return
		}

		auth, err := prisma.ServerAuth.CreateOne(
			db.ServerAuth.Username.Set(args[7]),
			db.ServerAuth.Password.Set(args[8]),
		).Exec(ctx)
		if err != nil {
			ll.ErrorDisplay("couldn't create ServerAuth", err)
			return
		}

		_, err = prisma.Account.CreateOne(
			db.Account.User.Link(db.User.Email.Equals(args[9])),
			db.Account.Address.Set(args[7]),
			db.Account.Name.Set(args[3]),
			db.Account.ReceiverServer.Link(db.Server.ID.Equals(receiver.ID)),
			db.Account.ReceiverAuth.Link(db.ServerAuth.ID.Equals(auth.ID)),
			db.Account.SenderServer.Link(db.Server.ID.Equals(sender.ID)),
			db.Account.SenderAuth.Link(db.ServerAuth.ID.Equals(auth.ID)),
		).Exec(ctx)
		if err != nil {
			ll.ErrorDisplay("couldn't create Account", err)
		}

	}
}
