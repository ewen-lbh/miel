import { builder } from "../builder"
import { typeName } from "../utils"

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
