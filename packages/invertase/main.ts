import { useTrimInputs } from "envelop-trim-inputs"
import express from "express"
import * as GraphQLWS from "graphql-ws/lib/use/ws"
import path from "node:path"
import { createYoga } from "graphql-yoga"
import helmet from "helmet"
import { WebSocketServer } from "ws"
import { schema } from "./write-schema.ts"
import { context } from "./builder.ts"

const yoga = createYoga({
  schema,
  context,
  plugins: [useTrimInputs()],
  graphiql: { subscriptionsProtocol: "WS" },
})

const server = express()

server.use(
  "/storage",
  helmet.contentSecurityPolicy({ directives: { "script-src": "'none'" } }),
  express.static(
    path.resolve(
      path.join(path.dirname(new URL(import.meta.url).pathname), "../nectar/")
    )
  )
)

server.use("/graphql", yoga.handle)
const apiServer = server.listen(4000, () => {
  console.info("Server is running on http://localhost:4000/graphql")
  const apiWS = new WebSocketServer({ server: apiServer, path: "/graphql" })
  GraphQLWS.useServer({ schema, context }, apiWS)
  console.info("Websocket server is running on ws://localhost:4000/graphql")
})
