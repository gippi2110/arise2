import type { Config, Context } from '@netlify/functions'
import { and, desc, eq, gt, sql } from 'drizzle-orm'
import { db } from '../../db/index.js'
import { authCodes, events, owner, playerState } from '../../db/schema.js'
import {
  claimOwnership, clearSessionCookie, createSession, destroySession, getOwnerEmail, getSession,
  isEmailAllowed, newCode, normalizeEmail, safeEqual, setSessionCookie, sha256,
} from '../lib/auth.js'
import { sendCodeEmail } from '../lib/email.js'

const json = (data: unknown, status = 200) => Response.json(data, { status })
const error = (message: string, status = 400) => json({ error: message }, status)

const MAX_EVENTS_PER_BATCH = 200
const STATE_ID = 1

async function readJson(req: Request): Promise<Record<string, unknown>> {
  try {
    const body = await req.json()
    return body && typeof body === 'object' ? body : {}
  } catch {
    return {}
  }
}

async function handleRequestCode(req: Request) {
  const body = await readJson(req)
  const email = normalizeEmail(body.email)
  if (!email) return error('Enter a valid email address.')
  if (!(await isEmailAllowed(email))) {
    // Do not reveal who the owner is; respond as if a code was sent.
    return json({ ok: true, delivered: true, claimed: true })
  }
  // Rate limit: at most 5 live codes per email within 15 minutes.
  const since = new Date(Date.now() - 15 * 60_000)
  const recent = await db
    .select({ count: sql<number>`count(*)` })
    .from(authCodes)
    .where(and(eq(authCodes.email, email), gt(authCodes.createdAt, since)))
  if (Number(recent[0]?.count ?? 0) >= 5) return error('Too many codes requested. Wait a few minutes.', 429)

  const code = newCode()
  await db.insert(authCodes).values({ email, codeHash: sha256(`${email}:${code}`), expiresAt: new Date(Date.now() + 10 * 60_000) })
  const origin = new URL(req.url).origin
  let delivered = false
  try {
    delivered = await sendCodeEmail(email, code, origin)
  } catch (e) {
    console.error('Email delivery failed', e)
    return error('The email provider rejected the message. Check the RESEND_API_KEY / RESEND_FROM configuration.', 502)
  }
  if (!delivered) {
    // No email provider configured yet: surface the code in the function log so the owner can still enter.
    console.log(`[SHADOW SYSTEM] Email delivery is not configured. Access code for ${email}: ${code}`)
  }
  const current = await getOwnerEmail()
  return json({ ok: true, delivered, claimed: current !== null })
}

async function handleVerify(req: Request, context: Context) {
  const body = await readJson(req)
  const email = normalizeEmail(body.email)
  const code = typeof body.code === 'string' ? body.code.replace(/\D/g, '') : ''
  if (!email || code.length !== 6) return error('Enter the 6-digit code from your email.')
  if (!(await isEmailAllowed(email))) return error('This System already belongs to another Player.', 403)

  const rows = await db
    .select()
    .from(authCodes)
    .where(and(eq(authCodes.email, email), eq(authCodes.consumed, false), gt(authCodes.expiresAt, new Date())))
    .orderBy(desc(authCodes.createdAt))
    .limit(3)
  const expected = sha256(`${email}:${code}`)
  const match = rows.find((r) => r.attempts < 5 && safeEqual(r.codeHash, expected))
  if (!match) {
    if (rows[0]) await db.update(authCodes).set({ attempts: rows[0].attempts + 1 }).where(eq(authCodes.id, rows[0].id))
    return error('Access denied. The code is wrong or has expired.', 401)
  }
  await db.update(authCodes).set({ consumed: true }).where(eq(authCodes.id, match.id))
  await db.delete(authCodes).where(and(eq(authCodes.email, email), eq(authCodes.consumed, false)))
  await claimOwnership(email)
  const { token, expiresAt } = await createSession(email, req.headers.get('user-agent'))
  setSessionCookie(context, token, expiresAt)
  const [state] = await db.select({ version: playerState.version }).from(playerState).where(eq(playerState.id, STATE_ID))
  return json({ ok: true, email, hasSave: Boolean(state) })
}

async function handleMe(context: Context) {
  const session = await getSession(context)
  if (!session) return json({ authenticated: false, claimed: (await getOwnerEmail()) !== null })
  const [state] = await db.select({ version: playerState.version, updatedAt: playerState.updatedAt }).from(playerState).where(eq(playerState.id, STATE_ID))
  return json({ authenticated: true, email: session.email, hasSave: Boolean(state), version: state?.version ?? 0, updatedAt: state?.updatedAt ?? null })
}

async function handleLogout(context: Context) {
  await destroySession(context)
  clearSessionCookie(context)
  return json({ ok: true })
}

async function requireSession(context: Context) {
  const session = await getSession(context)
  if (!session) throw new Response(JSON.stringify({ error: 'Not signed in.' }), { status: 401, headers: { 'Content-Type': 'application/json' } })
  return session
}

