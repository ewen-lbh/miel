import { builder, prisma } from "../builder"
import { AccountType } from "../schema"
import { ensureLoggedIn, fieldName } from "../utils"

builder.queryField(fieldName(), (t) =>
  t.prismaField({
    type: [AccountType],
    nullable: false,
    async resolve(query, _, {}, { session }) {
      return prisma.account.findMany({
        ...query,
        where: { userId: ensureLoggedIn(session).userId },
        orderBy: { address: "asc" },
      })
    },
  })
)
