import { EmailAddressResolver } from "graphql-scalars"
import { builder } from "../builder"

export const EmailAddressType = builder.addScalarType("EmailAddress", EmailAddressResolver)
