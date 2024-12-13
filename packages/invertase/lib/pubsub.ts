import { createRedisEventTarget } from "@graphql-yoga/redis-event-target"
import { FieldSubscriptionManager } from "@pothos/plugin-smart-subscriptions"
import { createPubSub } from "graphql-yoga"
import { Redis } from "ioredis"
import { PothosTypes } from "../builder.js"

const REDIS_URL = new URL(process.env.REDIS_URL || "redis://localhost:6379")

export const CHANNELS = [
  "mailbox:updates",
  "screenings:updates",
  "idler:online",
  "backchannel:in",
  "backchannel:out",
] as const
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

export function publish(
  channel: PubsubChannel,
  id: string,
  payload?: Record<string, unknown>
) {
  pubsub.publish(`${channel}${id ? `:${id}` : ""}`, {
    ...(id ? { id } : {}),
    ...payload,
  })
}

export function subscribe(channel: PubsubChannel) {
  return pubsub.subscribe(channel)
}

export function pothosSubscribe(
  subs: FieldSubscriptionManager<
    PothosSchemaTypes.ExtendDefaultTypes<PothosTypes>
  >,
  channel: PubsubChannel,
  id: string
) {
  subs.register(`${channel}${id ? `:${id}` : ""}`)
}

/**
 * Subscribes to a Redis channel and resolves when a message meets a predicate
 * @param channel - The Redis channel to subscribe to
 * @param predicate - A function that tests each received message
 * @param timeout - Optional timeout in milliseconds
 * @returns A promise that resolves with the matching message or rejects
 */
export async function subscribeUntil(
  channel: (typeof CHANNELS)[number],
  predicate: (message: string) => boolean,
  timeout: number = 5000
): Promise<string> {
  const client = subscribeClient.duplicate()

  return new Promise((resolve, reject) => {
    // Set up a timeout to prevent indefinite waiting
    const timeoutId = setTimeout(() => {
      client.unsubscribe(channel)
      client.quit()
      reject(new Error("Subscription timed out"))
    }, timeout)

    // Subscribe to the channel
    client.subscribe(channel)

    // Listen for messages
    client.on("message", (receivedChannel, message) => {
      // Only process messages from the specified channel
      if (receivedChannel === channel) {
        try {
          // Check if the message meets the predicate
          if (predicate(message)) {
            // Clear the timeout
            clearTimeout(timeoutId)

            // Unsubscribe and close the connection
            client.unsubscribe(channel)
            client.quit()

            // Resolve with the matching message
            resolve(message)
          }
        } catch (error) {
          // Handle any errors in the predicate
          clearTimeout(timeoutId)
          client.unsubscribe(channel)
          client.quit()
          reject(error)
        }
      }
    })
  })
}
