import { builder } from "../builder.js"
import { typeName } from "../utils.js"
import { EmailType } from "./email.js"

export const EmailConnectionType = builder.connectionObject({
  name: typeName(),
  type: EmailType,
})
