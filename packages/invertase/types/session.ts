import { builder } from "../builder.js"

export const SessionType = builder.prismaNode("Session", {
  id: { field: "id" },
  findUnique(id, ctx) {
    return { id, userId: ctx.ensuredUserId }
  },
  fields: (t) => ({
    userId: t.exposeID("userId"),
  }),
})
