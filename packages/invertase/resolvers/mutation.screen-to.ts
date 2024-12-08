import { builder, prisma } from "../builder"
import { publish } from "../lib/pubsub"
import { AddressType, EmailAddressType, MailboxType } from "../schema"
import { fieldName } from "../utils"

builder.mutationField(fieldName(), (t) =>
  t.prismaField({
    type: AddressType,
    errors: {},
    description:
      "Screen an address to a specific inbox. Can also be used on a already screened address to change its default inbox",
    args: {
      address: t.arg({ type: EmailAddressType, required: true }),
      box: t.arg.globalID({
        description: "Mailbox to screen the mail to",
        for: MailboxType,
        required: true,
      }),
    },
    async resolve(query, _, { address, box }) {
      await prisma.email.updateMany({
        where: {
          sender: { address },
          inbox: { type: "SCREENER" },
        },
        data: {
          inboxId: box.id,
        },
      })
      const result = await prisma.address.update({
        ...query,
        where: { address },
        data: {
          defaultInbox: { connect: { id: box.id } },
        },
      })
      publish("screenings:decisions", "", {
        address,
        inboxId: box.id,
      })
      return result
    },
  })
)
