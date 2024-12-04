import { createRedisEventTarget } from "@graphql-yoga/redis-event-target"
import { FieldSubscriptionManager } from "@pothos/plugin-smart-subscriptions"
import { createPubSub } from "graphql-yoga"
import { Redis } from "ioredis"
import { PothosTypes } from "../builder"

const REDIS_URL = new URL(process.env.REDIS_URL || "redis://localhost:6379")

export const CHANNELS = ["mailbox:updates", "screenings:updates"] as const
export type PubsubChannel = (typeof CHANNELS)[number]

export const publishClient = new Redis({
  host: REDIS_URL.hostname,
  port: Number.parseInt(REDIS_URL.port),
})

export const subscribeClient = new Redis({
  host: REDIS_URL.hostname,
  port: Number.parseInt(REDIS_URL.port),
})

export const pubsub = createPubSub({
  eventTarget: createRedisEventTarget({ publishClient, subscribeClient }),
})

export function publish(channel: PubsubChannel, id: string) {
  pubsub.publish(`${channel}:${id}`, { id })
}

export function subscribe(
  subs: FieldSubscriptionManager<
    PothosSchemaTypes.ExtendDefaultTypes<PothosTypes>
  >,
  channel: PubsubChannel,
  id: string
) {
  subs.register(`${channel}:${id}`)
}
