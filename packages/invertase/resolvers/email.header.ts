import { builder } from "../builder"
import { headersToEntries, headerValues } from "../schema"
import { EmailType } from "../types/email"

builder.prismaObjectField(EmailType, "header", (t) =>
  t.field({
    description: "Get all the values of a header by its key",
    type: ["String"],
    args: {
      key: t.arg.string({ required: true }),
    },
    resolve({ headers }, { key }) {
      return headerValues(headers, key)
    },
  })
)
