import { create } from 'zustand'
import { api, ApiError } from '../lib/api'

export type AuthStatus = 'unknown' | 'anon' | 'authed' | 'offline'

interface AuthStore {
  status: AuthStatus
  email: string | null
  claimed: boolean
  hasSave: boolean
  emailConfigured: boolean
  voiceConfigured: boolean
  check: () => Promise<void>
  requestCode: (email: string) => Promise<{ delivered: boolean }>
  verify: (email: string, code: string) => Promise<void>
  logout: () => Promise<void>
  markAnon: () => void
}

export const useAuth = create<AuthStore>((set) => ({
  status: 'unknown',
  email: null,
  claimed: false,
  hasSave: false,
  emailConfigured: true,
  voiceConfigured: false,
  async check() {
    try {
      const [me, health] = await Promise.all([
        api<{ authenticated: boolean; email?: string; claimed?: boolean; hasSave?: boolean }>('/api/auth/me'),
        api<{ emailConfigured: boolean; voiceConfigured: boolean }>('/api/health').catch(() => ({ emailConfigured: true, voiceConfigured: false })),
      ])
      set({
        status: me.authenticated ? 'authed' : 'anon',
        email: me.email ?? null,
        claimed: Boolean(me.claimed ?? me.authenticated),
        hasSave: Boolean(me.hasSave),
        emailConfigured: health.emailConfigured,
        voiceConfigured: health.voiceConfigured,
      })
    } catch {
      set({ status: 'offline' })
    }
  },
  async requestCode(email) {
    const res = await api<{ ok: boolean; delivered: boolean; claimed: boolean }>('/api/auth/request-code', { method: 'POST', json: { email } })
    set({ claimed: res.claimed })
    return { delivered: res.delivered }
  },
  async verify(email, code) {
    const res = await api<{ ok: boolean; email: string; hasSave: boolean }>('/api/auth/verify', { method: 'POST', json: { email, code } })
    set({ status: 'authed', email: res.email, hasSave: res.hasSave, claimed: true })
  },
  async logout() {
    try {
      await api('/api/auth/logout', { method: 'POST' })
    } catch (e) {
      if (!(e instanceof ApiError)) throw e
    }
    set({ status: 'anon', email: null })
  },
  markAnon() {
    set({ status: 'anon', email: null })
  },
}))
