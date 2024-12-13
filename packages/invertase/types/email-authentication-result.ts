import { builder } from "../builder.js"
import { parseComplexHeader, typeName } from "../utils.js"
import { firstHeaderValue } from "./header.js"

type EmailAuthenticationResult = {
  ok: boolean
  explanation: string
}

export const EmailAuthenticationResultType = builder
  .objectRef<EmailAuthenticationResult>(typeName())
  .implement({
    fields: (t) => ({
      ok: t.exposeBoolean("ok", {
        description: "The authentication check passed",
      }),
      explanation: t.exposeString("explanation", {
        description:
          "Reason for the authentication check (why it passed or failed)",
      }),
    }),
  })

export function resolveAuthenticationResultCheck(
  check: string,
  ok: (value: string) => boolean = (value) => value.toLowerCase() === "pass"
) {
  return ({ headers }) => {
    if (check === "spf" && firstHeaderValue(headers, "Received-SPF")) {
      return {
        ok: Boolean(
          firstHeaderValue(headers, "Received-SPF")
            ?.toLowerCase()
            .startsWith("pass ")
        ),
        explanation: firstHeaderValue(headers, "Received-SPF") ?? "",
      }
    }
    const results = firstHeaderValue(headers, "Authentication-Results")
    if (!results) return null
    const { value, description } = parseComplexHeader(results)[check] ?? {
      value: "",
      description: "",
    }
    return { ok: ok(value), explanation: description || value }
  }
}
