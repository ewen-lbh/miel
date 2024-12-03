import { builder } from "../builder"
import { typeName } from "../utils"
import { DateTimeType } from "./date-time"
import { HTMLType } from "./html"

export const EmailType = builder.prismaNode("Email", {
  id: { field: "id" },
  name: typeName(),
  fields: (t) => ({
    subject: t.string({
      description: "The subject of the email",
      args: {
        original: t.arg.boolean({
          required: false,
          defaultValue: false,
          description:
            "Return the original subject even if the mail was renamed (see Mail.renamed)",
        }),
      },
      resolve({ subject, originalSubject }, { original }) {
        return original ? originalSubject : subject
      },
    }),
    renamed: t.boolean({
      description: "The subject was changed by the user",
      resolve({ subject, originalSubject }) {
        return subject !== originalSubject
      },
    }),
    receivedAt: t.expose("receivedAt", { type: DateTimeType }),
    text: t.exposeString("textBody"),
    html: t.expose("htmlBody", { type: HTMLType }),
    raw: t.exposeString("rawBody"),
    inbox: t.relation("inbox"),
    trusted: t.exposeBoolean("trusted"),
    from: t.relation("sender"),
    to: t.relation("recipient"),
    cc: t.relation("cc"),
  }),
})
