import { builder, prisma } from "../builder.js"
import { meili } from "../lib/search.js"
import { EmailAddressType, EmailType } from "../schema.js"
import { fieldName } from "../utils.js"

builder.queryField(fieldName(), (t) =>
  t.prismaField({
    type: [EmailType],
    description: "Search in emails, including their body",
    args: {
      q: t.arg.string(),
      account: t.arg({
        type: EmailAddressType,
        required: false,
        description: "Limit to mails from a specific account",
      }),
    },
    async resolve(query, _, { q, account }, { ensuredUserId }) {
      if (!q) return []
      let ids: string[][] = []
      ids = await Promise.all(
        await prisma.account
          .findMany({
            where: { userId: ensuredUserId(), address: account ?? undefined },
          })
          .then((accounts) =>
            accounts.map(({ id: accountId }) =>
              Promise.all([
                // Search in emails
                meili
                  .index(`${accountId}__mails`)
                  .search(q)
                  .catch((err) => {
                    console.error(err)
                    return { hits: [] }
                  })
                  .then((results) => results.hits.map((hit) => hit.id)),
                // Search in attachments too
                meili
                  .index(`${accountId}__attachments`)
                  .search(q)
                  .catch((err) => {
                    console.error(err)
                    return { hits: [] }
                  })
                  .then((results) => results.hits.map((hit) => hit.emailId)),
              ]).then((results) => results.flat())
            )
          )
      )

      return prisma.email.findMany({
        ...query,
        where: {
          users: { some: { id: ensuredUserId() } },
          ...(ids.length > 0
            ? { id: { in: ids.flat() } }
            : {
                attachments: {
                  some: {
                    filename: { contains: q },
                    embedded: false,
                  },
                },
              }),
        },
        take: 50,
      })
    },
  })
)
