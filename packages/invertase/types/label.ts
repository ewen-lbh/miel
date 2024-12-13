import { builder } from "../builder.js"
import { typeName, graphinx } from "../utils.js"
import { ColorType } from "./color.js"
import { EmailType } from "./email.js"
import { EmailConnectionType } from "./email-connection.js"

export const LabelType = builder.prismaNode("Label", {
  id: { field: "id" },
  name: typeName(),
  fields: (t) => ({
    key: t.exposeString("key"),
    text: t.exposeString("text"),
    color: t.expose("color", { type: ColorType }),
    emails: t.relatedConnection(
      "emails",
      {
        type: EmailType,
        cursor: "id",
        query: { orderBy: { internalUid: "desc" } },
      },
      EmailConnectionType
    ),
  }),
})
