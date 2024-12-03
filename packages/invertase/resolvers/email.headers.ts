import { builder } from "../builder"
import { EmailType } from "../types/email"
import { headersToEntries, HeaderType } from "../types/header"

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
