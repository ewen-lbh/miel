import { builder } from "../builder"
import { typeName } from "../utils"
import { EmailAddressType } from "./email-address"
import { MailboxTypeType } from "./mailbox-type"

export const AccountType = builder.prismaNode("Account", {
  id: { field: "id" },
  name: typeName(),
  fields: (t) => ({
    address: t.expose("address", { type: EmailAddressType }),
    name: t.exposeString("name"),
    inboxes: t.relation("inboxes", {
      args: {
        empty: t.arg.boolean({
          defaultValue: false,
          description: "Include empty inboxes",
        }),
        type: t.arg({
          type: [MailboxTypeType],
          description: "Return only inboxes of the given types",
        }),
      },
      query({ empty, type }) {
        return {
          where: {
            ...(empty ? {} : { emails: { some: {} } }),
            ...(type ? { type: { in: type } } : {}),
          },
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
