package main

import (
	"context"
	"errors"
	"fmt"
	"os"
	"strconv"

	ll "github.com/ewen-lbh/label-logger-go"

	"github.com/ewen-lbh/miel/db"
	"github.com/joho/godotenv"
	"github.com/redis/go-redis/v9"
)

var prisma *db.PrismaClient
var redisClient *redis.Client

var ctx = context.Background()

func init() {
	err := godotenv.Load()
	if err != nil {
		panic(fmt.Errorf("while loading vars from .env: %w", err))
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
	}

	// Create account via CLI: account create <host> <sender port> <receiver port> <secure|insecure> <username> <password>
	if len(os.Args) == 9 && os.Args[1] == "account" && os.Args[2] == "create" {
		senderPort, err := strconv.Atoi(os.Args[4])
		if err != nil {
			ll.ErrorDisplay("invalid sender port number", err)
			return
		}

		receiverPort, err := strconv.Atoi(os.Args[5])
		if err != nil {
			ll.ErrorDisplay("invalid receiver port number", err)
			return
		}

		receiver, err := prisma.Server.CreateOne(
			db.Server.Host.Set(os.Args[3]),
			db.Server.Port.Set(receiverPort),
			db.Server.Secure.Set(os.Args[6] == "secure"),
			db.Server.Username.Set(os.Args[7]),
			db.Server.Type.Set(db.ServerTypeImap),
		).Exec(ctx)
		if err != nil {
			ll.ErrorDisplay("couldn't create ReceiverServer", err)
		}

		sender, err := prisma.Server.CreateOne(
			db.Server.Host.Set(os.Args[3]),
			db.Server.Port.Set(senderPort),
			db.Server.Secure.Set(os.Args[6] == "secure"),
			db.Server.Username.Set(os.Args[7]),
			db.Server.Type.Set(db.ServerTypeSMTP),
		).Exec(ctx)
		if err != nil {
			ll.ErrorDisplay("couldn't create SenderServer", err)
		}

		auth, err := prisma.ServerAuth.CreateOne(
			db.ServerAuth.Username.Set(os.Args[7]),
			db.ServerAuth.Password.Set(os.Args[8]),
		).Exec(ctx)
		if err != nil {
			ll.ErrorDisplay("couldn't create ServerAuth", err)
		}

		_, err = prisma.Account.CreateOne(
			db.Account.Address.Set(os.Args[7]),
			db.Account.Name.Set(os.Args[3]),
			db.Account.ReceiverServer.Link(db.Server.ID.Equals(receiver.ID)),
			db.Account.ReceiverAuth.Link(db.ServerAuth.ID.Equals(auth.ID)),
			db.Account.SenderServer.Link(db.Server.ID.Equals(sender.ID)),
			db.Account.SenderAuth.Link(db.ServerAuth.ID.Equals(auth.ID)),
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

	ll.Log("Done", "green", "syncing inboxes and mails")

	err = c.StartDecisionsListener()
	if err != nil {
		ll.ErrorDisplay("while starting decisions listener", err)
	}

	ll.Log("Starting", "cyan", "idle listener")

	err = c.StartIdleListener()
	if err != nil {
		ll.ErrorDisplay("while starting idle listener", err)
	}
}
