import { builder, prisma } from "../builder.js"
import { AddressType } from "../schema.js"
import { fieldName } from "../utils.js"

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
