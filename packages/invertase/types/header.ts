import { builder } from "../builder"
import { typeName, graphinx } from "../utils"

export const HeaderType = builder.prismaNode("Header", {
  id: { field: "id" },
  name: typeName(),
  fields: (t) => ({
    key: t.exposeString("key"),
    value: t.exposeString("value"),
    email: t.relation("email"),
  }),
})
