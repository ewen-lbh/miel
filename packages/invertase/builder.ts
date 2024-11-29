import SchemaBuilder from "npm:@pothos/core"
import { PrismaClient } from "./prisma/deno/edge.ts"
import PrismaPlugin from "npm:@pothos/plugin-prisma"
import type PrismaTypes from "./pothos-types.d.ts"

export const prisma = new PrismaClient({})

export const builder = new SchemaBuilder<{
  PrismaTypes: PrismaTypes
}>({
  plugins: [PrismaPlugin],
  prisma: {
    client: prisma,
    // defaults to false, uses /// comments from prisma schema as descriptions
    // for object types, relations and exposed fields.
    // descriptions can be omitted by setting description to false
    exposeDescriptions: true,
    // use where clause from prismaRelatedConnection for totalCount (defaults to true)
    filterConnectionTotalCount: true,
    // warn when not using a query parameter correctly
    // onUnusedQuery: env.NODE_ENV === 'production' ? null : 'warn',
    onUnusedQuery: "warn",
  },
})
