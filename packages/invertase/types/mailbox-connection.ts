import { builder } from "../builder.js"
import { typeName } from "../utils.js"
import { MailboxType } from "./mailbox.js"

export const MailboxConnectionType = builder.connectionObject({
  name: typeName(),
  type: MailboxType,
})
