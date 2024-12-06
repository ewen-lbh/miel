import { builder } from "../builder"
import { typeName } from "../utils"
import { AddressType } from "./address"
import { EmailType } from "./email"
import { EmailConnectionType } from "./email-connection"
import { MailboxTypeType } from "./mailbox-type"

export const MailboxType = builder.prismaNode("Mailbox", {
  id: { field: "id" },
  name: typeName(),
  fields: (t) => ({
    account: t.relation("account"),
    type: t.expose("type", { type: MailboxTypeType }),
    name: t.string({
      description:
        "The mailbox's name. The special inbox name 'INBOX' is replaced with 'Main'",
      nullable: true,
      resolve({ name }) {
        return name === "INBOX" ? "Main" : name
      },
    }),
    main: t.exposeBoolean("main", { nullable: true }),
    emails: t.relatedConnection(
      "emails",
      {
        type: EmailType,
        cursor: "id",
        args: {
          includeUnscreened: t.arg.boolean({
            defaultValue: false,
            required: false,
            description: "Include emails from unscreened senders",
          }),
        },
        query: ({ includeUnscreened }) => ({
          orderBy: { internalUid: "desc" },
          ...(includeUnscreened
            ? {}
            : { where: { sender: { defaultInbox: { isNot: null } } } }),
        }),
      },
      EmailConnectionType
    ),
    defaultOf: t.relatedConnection("defaultBoxOf", {
      cursor: "id",
      type: AddressType,
      totalCount: true,
    }),
    usedAsMainboxOn: t.relation("mainbox"),
    usedAsTrashboxOn: t.relation("trashbox"),
    usedAsSentboxOn: t.relation("sentbox"),
    usedAsDraftsboxOn: t.relation("draftsbox"),
  }),
})
