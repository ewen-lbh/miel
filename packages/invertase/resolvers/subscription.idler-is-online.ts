import { builder } from "../builder"
import { subscribe } from "../lib/pubsub"
import { fieldName } from "../utils"

builder.subscriptionField(fieldName(), (t) =>
  t.boolean({
    description: "Check if the daemon listening for new mail is running.",
    subscribe(subs) {
      subscribe(subs, "idler:online", "")
    },
  })
)
