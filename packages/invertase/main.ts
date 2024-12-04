import express from "express"
import { createYoga } from "graphql-yoga"
import { builder } from "./builder.ts"
import { useTrimInputs } from "envelop-trim-inputs"
import { WebSocketServer } from "ws"
import * as GraphQLWS from "graphql-ws/lib/use/ws"

await import("./schema.js")
const schema = builder.toSchema()

const yoga = createYoga({
  schema,
  plugins: [useTrimInputs()],
  graphiql: { subscriptionsProtocol: "WS" },
})

const server = express()

server.use("/graphql", yoga.handle)
const apiServer = server.listen(4000, () => {
  console.info("Server is running on http://localhost:4000/graphql")
  const apiWS = new WebSocketServer({ server: apiServer, path: "/graphql" })
  GraphQLWS.useServer({ schema }, apiWS)
  console.info("Websocket server is running on ws://localhost:4000/graphql")
})
