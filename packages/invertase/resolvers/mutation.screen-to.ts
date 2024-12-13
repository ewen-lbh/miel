import { GraphQLError } from "graphql"
import { builder, prisma } from "../builder.js"
import { backchannelCall } from "../lib/backchannel.js"
import { AddressType, EmailAddressType, MailboxType } from "../schema.js"
import { fieldName } from "../utils.js"

builder.mutationField(fieldName(), (t) =>
  t.prismaField({
    type: AddressType,
    errors: {},
    description:
      "Screen an address to a specific inbox. Can also be used on a already screened address to change its default inbox",
    args: {
      address: t.arg({ type: EmailAddressType, required: true }),
      account: t.arg({ type: EmailAddressType, required: true }),
      box: t.arg.globalID({
        description: "Mailbox to screen the mail to",
        for: MailboxType,
        required: true,
      }),
    },
    async resolve(query, _, { address, box, account }, ctx) {
      const { id: accountId } = await prisma.account.findUniqueOrThrow({
        where: { address: account, userId: ctx.ensuredUserId },
        select: { id: true },
      })

      const result = await prisma.address.update({
        ...query,
        where: { address_userId: { address, userId: ctx.ensuredUserId } },
        data: {
          defaultInbox: { connect: { id: box.id } },
        },
      })

      const emails = await prisma.email.findMany({
        where: {
          sender: { address },
          inbox: { accountId: accountId },
          processed: false,
        },
        select: { id: true },
      })

      const err = await backchannelCall(accountId, {
        MoveToInbox: [
          {
            Emails: emails.map((m) => m.id),
            Inbox: box.id,
          },
        ],
      })
      if (err) {
        throw new GraphQLError(
          `Could not move screen emails from ${address}: ${err}`
        )
      }
      return result
    },
  })
)
