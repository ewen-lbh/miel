import { builder } from "../builder"
import { typeName } from "../utils"
import { MailboxType } from "./mailbox"

export const MailboxConnectionType = builder.connectionObject({
  name: typeName(),
  type: MailboxType,
})
