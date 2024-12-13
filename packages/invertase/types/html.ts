import { builder } from "../builder.js"

export const HTMLType = builder.scalarType("HTML", {
  parseValue() {
    throw new Error("HTML input not allowed, use Markdown.")
  },
  serialize: (s) => s,
})
