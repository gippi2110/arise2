import { NavLink, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { useState } from 'react'
import clsx from '../lib/clsx'
import { playSfx } from '../audio'
import { useGame } from '../store/game'

export interface NavItem { to: string; label: string; icon: string; intro: string }

export const NAV: NavItem[] = [
  { to: '/', label: 'Dashboard', icon: 'M4 4h7v7H4zM13 4h7v4h-7zM13 10h7v10h-7zM4 13h7v7H4z', intro: 'materialize' },
  { to: '/quests', label: 'Quests', icon: 'M6 3h12v18l-6-4-6 4zM9 8h6M9 12h4', intro: 'glow' },
  { to: '/dungeons', label: 'Dungeons', icon: 'M12 2a8 8 0 0 1 8 8v12H4V10a8 8 0 0 1 8-8zM9 22v-6a3 3 0 0 1 6 0v6', intro: 'portal' },
  { to: '/red-gate', label: 'Red Gate', icon: 'M12 2 3 7v6c0 5 4 8 9 9 5-1 9-4 9-9V7zM12 8v5M12 16v1', intro: 'red' },
  { to: '/shadows', label: 'Shadows', icon: 'M12 3c3 0 5 2 5 5 0 2-1 3-2 4 3 1 5 3 5 6v3H4v-3c0-3 2-5 5-6-1-1-2-2-2-4 0-3 2-5 5-5z', intro: 'shadows' },
  { to: '/status', label: 'Status', icon: 'M12 3a4 4 0 1 1 0 8 4 4 0 0 1 0-8zM4 21c0-4 4-7 8-7s8 3 8 7M3 12h3M18 12h3', intro: 'assemble' },
  { to: '/skills', label: 'Skills', icon: 'M12 2l2.5 6.5L21 9l-5 4.5L17.5 21 12 17.5 6.5 21 8 13.5 3 9l6.5-.5z', intro: 'skills' },
  { to: '/inventory', label: 'Inventory', icon: 'M4 7h16v13H4zM8 7V4h8v3M4 12h16', intro: 'inventory' },
  { to: '/achievements', label: 'Achievements', icon: 'M8 3h8v6a4 4 0 0 1-8 0zM6 5H3v2a4 4 0 0 0 3 4M18 5h3v2a4 4 0 0 1-3 4M12 13v4M8 21h8M9 17h6', intro: 'achievements' },
  { to: '/history', label: 'History', icon: 'M3 12a9 9 0 1 0 3-6.7M3 4v5h5M12 7v5l3 2', intro: 'plain' },
  { to: '/notifications', label: 'Alerts', icon: 'M6 16V11a6 6 0 0 1 12 0v5l2 2H4zM10 21h4', intro: 'plain' },
  { to: '/settings', label: 'Settings', icon: 'M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8zM4 12h2M18 12h2M12 4v2M12 18v2M6.3 6.3l1.4 1.4M16.3 16.3l1.4 1.4M6.3 17.7l1.4-1.4M16.3 7.7l1.4-1.4', intro: 'plain' },
]

export function Icon({ d, className }: { d: string; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className ?? 'h-5 w-5'} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d={d} />
    </svg>
  )
}

const MOBILE_PRIMARY = ['/', '/quests', '/dungeons', '/shadows']

