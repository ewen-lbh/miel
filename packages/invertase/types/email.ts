import { builder } from "../builder"
import { graphinx, typeName } from "../utils"
import { HTMLType } from "./html"
import { URLType } from "./url"
import * as cheerio from "cheerio"

export const EmailType = builder.prismaNode("Email", {
  id: { field: "id" },
  name: typeName(),
  fields: (t) => ({
    subject: t.exposeString("subject"),
    text: t.exposeString("textBody"),
    html: t.expose("htmlBody", { type: HTMLType }),
    raw: t.exposeString("rawBody"),
    inbox: t.relation("inbox"),
    trusted: t.exposeBoolean("trusted"),
    from: t.relation("sender"),
    to: t.relation("recipient"),
    cc: t.relation("cc"),
    unsubscribe: t.field({
      type: URLType,
      nullable: true,
      description: "Link to unsubscribe from this email",
      resolve({ htmlBody }) {
        return htmlBody ? unsubscribeLink(htmlBody) : null
      },
    }),
  }),
})

function unsubscribeLink(htmlBody: string) {
  let candidates = [] as string[]
  const doc = cheerio.load(htmlBody)
  const links = doc("a[href]")
  for (const link of links) {
    const href = link.attribs.href
    if (href.includes("unsubscribe")) {
      candidates.push(href)
      continue
    }
    const text = doc.text([link])
    if (text.toLowerCase().includes("unsubscribe")) {
      candidates.unshift(href)
      continue
    }
    if (text.toLowerCase().includes("notification")) {
      candidates.push(href)
      continue
    }

    const outerText = doc.text(link.parentNode?.children ?? [])
    if (outerText.toLowerCase().includes("unsubscribe")) {
      candidates.push(href)
      continue
    }
    if (outerText.toLowerCase().includes("newsletter")) {
      candidates.push(href)
      continue
    }
    if (outerText.toLowerCase().includes("plus recevoir")) {
      candidates.push(href)
      continue
    }
  }

  return candidates.find((c) => URL.canParse(c))
}
