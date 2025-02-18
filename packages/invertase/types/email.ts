import path from "node:path"
import { builder } from "../builder.js"
import { storageUrl, typeName } from "../utils.js"
import { AttachmentType } from "./attachment.js"
import { DateTimeType } from "./date-time.js"
import {
  EmailAuthenticationResultType,
  resolveAuthenticationResultCheck,
} from "./email-authentication-result.js"
import { HTMLType } from "./html.js"

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
    attachments: t.relatedConnection("attachments", {
      cursor: "id",
      type: AttachmentType,
      totalCount: true,
      args: {
        embedded: t.arg.boolean({
          required: false,
          defaultValue: false,
          description: "Include embedded attachments",
        }),
      },
      query: ({ embedded }) => ({
        where: { embedded: embedded ? undefined : false },
      }),
    }),
    attachmentsBaseURL: t.string({
      resolve({ id }) {
        return storageUrl(path.join("attachments", id))
      },
    }),
    spf: t.field({
      description: "Result of the SPF check",
      type: EmailAuthenticationResultType,
      nullable: true,
      resolve: resolveAuthenticationResultCheck("spf"),
    }),
    dkim: t.field({
      description: "Result of the DKIM check",
      type: EmailAuthenticationResultType,
      nullable: true,
      resolve: resolveAuthenticationResultCheck("dkim", (v) =>
        v.startsWith("pass ")
      ),
    }),
    dmarc: t.field({
      description: "Result of the DMARC check",
      type: EmailAuthenticationResultType,
      nullable: true,
      resolve: resolveAuthenticationResultCheck("dmarc", (v) =>
        /^(p=)?pass/i.test(v)
      ),
    }),
  }),
})
