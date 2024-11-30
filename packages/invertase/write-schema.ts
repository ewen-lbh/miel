import { writeFile } from "node:fs/promises"
import { builder } from "./builder"
import path from "node:path"
import { addTypes, printSchemaWithDirectives } from "@graphql-tools/utils"
import { graphinxDirective } from "./utils.js"

const here = path.dirname(new URL(import.meta.url).pathname)

builder.queryType({})
builder.mutationType({})
builder.subscriptionType({})

await import("./schema.js")

export const schema = addTypes(builder.toSchema({}), [graphinxDirective])

await writeFile(
  path.join(here, "../fructose/schema.gql"),
  printSchemaWithDirectives(schema)
)
