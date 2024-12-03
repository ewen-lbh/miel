import { chunk } from "lodash-es"
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
 * @param flatEntries header entries as stored in the database
 */
export function headersToEntries(
  flatEntries: string[]
): Array<[string, string]> {
  return chunk(flatEntries, 2).filter((entry) => entry.length === 2) as Array<
    [string, string]
  >
}

export function headerValues(flatEntries: string[], key: string) {
  return headersToEntries(flatEntries)
    .filter(([k]) => k.toLowerCase() === key.toLowerCase())
    .map(([, value]) => value)
}

export function firstHeaderValue(flatEntries: string[], key: string) {
  return headerValues(flatEntries, key).at(0)
}
