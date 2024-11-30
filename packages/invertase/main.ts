import express from "express"
import { createYoga } from "graphql-yoga"
import { builder } from "./builder.ts"

const yoga = createYoga({
  schema: builder.toSchema(),
})

const server = express()

server.use("/graphql", yoga.handle)
server.listen(4000, () => {
  console.log("Server is running on http://localhost:4000/graphql")
})
