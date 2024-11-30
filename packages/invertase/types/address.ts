import { builder } from "../builder"
import { graphinx, typeName } from "../utils"
import { EmailType } from "./email"
import { EmailConnectionType } from "./email-connection"
import { URLType } from "./url"

export const AddressType = builder.prismaNode("Address", {
  id: { field: "id" },
  name: typeName(),
  fields: (t) => ({
    avatarURL: t.expose("avatarURL", { type: URLType, nullable: true }),
    address: t.exposeString("address"),
    name: t.exposeString("name"),
    known: t.exposeBoolean("known", { nullable: true }),
    verified: t.exposeBoolean("verified", { nullable: true }),
    sentEmails: t.relatedConnection(
      "sentEmails",
      {
        type: EmailType,
        cursor: "id",
      },
      EmailConnectionType
    ),
    receivedEmails: t.relatedConnection(
      "receivedEmails",
      {
        type: EmailType,
        cursor: "id",
      },
      EmailConnectionType
    ),
    ccEmails: t.relatedConnection(
      "ccEmails",
      {
        type: EmailType,
        cursor: "id",
      },
      EmailConnectionType
    ),
  }),
})
