import { builder } from "../builder"
import { ensureLoggedIn } from "../utils"
import { SessionType } from "./session"

export const UserType = builder.prismaNode("User", {
  id: { field: "id" },
  findUnique({}, { session }) {
    return { id: ensureLoggedIn(session).userId }
  },
  fields: (t) => ({
    sessions: t.relatedConnection("sessions", {
      cursor: "id",
      type: SessionType,
    }),
  }),
})
