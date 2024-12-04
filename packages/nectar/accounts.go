package main

import (
	"fmt"
	"mime"
	"os"
	"sync"
	"time"

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
