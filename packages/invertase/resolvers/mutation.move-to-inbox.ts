import { builder, prisma } from "../builder"
import { EmailType, MailboxType } from "../schema"
import { fieldName } from "../utils"

builder.mutationField(fieldName(), (t) =>
  t.prismaField({
    type: EmailType,
    errors: {},
    args: {
      email: t.arg.globalID({
        for: EmailType,
        required: true,
      }),
      inbox: t.arg.globalID({
        for: MailboxType,
        required: true,
      }),
    },
    async resolve(query, _, { email, inbox }) {
      // TODO notify nectar
      return prisma.email.update({
        ...query,
        where: { id: email.id },
        data: {
          inboxId: inbox.id,
        },
      })
    },
  })
)
