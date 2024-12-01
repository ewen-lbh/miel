import { builder, prisma } from "../builder"
import { EmailType } from "../schema"
import { fieldName } from "../utils"

builder.queryField(fieldName(), (t) =>
  t.prismaConnection({
    type: EmailType,
    cursor: "id",
    args: {
      inbox: t.arg.id({ required: true }),
    },
    smartSubscription: true,
    async subscribe() {
      console.error("TODO")
      return
    },
    async resolve(query, _, { inbox }) {
      return prisma.email.findMany({
        ...query,
        where: { inboxId: inbox },
        orderBy: { internalUid: "desc" },
      })
    },
  })
)
