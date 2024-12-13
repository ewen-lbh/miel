import { DirectiveLocation } from "@graphql-tools/utils"
import { GraphQLDirective, GraphQLError, GraphQLString } from "graphql"
import { camelCase, upperFirst } from "lodash-es"
import path from "node:path"
import * as util from "node:util"
import { PothosTypes } from "./builder.js"
import {
  SessionTokenValidateResult as Context,
  SessionTokenValidateResult,
  UnauthorizedError,
} from "./lib/auth.js"

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

/**
 * Enforce that a value is not null or undefined.
 * @param value the value to check for null or undefined
 * @param varname a descriptive name for the value
 * @returns the value if it's not null or undefined
 * @throws a GraphQLError "${varname} is required" if the value is null or undefined
 */
export function enforceNonNull<T>(value: T, varname: string): NonNullable<T> {
  if (value === null || value === undefined) {
    throw new GraphQLError(
      varname ? `${varname} is required` : "This is required"
    )
  }
  return value
}

export function enforceNonNullMember<
  V,
  K extends string,
  O extends { [key in K]?: V }
>(object: O, key: K) {
  return enforceNonNull(object[key], key)
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

/**
 * Parse a header value that contains ';'-separated key-value pairs.
 */
export function parseComplexHeader(value: string) {
  const segments = Object.fromEntries(
    value.split(";").map((segment) => {
      const [key, ...values] = segment.trim().split("=")
      let value = values.join("=").trim()
      let description = ""
      /* Parse eventual parenthesized end of value as a description */
      if (value.includes("(") && value.includes(")")) {
        ;[value, description] = value.split("(")
        value = value.trim()
        description = description.replace(")", "").trim()
      }
      return value ? [key.trim(), { value, description }] : [key, null]
    })
  )

  return segments
}

export function storageUrl(storagePath: string) {
  const diskLocation = path.resolve(
    path.join(path.dirname(new URL(import.meta.url).pathname), "../nectar")
  )
  return new URL(
    path
      .relative(diskLocation, path.resolve(storagePath))
      .replace("invertase/", "storage/"),
    "https://miel.gwen.works"
  ).toString()
}

export function ensureLoggedIn(
  session: SessionTokenValidateResult["session"],
  errorMessage = "You must be logged in"
): NonNullable<SessionTokenValidateResult["session"]> {
  if (!session) throw new UnauthorizedError(errorMessage)
  return session
}
