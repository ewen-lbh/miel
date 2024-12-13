import { builder, prisma } from "../builder.js"
import { AccountType, EmailAddressType } from "../schema.js"
import { fieldName } from "../utils.js"

builder.queryField(fieldName(), (t) =>
  t.prismaField({
    type: AccountType,
    nullable: true,
    args: {
      address: t.arg({ type: EmailAddressType, required: true }),
    },
    async resolve(query, _, { address }) {
      return prisma.account.findUnique({
        ...query,
        where: { address },
      })
    },
  })
)
