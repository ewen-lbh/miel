import { builder, prisma } from "../builder.js"
import { typeName } from "../utils.js"
import { EmailAddressType } from "./email-address.js"
import { MailboxType } from "./mailbox.js"
import { MailboxTypeType } from "./mailbox-type.js"

export const AccountType = builder.prismaNode("Account", {
  id: { field: "id" },
  name: typeName(),
  fields: (t) => ({
    emailAddress: t.expose("address", { type: EmailAddressType }),
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
    inbox: t.prismaField({
      type: MailboxType,
      nullable: true,
      description: "Get a mailbox on this account by its ID",
      args: {
        id: t.arg.globalID({ for: MailboxType, required: true }),
      },
      async resolve(query, account, { id }) {
        return prisma.mailbox.findUnique({
          ...query,
          where: {
            id: id.id,
            accountId: account.id,
          },
        })
      },
    }),
    mainbox: t.relation("mainbox", { nullable: true }),
    trashbox: t.relation("trashbox", { nullable: true }),
    sentbox: t.relation("sentbox", { nullable: true }),
    draftsbox: t.relation("draftsbox", { nullable: true }),
    feedbox: t.prismaField({
      description: "First maibox of type FEED",
      type: MailboxType,
      nullable: true,
      async resolve(query, account) {
        return prisma.mailbox.findFirst({
          ...query,
          where: {
            accountId: account.id,
            type: "FEED",
          },
        })
      },
    }),
    senderServer: t.relation("senderServer", { nullable: true }),
    receiverServer: t.relation("receiverServer"),
  }),
})
