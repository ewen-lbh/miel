import { builder } from "../builder"
import { typeName, graphinx } from "../utils"
import * as Prisma from "../prisma"

export const ServerTypeType = builder.enumType(Prisma.ServerType, {
  name: typeName(),
})
