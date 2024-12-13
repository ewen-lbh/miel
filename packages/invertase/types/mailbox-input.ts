import { builder } from "../builder.js"
import { typeName } from "../utils.js"
import { EmailAddressType } from "./email-address.js"
import { MailboxTypeType } from "./mailbox-type.js"

export const MailboxInputType = builder.inputType(typeName(), {
  description: "Input type for creating or updating a mailbox",
  fields: (t) => ({
    type: t.field({ type: MailboxTypeType, required: false }),
    account: t.field({ type: EmailAddressType, required: false }),
    name: t.string({ required: false }),
  }),
})
