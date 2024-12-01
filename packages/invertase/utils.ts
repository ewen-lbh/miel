import { DirectiveLocation } from "@graphql-tools/utils"
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
  )
}

/**
 * Return the name to use as the GraphQL type name from the file's name.
 */

export function typeName(): string {
  return upperFirst(
    camelCase(
      path.basename(util.getCallSite()[1].scriptName.replace(/\.ts$/, ""))
    )
  )
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
