import { builder } from "../builder.js"
import { storageUrl } from "../utils.js"
import { URLType } from "./url.js"

export const AttachmentType = builder.prismaNode("Attachment", {
  id: { field: "id" },
  include: { email: true },
  fields: (t) => ({
    filename: t.exposeString("filename"),
    contentType: t.exposeString("mimeType"),
    size: t.exposeInt("size"),
    textContent: t.exposeString("textContent"),
    email: t.relation("email"),
    embedded: t.exposeBoolean("embedded"),
    url: t.field({
      type: URLType,
      resolve({ storagePath }) {
        return storageUrl(storagePath)
      },
    }),
  }),
})
