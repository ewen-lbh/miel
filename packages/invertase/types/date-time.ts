import { DateTimeResolver } from "graphql-scalars"
import { builder } from "../builder"

export const DateTimeType = builder.addScalarType("DateTime", DateTimeResolver)
