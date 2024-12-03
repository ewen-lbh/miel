import { builder, prisma } from "../builder"
import { AddressType, EmailAddressType } from "../schema"
import { fieldName } from "../utils"

builder.mutationField(fieldName(), (t) =>
  t.prismaField({
    type: AddressType,
    description:
      "Screen an address to a specific inbox. Can also be used on a already screened address to change its default inbox",
    args: {
      address: t.arg({ type: EmailAddressType, required: true }),
      box: t.arg.globalID({
        description: "Mailbox to screen the mail to",
        required: true,
      }),
    },
    async resolve(query, _, { address, box }) {
      return await prisma.address.update({
        ...query,
        where: { address },
        data: {
          defaultInbox: { connect: { id: box.id } },
        },
      })
    },
  })
)
