import * as cheerio from "cheerio"
import { builder } from "../builder"
import { EmailType, firstHeaderValue, URLType } from "../schema"
import { fieldName } from "../utils"

builder.prismaObjectField(EmailType, fieldName(), (t) =>
  t.field({
    type: URLType,
    nullable: true,
    description: "URL to unsubscribe from the email",
    resolve({ htmlBody, headers }) {
      const fromHeaders = unsubscribeLinkFromHeaders(headers)
      const fromBody = unsubscribeLinkFromBody(htmlBody)

      // Prefer HTTPS links from body to HTTP links from List-Unsubscribe
      if (fromHeaders?.protocol === "https:") return fromHeaders.toString()
      if (fromBody?.protocol === "https:") return fromBody.toString()

      return (fromHeaders || fromBody)?.toString()
    },
  })
)

export function unsubscribeLinkFromHeaders(headers: string[]) {
  const listUnsubscribe = firstHeaderValue(headers, "List-Unsubscribe")
  if (!listUnsubscribe) return undefined

  const matches = /^<(?<mailto>[^>]+)>,<(?<link>[^>]+)>$/.exec(listUnsubscribe)
  if (!matches?.groups?.link) return undefined

  if (!URL.canParse(matches.groups.link)) return undefined
  const url = new URL(matches.groups.link)
  if (/^https?:$/.test(url.protocol)) return url
  return undefined
}

export function unsubscribeLinkFromBody(htmlBody: string) {
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

  const maybeUrl = candidates.find((c) => URL.canParse(c))
  return maybeUrl ? new URL(maybeUrl) : undefined
}
