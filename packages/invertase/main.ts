import { serve } from "https://deno.land/std@0.157.0/http/server.ts"
import { createYoga } from "npm:graphql-yoga"
import { builder, prisma } from "./builder.ts"

builder.queryType({
  fields: (t) => ({
    hello: t.string({
      args: {
        name: t.arg.string({}),
      },
      async resolve(_, { name }) {
        await prisma.email.create({
          data: {
            body: name ?? "World  ",
            subject: "Hello",
            trusted: false,
          },
        })
        return `Hello ${name ?? "World"}!`
      },
    }),
  }),
})

const yoga = createYoga({
  schema: builder.toSchema(),
})

serve(yoga, {
  onListen({ hostname, port }) {
    console.log(`Listening on http://${hostname}:${port}/graphql`)
  },
})
