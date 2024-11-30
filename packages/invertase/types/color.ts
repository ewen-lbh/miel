import { builder } from "../builder"
import { HexColorCodeResolver } from "graphql-scalars"

export const ColorType = builder.addScalarType("Color", HexColorCodeResolver)
