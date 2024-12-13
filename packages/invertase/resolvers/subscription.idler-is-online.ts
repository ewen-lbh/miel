import { builder } from "../builder.js"
import { pothosSubscribe } from "../lib/pubsub.js"
import { fieldName } from "../utils.js"

builder.subscriptionField(fieldName(), (t) =>
  t.boolean({
    description: "Check if the daemon listening for new mail is running.",
    subscribe(subs) {
      pothosSubscribe(subs, "idler:online", "")
    },
  })
)
