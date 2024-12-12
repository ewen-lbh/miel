import { builder } from "../builder"
import { ensureLoggedIn } from "../utils"

export const SessionType = builder.prismaNode("Session", {
  id: { field: "id" },
  findUnique(id, { session }) {
    return { id, userId: ensureLoggedIn(session).userId }
  },
  fields: (t) => ({
    userId: t.exposeID("userId"),
  }),
})
