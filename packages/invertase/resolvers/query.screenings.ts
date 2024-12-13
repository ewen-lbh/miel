import { builder, prisma } from "../builder.js"
import { pothosSubscribe } from "../lib/pubsub.js"
import { EmailAddressType } from "../schema.js"
import { AddressType } from "../types/address.js"
import { fieldName } from "../utils.js"

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
      pothosSubscribe(subs, "screenings:updates", "*")
    },
    async totalCount(_, { account }) {
      return await prisma.address.count({
        where: {
          sentEmails: account
            ? {
                some: {
                  receiver: {
                    receiverAccounts: { some: { address: account } },
                  },
                },
              }
            : undefined,
          defaultInbox: null,
        },
      })
    },
    async resolve(query, _, { account }) {
      return prisma.address.findMany({
        ...query,
        where: {
          defaultInbox: null,
          sentEmails: {
            some: account
              ? {
                  processed: false,
                  receiver: {
                    receiverAccounts: { some: { address: account } },
                  },
                }
              : {},
          },
        },
        orderBy: { lastEmailSentAt: "desc" },
      })
    },
  })
)
