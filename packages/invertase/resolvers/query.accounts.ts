import { builder, prisma } from "../builder"
import { AccountType } from "../schema"
import { fieldName } from "../utils"

builder.queryField(fieldName(), (t) =>
  t.prismaField({
    type: [AccountType],
    nullable: false,
    async resolve(query) {
      return prisma.account.findMany({
        ...query,
        orderBy: { address: "asc" },
      })
    },
  })
)
