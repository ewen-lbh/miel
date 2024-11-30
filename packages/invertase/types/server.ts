import { builder } from "../builder"
import { typeName, graphinx } from "../utils"
import { ServerTypeType } from "./server-type"

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
    type: t.expose("type", { type: ServerTypeType }),
    senderAccounts: t.relation("senderAccounts"),
    receiverAccounts: t.relation("receiverAccounts"),
  }),
})
