import { ZodError, type ZodFormattedError } from "zod"
import { builder } from "../builder.js"
import { RedirectionError, UnauthorizedError } from "../lib/auth.js"
import { URLType } from "./url.js"

export const ErrorInterface = builder
  .interfaceRef<Error>("ErrorInterface")
  .implement({
    description: "Basic interface for all error types to implement.",
    fields: (t) => ({
      message: t.exposeString("message"),
    }),
  })

builder.objectType(Error, {
  name: "Error",
  description:
    "The most basic error object, based on the base JavaScript Error object.",
  interfaces: [ErrorInterface],
})

/** Flattens nested-object ZodFormattedError into a list of path and message pairs. */
const flattenErrors = (
  error: ZodFormattedError<unknown>,
  path: string[]
): Array<{ path: string[]; message: string }> => {
  // Take errors from the root of the object and add them to the list
  let errors = error._errors.map((message) => ({
    path,
    message,
  }))

  // Iterate over nested objects
  for (const key of Object.keys(error).filter((key) => key !== "_errors")) {
    errors = [
      ...errors,
      // Use error[key] as the new root
      ...flattenErrors(
        (error as Record<string, unknown>)[key] as ZodFormattedError<unknown>,
        [...path, key]
      ),
    ]
  }

  return errors
}

const ZodFieldErrorType = builder
  .objectRef<{ message: string; path: string[] }>("ZodFieldError")
  .implement({
    description: "A validation issue for a field.",
    fields: (t) => ({
      message: t.exposeString("message"),
      path: t.exposeStringList("path"),
    }),
  })

export const ZodErrorType = builder.objectType(ZodError, {
  name: "ZodError",
  description: "A validation error, as a list of field errors.",
  interfaces: [ErrorInterface],
  fields: (t) => ({
    fieldErrors: t.field({
      type: [ZodFieldErrorType],
      resolve: (error) => flattenErrors(error.format(), []),
    }),
  }),
})

builder.objectType(UnauthorizedError, {
  name: "UnauthorizedError",
  description: "An error representing an unauthorized request.",
  interfaces: [ErrorInterface],
})

builder.objectType(RedirectionError, {
  name: "RedirectionError",
  description: "The user must be redirected to a URL.",
  interfaces: [ErrorInterface],
  fields: (t) => ({
    url: t.field({
      type: URLType,
      resolve(err) {
        return err.url.toString()
      },
    }),
  }),
})