export default function Nav() {
  const [more, setMore] = useState(false)
  const loc = useLocation()
  const unread = useGame((s) => s.state.notifications.filter((n) => !n.read).length)
  const activeRun = useGame((s) => Boolean(s.state.activeRun))
  const redGate = useGame((s) => s.state.redGate?.status === 'active')
  const badge = (to: string) => (to === '/notifications' && unread > 0 ? unread : to === '/dungeons' && activeRun ? '!' : to === '/red-gate' && redGate ? '!' : null)
  const linkClass = (active: boolean) => clsx('group relative flex items-center gap-3 px-3 py-2.5 font-display text-[11px] uppercase tracking-[0.2em] transition-colors', active ? 'text-glow' : 'text-muted hover:text-glow/80')

  return (
    <>
      {/* Desktop side rail */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-56 flex-col border-r border-sys/15 bg-void/70 backdrop-blur-xl lg:flex">
        <div className="px-5 pb-4 pt-6">
          <div className="font-display text-[10px] tracking-[0.5em] text-sys">SHADOW</div>
          <div className="font-display text-lg font-black tracking-[0.3em] text-glow">SYSTEM</div>
        </div>
        <nav className="flex-1 space-y-0.5 overflow-y-auto px-2">
          {NAV.map((n) => (
            <NavLink key={n.to} to={n.to} end={n.to === '/'} onClick={() => playSfx('press')} className={({ isActive }) => linkClass(isActive)}>
              {({ isActive }) => (
                <>
                  {isActive && <motion.span layoutId="rail" className="absolute inset-y-1 left-0 w-0.5 bg-sys shadow-[0_0_12px_rgb(var(--c-primary))]" />}
                  <Icon d={n.icon} className={clsx('h-[18px] w-[18px]', n.to === '/red-gate' && 'text-danger/80')} />
                  <span>{n.label}</span>
                  {badge(n.to) && <span className="ml-auto rounded-sm bg-ember px-1.5 text-[9px] font-bold text-void">{badge(n.to)}</span>}
                </>
              )}
            </NavLink>
          ))}
        </nav>
      </aside>

      {/* Mobile bottom bar */}
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-sys/20 bg-void/85 backdrop-blur-xl lg:hidden safe-bottom">
        <div className="grid grid-cols-5">
          {NAV.filter((n) => MOBILE_PRIMARY.includes(n.to)).map((n) => (
            <NavLink key={n.to} to={n.to} end={n.to === '/'} onClick={() => playSfx('press')} className={({ isActive }) => clsx('relative flex flex-col items-center gap-1 py-2 font-display text-[9px] uppercase tracking-[0.15em]', isActive ? 'text-sys' : 'text-muted')}>
              {({ isActive }) => (
                <>
                  {isActive && <motion.span layoutId="tab" className="absolute top-0 h-0.5 w-10 bg-sys shadow-[0_0_10px_rgb(var(--c-primary))]" />}
                  <Icon d={n.icon} />
                  <span>{n.label}</span>
                  {badge(n.to) && <span className="absolute right-3 top-1 rounded-sm bg-ember px-1 text-[8px] font-bold text-void">{badge(n.to)}</span>}
                </>
              )}
            </NavLink>
          ))}
          <button type="button" onClick={() => { playSfx('open'); setMore(true) }} className={clsx('relative flex flex-col items-center gap-1 py-2 font-display text-[9px] uppercase tracking-[0.15em]', !MOBILE_PRIMARY.includes(loc.pathname) ? 'text-sys' : 'text-muted')}>
            <Icon d="M5 12h.01M12 12h.01M19 12h.01" />
            <span>More</span>
            {(unread > 0 || redGate) && <span className="absolute right-4 top-1 h-2 w-2 rounded-full bg-ember" />}
          </button>
        </div>
      </nav>

      <AnimatePresence>
        {more && (
          <motion.div className="fixed inset-0 z-[70] lg:hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="absolute inset-0 bg-void/80 backdrop-blur-sm" onClick={() => setMore(false)} />
            <motion.div className="holo clip-panel absolute inset-x-2 bottom-2 p-3 safe-bottom" initial={{ y: 200 }} animate={{ y: 0 }} exit={{ y: 200 }} transition={{ type: 'spring', stiffness: 260, damping: 26 }}>
              <div className="mb-2 px-2 font-display text-[10px] tracking-[0.4em] text-sys">SYSTEM MENU</div>
              <div className="grid grid-cols-4 gap-2">
                {NAV.filter((n) => !MOBILE_PRIMARY.includes(n.to)).map((n) => (
                  <NavLink key={n.to} to={n.to} onClick={() => { playSfx('press'); setMore(false) }} className={({ isActive }) => clsx('clip-panel-sm relative flex flex-col items-center gap-1.5 border py-3 font-display text-[9px] uppercase tracking-[0.12em]', isActive ? 'border-sys/70 bg-sys/15 text-glow' : 'border-glow/10 text-muted')}>
                    <Icon d={n.icon} className={clsx('h-5 w-5', n.to === '/red-gate' && 'text-danger')} />
                    <span>{n.label}</span>
                    {badge(n.to) && <span className="absolute right-1 top-1 rounded-sm bg-ember px-1 text-[8px] font-bold text-void">{badge(n.to)}</span>}
                  </NavLink>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
