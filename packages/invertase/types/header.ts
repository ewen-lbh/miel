import { builder, prisma } from "../builder"
import { typeName } from "../utils"
import { EmailType } from "./email"

export const HeaderType = builder.objectRef<Header>(typeName()).implement({
  fields: (t) => ({
    key: t.exposeString("key"),
    value: t.exposeString("value"),
    email: t.prismaField({
      type: EmailType,
      async resolve(query, { emailId }) {
        return prisma.email.findUniqueOrThrow({
          ...query,
          where: { id: emailId },
        })
      },
    }),
  }),
})

type Header = {
  key: string
  value: string
  emailId: string
}

/**
 * Convert header entries as stored in the database to a list of headers.
 * @param rawHeaders header entries as stored in the database
 */
export function headersToEntries(rawHeaders: string): Array<[string, string]> {
  return rawHeaders.split("\n").map((line) => {
    const [key, ...value] = line.split(": ")
    return [key, value.join(": ")]
  })
}

export function headerValues(rawHeaders: string, key: string) {
  return headersToEntries(rawHeaders)
    .filter(([k]) => k.toLowerCase() === key.toLowerCase())
    .map(([, value]) => value)
}

export function firstHeaderValue(flatEntries: string, key: string) {
  return headerValues(flatEntries, key).at(0)
}
