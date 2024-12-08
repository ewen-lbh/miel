package main

import (
	"encoding/json"
	"fmt"
	"time"

	ll "github.com/ewen-lbh/label-logger-go"
	"github.com/redis/go-redis/v9"

	"github.com/ewen-lbh/miel/db"

	"github.com/emersion/go-imap/v2"
)

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
