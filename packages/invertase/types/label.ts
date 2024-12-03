import { builder } from "../builder"
import { typeName, graphinx } from "../utils"
import { ColorType } from "./color"
import { EmailType } from "./email"
import { EmailConnectionType } from "./email-connection"

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
