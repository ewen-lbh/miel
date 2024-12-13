package main

import (
	"encoding/json"
	"fmt"

	ll "github.com/ewen-lbh/label-logger-go"

	"github.com/redis/go-redis/v9"
)

const REDIS_BACKCHANNEL_INPUT_TOPIC = "backchannel:in"
const REDIS_BACKCHANNEL_OUTPUT_TOPIC = "backchannel:out"

type BackchannelInputPayload struct {
	// The account to use
	AccountID string
	// A unique operation ID for this backchannel operation, used to know which push to listen to. Omit to tell nectar to not push a backchannel response
	OperationID string
	// Noop, allows the backchannel to be used as a heartbeat
	Noop bool
	// Move emails to an inbox
	MoveToInbox []struct {
		Emails []string
		Inbox  string
	}
	// Re-sync the entire account
	ResyncAll bool
	// Re-sync a specific mailbox, by database's mailbox ID
	ResyncMailbox string
}

func (p BackchannelInputPayload) Validate() (*LoggedInAccount, error) {
	if p.AccountID == "" {
		return nil, fmt.Errorf("account ID is empty")
	}

	return CreateIMAPClient(p.AccountID)
}

// BackchannelOutputPayload is the payload that nectar sends back to Invertase after processing a backchannel request. It contains an error if one occured. No other data is transmitted, as the backchannel is only used to trigger actions.
type BackchannelOutputPayload struct {
	// The operation ID we are responding to
	OperationID string
	// An error if one occured (empty string if successful)
	Error string
}

func (input BackchannelInputPayload) OutputPayloadJSON(err error) string {
	if input.OperationID == "" {
		return ""
	}

	errmsg := ""
	if err != nil {
		errmsg = err.Error()
	}

	output := BackchannelOutputPayload{
		OperationID: input.OperationID,
		Error:       errmsg,
	}
	var encoded []byte
	encoded, err = json.Marshal(output)
	if err != nil {
		panic(fmt.Errorf("could not marshal output payload %+v: %w", output, err))
	}

	return string(encoded)
}

// StartBackchannelListener starts the backchannel listener, which listens to redis pubsubs from Invertase to do actions (such as creating an inbox) on the IMAP server.
func StartBackchannelListener() error {
	ll.Log("Listening", "magenta", "on backchannel at %s", REDIS_BACKCHANNEL_INPUT_TOPIC)
	sub := redisClient.Subscribe(ctx, REDIS_BACKCHANNEL_INPUT_TOPIC)

	err := sub.Ping(ctx)
	if err != nil {
		return fmt.Errorf("can't ping redis pubsub: %w", err)
	}

	go func(sub *redis.PubSub) {
		for msg := range sub.Channel() {
			// payload should contain address and inboxId
			var payload BackchannelInputPayload
			err := json.Unmarshal([]byte(msg.Payload), &payload)
			if err != nil {
				ll.ErrorDisplay("while unmarshalling payload %q", err, msg.Payload)
				continue
			}

			c, err := payload.Validate()
			if err != nil {
				ll.ErrorDisplay("could not connect to account of backchannel operation %s (payload is %+v)", err, payload.OperationID, payload)
				continue
			}

			ll.Log("Received", "magenta", "backchannel operation %s from account %s", payload.OperationID, c.account.Address)

			var operationError error

			if payload.ResyncAll {
				operationError = c.SyncAccount()
			}

			if operationError == nil && payload.ResyncMailbox != "" {
				operationError = c.SyncMails(payload.ResyncMailbox)
			}

			if operationError == nil && len(payload.MoveToInbox) > 0 {
				for _, move := range payload.MoveToInbox {
					operationError = c.MoveEmails(move.Emails, move.Inbox)
					if operationError != nil {
						break
					}
				}
			}

			if operationError != nil {
				ll.ErrorDisplay("while processing backchannel operation %s", operationError, payload.OperationID)
			}

			// Send back a response
			output := payload.OutputPayloadJSON(operationError)
			if output != "" {
				_, err = redisClient.Publish(ctx, REDIS_BACKCHANNEL_OUTPUT_TOPIC, output).Result()
				if err != nil {
					ll.ErrorDisplay("could not publish response %s", err, output)
					continue
				}
			}
		}
	}(sub)

	return nil
}
