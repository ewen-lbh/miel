import { builder } from "../builder"
import * as Prisma from "../prisma"
import { graphinx, typeName } from "../utils"

export const MailboxTypeType = builder.enumType(Prisma.MailboxType, {
  name: typeName(),
})
