import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGame } from '../store/game'
import { useAuth } from '../store/auth'
import { ATTRS, CATEGORY_META } from '../game/content/attrs'
import type { AttrKey, QuestCategory, Settings as S, ThemeId } from '../game/types'
import { migrate } from '../game/engine'
import { useSyncStatus } from '../lib/hooks'
import { pushNow } from '../lib/sync'
import { api } from '../lib/api'
import HoloPanel from '../components/ui/HoloPanel'
import SysButton from '../components/ui/SysButton'
import Tag from '../components/ui/Tag'
import { listVoices, playSfx, speak, stopVoice, type SfxName } from '../audio'
import clsx from '../lib/clsx'

interface BIP extends Event { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> }
let deferredInstall: BIP | null = null
if (typeof window !== 'undefined') window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); deferredInstall = e as BIP })

function Slider({ label, value, onChange, min = 0, max = 1, step = 0.01, format }: { label: string; value: number; onChange: (v: number) => void; min?: number; max?: number; step?: number; format?: (v: number) => string }) {
  return (
    <label className="block">
      <div className="flex justify-between font-display text-[10px] tracking-[0.3em] text-muted"><span>{label}</span><span className="text-glow">{format ? format(value) : `${Math.round(value * 100)}%`}</span></div>
      <input type="range" className="mt-1 w-full" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} />
    </label>
  )
}

function Toggle({ label, hint, value, onChange }: { label: string; hint?: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button type="button" onClick={() => { playSfx('press'); onChange(!value) }} className="flex w-full items-center justify-between gap-3 py-2 text-left">
      <div><div className="font-display text-xs tracking-[0.2em]">{label}</div>{hint && <div className="text-[11px] text-muted">{hint}</div>}</div>
      <span className={clsx('relative h-6 w-11 flex-none clip-panel-sm border transition', value ? 'border-sys bg-sys/40' : 'border-glow/20 bg-glow/5')}><span className={clsx('absolute top-0.5 h-4.5 w-4.5 bg-glow transition-all', value ? 'left-6 shadow-[0_0_10px_rgb(var(--c-primary))]' : 'left-0.5 opacity-50')} style={{ height: 18, width: 18 }} /></span>
    </button>
  )
}

