import { builder } from "../builder.js"
import { AddressType, MailboxType } from "../schema.js"
import { fieldName } from "../utils.js"

builder.prismaObjectField(AddressType, fieldName(), (t) =>
  t.relation("defaultInbox", {
    nullable: true,
    type: MailboxType,
  })
)
