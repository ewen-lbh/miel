import { builder } from "../builder.js"
import { typeName } from "../utils.js"

export enum ServerTypeEnum {
  IMAP = "IMAP",
  SMTP = "SMTP",
  Google = "Google",
}

export const ServerTypeType = builder.enumType(ServerTypeEnum, {
  name: typeName(),
})
