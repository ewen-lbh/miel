import { builder } from "../builder"
import { invalidateSession } from "../lib/auth"
import { SessionType } from "../schema"
import { ensureLoggedIn } from "../utils"

builder.mutationField("logout", (t) =>
  t.prismaField({
    type: SessionType,
    errors: {},
    args: {
      token: t.arg.string({ required: false }),
    },
    async resolve(query, _, { token }, { session }) {
      return invalidateSession(query, token ?? ensureLoggedIn(session).token)
    },
  })
)
