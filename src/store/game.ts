import { create } from 'zustand'
import { produce } from 'immer'
import type { GameState } from '../game/types'
import { initialState, migrate, rolloverQuests, dailyLogin, checkAchievements } from '../game/engine'
import { scheduleSync } from '../lib/sync'

const STORAGE_KEY = 'shadow-system:save:v1'

interface Persisted {
  state: GameState
  serverVersion: number
}

export interface GameStore {
  state: GameState
  serverVersion: number
  hydrated: boolean
  /** Apply a mutation to the save file. Every change is persisted locally and queued for cloud sync. */
  mutate: (fn: (draft: GameState) => void, opts?: { silent?: boolean }) => void
  /** Replace the whole save file (used when a newer save arrives from the cloud). */
  replace: (state: GameState, serverVersion: number) => void
  setServerVersion: (v: number) => void
  /** Daily housekeeping: quest rollover, login reward, expiry checks. Safe to call often. */
  tick: () => void
  resetAll: () => void
}

function loadLocal(): Persisted | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Persisted
    return { state: migrate(parsed.state), serverVersion: parsed.serverVersion ?? 0 }
  } catch {
    return null
  }
}

let saveTimer: number | null = null
function saveLocal(p: Persisted) {
  if (saveTimer) window.clearTimeout(saveTimer)
  saveTimer = window.setTimeout(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ state: { ...p.state, cinematics: [] }, serverVersion: p.serverVersion }))
    } catch (e) {
      console.warn('Local save failed', e)
    }
  }, 250)
}

const local = loadLocal()

export const useGame = create<GameStore>((set, get) => ({
  state: local?.state ?? initialState(),
  serverVersion: local?.serverVersion ?? 0,
  hydrated: true,
  mutate(fn, opts) {
    const prev = get().state
    let next = produce(prev, fn)
    if (next === prev) return
    if (!opts?.silent) next = { ...next, savedAt: Date.now() }
    set({ state: next })
    saveLocal({ state: next, serverVersion: get().serverVersion })
    if (!opts?.silent) scheduleSync()
  },
  replace(state, serverVersion) {
    set({ state: { ...migrate(state), cinematics: get().state.cinematics }, serverVersion })
    saveLocal({ state, serverVersion })
  },
  setServerVersion(v) {
    set({ serverVersion: v })
    saveLocal({ state: get().state, serverVersion: v })
  },
  tick() {
    const s = get().state
    if (!s.profile.awakenedAt) return
    get().mutate((d) => {
      rolloverQuests(d)
      dailyLogin(d)
      checkAchievements(d)
    })
  },
  resetAll() {
    const fresh = initialState()
    set({ state: fresh, serverVersion: 0 })
    localStorage.removeItem(STORAGE_KEY)
    saveLocal({ state: fresh, serverVersion: 0 })
    scheduleSync(true)
  },
}))

/** Convenience selector for derived UI. */
export const selectState = (s: GameStore) => s.state
