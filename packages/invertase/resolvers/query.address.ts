import { builder, prisma } from "../builder.js"
import { AddressType, EmailAddressType } from "../schema.js"
import { fieldName } from "../utils.js"

builder.queryField(fieldName(), (t) =>
  t.prismaField({
    type: AddressType,
    nullable: true,
    description: "Find an address by its email address",
    args: {
      email: t.arg({ type: EmailAddressType, required: true }),
    },
    async resolve(query, _, { email }, ctx) {
      return await prisma.address.findUnique({
        ...query,
        where: {
          address_userId: {
            address: email,
            userId: ctx.ensuredUserId(),
          },
        },
      })
    },
  })
)
