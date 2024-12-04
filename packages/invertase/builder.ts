import SchemaBuilder from "@pothos/core"
import { PrismaClient } from "./prisma/index.js"
import { ZodError } from "zod"
import PrismaPlugin from "@pothos/plugin-prisma"
import ErrorsPlugin from "@pothos/plugin-errors"
import SmartSubscriptionsPlugin, {
  subscribeOptionsFromIterator,
} from "@pothos/plugin-smart-subscriptions"
import ZodPlugin from "@pothos/plugin-zod"
import RelayPlugin from "@pothos/plugin-relay"
import type PrismaTypes from "./pothos-types.d.ts"
import { GraphinxDirective } from "./utils.ts"
import { pubsub } from "./lib/pubsub.ts"

export const prisma = new PrismaClient({})

export type PothosTypes = {
  PrismaTypes: PrismaTypes
  DefaultFieldNullability: false
  DefaultNodeNullability: false
  DefaultEdgesNullability: false
  Scalars: {
    EmailAddress: {
      Input: string
      Output: string
    }
    HTML: {
      Input: string
      Output: string
    }
    URL: {
      Input: string
      Output: string
    }
    Color: {
      Input: string
      Output: string
    }
    DateTime: {
      Input: Date
      Output: Date
    }
  }
  Directives: {
    graphinx: GraphinxDirective
  }
}

export const builder = new SchemaBuilder<PothosTypes>({
  plugins: [
    ErrorsPlugin,
    ZodPlugin,
    PrismaPlugin,
    RelayPlugin,
    SmartSubscriptionsPlugin,
  ],
  defaultFieldNullability: false,
  errors: {
    defaultTypes: [Error, ZodError],
  },
  smartSubscriptions: subscribeOptionsFromIterator((name) =>
    pubsub.subscribe(name)
  ),
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
  relay: {
    nodesOnConnection: true,
    brandLoadedObjects: true,
    edgesFieldOptions: {
      nullable: false,
    },
    nodeFieldOptions: {
      nullable: false,
    },
  },
})

builder.queryType({})
builder.mutationType({})
builder.subscriptionType({})
