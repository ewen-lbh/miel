import { builder } from "../builder"
import { typeName } from "../utils"

export const AccountType = builder.prismaNode("Account", {
  id: { field: "id" },
  name: typeName(),
  fields: (t) => ({
    address: t.exposeString("address"),
    name: t.exposeString("name"),
  }),
})
