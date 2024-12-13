import { DateTimeResolver } from "graphql-scalars"
import { builder } from "../builder.js"

export const DateTimeType = builder.addScalarType("DateTime", DateTimeResolver)
