import { builder } from "../builder.js"
import { SessionType } from "./session.js"

export const UserType = builder.prismaNode("User", {
  id: { field: "id" },
  findUnique({}, ctx) {
    return { id: ctx.ensuredUserId() }
  },
  fields: (t) => ({
    sessions: t.relatedConnection("sessions", {
      cursor: "id",
      type: SessionType,
    }),
  }),
})
