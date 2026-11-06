import { useMemo, useState } from 'react'
import { useGame } from '../store/game'
import type { HistoryEvent } from '../game/types'
import { RANK_META } from '../game/content/ranks'
import HoloPanel from '../components/ui/HoloPanel'
import Empty from '../components/ui/Empty'
import Tag from '../components/ui/Tag'
import { fmtDate, fmtDateTime } from '../lib/format'
import { playSfx } from '../audio'
import clsx from '../lib/clsx'

const KIND_COLOR: Record<HistoryEvent['kind'], string> = { quest: '#168CFF', level: '#EAF5FF', rank: '#FF7100', dungeon: '#7215C8', boss: '#B266FF', shadow: '#7215C8', achievement: '#FF7100', purchase: '#FFD166', skill: '#B266FF', penalty: '#FF3C3C', login: '#58C37A', training: '#FF7100', redgate: '#FF3C3C', stat: '#8FB8FF' }

export default function History() {
  const state = useGame((s) => s.state)
  const [kind, setKind] = useState<HistoryEvent['kind'] | 'all'>('all')
  const grouped = useMemo(() => {
    const map = new Map<string, HistoryEvent[]>()
    for (const h of state.history) {
      if (kind !== 'all' && h.kind !== kind) continue
      const k = new Date(h.at).toDateString()
      map.set(k, [...(map.get(k) ?? []), h])
    }
    return [...map.entries()].slice(0, 60)
  }, [state.history, kind])
  const kinds = useMemo(() => ['all', ...new Set(state.history.map((h) => h.kind))] as (HistoryEvent['kind'] | 'all')[], [state.history])
  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <div className="space-y-3 lg:col-span-2">
        <div><h1 className="font-display text-2xl font-black tracking-[0.15em] text-glow text-glow-sys">PLAYER HISTORY</h1><p className="text-sm text-muted">Every mission, promotion, purchase and penalty the System recorded. Synced across your devices.</p></div>
        <div className="flex gap-1 overflow-x-auto">{kinds.map((k) => <button key={k} type="button" onClick={() => { setKind(k); playSfx('press') }} className={clsx('clip-panel-sm flex-none border px-3 py-1.5 font-display text-[10px] tracking-[0.25em]', kind === k ? 'border-sys bg-sys/15 text-glow' : 'border-glow/10 text-muted')}>{k.toUpperCase()}</button>)}</div>
        {grouped.length === 0 ? <Empty title="NO HISTORY" body="Your story has not begun. Complete a quest." /> : grouped.map(([day, items]) => (
          <HoloPanel key={day} noPad>
            <div className="border-b border-glow/10 px-4 py-2 font-display text-[10px] tracking-[0.3em] text-muted">{day.toUpperCase()} · {items.reduce((s, i) => s + i.xp, 0)} XP · {items.reduce((s, i) => s + i.gold, 0)} G</div>
            <ul className="divide-y divide-glow/5">
              {items.map((h) => (
                <li key={h.id} className="flex items-center gap-3 px-4 py-2 text-sm">
                  <span className="h-2 w-2 flex-none rounded-full" style={{ background: KIND_COLOR[h.kind], boxShadow: `0 0 8px ${KIND_COLOR[h.kind]}` }} />
                  <span className="min-w-0 flex-1 truncate">{h.title}</span>
                  <span className="flex-none font-display text-[10px] text-muted">{h.xp ? <span className={h.xp > 0 ? 'text-sys' : 'text-danger'}>{h.xp > 0 ? '+' : ''}{h.xp} XP </span> : null}{h.gold ? <span className="text-ember">{h.gold > 0 ? '+' : ''}{h.gold} G </span> : null}{new Date(h.at).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}</span>
                </li>
              ))}
            </ul>
          </HoloPanel>
        ))}
      </div>
      <div className="space-y-3">
        <HoloPanel tag="RANK HISTORY" title="Promotions" tone="ember">
          <ol className="relative ml-2 border-l border-ember/30 pl-5">
            {[...state.rankHistory].reverse().map((r, i) => (
              <li key={i} className="relative mb-4 last:mb-0">
                <span className="absolute -left-[27px] top-0.5 h-3 w-3 rounded-full" style={{ background: RANK_META[r.rank].color, boxShadow: `0 0 10px ${RANK_META[r.rank].color}` }} />
                <div className="flex items-center gap-2"><Tag color={RANK_META[r.rank].color}>{RANK_META[r.rank].label}</Tag><span className="font-display text-sm font-bold tracking-[0.12em]">{RANK_META[r.rank].title}</span></div>
                <div className="text-xs text-muted">{fmtDateTime(r.at)} · level {r.level}</div>
              </li>
            ))}
          </ol>
        </HoloPanel>
        <HoloPanel tag="LEVEL HISTORY" title="Growth">
          <ul className="space-y-1 text-sm">{state.history.filter((h) => h.kind === 'level').slice(0, 12).map((h) => <li key={h.id} className="flex justify-between border-b border-glow/5 py-1"><span>{h.title}</span><span className="text-muted">{fmtDate(h.at)}</span></li>)}{state.history.filter((h) => h.kind === 'level').length === 0 && <li className="text-muted">No level-ups yet.</li>}</ul>
        </HoloPanel>
        <HoloPanel tag="AWAKENED" title={state.profile.awakenedAt ? fmtDateTime(state.profile.awakenedAt) : '—'}><div className="text-sm text-muted">The day the System chose you.</div></HoloPanel>
      </div>
    </div>
  )
}
