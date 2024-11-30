import { builder } from "../builder"
import * as Prisma from "../prisma"
import { typeName } from "../utils"

export const AddressTypeType = builder.enumType(Prisma.AddressType, {
  name: typeName(),
})
