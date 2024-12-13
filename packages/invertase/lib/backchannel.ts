import { z } from "zod"
import { publish, subscribeUntil } from "./pubsub.js"

export async function backchannelCall(
  accountID: string,
  payload: Partial<Omit<BackchannelInputPayload, "OperationID" | "AccountID">>
): Promise<BackchannelOutputPayload["Error"]> {
  const operationID = Math.random().toString(36).substring(2)
  backchannelCallNoResponse(accountID, {
    ...payload,
    OperationID: operationID,
  })
  const raw = await subscribeUntil("backchannel:out", (message) => {
    return message.includes(`"OperationID":"${operationID}"`)
  })
  const { Error } = backchannelOutputSchema.parse(JSON.parse(raw))
  return Error
}

export function backchannelCallNoResponse(
  accountID: string,
  input: Partial<Omit<BackchannelInputPayload, "AccountID">>
) {
  const payload: BackchannelInputPayload = {
    MoveToInbox: [],
    Noop: false,
    ResyncAll: false,
    ResyncMailbox: "",
    OperationID: "",
    AccountID: accountID,
    ...input,
  }
  publish("backchannel:in", "", payload)
}

export const backchannelOutputSchema = z.object({
  OperationID: z.string().describe("The operation ID we are responding to"),
  Error: z
    .string()
    .describe("An error if one occured (empty string if successful)"),
})

export type BackchannelOutputPayload = z.infer<typeof backchannelOutputSchema>

export const backchannelInputSchema = z.object({
  AccountID: z.string().describe("The account to use"),
  OperationID: z
    .string()
    .describe(
      "A unique operation ID for this backchannel operation, used to know which push to listen to. Omit to tell nectar to not push a backchannel response"
    ),
  Noop: z
    .boolean()
    .describe("Noop, allows the backchannel to be used as a heartbeat"),
  MoveToInbox: z
    .array(
      z.object({
        Emails: z.array(z.string()),
        Inbox: z.string(),
      })
    )
    .describe("Move emails to an inbox"),
  ResyncAll: z.boolean().describe("Re-sync the entire account"),
  ResyncMailbox: z
    .string()
    .describe("Re-sync a specific mailbox, by database's mailbox ID"),
})

export type BackchannelInputPayload = z.infer<typeof backchannelInputSchema>
