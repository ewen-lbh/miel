import { builder, prisma } from "../builder.js"
import { EmailType } from "../schema.js"
import { fieldName } from "../utils.js"

builder.mutationField(fieldName(), (t) =>
  t.prismaField({
    type: EmailType,
    errors: {},
    description: "Change an email's subject",
    args: {
      email: t.arg.globalID({ for: EmailType, required: true }),
      subject: t.arg.string({ required: true, validate: { minLength: 1 } }),
    },
    async resolve(query, _, { email, subject }) {
      return prisma.email.update({
        ...query,
        where: { id: email.id },
        data: { subject },
      })
    },
  })
)
