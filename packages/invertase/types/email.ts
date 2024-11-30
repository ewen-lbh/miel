import { builder } from "../builder"
import { graphinx, typeName } from "../utils"
import { HTMLType } from "./html"

export const EmailType = builder.prismaNode("Email", {
  id: { field: "id" },
  name: typeName(),
  fields: (t) => ({
    subject: t.exposeString("subject"),
    text: t.exposeString("textBody"),
    html: t.expose("htmlBody", { type: HTMLType }),
    raw: t.exposeString("rawBody"),
    inbox: t.relation("inbox"),
    trusted: t.exposeBoolean("trusted"),
  }),
})
