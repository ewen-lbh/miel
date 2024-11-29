package main

import (
	"fmt"
	"mime"

	"github.com/emersion/go-imap/v2"
	"github.com/emersion/go-imap/v2/imapclient"
	"github.com/emersion/go-message/charset"
)

func fetchmails() error {

	options := &imapclient.Options{
		WordDecoder: &mime.WordDecoder{CharsetReader: charset.Reader},
	}

	client, err := imapclient.DialTLS("mail.ewen.works:993", options)
	if err != nil {
		return fmt.Errorf("could not dial tls: %w", err)
	}

	err = client.Login("hey@ewen.works", "").Wait()
	if err != nil {
		return fmt.Errorf("could not login: %w", err)
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
		fmt.Printf("Mailbox: %s %v / %v\n", box.Mailbox, *box.Status.NumUnseen, *box.Status.NumMessages)

		data, err := client.Select(box.Mailbox, &imap.SelectOptions{
			ReadOnly: true,
		}).Wait()
		if err != nil {
			return fmt.Errorf("while selecting mailbox %s: %w", box.Mailbox, err)
		}

		fmt.Printf("Flags: %v\n", data.Flags)

		seqset := imap.SeqSetNum(*box.Status.NumMessages, *box.Status.NumMessages-1)
		mails, err := client.Fetch(seqset, &imap.FetchOptions{
			Flags:    true,
			Envelope: true,
			BodySection: []*imap.FetchItemBodySection{
				{Specifier: imap.PartSpecifierHeader},
			},
		}).Collect()

		for _, mail := range mails {
			fmt.Printf("Flags: %v\n", mail.Flags)
			fmt.Printf("Subject: %s\n", mail.Envelope.Subject)
			fmt.Printf("From: %s\n", mail.Envelope.From[0].Addr())
			fmt.Printf("Date: %s\n", mail.Envelope.Date)
		}
		fmt.Printf("\n\n")
	}

	return nil
}


