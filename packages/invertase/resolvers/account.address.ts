import { builder, prisma } from "../builder.js"
import { AccountType } from "../schema.js"
import { AddressType } from "../types/address.js"

builder.prismaObjectField(AccountType, "address", (t) =>
  t.prismaField({
    type: AddressType,
    async resolve(query, { address }, {}, ctx) {
      return prisma.address.upsert({
        ...query,
        where: {
          address_userId: { address, userId: ctx.ensuredUserId() },
        },
        update: {},
        create: {
          userId: ctx.ensuredUserId(),
          address,
          name: "You",
        },
      })
    },
  })
)
