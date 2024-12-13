import { builder, prisma } from "../builder.js"
import { EmailType } from "../schema.js"
import { fieldName } from "../utils.js"

builder.queryField(fieldName(), (t) =>
  t.prismaField({
    type: EmailType,
    nullable: true,
    description: "Find a mail by id",
    args: {
      id: t.arg.globalID({ for: EmailType, required: true }),
    },
    async resolve(query, _, { id: gid }) {
      return prisma.email.findUnique({
        ...query,
        where: { id: gid.id },
      })
    },
  })
)
