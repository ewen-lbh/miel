import { builder } from "../builder.js"
import { EmailType } from "../types/email.js"
import { headersToEntries, HeaderType } from "../types/header.js"

builder.prismaObjectField(EmailType, "headers", (t) =>
  t.field({
    type: [HeaderType],
    description: "Headers of the email",
    resolve({ headers, id }) {
      return headersToEntries(headers).map(([key, value]) => ({
        key,
        value,
        emailId: id,
      }))
    },
  })
)
