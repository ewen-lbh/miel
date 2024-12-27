import { sha256 } from "@oslojs/crypto/sha2"
import {
  encodeBase32LowerCaseNoPadding,
  encodeHexLowerCase,
} from "@oslojs/encoding"
import { prisma } from "../builder.js"
import type { Prisma } from "../prisma/index.js"

export class RedirectionError extends Error {
  url: URL

  constructor(url: URL) {
    super(`Go to ${url}`)
    this.url = url
  }
}

export class UnauthorizedError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "UnauthorizedError"
  }
}

export function generateSessionToken(): string {
  const bytes = new Uint8Array(20)
  crypto.getRandomValues(bytes)
  const token = encodeBase32LowerCaseNoPadding(bytes)
  return token
}

export function newSession(token: string) {
  const sessionId = encodeHexLowerCase(sha256(new TextEncoder().encode(token)))
  return {
    id: sessionId,
    expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30),
  }
}

export type SessionTokenValidateResult =
  | {
      session: Prisma.SessionGetPayload<{ include: { user: true } }>
      token: string
    }
  | {
      session: undefined
      token: undefined
    }

export async function validateSessionToken(
  token: string | null | undefined
): Promise<SessionTokenValidateResult> {
  if (!token) return { session: undefined, token: undefined }
  const sessionId = encodeHexLowerCase(sha256(new TextEncoder().encode(token)))
  const result = await prisma.session.findUnique({
    where: {
      id: sessionId,
    },
    include: {
      user: true,
    },
  })
  if (result === null) {
    return { session: undefined, token: undefined }
  }
  const { user, ...session } = result
  if (Date.now() >= session.expiresAt.getTime()) {
    await prisma.session.delete({ where: { id: sessionId } })
    return { session: undefined, token: undefined }
  }
  if (Date.now() >= session.expiresAt.getTime() - 1000 * 60 * 60 * 24 * 15) {
    session.expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30)
    await prisma.session.update({
      where: {
        id: session.id,
      },
      data: {
        expiresAt: session.expiresAt,
      },
    })
  }
  return { session: result, token }
}

export async function invalidateSession<
  Query extends {
    include?: Prisma.SessionInclude
    select?: Prisma.SessionSelect
  }
>(query: Query, sessionId: string) {
  return await prisma.session.delete({ ...query, where: { id: sessionId } })
}
