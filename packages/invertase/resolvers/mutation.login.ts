import { verify } from "argon2"
import { GraphQLError } from "graphql"
import { builder, prisma } from "../builder"
import { generateSessionToken, newSession } from "../lib/auth"
import { NewSessionType } from "../types/new-session"
import { fieldName } from "../utils"

builder.mutationField(fieldName(), (t) =>
  t.field({
    type: NewSessionType,
    errors: {},
    args: {
      email: t.arg.string({ required: true, validate: { email: true } }),
      password: t.arg.string({ required: true }),
    },
    async resolve(_, { email, password }) {
      const user = await prisma.user.findUniqueOrThrow({
        where: { email },
      })
      if (!(await verify(user.passwordHash, password))) {
        throw new GraphQLError("Invalid password")
      }
      const token = generateSessionToken()
      const session = await prisma.session.create({
        data: {
          ...newSession(token),
          user: {
            connect: { id: user.id },
          },
        },
      })
      return { ...session, token }
    },
  })
)