export default function Settings() {
  const state = useGame((s) => s.state)
  const mutate = useGame((s) => s.mutate)
  const resetAll = useGame((s) => s.resetAll)
  const auth = useAuth()
  const sync = useSyncStatus()
  const nav = useNavigate()
  const s = state.settings
  const set = (patch: Partial<S>) => mutate((d) => { Object.assign(d.settings, patch) })
  const [voices, setVoices] = useState(listVoices())
  const [installable, setInstallable] = useState(Boolean(deferredInstall))
  useEffect(() => {
    const refresh = () => setVoices(listVoices())
    refresh()
    if (typeof speechSynthesis !== 'undefined') speechSynthesis.addEventListener('voiceschanged', refresh)
    const t = window.setInterval(() => setInstallable(Boolean(deferredInstall)), 1500)
    return () => { if (typeof speechSynthesis !== 'undefined') speechSynthesis.removeEventListener('voiceschanged', refresh); window.clearInterval(t) }
  }, [])

  const exportSave = () => {
    const blob = new Blob([JSON.stringify({ state: { ...state, cinematics: [] } }, null, 2)], { type: 'application/json' })
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `shadow-system-${new Date().toISOString().slice(0, 10)}.json`; a.click()
    playSfx('coin')
  }
  const importSave = (file: File) => {
    file.text().then((t) => {
      const parsed = JSON.parse(t)
      const next = migrate(parsed.state ?? parsed)
      if (!confirm(`Import save for "${next.profile.name || 'unknown'}" (level ${next.level})? This replaces the current save on every device.`)) return
      useGame.getState().replace({ ...next, savedAt: Date.now() }, useGame.getState().serverVersion)
      void pushNow(true)
      playSfx('complete')
    }).catch(() => alert('That file is not a valid Shadow System save.'))
  }
  const testSfx: SfxName[] = ['press', 'open', 'accept', 'complete', 'levelup', 'rank', 'portal', 'bossDefeat', 'arise', 'warning']

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="lg:col-span-2"><h1 className="font-display text-2xl font-black tracking-[0.15em] text-glow text-glow-sys">SYSTEM SETTINGS</h1><p className="text-sm text-muted">Settings are part of your save file and follow you to every device.</p></div>

      <HoloPanel tag="APPEARANCE" title="Theme">
        <div className="grid grid-cols-2 gap-3">
          {([['monarch', 'Shadow Monarch', 'Black, midnight navy, electric blue, violet, with orange for events.', ['#050509', '#168CFF', '#7215C8', '#FF7100']], ['ember', 'Ember Gate', 'Pure orange and black. Fire in the dark.', ['#090604', '#FF7100', '#FF3C14', '#FFC45A']]] as [ThemeId, string, string, string[]][]).map(([id, name, blurb, sw]) => (
            <button key={id} type="button" onClick={() => { set({ theme: id }); playSfx('open') }} className={clsx('clip-panel border p-3 text-left', s.theme === id ? 'border-sys shadow-holo' : 'border-glow/10')} style={{ background: `linear-gradient(160deg, ${sw[0]}, ${sw[0]}ee)` }}>
              <div className="flex gap-1">{sw.map((c) => <span key={c} className="h-4 w-4 clip-tag" style={{ background: c, boxShadow: `0 0 8px ${c}` }} />)}</div>
              <div className="mt-2 font-display text-sm font-bold tracking-[0.12em]">{name}</div>
              <div className="text-[11px] text-muted">{blurb}</div>
              {s.theme === id && <Tag className="mt-2 bg-sys text-void">ACTIVE</Tag>}
            </button>
          ))}
        </div>
        <div className="mt-3 border-t border-glow/10 pt-2"><Toggle label="REDUCE MOTION" hint="Shortens animations and thins particle effects." value={s.reduceMotion} onChange={(v) => set({ reduceMotion: v })} /></div>
      </HoloPanel>

      <HoloPanel tag="AUDIO" title="Volume">
        <div className="space-y-3">
          <Slider label="MASTER" value={s.masterVolume} onChange={(v) => set({ masterVolume: v })} />
          <Slider label="SYSTEM VOICE" value={s.voiceVolume} onChange={(v) => set({ voiceVolume: v })} />
          <Slider label="SOUND EFFECTS" value={s.sfxVolume} onChange={(v) => set({ sfxVolume: v })} />
          <Slider label="BACKGROUND MUSIC" value={s.musicVolume} onChange={(v) => set({ musicVolume: v })} />
          <Toggle label="BACKGROUND MUSIC" hint="Generative ambient score that changes with each section." value={s.musicEnabled} onChange={(v) => set({ musicEnabled: v })} />
          <div className="border-t border-glow/10 pt-2 font-display text-[10px] tracking-[0.3em] text-muted">SOUND TEST</div>
          <div className="flex flex-wrap gap-1.5">{testSfx.map((n) => <button key={n} type="button" onClick={() => playSfx(n)} className="clip-panel-sm border border-sys/30 px-2 py-1 font-display text-[10px] tracking-[0.2em] hover:bg-sys/15">{n}</button>)}</div>
        </div>
      </HoloPanel>

      <HoloPanel tag="SYSTEM VOICE" title="The voice that commands you" tone="arcane">
        <Toggle label="ENABLE VOICE" value={s.voiceEnabled} onChange={(v) => { set({ voiceEnabled: v }); if (!v) stopVoice() }} />
        <Toggle label="PREMIUM VOICE" hint={auth.voiceConfigured ? 'ElevenLabs is connected. Lines are synthesised with a deep masculine voice and cached.' : 'Not connected. Add ELEVENLABS_API_KEY (and optionally ELEVENLABS_VOICE_ID) to use a studio-grade voice. Until then the built-in deep voice is used.'} value={s.preferPremiumVoice} onChange={(v) => set({ preferPremiumVoice: v })} />
        <div className="mt-2 space-y-3">
          <Slider label="VOICE SPEED" value={s.voiceRate} min={0.5} max={1.3} step={0.01} onChange={(v) => set({ voiceRate: v })} format={(v) => `${v.toFixed(2)}×`} />
          <Slider label="VOICE DEPTH (lower = deeper)" value={s.voicePitch} min={0.1} max={1.2} step={0.01} onChange={(v) => set({ voicePitch: v })} format={(v) => v.toFixed(2)} />
          <label className="block">
            <div className="font-display text-[10px] tracking-[0.3em] text-muted">BUILT-IN VOICE SELECTION</div>
            <select className="sys-input mt-1" value={s.voiceURI ?? ''} onChange={(e) => set({ voiceURI: e.target.value || null })}>
              <option value="">Auto (deepest masculine voice available)</option>
              {voices.map((v) => <option key={v.uri} value={v.uri}>{v.likelyMale ? '♂ ' : ''}{v.name} ({v.lang})</option>)}
            </select>
            <div className="mt-1 text-[11px] text-muted">Voices are provided by your device. Voices marked ♂ are detected as masculine. Install additional voices in your OS for more options.</div>
          </label>
          <div className="flex flex-wrap gap-2">
            {[['Player. Your daily quest has arrived.', 'normal'], ['You are not ready.', 'warning'], ['Level up. Your strength has increased.', 'epic'], ['Arise.', 'dark']].map(([t, st]) => <SysButton key={t} size="sm" variant="arcane" onClick={() => void speak(t, st as 'normal')}>{t.split('.')[0].toUpperCase()}</SysButton>)}
          </div>
        </div>
      </HoloPanel>

      <HoloPanel tag="DISCIPLINE" title="Penalties" tone="danger">
        <Toggle label="ENABLE PENALTIES" hint="Failed quests subtract XP when their period ends." value={s.penaltiesEnabled} onChange={(v) => set({ penaltiesEnabled: v })} />
        <div className="mt-2"><Slider label="PENALTY SEVERITY" value={s.penaltyPercent} min={10} max={200} step={5} onChange={(v) => set({ penaltyPercent: v })} format={(v) => `${v}%`} /></div>
        <div className="mt-2 text-[11px] text-muted">XP lost never drops you below your current level. The System punishes, it does not erase.</div>
      </HoloPanel>

      <HoloPanel tag="REAL-WORLD PROGRESSION" title="Activity rewards" className="lg:col-span-2">
        <p className="mb-3 text-sm text-muted">Tune how each kind of activity feeds your character. The XP multiplier scales quest rewards; the attribute gains are applied when a quest of that category is completed and become the default for new quests.</p>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead><tr className="font-display text-[9px] tracking-[0.3em] text-muted"><th className="py-1 pr-2">ACTIVITY</th><th className="py-1 pr-2">XP ×</th>{ATTRS.map((a) => <th key={a.key} className="px-1 py-1 text-center">{a.short}</th>)}</tr></thead>
            <tbody>
              {(Object.keys(CATEGORY_META) as QuestCategory[]).map((c) => {
                const r = s.activityRewards[c]
                return (
                  <tr key={c} className="border-t border-glow/5">
                    <td className="py-1 pr-2 font-display tracking-[0.15em]">{CATEGORY_META[c].label}</td>
                    <td className="py-1 pr-2"><input type="number" min={0.5} max={3} step={0.1} className="sys-input w-16 py-1 text-center" value={r.xpMultiplier} onChange={(e) => mutate((d) => { d.settings.activityRewards[c].xpMultiplier = Math.max(0.5, Math.min(3, Number(e.target.value))) })} /></td>
                    {ATTRS.map((a) => <td key={a.key} className="px-1 py-1"><input type="number" min={0} max={5} className="sys-input w-11 py-1 text-center" value={r.attrs[a.key] ?? 0} onChange={(e) => mutate((d) => { d.settings.activityRewards[c].attrs[a.key as AttrKey] = Math.max(0, Math.min(5, Number(e.target.value))) })} /></td>)}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </HoloPanel>

      <HoloPanel tag="PLAYER" title="Identity">
        <label className="block"><div className="font-display text-[10px] tracking-[0.3em] text-muted">NAME</div><input className="sys-input mt-1" value={state.profile.name} maxLength={24} onChange={(e) => mutate((d) => { d.profile.name = e.target.value })} /></label>
        <label className="mt-3 block"><div className="font-display text-[10px] tracking-[0.3em] text-muted">TITLE</div><input className="sys-input mt-1" value={state.profile.title} maxLength={32} onChange={(e) => mutate((d) => { d.profile.title = e.target.value })} /></label>
        <div className="mt-3 font-display text-[10px] tracking-[0.3em] text-muted">AVATAR</div>
        <div className="mt-1 grid grid-cols-6 gap-1.5">{['a1', 'a2', 'a3', 'a4', 'a5', 'a6'].map((a) => { const src = `/art/avatar/${a}.webp`; return <button key={a} type="button" onClick={() => { mutate((d) => { d.profile.avatar = src }); playSfx('press') }} className={clsx('aspect-square overflow-hidden clip-panel-sm border', state.profile.avatar === src ? 'border-sys shadow-holo' : 'border-glow/10 opacity-70')}><img src={src} alt="" className="h-full w-full object-cover" /></button> })}</div>
        <div className="mt-4 flex flex-wrap gap-2">
          <SysButton variant="arcane" size="sm" onClick={() => nav('/awakening?replay=1')}>REPLAY AWAKENING</SysButton>
          {installable && <SysButton size="sm" variant="ember" onClick={async () => { if (!deferredInstall) return; await deferredInstall.prompt(); deferredInstall = null; setInstallable(false) }}>INSTALL APP</SysButton>}
        </div>
      </HoloPanel>

      <HoloPanel tag="ACCOUNT & DATA" title="Cloud save">
        <div className="space-y-1 text-sm">
          <div className="flex justify-between"><span className="text-muted">Signed in as</span><span>{auth.email ?? 'offline'}</span></div>
          <div className="flex justify-between"><span className="text-muted">Sync status</span><span className={clsx(sync.status === 'synced' && 'text-emerald-400', (sync.status === 'error' || sync.status === 'unauthenticated') && 'text-danger', sync.status === 'offline' && 'text-ember')}>{sync.status}{sync.lastError ? ` · ${sync.lastError}` : ''}</span></div>
          <div className="flex justify-between"><span className="text-muted">Email delivery</span><span>{auth.emailConfigured ? 'Resend connected' : 'not configured (codes go to function log)'}</span></div>
          <div className="flex justify-between"><span className="text-muted">Last saved</span><span>{new Date(state.savedAt).toLocaleString()}</span></div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <SysButton size="sm" onClick={() => void pushNow(true)}>SYNC NOW</SysButton>
          <SysButton size="sm" variant="ghost" onClick={exportSave}>EXPORT SAVE</SysButton>
          <label className="inline-flex"><input type="file" accept="application/json" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) importSave(f); e.target.value = '' }} /><span className="clip-panel-sm inline-flex cursor-pointer items-center border border-glow/20 px-3 py-1.5 font-display text-[11px] uppercase tracking-[0.2em] hover:border-glow/50">IMPORT SAVE</span></label>
          <SysButton size="sm" variant="ghost" onClick={async () => { await auth.logout(); nav('/login') }}>SIGN OUT</SysButton>
        </div>
        <div className="mt-4 border-t border-danger/30 pt-3">
          <SysButton size="sm" variant="danger" onClick={async () => {
            if (!confirm('Erase the entire save on this device AND in the cloud? This cannot be undone.')) return
            if (prompt('Type ERASE to confirm.') !== 'ERASE') return
            try { await api('/api/state', { method: 'DELETE' }) } catch { /* offline: local reset still proceeds */ }
            resetAll()
            nav('/awakening', { replace: true })
          }}>ERASE EVERYTHING</SysButton>
        </div>
      </HoloPanel>
    </div>
  )
}
