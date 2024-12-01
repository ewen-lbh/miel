import { builder } from "../builder"
import { typeName } from "../utils"

export const AccountType = builder.prismaNode("Account", {
  id: { field: "id" },
  name: typeName(),
  fields: (t) => ({
    address: t.exposeString("address"),
    name: t.exposeString("name"),
    inboxes: t.relation("inboxes", {
      args: {
        empty: t.arg.boolean({
          defaultValue: false,
          description: "Include empty inboxes",
        }),
      },
      query({ empty }) {
        return {
          where: empty ? {} : { emails: { some: {} } },
          orderBy: { emails: { _count: "desc" } },
        }
      },
    }),
    mainbox: t.relation("mainbox", { nullable: true }),
    trashbox: t.relation("trashbox", { nullable: true }),
    sentbox: t.relation("sentbox", { nullable: true }),
    draftsbox: t.relation("draftsbox", { nullable: true }),
    senderServer: t.relation("senderServer", { nullable: true }),
    receiverServer: t.relation("receiverServer"),
  }),
})
