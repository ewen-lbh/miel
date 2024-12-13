import { builder } from "../builder.js"
import { EmailType, firstHeaderValue, headersToEntries } from "../schema.js"

builder.prismaObjectField(EmailType, "hasHeader", (t) =>
  t.boolean({
    description:
      'Check if the email has a header by its key. Example: `{ email(...) { respectsPeople: hasHeader(key: "List-Unsubscribe") } } `',
    args: {
      key: t.arg.string({ required: true }),
    },
    resolve({ headers }, { key }) {
      return firstHeaderValue(headers, key) !== undefined
    },
  })
)
