import { builder, prisma } from "../builder.js"
import { pothosSubscribe } from "../lib/pubsub.js"
import { EmailType, MailboxType } from "../schema.js"
import { fieldName } from "../utils.js"

builder.queryField(fieldName(), (t) =>
  t.prismaConnection({
    type: EmailType,
    cursor: "id",
    args: {
      inbox: t.arg.globalID({ required: true, for: MailboxType }),
    },
    smartSubscription: true,
    subscribe(subs, _, { inbox }) {
      pothosSubscribe(subs, "mailbox:updates", inbox.id)
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
