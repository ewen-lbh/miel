import { DirectiveLocation } from "@graphql-tools/utils"
import * as cheerio from "cheerio"
import { GraphQLDirective, GraphQLError, GraphQLString } from "graphql"
import { camelCase, upperFirst } from "lodash-es"
import path from "node:path"
import * as util from "node:util"

/**
 * Return the name to use as the GraphQL field name from the file's name.
 */
export function fieldName(): string {
  return camelCase(
    path
      .basename(util.getCallSite()[1].scriptName)
      .replace(/\w+\.([\w-]+)\.ts$/, "$1")
  ).replace("Url", "URL")
}

/**
 * Return the name to use as the GraphQL type name from the file's name.
 */

export function typeName(): string {
  return upperFirst(
    camelCase(
      path.basename(util.getCallSite()[1].scriptName.replace(/\.ts$/, ""))
    )
  ).replace("Url", "URL")
}

export const graphinxDirective = new GraphQLDirective({
  name: "graphinx",
  locations: [
    DirectiveLocation.OBJECT,
    DirectiveLocation.FIELD_DEFINITION,
    DirectiveLocation.SCALAR,
    DirectiveLocation.ENUM,
    DirectiveLocation.UNION,
    DirectiveLocation.INTERFACE,
    DirectiveLocation.INPUT_OBJECT,
  ],
  args: {
    module: {
      type: GraphQLString,
    },
  },
})

export type GraphinxDirective = {
  locations:
    | "OBJECT"
    | "FIELD_DEFINITION"
    | "SCALAR"
    | "ENUM"
    | "UNION"
    | "INTERFACE"
    | "INPUT_OBJECT"
  args: {
    module: string
  }
}

export function graphinx<T extends string>(module: T) {
  return {
    directives: {
      graphinx: {
        module,
      },
    },
  } as const
}

export function enforceNonNull<T>(value: T | null | undefined): T {
  if (value === null || value === undefined) {
    throw new GraphQLError("This is required")
  }
  return value
}

/**
 * Successively tries each of the given URLs and returns the first URL that does not return a non-error status code, or null if all URLs fail.
 */
export async function workingURL(...urls: string[]): Promise<string | null> {
  for (const url of urls) {
    try {
      const response = await fetch(url, { method: "HEAD" })
      if (response.ok) {
        // Check if the response is an image
        const contentType = response.headers.get("content-type")
        if (contentType?.startsWith("image/")) {
          return url
        }
      }
    } catch (error) {
      // Ignore
    }
  }
  return null
}
