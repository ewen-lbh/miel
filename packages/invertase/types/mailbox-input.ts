import { builder } from "../builder"
import { typeName } from "../utils"
import { EmailAddressType } from "./email-address"
import { MailboxTypeType } from "./mailbox-type"

export const MailboxInputType = builder.inputType(typeName(), {
  description: "Input type for creating or updating a mailbox",
  fields: (t) => ({
    type: t.field({ type: MailboxTypeType, required: false }),
    account: t.field({ type: EmailAddressType, required: false }),
    name: t.string({ required: false }),
  }),
})
