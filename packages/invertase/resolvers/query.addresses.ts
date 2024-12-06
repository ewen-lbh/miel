import { builder, prisma } from "../builder"
import { AddressType } from "../schema"
import { fieldName } from "../utils"

builder.queryField(fieldName(), (t) =>
  t.prismaConnection({
    cursor: "id",
    type: AddressType,
    description: "Get all addresses",
    async resolve(query) {
      return prisma.address.findMany({
        ...query,
        orderBy: { sentEmails: { _count: "desc" } },
      })
    },
  })
)
