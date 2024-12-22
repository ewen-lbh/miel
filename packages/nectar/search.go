package main

import (
	"fmt"
	"os"

	"github.com/ewen-lbh/miel/db"
	meilisearch "github.com/meilisearch/meilisearch-go"
)

var meili meilisearch.ServiceManager

func init() {
	meili = meilisearch.New(os.Getenv("MEILISEARCH_URL"), meilisearch.WithAPIKey(os.Getenv("MEILISEARCH_MASTER_KEY")))
}

func (c *LoggedInAccount) AddMailToSearchIndex(mail *db.EmailModel) error {
	index := meili.Index(fmt.Sprintf("%s__mails", c.account.ID))
	searchableAttributes := []string{"subject", "bodyhtml", "bodytext"}
	index.UpdateSearchableAttributes(&searchableAttributes)
	_, err := index.AddDocuments(map[string]interface{}{
		"id": mail.ID, "bodyhtml": mail.HTMLBody, "bodytext": mail.TextBody, "subject": mail.Subject,
	})

	if err != nil {
		return fmt.Errorf("while adding mail %s to search index: %w", mail.ID, err)
	}

	return nil
}

func (c *LoggedInAccount) AddAttachmentToSearchIndex(attachment *db.AttachmentModel) error {
	index := meili.Index(fmt.Sprintf("%s__attachments", c.account.ID))
	searchableAttributes := []string{"filename", "text"}
	index.UpdateSearchableAttributes(&searchableAttributes)
	_, err := index.AddDocuments(map[string]interface{}{
		"id": attachment.ID, "filename": attachment.Filename, "text": attachment.TextContent, "mailId": attachment.EmailID,
	})

	if err != nil {
		return fmt.Errorf("while adding attachment %s to search index: %w", attachment.ID, err)
	}

	return nil
}
