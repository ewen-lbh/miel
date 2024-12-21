import { builder, prisma } from "../builder.js"
import { AttachmentType, EmailAddressType } from "../schema.js"
import { fieldName } from "../utils.js"

builder.queryField(fieldName(), (t) =>
  t.prismaConnection({
    type: AttachmentType,
    cursor: "id",
    description: "List of all your attachments",
    args: {
      account: t.arg({
        type: EmailAddressType,
        required: false,
        description: "Limit to attachments from a specific account",
      }),
    },
    async resolve(query, _, { account }, { ensuredUserId }) {
      return prisma.attachment.findMany({
        ...query,
        where: {
          email: {
            users: { some: { id: ensuredUserId() } },
            ...(account
              ? { mailbox: { account: { email: account } } }
              : undefined),
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      })
    },
  })
)
