import { useTrimInputs } from "envelop-trim-inputs"
import express from "express"
import * as GraphQLWS from "graphql-ws/lib/use/ws"
import path from "node:path"
import { createYoga } from "graphql-yoga"
import helmet from "helmet"
import { WebSocketServer } from "ws"
import { schema } from "./write-schema.ts"
import { context } from "./builder.ts"
import * as dotenv from "dotenv"

dotenv.config()

const API_PORT = process.env.PORT || 4000

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
const apiServer = server.listen(API_PORT, () => {
  console.info(`Server is running on http://localhost:${API_PORT}/graphql`)
  const apiWS = new WebSocketServer({ server: apiServer, path: "/graphql" })
  GraphQLWS.useServer({ schema, context }, apiWS)
  console.info(
    `Websocket server is running on ws://localhost:${API_PORT}/graphql`
  )
})
