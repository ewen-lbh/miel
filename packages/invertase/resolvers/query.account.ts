import { builder, prisma } from "../builder"
import { AccountType, EmailAddressType } from "../schema"
import { fieldName } from "../utils"

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
