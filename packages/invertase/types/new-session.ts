import { builder } from "../builder"
import { Session } from "../prisma"
import { typeName } from "../utils"

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
