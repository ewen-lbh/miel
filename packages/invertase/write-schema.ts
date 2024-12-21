import { writeFile } from "node:fs/promises"
import { builder } from "./builder.js"
import { fileURLToPath } from "url"
import path from "node:path"
import { addTypes, printSchemaWithDirectives } from "@graphql-tools/utils"
import { graphinxDirective } from "./utils.js"

const here = path.dirname(new URL(import.meta.url).pathname)

await import("./schema.js")
export const schema = addTypes(builder.toSchema({}), [graphinxDirective])

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  await writeFile(
    path.join(here, "../fructose/schema.gql"),
    printSchemaWithDirectives(schema)
  )
  process.exit(0)
}
