import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useGame } from '../store/game'
import type { NoticeStyle } from '../game/types'
import SysButton from '../components/ui/SysButton'
import Empty from '../components/ui/Empty'
import Tag from '../components/ui/Tag'
import { relTime } from '../lib/format'
import { playSfx } from '../audio'
import clsx from '../lib/clsx'

const COLOR: Record<NoticeStyle, string> = { normal: 'rgb(var(--c-primary))', warning: 'rgb(var(--c-danger))', epic: 'rgb(var(--c-accent))', dark: 'rgb(var(--c-secondary))', quest: 'rgb(var(--c-primary))' }

export default function Notifications() {
  const notifications = useGame((s) => s.state.notifications)
  const mutate = useGame((s) => s.mutate)
  const [filter, setFilter] = useState<NoticeStyle | 'all' | 'unread'>('all')
  const list = notifications.filter((n) => filter === 'all' || (filter === 'unread' ? !n.read : n.style === filter))
  const unread = notifications.filter((n) => !n.read).length
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div><h1 className="font-display text-2xl font-black tracking-[0.15em] text-glow text-glow-sys">NOTIFICATION CENTER</h1><p className="text-sm text-muted">{unread} unread System messages.</p></div>
        <div className="flex gap-2">
          <SysButton size="sm" variant="ghost" disabled={unread === 0} onClick={() => mutate((d) => { d.notifications.forEach((n) => { n.read = true }) })}>MARK ALL READ</SysButton>
          <SysButton size="sm" variant="danger" disabled={notifications.length === 0} onClick={() => { if (confirm('Clear all notifications?')) mutate((d) => { d.notifications = [] }) }}>CLEAR</SysButton>
        </div>
      </div>
      <div className="flex gap-1 overflow-x-auto">
        {(['all', 'unread', 'quest', 'epic', 'warning', 'dark', 'normal'] as const).map((f) => <button key={f} type="button" onClick={() => { setFilter(f); playSfx('press') }} className={clsx('clip-panel-sm flex-none border px-3 py-1.5 font-display text-[10px] tracking-[0.25em]', filter === f ? 'border-sys bg-sys/15 text-glow' : 'border-glow/10 text-muted')}>{f.toUpperCase()}</button>)}
      </div>
      {list.length === 0 ? <Empty title="SILENCE" body="The System has nothing to say. Yet." /> : (
        <div className="space-y-2">
          <AnimatePresence>
            {list.map((n) => (
              <motion.button key={n.id} type="button" layout initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, height: 0 }} onClick={() => mutate((d) => { const t = d.notifications.find((x) => x.id === n.id); if (t) t.read = true })} className={clsx('holo clip-panel-sm flex w-full gap-3 p-3 text-left', n.read && 'opacity-60')} style={{ borderLeft: `3px solid ${COLOR[n.style]}` }}>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2"><span className="font-display text-xs font-bold tracking-[0.2em]">{n.title}</span><Tag color={COLOR[n.style]}>{n.style}</Tag>{!n.read && <span className="h-1.5 w-1.5 rounded-full bg-ember" />}</div>
                  <div className="mt-1 text-sm text-glow/85">{n.body}</div>
                </div>
                <div className="flex-none font-display text-[10px] text-muted">{relTime(n.at)}</div>
              </motion.button>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  )
}
