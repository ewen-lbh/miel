import { builder, prisma } from "../builder"
import { EmailAddressType, AddressType } from "../schema"
import { fieldName } from "../utils"

builder.queryField(fieldName(), (t) =>
  t.prismaField({
    type: AddressType,
    nullable: true,
    description: "Find an address by its email address",
    args: {
      email: t.arg({ type: EmailAddressType, required: true }),
    },
    async resolve(query, _, { email }) {
      return await prisma.address.findUnique({
        ...query,
        where: { address: email },
      })
    },
  })
)
