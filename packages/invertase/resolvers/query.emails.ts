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
      includeUnscreened: t.arg.boolean({
        defaultValue: false,
        required: false,
        description: "Include emails from unscreened senders",
      }),
    },
    smartSubscription: true,
    subscribe(subs, _, { inbox }) {
      console.log("Subscribing to mailbox updates", inbox.id)
      pothosSubscribe(subs, "mailbox:updates", inbox.id)
    },
    async resolve(query, _, { inbox, includeUnscreened }) {
      return prisma.email.findMany({
        ...query,
        where: {
          inboxId: inbox.id,
          ...(includeUnscreened
            ? {}
            : { sender: { defaultInbox: { isNot: null } } }),
        },
        orderBy: [{ receivedAt: "desc" }, { internalUid: "desc" }],
      })
    },
  })
)
