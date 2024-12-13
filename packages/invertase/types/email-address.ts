import { EmailAddressResolver } from "graphql-scalars"
import { builder } from "../builder.js"

export const EmailAddressType = builder.addScalarType("EmailAddress", EmailAddressResolver)
