package main

import (
	"fmt"
	"io"
	"os"
	"path/filepath"

	ll "github.com/ewen-lbh/label-logger-go"
	"github.com/ewen-lbh/miel/db"
	"github.com/ewen-lbh/parsemail"
)

type Attachment struct {
	Filename string
	Content  []byte
	MimeType string
	Size     int
	Embedded bool
}

func (c *LoggedInAccount) SaveAttachments(parsedEmail parsemail.Email, dbEmail *db.EmailModel) error {

	attachments := make([]Attachment, 0)

	for _, file := range parsedEmail.EmbeddedFiles {
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

	for _, attachment := range parsedEmail.Attachments {
		data, err := io.ReadAll(attachment.Data)
		if err != nil {
			ll.WarnDisplay("while reading attachment %q of %q: %w", err, attachment.Filename, parsedEmail.Subject)
			continue
		}

		attachments = append(attachments, Attachment{
			MimeType: attachment.ContentType,
			Filename: attachment.Filename,
			Size:     len(data),
			Content:  data,
		})
	}

	for _, attachment := range attachments {

		storagepath := fmt.Sprintf("attachments/%s/%s", dbEmail.ID, attachment.Filename)
		err := os.MkdirAll(filepath.Dir(storagepath), 0755)
		if err != nil {
			return fmt.Errorf("while creating directories to save attachment to %q: %w", storagepath, err)
		}

		err = os.WriteFile(storagepath, attachment.Content, 0644)
		if err != nil {
			return fmt.Errorf("while writing attachment to %q: %w", storagepath, err)
		}

		dbAttachment, err := prisma.Attachment.UpsertOne(
			db.Attachment.EmailIDFilename(
				db.Attachment.EmailID.Equals(dbEmail.ID),
				db.Attachment.Filename.Equals(attachment.Filename),
			),
		).Create(
			db.Attachment.Filename.Set(attachment.Filename),
			db.Attachment.MimeType.Set(attachment.MimeType),
			db.Attachment.Size.Set(attachment.Size),
			db.Attachment.TextContent.Set(""),
			db.Attachment.Email.Link(db.Email.ID.Equals(dbEmail.ID)),
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

		// only add non-embedded attachments to search index (end user is not conscious of embedded attachments, as they only appear in the email body)
		if !dbAttachment.Embedded {
			err = c.AddAttachmentToSearchIndex(dbAttachment)
			if err != nil {
				return fmt.Errorf("while adding attachment to search index: %w", err)
			}
		}
	}

	return nil
}
