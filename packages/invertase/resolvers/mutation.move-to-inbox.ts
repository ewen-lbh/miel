import { GraphQLError } from "graphql"
import { builder, prisma } from "../builder.js"
import { backchannelCall } from "../lib/backchannel.js"
import { EmailType, MailboxType } from "../schema.js"
import { fieldName } from "../utils.js"

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
      const { accountId } = await prisma.mailbox.findUniqueOrThrow({
        where: { id: inbox.id },
        select: { accountId: true },
      })

      const err = await backchannelCall(accountId, {
        MoveToInbox: [{ Emails: [email.id], Inbox: inbox.id }],
      })

      if (err) {
        throw new GraphQLError(`Could not move email to inbox: ${err}`)
      }

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
