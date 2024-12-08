package main

import (
	"fmt"
	"github.com/bep/debounce"
	"os"
	"time"

	ll "github.com/ewen-lbh/label-logger-go"

	imapclientv1 "github.com/emersion/go-imap/client"
)

func (c *LoggedInAccount) StartIdleListener() error {
	// ctx := context.Background()
	mainbox, hasMainbox := c.account.Mainbox()
	ll.Info("Mainbox %q", mainbox.Name)

	v1C, err := imapclientv1.DialTLS(fmt.Sprintf("%s:%d", c.account.ReceiverServer().Host, c.account.ReceiverServer().Port), nil)
	if err != nil {
		return fmt.Errorf("while connecting (using v1 client): %w", err)
	}

	password, hasPassword := c.account.ReceiverAuth().Password()
	if !hasPassword {
		return fmt.Errorf("no password found for account %q", c.account.Name)
	}

	err = v1C.Login(c.account.ReceiverAuth().Username, password)
	if err != nil {
		return fmt.Errorf("while logging in (using v1 client): %w", err)
	}

	if !hasMainbox {
		return fmt.Errorf("couldn't find mainbox for account %q", c.account.Name)
	}

	ll.Log("Listening", "cyan", "for new emails")

	_, err = v1C.Select(mainbox.Name, false)
	if err != nil {
		return fmt.Errorf("couldn't select mainbox %q: %w", mainbox.Name, err)
	}

	v1C.SetDebug(os.Stderr)

	stopIdling := make(<-chan struct{}, 1)
	updates := make(chan imapclientv1.Update)
	done := make(chan error, 1)
	v1C.Updates = updates

	go func() {
		done <- v1C.Idle(stopIdling, nil)
	}()

	resync := func() {
		ll.Log("Updating", "white", "because mailbox changed")
		c.SyncMails(mainbox.ID)
	}

	atMostEvery1s := debounce.New(1 * time.Second)

	for {
		select {
		case update := <-updates:
			switch update.(type) {
			case *imapclientv1.MailboxUpdate:
				atMostEvery1s(resync)
			}
		case err := <-done:
			if err != nil {
				return fmt.Errorf("couldn't start listening to server (IDLE comm): %w", err)
			}
		}
	}
}
