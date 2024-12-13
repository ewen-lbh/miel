import { builder } from "../builder.js"
import { HexColorCodeResolver } from "graphql-scalars"

export const ColorType = builder.addScalarType("Color", HexColorCodeResolver)
