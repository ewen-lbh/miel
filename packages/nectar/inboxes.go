package main

import (
	"fmt"

	ll "github.com/ewen-lbh/label-logger-go"

	"github.com/ewen-lbh/miel/db"

	"github.com/emersion/go-imap/v2"
)

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
	default:
		return db.MailboxTypeInbox
	}
}
