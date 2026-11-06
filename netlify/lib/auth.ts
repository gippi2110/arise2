import { createHash, randomBytes, randomInt, timingSafeEqual } from 'node:crypto'
import { and, eq, gt } from 'drizzle-orm'
import type { Context } from '@netlify/functions'
import { db } from '../../db/index.js'
import { owner, sessions } from '../../db/schema.js'

export const SESSION_COOKIE = 'ss_session'
export const SESSION_DAYS = 180

export function sha256(input: string) {
  return createHash('sha256').update(input).digest('hex')
}

export function safeEqual(a: string, b: string) {
  const ba = Buffer.from(a)
  const bb = Buffer.from(b)
  return ba.length === bb.length && timingSafeEqual(ba, bb)
}

export function newCode() {
  return String(randomInt(0, 1_000_000)).padStart(6, '0')
}

export function newToken() {
  return randomBytes(32).toString('base64url')
}

export function normalizeEmail(raw: unknown) {
  if (typeof raw !== 'string') return null
  const email = raw.trim().toLowerCase()
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) return null
  return email
}

/** Returns the email allowed to use this System, or null if nobody has claimed it yet. */
export async function getOwnerEmail(): Promise<string | null> {
  const configured = process.env.OWNER_EMAIL?.trim().toLowerCase()
  if (configured) return configured
  const rows = await db.select().from(owner).limit(1)
  return rows[0]?.email ?? null
}

export async function isEmailAllowed(email: string) {
  const current = await getOwnerEmail()
  return current === null || current === email
}

export async function claimOwnership(email: string) {
  const rows = await db.select().from(owner).limit(1)
  if (rows.length === 0) await db.insert(owner).values({ email })
}

export async function createSession(email: string, userAgent: string | null) {
  const token = newToken()
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 86_400_000)
  await db.insert(sessions).values({ tokenHash: sha256(token), email, userAgent, expiresAt })
  return { token, expiresAt }
}

export async function getSession(context: Context) {
  const token = context.cookies.get(SESSION_COOKIE)
  if (!token) return null
  const hash = sha256(token)
  const rows = await db
    .select()
    .from(sessions)
    .where(and(eq(sessions.tokenHash, hash), gt(sessions.expiresAt, new Date())))
    .limit(1)
  const session = rows[0]
  if (!session) return null
  // The owner may have been reconfigured; never let a stale session outlive that.
  const allowed = await getOwnerEmail()
  if (allowed && allowed !== session.email) return null
  // Touch at most once per hour to avoid a write on every request.
  if (Date.now() - new Date(session.lastSeenAt).getTime() > 3_600_000) {
    await db.update(sessions).set({ lastSeenAt: new Date() }).where(eq(sessions.id, session.id))
  }
  return session
}

export async function destroySession(context: Context) {
  const token = context.cookies.get(SESSION_COOKIE)
  if (token) await db.delete(sessions).where(eq(sessions.tokenHash, sha256(token)))
}

export function setSessionCookie(context: Context, token: string, expiresAt: Date) {
  context.cookies.set({
    name: SESSION_COOKIE,
    value: token,
    path: '/',
    httpOnly: true,
    secure: true,
    sameSite: 'Lax',
    expires: expiresAt,
  })
}

export function clearSessionCookie(context: Context) {
  context.cookies.delete({ name: SESSION_COOKIE, path: '/' })
}
