import { builder } from "../builder.js"
import { EmailConnectionType, EmailType } from "../schema.js"
import { fieldName } from "../utils.js"

builder.prismaObjectField(EmailType, fieldName(), (t) =>
  t.relatedConnection("threadReplies", { cursor: "id" }, EmailConnectionType)
)
