package main

import (
	"context"
	"fmt"
	"os"
	"sync"

	ll "github.com/ewen-lbh/label-logger-go"

	"github.com/ewen-lbh/miel/db"
	"github.com/joho/godotenv"
	"github.com/redis/go-redis/v9"
)

var prisma *db.PrismaClient
var redisClient *redis.Client

var ctx = context.Background()

const (
	ServerTypeIMAP = "IMAP"
	ServerTypeSMTP = "SMTP"
)

func init() {
	// check if .env exists
	if _, err := os.Stat(".env"); err == nil {
		err := godotenv.Load()
		if err != nil {
			panic(fmt.Errorf("while loading vars from .env: %w", err))
		}
	}

	prisma = db.NewClient()
	if err := prisma.Connect(); err != nil {
		panic(fmt.Sprintf("could not connect to database: %v", err))
	}

	opts, err := redis.ParseURL(os.Getenv("REDIS_URL"))
	if err != nil {
		panic(fmt.Sprintf("could not parse redis url: %v", err))
	}

	redisClient = redis.NewClient(opts)
}

func main() {
	if os.Getenv("VACUUM") == "YESPLZ" {
		prisma.Email.FindMany().Delete().Exec(ctx)
		prisma.Address.FindMany().Delete().Exec(ctx)
		prisma.Mailbox.FindMany().Delete().Exec(ctx)
		prisma.Account.FindMany().Delete().Exec(ctx)
	}

	CreateAccount(os.Args)

	accounts, err := prisma.Account.FindMany().With(
		db.Account.ReceiverServer.Fetch(),
		db.Account.ReceiverAuth.Fetch(),
		db.Account.Mainbox.Fetch(),
		db.Account.Trashbox.Fetch(),
		db.Account.Draftsbox.Fetch(),
		db.Account.Sentbox.Fetch(),
	).Exec(ctx)
	if err != nil {
		ll.ErrorDisplay("while getting all accounts", err)
		return
	}

	err = StartBackchannelListener()
	if err != nil {
		ll.ErrorDisplay("while starting backchannel listener", err)
		return
	}

	wg := sync.WaitGroup{}
	wg.Add(1)

	for _, acct := range accounts {
		c, err := CreateIMAPClient(acct.ID)
		if err != nil {
			ll.ErrorDisplay("while creating imap client", err)
			continue
		}

		err = c.SyncAccount()
		if err != nil {
			ll.ErrorDisplay("while syncing account", err)
			continue
		}

		wg.Add(1)
		go func(c *LoggedInAccount, wg *sync.WaitGroup) {
			ll.Log("Starting", "cyan", "idle listener for %s", c.account.Name)
			err = c.StartIdleListener()
			if err != nil {
				ll.ErrorDisplay("while starting idle listener", err)
				wg.Done()
			}
		}(c, &wg)

	}

	wg.Wait()
}

func (c *LoggedInAccount) SyncAccount() error {
	err := c.SyncInboxes()
	if err != nil {
		return fmt.Errorf("could not sync inboxes for %s: %w", c.account.ID, err)
	}

	inboxes, err := prisma.Mailbox.FindMany(db.Mailbox.AccountID.Equals(c.account.ID)).Exec(ctx)
	if err != nil {
		return fmt.Errorf("could not get mailboxes for %s from db: %w", c.account.ID, err)
	}

	for _, inbox := range inboxes {
		err = c.SyncMails(inbox.ID)
		if err != nil {
			ll.WarnDisplay("could not sync mails for %s: %w", err, inbox.ID)
		}
	}

	ll.Log("Done", "green", "syncing inboxes and mails for %s", c.account.Address)
	return nil
}
