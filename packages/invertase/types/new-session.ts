import { builder } from "../builder.js"
import { Session } from "../prisma/index.js"
import { typeName } from "../utils.js"

export type NewSession = Session & {
  token: string
}

export const NewSessionType = builder
  .objectRef<NewSession>(typeName())
  .implement({
    fields: (t) => ({
      token: t.exposeString("token"),
      userId: t.exposeID("userId"),
    }),
  })
