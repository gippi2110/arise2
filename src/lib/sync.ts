import { api, ApiError } from './api'
import type { GameState } from '../game/types'

type SyncStatus = 'idle' | 'syncing' | 'synced' | 'offline' | 'error' | 'unauthenticated'

let status: SyncStatus = 'idle'
let lastError: string | null = null
let timer: number | null = null
let inFlight: Promise<void> | null = null
let queuedForce = false
const listeners = new Set<() => void>()

export function getSyncStatus() {
  return { status, lastError }
}
export function subscribeSync(fn: () => void) {
  listeners.add(fn)
  return () => {
    listeners.delete(fn)
  }
}
function setStatus(s: SyncStatus, err: string | null = null) {
  status = s
  lastError = err
  listeners.forEach((l) => l())
}

// The store is imported lazily to avoid a circular import at module evaluation time.
async function store() {
  const mod = await import('../store/game')
  return mod.useGame
}
async function auth() {
  const mod = await import('../store/auth')
  return mod.useAuth
}

/** Debounced cloud save. Called after every local mutation. */
export function scheduleSync(force = false) {
  if (force) queuedForce = true
  if (timer) window.clearTimeout(timer)
  timer = window.setTimeout(() => {
    timer = null
    void pushNow(queuedForce)
    queuedForce = false
  }, 1800)
}

export async function pushNow(force = false): Promise<void> {
  if (inFlight) {
    await inFlight
  }
  inFlight = (async () => {
    const game = await store()
    const a = await auth()
    if (a.getState().status !== 'authed') return
    const { state, serverVersion } = game.getState()
    if (!state.profile.awakenedAt) return
    setStatus('syncing')
    try {
      const payload = stripForServer(state)
      const res = await api<{ ok?: boolean; version?: number; conflict?: boolean; data?: GameState }>('/api/state', {
        method: 'PUT',
        json: { data: payload, baseVersion: serverVersion, force },
      })
      if (res.version !== undefined) game.getState().setServerVersion(res.version)
      await pushEvents()
      setStatus('synced')
    } catch (e) {
      if (e instanceof ApiError && e.status === 409) {
        const body = e.data as { data: GameState; version: number }
        const local = game.getState().state
        if (body.data && (body.data.savedAt ?? 0) > (local.savedAt ?? 0)) {
          game.getState().replace(body.data, body.version)
          setStatus('synced')
        } else {
          game.getState().setServerVersion(body.version)
          await pushNowForce()
        }
        return
      }
      if (e instanceof ApiError && e.status === 401) {
        setStatus('unauthenticated', 'Session expired')
        ;(await auth()).getState().markAnon()
        return
      }
      if (e instanceof ApiError) setStatus('error', e.message)
      else setStatus('offline', 'Offline: changes are saved on this device and will sync when you reconnect.')
    }
  })()
  try {
    await inFlight
  } finally {
    inFlight = null
  }
}

async function pushNowForce() {
  const game = await store()
  const { state, serverVersion } = game.getState()
  try {
    const res = await api<{ version: number }>('/api/state', { method: 'PUT', json: { data: stripForServer(state), baseVersion: serverVersion, force: true } })
    game.getState().setServerVersion(res.version)
    setStatus('synced')
  } catch (e) {
    setStatus('error', e instanceof Error ? e.message : 'Sync failed')
  }
}

async function pushEvents() {
  const game = await store()
  const pending = game.getState().state.history.filter((h) => !h.synced).slice(0, 200)
  if (!pending.length) return
  await api('/api/events', { method: 'POST', json: { events: pending.map((h) => ({ kind: h.kind, title: h.title, xp: h.xp, gold: h.gold, at: h.at, payload: { id: h.id } })) } })
  const ids = new Set(pending.map((h) => h.id))
  game.getState().mutate((d) => {
    for (const h of d.history) if (ids.has(h.id)) h.synced = true
  }, { silent: true })
}

/** Pull the cloud save after sign-in and reconcile with the local device copy. */
export async function pullAndReconcile(): Promise<'server' | 'local' | 'none'> {
  const game = await store()
  setStatus('syncing')
  try {
    const res = await api<{ data: GameState | null; version: number }>('/api/state')
    const local = game.getState().state
    if (res.data) {
      const serverNewer = (res.data.savedAt ?? 0) >= (local.savedAt ?? 0)
      const localFresh = !local.profile.awakenedAt
      if (serverNewer || localFresh) {
        game.getState().replace(res.data, res.version)
        setStatus('synced')
        return 'server'
      }
      game.getState().setServerVersion(res.version)
      await pushNow(true)
      return 'local'
    }
    if (local.profile.awakenedAt) {
      await pushNow(true)
      return 'local'
    }
    setStatus('synced')
    return 'none'
  } catch (e) {
    if (e instanceof ApiError && e.status === 401) {
      setStatus('unauthenticated')
      ;(await auth()).getState().markAnon()
    } else setStatus('offline', 'Offline: using the save on this device.')
    return 'none'
  }
}

function stripForServer(state: GameState): GameState {
  return { ...state, cinematics: [] }
}

if (typeof window !== 'undefined') {
  window.addEventListener('online', () => scheduleSync())
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') void pushNow()
  })
}
