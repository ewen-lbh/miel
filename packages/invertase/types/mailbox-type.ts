import { builder } from "../builder.js"
import { typeName } from "../utils.js"

export enum MailboxTypeEnum {
  Inbox = "INBOX",
  Trash = "TRASH",
  Drafts = "DRAFTS",
  Sent = "SENT",
  Feed = "FEED",
}

export const MailboxTypeType = builder.enumType(MailboxTypeEnum, {
  name: typeName(),
})
