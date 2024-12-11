import { builder } from "../builder"
import { typeName } from "../utils"

export enum ServerTypeEnum {
  IMAP = "IMAP",
  SMTP = "SMTP",
  Google = "Google",
}

export const ServerTypeType = builder.enumType(ServerTypeEnum, {
  name: typeName(),
})
