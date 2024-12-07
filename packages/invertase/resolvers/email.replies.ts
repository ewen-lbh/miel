import { builder } from "../builder"
import { EmailConnectionType, EmailType } from "../schema"
import { fieldName } from "../utils"

builder.prismaObjectField(EmailType, fieldName(), (t) =>
  t.relatedConnection("threadReplies", { cursor: "id" }, EmailConnectionType)
)
