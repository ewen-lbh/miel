import { builder, prisma } from "../builder.js"
import { AddressType } from "../types/address.js"
import { EmailAddressType } from "../types/email-address.js"
import { MailboxType } from "../types/mailbox.js"
import { enforceNonNullMember, fieldName } from "../utils.js"

const AddressInputType = builder.inputType("AddressInput", {
  fields: (t) => ({
    name: t.string({ required: false }),
    defaultInbox: t.globalID({ for: MailboxType, required: false }),
  }),
})

builder.mutationField(fieldName(), (t) =>
  t.prismaField({
    type: AddressType,
    errors: {},
    description: "Update or create an address",
    args: {
      email: t.arg({ type: EmailAddressType, required: true }),
      input: t.arg({ type: AddressInputType, required: true }),
    },
    async resolve(query, _, { input, email }, ctx) {
      const found = await prisma.address
        .findUnique({
          where: {
            address_userId: {
              address: email,
              userId: ctx.ensuredUserId(),
            },
          },
          select: { id: true },
        })
        .then(Boolean)

      if (found) {
        return prisma.address.update({
          ...query,
          where: {
            address_userId: {
              address: email,
              userId: ctx.ensuredUserId(),
            },
          },
          data: {
            name: input.name ?? undefined,
            defaultInbox: input.defaultInbox
              ? {
                  connect: {
                    id: input.defaultInbox.id,
                    account: { userId: ctx.ensuredUserId() },
                  },
                }
              : undefined,
          },
        })
      }

      return prisma.address.create({
        ...query,
        data: {
          address: email,
          user: { connect: { id: ctx.ensuredUserId() } },
          name: enforceNonNullMember(input, "name"),
          defaultInbox: input.defaultInbox
            ? {
                connect: {
                  id: input.defaultInbox.id,
                  account: { userId: ctx.ensuredUserId() },
                },
              }
            : undefined,
        },
      })
    },
  })
)
