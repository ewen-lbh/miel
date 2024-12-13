package main

import (
	"bytes"
	"errors"
	"fmt"
	"io"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/emersion/go-imap/v2"
	"github.com/emersion/go-imap/v2/imapclient"
	ll "github.com/ewen-lbh/label-logger-go"
	"github.com/ewen-lbh/miel/db"
	"github.com/ewen-lbh/parsemail"
)

func (c *LoggedInAccount) Move(mailseq imap.NumSet, inbox string, wait time.Duration) error {
	if wait == 0 {
		_, err, _ := timeout(1*time.Microsecond, func() (*imapclient.MoveData, error) {
			return c.imap.Move(mailseq, inbox).Wait()
		})
		return err
	}
	res, err, timedout := timeout(wait, func() (*imapclient.MoveData, error) {
		return c.imap.Move(mailseq, inbox).Wait()
	})
	if res != nil {
		if *res != nil {
			ll.Debug("after move %v -> %q: %+v", mailseq, inbox, **res)
		}
	}
	if timedout {
		return fmt.Errorf("timed out while moving email to %s", inbox)
	}
	return err
}

func (c *LoggedInAccount) Trash(mailseq imap.NumSet) error {
	trashbox, ok := c.account.Trashbox()
	if !ok {
		return fmt.Errorf("no trashbox for this account")
	}

	return c.Move(mailseq, trashbox.Name, 3*time.Second)
}

func (c *LoggedInAccount) SyncMails(inboxId string) error {
	err := c.Reconnect(nil)
	if err != nil {
		return fmt.Errorf("while reconnecting: %w", err)
	}

	box, err := prisma.Mailbox.FindUnique(db.Mailbox.ID.Equals(inboxId)).Exec(ctx)

	if err != nil {
		return fmt.Errorf("while getting inbox %s: %w", inboxId, err)
	}

	inboxIsEmpty := false
	lastEmail, err := prisma.Email.FindFirst(
		db.Email.InboxID.Equals(inboxId),
	).OrderBy(
		db.Email.InternalUID.Order(db.DESC),
	).Exec(ctx)
	if err != nil {
		if errors.Is(err, db.ErrNotFound) {
			inboxIsEmpty = true
		} else {
			return fmt.Errorf("while getting last email: %w", err)
		}
	}

	data, err := c.imap.Select(box.Name, &imap.SelectOptions{}).Wait()

	if err != nil {
		return fmt.Errorf("while selecting mailbox %s: %w", box.Name, err)
	}

	var uidSearchCriteria *imap.SearchCriteria

	if inboxIsEmpty {
		uidSearchCriteria = &imap.SearchCriteria{}
	} else {
		uidSearchCriteria = &imap.SearchCriteria{
			UID: []imap.UIDSet{
				[]imap.UIDRange{
					{
						Start: imap.UID(lastEmail.InternalUID - 1),
						Stop:  imap.UID(0),
					},
				},
			},
		}
	}

	result, err := c.imap.Search(uidSearchCriteria, &imap.SearchOptions{
		ReturnAll:   true,
		ReturnCount: true,
		ReturnMin:   true,
		ReturnMax:   true,
	}).Wait()

	if err != nil {
		return fmt.Errorf("while getting seqset: while getting new UIDs from range \"%v:*\": %w", lastEmail.InternalUID, err)
	}

	seqset := imap.SeqSet{imap.SeqRange{Start: result.Min, Stop: result.Max}}

	if result.Count == 0 {
		ll.Log("Up-to-date", "blue", "in %s (out of %d)", box.Name, data.NumMessages)
		return nil
	}

	ll.Log("Fetching", "cyan", "%d emails in %s (out of %d)", result.Count, box.Name, data.NumMessages)

	ll.Debug("seqset: %+v", seqset)

	mails := c.imap.Fetch(seqset, &imap.FetchOptions{
		Envelope: true,
		Flags:    true,
		BodyStructure: &imap.FetchItemBodyStructure{
			Extended: true,
		},
		InternalDate: true,
		UID:          true,
		BodySection:  []*imap.FetchItemBodySection{{}},
	})

	defer mails.Close()

	ll.StartProgressBar(seqsetSize(seqset), "Saving", "cyan")
	i := 0
	for {
		i++
		mailbuf := mails.Next()
		if mailbuf == nil {
			break
		}
		mail, err := mailbuf.Collect()
		if err != nil {
			return fmt.Errorf("could not collect mail: %w", err)
		}

		if mail == nil || mail.Envelope == nil {
			ll.Warn("mail has no envelope")
			continue
		}

		err = c.SyncMail(box, mail)
		if err != nil {
			ll.WarnDisplay("while syncing mail %q", err, mail.Envelope.Subject)
		}

		ll.IncrementProgressBar()
	}
	ll.StopProgressBar()

	ll.Log("Published", "green", fmt.Sprintf("mailbox:updates:%s", box.ID))
	redisClient.Publish(ctx, fmt.Sprintf("mailbox:updates:%s", box.ID), nil)
	return nil

}

