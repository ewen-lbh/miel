import { builder } from "../builder"
import { graphinx, typeName } from "../utils"
import { EmailType } from "./email"

export const EmailConnectionType = builder.connectionObject({
  name: typeName(),
  type: EmailType,
})