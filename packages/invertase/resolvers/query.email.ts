import { builder, prisma } from "../builder"
import { EmailType } from "../schema"
import path from "node:path"
import { fieldName } from "../utils"

builder.queryField(fieldName(), (t) =>
  t.prismaField({
    type: EmailType,
    nullable: true,
    description: "Find a mail by id",
    args: {
      id: t.arg.id({ required: true }),
    },
    async resolve(query, _, { id }) {
      return prisma.email.findUnique({
        ...query,
        where: { id },
      })
    },
  })
)