async function handleGetState(context: Context) {
  await requireSession(context)
  const [row] = await db.select().from(playerState).where(eq(playerState.id, STATE_ID))
  if (!row) return json({ data: null, version: 0, updatedAt: null })
  return json({ data: row.data, version: row.version, updatedAt: row.updatedAt })
}

async function handlePutState(req: Request, context: Context) {
  await requireSession(context)
  const body = await readJson(req)
  const data = body.data
  if (!data || typeof data !== 'object') return error('Missing save data.')
  const raw = JSON.stringify(data)
  if (raw.length > 2_000_000) return error('Save file is too large.', 413)
  const baseVersion = typeof body.baseVersion === 'number' ? body.baseVersion : null
  const [current] = await db.select({ version: playerState.version, data: playerState.data, updatedAt: playerState.updatedAt }).from(playerState).where(eq(playerState.id, STATE_ID))
  if (current && baseVersion !== null && body.force !== true && current.version > baseVersion) {
    // Another device saved first. Hand the newer save back so the client can merge.
    return json({ conflict: true, data: current.data, version: current.version, updatedAt: current.updatedAt }, 409)
  }
  const nextVersion = (current?.version ?? 0) + 1
  const now = new Date()
  if (current) {
    await db.update(playerState).set({ data, version: nextVersion, updatedAt: now }).where(eq(playerState.id, STATE_ID))
  } else {
    await db.insert(playerState).values({ id: STATE_ID, data, version: nextVersion, updatedAt: now })
  }
  const name = (data as { profile?: { name?: string } }).profile?.name
  if (typeof name === 'string' && name.trim()) {
    const rows = await db.select().from(owner).limit(1)
    if (rows[0] && rows[0].playerName !== name) await db.update(owner).set({ playerName: name }).where(eq(owner.id, rows[0].id))
  }
  return json({ ok: true, version: nextVersion, updatedAt: now })
}

async function handleGetEvents(req: Request, context: Context) {
  await requireSession(context)
  const url = new URL(req.url)
  const limit = Math.min(500, Math.max(1, Number(url.searchParams.get('limit') ?? 200)))
  const rows = await db.select().from(events).orderBy(desc(events.createdAt)).limit(limit)
  return json({ events: rows })
}

async function handlePostEvents(req: Request, context: Context) {
  await requireSession(context)
  const body = await readJson(req)
  const list = Array.isArray(body.events) ? body.events.slice(0, MAX_EVENTS_PER_BATCH) : []
  const values = list
    .filter((e): e is Record<string, unknown> => Boolean(e) && typeof e === 'object')
    .map((e) => ({
      kind: String(e.kind ?? 'event').slice(0, 40),
      title: String(e.title ?? '').slice(0, 200),
      xp: Number.isFinite(Number(e.xp)) ? Math.trunc(Number(e.xp)) : 0,
      gold: Number.isFinite(Number(e.gold)) ? Math.trunc(Number(e.gold)) : 0,
      payload: (e.payload as object | undefined) ?? null,
      createdAt: typeof e.at === 'number' ? new Date(e.at) : new Date(),
    }))
  if (values.length) await db.insert(events).values(values)
  return json({ ok: true, inserted: values.length })
}

async function handleDeleteAccountData(context: Context) {
  await requireSession(context)
  await db.delete(playerState).where(eq(playerState.id, STATE_ID))
  await db.delete(events)
  return json({ ok: true })
}

export default async (req: Request, context: Context) => {
  const url = new URL(req.url)
  const path = url.pathname.replace(/\/$/, '')
  const method = req.method.toUpperCase()
  try {
    if (path === '/api/auth/request-code' && method === 'POST') return await handleRequestCode(req)
    if (path === '/api/auth/verify' && method === 'POST') return await handleVerify(req, context)
    if (path === '/api/auth/me' && method === 'GET') return await handleMe(context)
    if (path === '/api/auth/logout' && method === 'POST') return await handleLogout(context)
    if (path === '/api/state' && method === 'GET') return await handleGetState(context)
    if (path === '/api/state' && method === 'PUT') return await handlePutState(req, context)
    if (path === '/api/state' && method === 'DELETE') return await handleDeleteAccountData(context)
    if (path === '/api/events' && method === 'GET') return await handleGetEvents(req, context)
    if (path === '/api/events' && method === 'POST') return await handlePostEvents(req, context)
    if (path === '/api/health' && method === 'GET') return json({ ok: true, emailConfigured: Boolean(process.env.RESEND_API_KEY), voiceConfigured: Boolean(process.env.ELEVENLABS_API_KEY) })
    return error('Unknown System endpoint.', 404)
  } catch (e) {
    if (e instanceof Response) return e
    console.error('API failure', e)
    return error('The System encountered an internal error.', 500)
  }
}

export const config: Config = {
  path: ['/api/auth/*', '/api/state', '/api/events', '/api/health'],
}
