import { builder, prisma } from "../builder.js"
import { AccountType } from "../schema.js"
import { fieldName } from "../utils.js"

builder.queryField(fieldName(), (t) =>
  t.prismaField({
    type: [AccountType],
    nullable: false,
    async resolve(query, _, {}, ctx) {
      return prisma.account.findMany({
        ...query,
        where: { userId: ctx.ensuredUserId() },
        orderBy: { address: "asc" },
      })
    },
  })
)
