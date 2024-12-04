import { builder, prisma } from "../builder"
import { subscribe } from "../lib/pubsub"
import { EmailType, MailboxType } from "../schema"
import { fieldName } from "../utils"

builder.queryField(fieldName(), (t) =>
  t.prismaConnection({
    type: EmailType,
    cursor: "id",
    args: {
      inbox: t.arg.globalID({ required: true, for: MailboxType }),
    },
    smartSubscription: true,
    subscribe(subs, _, { inbox }) {
      subscribe(subs, "mailbox:updates", inbox.id)
    },
    async resolve(query, _, { inbox }) {
      return prisma.email.findMany({
        ...query,
        where: { inboxId: inbox.id },
        orderBy: { internalUid: "desc" },
      })
    },
  })
)
