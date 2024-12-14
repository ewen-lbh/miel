import * as bluesky from "@atcute/client"
import * as cheerio from "cheerio"
import { sha256 } from "js-sha256"
import { z } from "zod"
import { builder, PothosTypes, prisma } from "../builder.js"
import { AddressType, URLType } from "../schema.js"
import { fieldName, workingURL } from "../utils.js"

const bskyManager = new bluesky.CredentialManager({
  service: "https://bsky.social",
})
const bsky = new bluesky.XRPC({ handler: bskyManager })

builder.prismaObjectField(AddressType, fieldName(), (t) =>
  t.field({
    type: URLType,
    nullable: true,
    description: "A avatar URL for this address",
    async resolve({ avatarURL, address }, _, ctx) {
      if (avatarURL) return avatarURL
      void infer(ctx, address).catch(console.error)
      return null
    },
  })
)

async function infer(
  ctx: PothosTypes["Context"],
  address: string,
  domain?: string
) {
  domain ??= address.split("@", 2)[1]

  let url = await workingURL(
    `https://${domain}/android-chrome-512x512.png`,
    `https://www.gravatar.com/avatar/${sha256(
      address.trim().toLowerCase()
    )}?d=404`
  )

  try {
    url ??= await faviconURLFromPage(domain)
  } catch (error) {
    // ignore
  }

  try {
    url ??= await workingURL(
      `https://${domain}/favicon.png`,
      `https://${domain}/favicon.ico`
    )
  } catch (error) {
    // ignore
  }

  if (url) {
    console.info(`Inferred avatar for ${address}: ${url}`)
    await prisma.address.update({
      where: {
        address_userId: { address, userId: ctx.ensuredUserId() },
      },
      data: { avatarURL: url },
    })
  } else if (domain?.split(".").length > 2) {
    // Try again with root domain
    const parentDomain = domain.replace(/^[^.]+\./, "")
    console.log({ domain, tryingagainwith: parentDomain })
    await infer(ctx, address, parentDomain)
  }
}

async function faviconURLFromBlueskyDid(domain: string) {
  const { data: handle } = await bsky.get(
    "com.atproto.identity.resolveHandle",
    {
      params: { handle: domain },
    }
  )

  const { value } = await bsky
    .get("com.atproto.repo.getRecord", {
      params: {
        collection: "app.bsky.actor.profile",
        repo: handle.did,
        rkey: "self",
      },
    })
    .then(({ data }) =>
      z
        .object({
          value: z.object({
            avatar: z.object({
              original: z.object({
                ref: z.object({ $link: z.string() }),
              }),
            }),
          }),
        })
        .parse(data)
    )
  return `https://cdn.bsky.app/img/feed_thumbnail/plain/${handle.did}/${value.avatar.original.ref["$link"]}@jpeg`
}

async function faviconURLFromPage(domain: string) {
  try {
    let bskyAvatar = await faviconURLFromBlueskyDid(domain)
    if (bskyAvatar) return bskyAvatar
  } catch (error) {
    // ignore
  }

  const response = await fetch(`https://${domain}`)
  const contentType = response.headers.get("content-type")

  // If it's HTML, get the favicon from the meta tags
  if (contentType?.startsWith("text/html")) {
    const html = await response.text()
    const doc = cheerio.load(html)
    const twitterHandle = doc(
      "meta[name='twitter:site'], meta[name='twitter:creator']"
    )
      .attr("content")
      ?.replace("@", "")

    if (twitterHandle) {
      return `https://unavatar.io/x/${twitterHandle}`
    }

    const favicon =
      doc("meta[property='og:image'], meta[property='twitter:image']").attr(
        "content"
      ) ?? doc("link[rel='icon'], link[rel='shortcut icon']").attr("href")
    if (favicon) {
      try {
        return new URL(favicon, `https://${domain}`).toString()
      } catch (error) {
        console.error(
          `${domain}: Error parsing favicon URL ${JSON.stringify(
            favicon
          )}: ${error}`
        )
      }
    }
  }

  return null
}
