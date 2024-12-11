import { builder, prisma } from "../builder"
import { subscribe } from "../lib/pubsub"
import { EmailAddressType } from "../schema"
import { AddressType } from "../types/address"
import { fieldName } from "../utils"

builder.queryField(fieldName(), (t) =>
  t.prismaConnection({
    type: AddressType,
    cursor: "id",
    description:
      "Addresses that are waiting screening (have not been assigned a default inbox yet).",
    smartSubscription: true,
    args: {
      account: t.arg({
        type: EmailAddressType,
        required: false,
        description: "Limit to emails received on a specific account",
      }),
    },
    subscribe(subs) {
      subscribe(subs, "screenings:updates", "*")
    },
    async totalCount(_, { account }) {
      return await prisma.address.count({
        where: {
          defaultInbox: null,
        },
      })
    },
    async resolve(query) {
      return prisma.address.findMany({
        ...query,
        where: { defaultInbox: null, sentEmails: { some: {} } },
        orderBy: { lastEmailSentAt: "desc" },
      })
    },
  })
)
