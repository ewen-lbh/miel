import { builder } from "../builder"
import { MailboxType } from "../prisma"
import { graphinx, typeName } from "../utils"

export const MailboxConnectionType = builder.connectionObject({
  name: typeName(),
  type: MailboxType,
})
