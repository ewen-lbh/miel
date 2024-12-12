import { hash } from "argon2"
import { builder, prisma } from "../builder"
import { SessionType } from "../schema"
import { fieldName } from "../utils"
import { generateSessionToken, newSession } from "../lib/auth"
import { NewSessionType } from "../types/new-session"

builder.mutationField(fieldName(), (t) =>
  t.field({
    type: NewSessionType,
    errors: {},
    description:
      "Can also be used to change a password, by being logged-in and providing the new password and the email",
    args: {
      email: t.arg.string({ required: true, validate: { email: true } }),
      password: t.arg.string({ required: true }),
    },
    async resolve(_, { email, password }, { session }) {
      const token = generateSessionToken()
      const { expiresAt, id } = newSession(token)
      const freshSession = await prisma.session.create({
        data: {
          id,
          expiresAt,
          user: session
            ? {
                connectOrCreate: {
                  where: { email, id: session.userId },
                  create: {
                    email,
                    passwordHash: await hash(password),
                  },
                },
              }
            : {
                create: {
                  email,
                  passwordHash: await hash(password),
                },
              },
        },
      })
      return { ...freshSession, token }
    },
  })
)
