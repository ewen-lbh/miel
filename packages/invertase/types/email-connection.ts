import { builder } from "../builder"
import { typeName } from "../utils"
import { EmailType } from "./email"

export const EmailConnectionType = builder.connectionObject({
  name: typeName(),
  type: EmailType,
})
