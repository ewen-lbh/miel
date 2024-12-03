import { builder, prisma } from "../builder"
import { AddressType } from "../types/address"
import { fieldName } from "../utils"

builder.queryField(fieldName(), (t) =>
  t.prismaConnection({
    type: AddressType,
    cursor: "id",
    description:
      "Addresses that are waiting screening (have not been assigned a default inbox yet).",
    async totalCount() {
      return await prisma.address.count({
        where: {
          defaultInbox: null,
        },
      })
    },
    async resolve(query) {
      return await prisma.address.findMany({
        ...query,
        where: {
          defaultInbox: null,
        },
        orderBy: {
          sentEmails: {
            _count: "desc",
          },
        },
      })
    },
  })
)
