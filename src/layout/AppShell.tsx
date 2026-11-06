import { Outlet, useLocation, Link } from 'react-router-dom'
import { useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import Nav, { NAV } from './Nav'
import SectionIntro, { type IntroKind } from './SectionIntro'
import { useGame } from '../store/game'
import { useSyncStatus } from '../lib/hooks'
import { RANK_META } from '../game/content/ranks'
import { setScene, type Scene } from '../audio'
import { xpToNext } from '../game/engine'
import clsx from '../lib/clsx'

const BG: Record<string, string> = {
  '/': '/art/bg/dashboard.webp', '/quests': '/art/bg/quests.webp', '/dungeons': '/art/bg/dungeons.webp', '/red-gate': '/art/bg/redgate.webp',
  '/shadows': '/art/bg/shadows.webp', '/status': '/art/bg/status.webp', '/skills': '/art/bg/skills.webp', '/inventory': '/art/bg/inventory.webp',
  '/achievements': '/art/bg/achievements.webp', '/history': '/art/bg/status.webp', '/notifications': '/art/bg/quests.webp', '/settings': '/art/bg/awakening.webp',
}
const SCENE: Record<string, Scene> = {
  '/': 'dashboard', '/quests': 'quests', '/dungeons': 'dungeons', '/red-gate': 'redgate', '/shadows': 'shadows', '/status': 'status', '/skills': 'skills',
  '/inventory': 'inventory', '/achievements': 'achievements', '/history': 'status', '/notifications': 'quests', '/settings': 'dashboard',
}
const LABEL: Record<string, string> = {
  '/': 'Player dashboard', '/quests': 'Quest log', '/dungeons': 'Gate registry', '/red-gate': 'Emergency: red gate', '/shadows': 'Shadow monarch', '/status': 'Player status',
  '/skills': 'Skill tree', '/inventory': 'Inventory & armory', '/achievements': 'Achievement hall', '/history': 'Player history', '/notifications': 'Notification center', '/settings': 'System settings',
}

export default function AppShell() {
  const loc = useLocation()
  const base = '/' + (loc.pathname.split('/')[1] ?? '')
  const state = useGame((s) => s.state)
  const tick = useGame((s) => s.tick)
  const sync = useSyncStatus()
  const nav = NAV.find((n) => n.to === base)
  const intro = (nav?.intro ?? 'plain') as IntroKind
  const inBattle = Boolean(state.activeRun && state.activeRun.status === 'boss')

  useEffect(() => {
    setScene(inBattle ? 'battle' : (SCENE[base] ?? 'dashboard'))
  }, [base, inBattle])

  useEffect(() => {
    tick()
    const t = window.setInterval(tick, 30_000)
    const vis = () => { if (document.visibilityState === 'visible') tick() }
    document.addEventListener('visibilitychange', vis)
    return () => { window.clearInterval(t); document.removeEventListener('visibilitychange', vis) }
  }, [tick])

  useEffect(() => {
    document.documentElement.setAttribute('data-redgate', base === '/red-gate' ? 'true' : 'false')
    window.scrollTo({ top: 0 })
  }, [base])

  const rank = RANK_META[state.rank]
  const unread = state.notifications.filter((n) => !n.read).length
  const syncDot = sync.status === 'synced' ? 'bg-emerald-400' : sync.status === 'syncing' ? 'bg-sys animate-pulseGlow' : sync.status === 'offline' ? 'bg-ember' : sync.status === 'error' || sync.status === 'unauthenticated' ? 'bg-danger' : 'bg-muted'

  return (
    <div className="relative min-h-full">
      {/* Section background */}
      <AnimatePresence mode="wait">
        <motion.div key={base} className="fixed inset-0 z-0" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.8 }}>
          <motion.img src={BG[base] ?? BG['/']} alt="" className="h-full w-full object-cover" initial={{ scale: 1.08 }} animate={{ scale: 1 }} transition={{ duration: 22, ease: 'linear' }} />
          <div className="absolute inset-0 bg-gradient-to-b from-void/70 via-void/85 to-void" />
        </motion.div>
      </AnimatePresence>
      <div className="vignette" />
      <div className="grain" />

      <Nav />

      {/* Top status strip */}
      <header className="sticky top-0 z-30 border-b border-sys/15 bg-void/70 backdrop-blur-xl safe-top lg:ml-56">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-3 py-2 sm:px-6">
          <Link to="/status" className="relative h-10 w-10 flex-none overflow-hidden rounded-full ring-1 ring-sys/60" style={{ boxShadow: `0 0 14px ${rank.color}88` }}>
            <img src={state.profile.avatar} alt="" className="h-full w-full object-cover" />
          </Link>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="truncate font-display text-sm font-bold tracking-[0.12em]">{state.profile.name || 'PLAYER'}</span>
              <span className="clip-tag px-1.5 font-display text-[9px] font-black tracking-widest text-void" style={{ background: rank.color }}>{rank.label}</span>
            </div>
            <div className="mt-0.5 flex items-center gap-2">
              <span className="font-display text-[10px] tracking-[0.2em] text-muted">LV {state.level}</span>
              <div className="bar-track h-1 w-24 overflow-hidden sm:w-40"><div className="h-full bg-sys" style={{ width: `${Math.min(100, (state.xp / xpToNext(state)) * 100)}%`, boxShadow: '0 0 8px rgb(var(--c-primary))' }} /></div>
              <span className="hidden font-display text-[10px] text-muted sm:inline">{state.xp.toLocaleString()} / {xpToNext(state).toLocaleString()} XP</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden items-center gap-1 font-display text-xs text-ember sm:flex" title="Gold"><span className="text-[10px] tracking-widest text-muted">GOLD</span>{state.gold.toLocaleString()}</div>
            <Link to="/notifications" className="relative flex h-9 w-9 items-center justify-center rounded-sm border border-sys/25 text-glow/80 hover:border-sys/60" aria-label="Notifications">
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M6 16V11a6 6 0 0 1 12 0v5l2 2H4zM10 21h4" /></svg>
              {unread > 0 && <span className="absolute -right-1 -top-1 rounded-sm bg-ember px-1 font-display text-[9px] font-bold text-void">{unread > 99 ? '99+' : unread}</span>}
            </Link>
            <span className={clsx('h-2 w-2 rounded-full', syncDot)} title={`Cloud sync: ${sync.status}${sync.lastError ? ` (${sync.lastError})` : ''}`} />
          </div>
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-6xl px-3 pb-28 pt-4 sm:px-6 lg:ml-56 lg:pb-10 xl:mx-auto">
        <AnimatePresence mode="wait">
          <motion.div key={base} exit={{ opacity: 0, y: -10, transition: { duration: 0.2 } }}>
            <SectionIntro kind={intro} label={LABEL[base]}>
              <Outlet />
            </SectionIntro>
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  )
}
