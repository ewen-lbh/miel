import { builder } from "../builder.js"
import { typeName } from "../utils.js"
import { EmailType } from "./email.js"
import { EmailAddressType } from "./email-address.js"
import { EmailConnectionType } from "./email-connection.js"

export const AddressType = builder.prismaNode("Address", {
  id: { field: "id" },
  name: typeName(),
  fields: (t) => ({
    address: t.exposeString("address"),
    name: t.exposeString("name"),
    known: t.exposeBoolean("known", { nullable: true }),
    verified: t.exposeBoolean("verified", { nullable: true }),
    probablyAPerson: t.boolean({
      resolve({ address }) {
        const domain = address.split("@", 2)[1]
        return REGULAR_PEOPLE_DOMAINS.has(domain)
      },
    }),
    sentEmails: t.relatedConnection(
      "sentEmails",
      {
        type: EmailType,
        cursor: "id",
        args: {
          account: t.arg({
            type: EmailAddressType,
            required: false,
            description: "Limit to emails received on a specific account",
          }),
        },
        query({ account }) {
          return {
            where: account
              ? { inbox: { account: { address: account } } }
              : undefined,
            orderBy: { internalUid: "desc" },
          }
        },
      },
      EmailConnectionType
    ),
    receivedEmails: t.relatedConnection(
      "receivedEmails",
      {
        type: EmailType,
        cursor: "id",
        args: {
          account: t.arg({
            type: EmailAddressType,
            required: false,
            description: "Limit to emails received on a specific account",
          }),
        },
        query({ account }) {
          return {
            where: account
              ? { inbox: { account: { address: account } } }
              : undefined,
            orderBy: { internalUid: "desc" },
          }
        },
      },
      EmailConnectionType
    ),
    ccEmails: t.relatedConnection(
      "ccEmails",
      {
        type: EmailType,
        cursor: "id",
        args: {
          account: t.arg({
            type: EmailAddressType,
            required: false,
            description: "Limit to emails received on a specific account",
          }),
        },
        query({ account }) {
          return {
            where: account
              ? { inbox: { account: { address: account } } }
              : undefined,
            orderBy: { internalUid: "desc" },
          }
        },
      },
      EmailConnectionType
    ),
  }),
})

// Thx Copilot
const REGULAR_PEOPLE_DOMAINS = new Set([
  "gmail.com",
  "yahoo.com",
  "hotmail.com",
  "outlook.com",
  "icloud.com",
  "aol.com",
  "protonmail.com",
  "zoho.com",
  "yandex.com",
  "mail.com",
  "gmx.com",
  "inbox.com",
  "fastmail.com",
  "tutanota.com",
  "hushmail.com",
  "runbox.com",
  "countermail.com",
  "tormail.org",
  "lavabit.com",
  "safe-mail.net",
  "elude.in",
  "mailfence.com",
  "riseup.net",
  "autistici.org",
  "free.fr",
  "tutanota.de",
  "disroot.org",
  "mailbox.org",
  "protonmail.ch",
])
