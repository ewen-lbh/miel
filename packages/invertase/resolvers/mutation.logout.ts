import { GraphQLError } from "graphql"
import { builder } from "../builder.js"
import { invalidateSession } from "../lib/auth.js"
import { SessionType } from "../schema.js"

builder.mutationField("logout", (t) =>
  t.prismaField({
    type: SessionType,
    errors: {},
    args: {
      token: t.arg.string({ required: false }),
    },
    async resolve(query, _, { token: argumentToken }, { token: sessionToken }) {
      const token = argumentToken ?? sessionToken
      if (!token) {
        throw new GraphQLError(
          "Provide a token to invalidate or be logged in to log out"
        )
      }

      return invalidateSession(query, token)
    },
  })
)