func (c *LoggedInAccount) SyncMail(box *db.MailboxModel, mail *imapclient.FetchMessageBuffer) error {
	if mail == nil || mail.Envelope == nil {
		return fmt.Errorf("mail is nil or has no envelope")
	}

	envelope := mail.Envelope

	ccEmailAddrs := make([]string, 0, len(envelope.Cc))
	for _, cc := range envelope.Cc {
		ccEmailAddrs = append(ccEmailAddrs, cc.Addr())
	}

	ccAddresses, err := prisma.Address.FindMany(
		db.Address.Address.In(ccEmailAddrs),
	).Exec(ctx)
	if err != nil {
		ll.WarnDisplay("while getting CC addresses of mail %q (%v) that exist in DB", err, envelope.Subject, ccEmailAddrs)
	}

	for _, cc := range envelope.Cc {
		found := false
		for _, ccAddress := range ccAddresses {
			if ccAddress.Address == cc.Addr() {
				found = true
				break
			}
		}

		if !found {
			a, err := prisma.Address.CreateOne(
				db.Address.Address.Set(cc.Addr()),
				db.Address.Name.Set(cc.Name),
			).Exec(ctx)
			if err != nil {
				return fmt.Errorf("while creating db-address for cc %s: %w", cc.Addr(), err)
			}

			ccAddresses = append(ccAddresses, *a)
		}
	}

	if len(envelope.To) == 0 && len(ccAddresses) > 0 {
		envelope.To = append(envelope.To, imap.Address{
			Name:    ccAddresses[0].Name,
			Mailbox: strings.SplitN(ccAddresses[0].Address, "@", 2)[0],
			Host:    strings.SplitN(ccAddresses[0].Address, "@", 2)[1],
		})
	}

	if len(envelope.To) == 0 || len(envelope.From) == 0 {
		if box.Type != MailboxTypeTrash {
			ll.Warn("email %+v has no sender or recipient, deleting", mail.Envelope)
			c.Trash(imap.SeqSetNum(mail.SeqNum))
		}
		return nil

	}

	sender, err := prisma.Address.UpsertOne(
		db.Address.Address.Equals(envelope.From[0].Addr()),
	).Create(
		db.Address.Address.Set(envelope.From[0].Addr()),
		db.Address.Name.Set(envelope.From[0].Name),
		db.Address.LastEmailSentAt.Set(envelope.Date),
	).Update(
		db.Address.Name.Set(envelope.From[0].Name),
		db.Address.LastEmailSentAt.Set(envelope.Date),
	).Exec(ctx)

	if err != nil {
		return fmt.Errorf("while upserting db-address for sender %s: %w", envelope.From, err)
	}

	sender, err = prisma.Address.FindUnique(
		db.Address.ID.Equals(sender.ID),
	).With(
		db.Address.DefaultInbox.Fetch(),
	).Exec(ctx)
	if err != nil {
		return fmt.Errorf("could not find db-address for sender after upserting: %w", err)
	}

	recipient, err := prisma.Address.UpsertOne(
		db.Address.Address.Equals(envelope.To[0].Addr()),
	).Create(
		db.Address.Address.Set(envelope.To[0].Addr()),
		db.Address.Name.Set(envelope.To[0].Name),
	).Update(
		db.Address.Name.Set(envelope.To[0].Name),
	).Exec(ctx)

	if err != nil {
		return fmt.Errorf("while upserting db-address for recipient %s: %w", envelope.To, err)
	}

	bodyText := ""
	bodyHTML := ""
	bodyRaw := ""

	messageidOrNull := &envelope.MessageID
	if envelope.MessageID == "" {
		messageidOrNull = nil
	}

	dbEmail, err := prisma.Email.FindFirst(
		db.Email.Or(
			db.Email.And(
				db.Email.InboxID.Equals(box.ID),
				db.Email.InternalUID.Equals(int(mail.UID)),
			),
			db.Email.MessageID.EqualsIfPresent(messageidOrNull),
		),
	).Exec(ctx)

	if err != nil && !errors.Is(err, db.ErrNotFound) {
		return fmt.Errorf("while checking if email exists: %w", err)
	}

	mailReferences := make([]string, 0)
	mailHeaders := ""
	type Attachment struct {
		Filename string
		Content  []byte
		MimeType string
		Size     int
		Embedded bool
	}
	attachments := make([]Attachment, 0)

	if len(mail.BodySection) > 1 {
		return fmt.Errorf("mail has more than one body section: %v", mail.BinarySection)
	}

	if len(mail.BodySection) == 1 {
		_, body := firstmapEntry(mail.BodySection)
		bodyRaw = string(body)
		parsed, err := parsemail.Parse(bytes.NewReader(body))
		if err != nil {
			ll.WarnDisplay("could not parse email body for %q: %w", err, envelope.Subject)
			mail.BodyStructure.Walk(func(path []int, part imap.BodyStructure) (walkChildren bool) {
				ll.Debug("part: %+v", part)
				return true
			})
			os.WriteFile("body.eml", body, 0644)
		}

		for _, file := range parsed.EmbeddedFiles {
			data, err := io.ReadAll(file.Data)
			if err != nil {
				return fmt.Errorf("while reading bytes from embedded file %q: %w", file.CID, err)
			}

			attachments = append(attachments, Attachment{
				MimeType: file.ContentType,
				Filename: file.CID,
				Size:     len(data),
				Content:  data,
				Embedded: true,
			})
		}

		for _, attachment := range parsed.Attachments {
			data, err := io.ReadAll(attachment.Data)
			if err != nil {
				ll.WarnDisplay("while reading attachment %q of %q: %w", err, attachment.Filename, envelope.Subject)
				continue
			}

			attachments = append(attachments, Attachment{
				MimeType: attachment.ContentType,
				Filename: attachment.Filename,
				Size:     len(data),
				Content:  data,
			})
		}

		bodyText = parsed.TextBody
		bodyHTML = parsed.HTMLBody
		mailReferences = append(mailReferences, parsed.References...)
		mailReferences = append(mailReferences, parsed.InReplyTo...)
		for k, vs := range parsed.Header {
			for _, v := range vs {
				mailHeaders = fmt.Sprintf("%s%s: %s\n", mailHeaders, k, v)
			}
		}
	}

	ll.Debug("references: %+v", mailReferences)

	// Keep references that actually exist in the database
	mails, err := prisma.Email.FindMany(
		db.Email.MessageID.In(mailReferences),
	).Select(
		db.Email.MessageID.Field(),
	).Exec(ctx)
	if err != nil {
		ll.WarnDisplay("while getting mail references of %q (%#v) that exist in the database", err, envelope.Subject, mailReferences)
	}

	mailReferencesQuery := make([]db.EmailWhereParam, 0, len(mailReferences))

	for _, ref := range mailReferences {
		for _, mail := range mails {
			if msgid, ok := mail.MessageID(); ok && msgid == ref {
				mailReferencesQuery = append(mailReferencesQuery, db.Email.MessageID.Equals(ref))
				break
			}
		}
	}

	linkReferences := make([]db.EmailSetParam, 0)
	if len(mailReferencesQuery) > 0 {
		linkReferences = append(linkReferences, db.Email.ThreadReferences.Link(mailReferencesQuery...))
	}

	if dbEmail == nil {
		var uniqueParam db.EmailEqualsUniqueWhereParam
		if messageidOrNull != nil {
			uniqueParam = db.Email.MessageID.Equals(*messageidOrNull)
		} else {
			uniqueParam = db.Email.InboxIDInternalUID(
				db.Email.InboxID.Equals(box.ID),
				db.Email.InternalUID.Equals(int(mail.UID)),
			)
		}

		resultingEmail, err := prisma.Email.UpsertOne(uniqueParam).Update(
			append([]db.EmailSetParam{
				db.Email.ReceivedAt.Set(envelope.Date),
				db.Email.Sender.Link(db.Address.ID.Equals(sender.ID)),
				db.Email.Recipient.Link(db.Address.ID.Equals(recipient.ID)),
				db.Email.Subject.Set(envelope.Subject),
				db.Email.OriginalSubject.Set(envelope.Subject),
				db.Email.TextBody.Set(bodyText),
				db.Email.HTMLBody.Set(bodyHTML),
				db.Email.RawBody.Set(bodyRaw),
				db.Email.Inbox.Link(db.Mailbox.ID.Equals(box.ID)),
				db.Email.Trusted.Set(contains(mail.Flags, imap.FlagNotJunk)),
				db.Email.MessageID.SetOptional(messageidOrNull),
				db.Email.Headers.Set(mailHeaders),
				db.Email.Receiver.Link(db.Server.ID.Equals(c.account.ReceiverServerID)),
			}, linkReferences...)...,
		).Create(
			db.Email.InternalUID.Set(int(mail.UID)),
			db.Email.ReceivedAt.Set(envelope.Date),
			db.Email.Sender.Link(db.Address.ID.Equals(sender.ID)),
			db.Email.Recipient.Link(db.Address.ID.Equals(recipient.ID)),
			db.Email.Subject.Set(envelope.Subject),
			db.Email.OriginalSubject.Set(envelope.Subject),
			db.Email.TextBody.Set(bodyText),
			db.Email.HTMLBody.Set(bodyHTML),
			db.Email.RawBody.Set(bodyRaw),
			db.Email.Headers.Set(mailHeaders),
			db.Email.Inbox.Link(db.Mailbox.ID.Equals(box.ID)),
			db.Email.Trusted.Set(contains(mail.Flags, imap.FlagNotJunk)),
			append([]db.EmailSetParam{
				db.Email.Receiver.Link(db.Server.ID.Equals(c.account.ReceiverServerID)),
				db.Email.MessageID.SetOptional(messageidOrNull),
				db.Email.Users.Link(db.User.ID.Equals(c.account.UserID)),
			}, linkReferences...)...,
		).Exec(ctx)

		if err != nil {
			return fmt.Errorf("could not save new email %q: %w", envelope.Subject, err)
		}

		if len(attachments) > 0 {
			for _, attachment := range attachments {
				storagepath := fmt.Sprintf("attachments/%s/%s", resultingEmail.ID, attachment.Filename)
				err = os.MkdirAll(filepath.Dir(storagepath), 0755)
				if err != nil {
					return fmt.Errorf("while creating directories to save attachment to %q: %w", storagepath, err)
				}

				err = os.WriteFile(storagepath, attachment.Content, 0644)
				if err != nil {
					return fmt.Errorf("while writing attachment to %q: %w", storagepath, err)
				}

				_, err = prisma.Attachment.UpsertOne(
					db.Attachment.EmailIDFilename(
						db.Attachment.EmailID.Equals(resultingEmail.ID),
						db.Attachment.Filename.Equals(attachment.Filename),
					),
				).Create(
					db.Attachment.Filename.Set(attachment.Filename),
					db.Attachment.MimeType.Set(attachment.MimeType),
					db.Attachment.Size.Set(attachment.Size),
					db.Attachment.TextContent.Set(""),
					db.Attachment.Email.Link(db.Email.ID.Equals(resultingEmail.ID)),
					db.Attachment.StoragePath.Set(storagepath),
					db.Attachment.Embedded.Set(attachment.Embedded),
				).Update(
					db.Attachment.MimeType.Set(attachment.MimeType),
					db.Attachment.Size.Set(attachment.Size),
					db.Attachment.TextContent.Set(""),
				).Exec(ctx)

				if err != nil {
					return fmt.Errorf("could not save attachment %q: %w", attachment.Filename, err)
				}
			}
		}
	} else {

		_, err = prisma.Email.FindUnique(db.Email.ID.Equals(dbEmail.ID)).Update(
			append([]db.EmailSetParam{
				db.Email.Inbox.Link(db.Mailbox.ID.Equals(box.ID)),
				db.Email.MessageID.SetIfPresent(messageidOrNull),
			}, linkReferences...)...,
		).Exec(ctx)
		if err != nil {
			return fmt.Errorf("could not update email %q: %w", envelope.Subject, err)
		}
	}

	if defaultbox, ok := sender.DefaultInbox(); ok && (dbEmail == nil || !dbEmail.Processed) {
		c.Move(imap.SeqSetNum(mail.SeqNum), defaultbox.Name, 3*time.Second)

		_, err = prisma.Email.FindUnique(db.Email.ID.Equals(dbEmail.ID)).Update(
			db.Email.Inbox.Link(db.Mailbox.ID.Equals(defaultbox.ID)),
			db.Email.Processed.Set(true),
		).Exec(ctx)
		if err != nil {
			return fmt.Errorf("could not mark email %q as processed: %w", envelope.Subject, err)
		}
	}

	return nil
}
