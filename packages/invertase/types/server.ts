import { builder } from "../builder.js"
import { typeName } from "../utils.js"
import { ServerTypeEnum, ServerTypeType } from "./server-type.js"

export const ServerType = builder.prismaNode("Server", {
  id: { field: "id" },
  name: typeName(),
  fields: (t) => ({
    host: t.exposeString("host"),
    port: t.exposeInt("port"),
    secure: t.exposeBoolean("secure"),
    username: t.exposeString("username"),
    password: t.exposeString("password", { nullable: true }),
    token: t.exposeString("token", { nullable: true }),
    type: t.field({
      type: ServerTypeType,
      resolve: (s) => s.type as ServerTypeEnum,
    }),
    senderAccounts: t.relation("senderAccounts"),
    receiverAccounts: t.relation("receiverAccounts"),
  }),
})
