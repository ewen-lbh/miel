import { uniqBy } from "lodash-es"
import { builder, prisma } from "../builder"
import { subscribe } from "../lib/pubsub"
import { AddressType } from "../types/address"
import { fieldName } from "../utils"

builder.queryField(fieldName(), (t) =>
  t.prismaConnection({
    type: AddressType,
    cursor: "id",
    description:
      "Addresses that are waiting screening (have not been assigned a default inbox yet).",
    smartSubscription: true,
    subscribe(subs) {
      subscribe(subs, "screenings:updates", "*")
    },
    async totalCount() {
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
