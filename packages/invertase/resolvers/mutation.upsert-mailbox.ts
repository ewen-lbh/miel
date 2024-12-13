import { builder, prisma } from "../builder.js"
import { MailboxType } from "../schema.js"
import { MailboxInputType } from "../types/mailbox-input.js"
import { enforceNonNullMember, fieldName } from "../utils.js"

builder.mutationField(fieldName(), (t) =>
  t.prismaField({
    type: MailboxType,
    errors: {},
    args: {
      id: t.arg.globalID({
        for: MailboxType,
        required: false,
        description: "Leave empty to create a new mailbox",
      }),
      input: t.arg({ type: MailboxInputType, required: true }),
    },
    async resolve(query, _, { id, input }) {
      if (id)
        return prisma.mailbox.update({
          where: { id: id.id },
          data: {
            type: input.type ?? undefined,
            name: input.name ?? undefined,
          },
        })

      return prisma.mailbox.create({
        ...query,
        data: {
          account: {
            connect: { address: enforceNonNullMember(input, "account") },
          },
          type: enforceNonNullMember(input, "type"),
          internalUidValidity: 0,
          name: enforceNonNullMember(input, "name"),
        },
      })
    },
  })
)
