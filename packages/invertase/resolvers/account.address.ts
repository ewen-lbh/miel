import { builder, prisma } from "../builder"
import { AccountType } from "../schema"
import { AddressType } from "../types/address"

builder.prismaObjectField(AccountType, "address", (t) =>
  t.prismaField({
    type: AddressType,
    async resolve(query, { address }) {
      return prisma.address.upsert({
        ...query,
        where: { address },
        update: {},
        create: {
          address,
          name: "You",
        },
      })
    },
  })
)
