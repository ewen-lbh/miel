import { builder, prisma } from "../builder"
import { MailboxType } from "../schema"
import { MailboxInputType } from "../types/mailbox-input"
import { enforceNonNull, fieldName } from "../utils"

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
          account: { connect: { address: enforceNonNull(input.account) } },
          type: enforceNonNull(input.type),
          internalUidValidity: 0,
          name: enforceNonNull(input.name),
        },
      })
    },
  })
)
