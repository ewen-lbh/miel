import { sha256 } from "js-sha256"
import { builder, prisma } from "../builder"
import { typeName, workingURL } from "../utils"
import { EmailType } from "./email"
import { EmailConnectionType } from "./email-connection"
import { URLType } from "./url"

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
        query: { orderBy: { internalUid: "desc" } },
      },
      EmailConnectionType
    ),
    receivedEmails: t.relatedConnection(
      "receivedEmails",
      {
        type: EmailType,
        cursor: "id",
        query: { orderBy: { internalUid: "desc" } },
      },
      EmailConnectionType
    ),
    ccEmails: t.relatedConnection(
      "ccEmails",
      {
        type: EmailType,
        cursor: "id",
        query: { orderBy: { internalUid: "desc" } },
      },
      EmailConnectionType
    ),
  }),
})
