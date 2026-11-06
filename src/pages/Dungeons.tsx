import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { useGame } from '../store/game'
import type { DungeonCategory, DungeonDef } from '../game/types'
import { DUNGEONS, DUNGEON_CATEGORY_META } from '../game/content/dungeons'
import { DIFFICULTY_META } from '../game/content/ranks'
import { abandonDungeon, beginBoss, clearDungeon, dungeonAvailability, dungeonFor, enterDungeon, failDungeon, objectivesDone, setObjective } from '../game/engine'
import { SHADOWS } from '../game/content/shadows'
import { ITEM_BY_ID } from '../game/content/items'
import HoloPanel from '../components/ui/HoloPanel'
import SysButton from '../components/ui/SysButton'
import Tag from '../components/ui/Tag'
import Modal from '../components/ui/Modal'
import Stepper from '../components/ui/Stepper'
import StatBar from '../components/ui/StatBar'
import PortalTransition from '../components/cinematics/PortalTransition'
import BossBattle from '../components/BossBattle'
import { fmtDuration } from '../lib/format'
import { useNow } from '../lib/hooks'
import { playSfx } from '../audio'
import clsx from '../lib/clsx'

const ORDER: DungeonCategory[] = ['daily', 'normal', 'instant', 'boss', 'shadow', 'event', 'redgate']

export default function Dungeons() {
  const state = useGame((s) => s.state)
  const mutate = useGame((s) => s.mutate)
  const [selected, setSelected] = useState<DungeonDef | null>(null)
  const [portal, setPortal] = useState<DungeonDef | null>(null)
  const [result, setResult] = useState<ReturnType<typeof clearDungeon> | null>(null)
  const now = useNow(1000)
  const run = state.activeRun
  const runDef = run ? dungeonFor(run.dungeonId) : null
  const grouped = useMemo(() => ORDER.map((c) => ({ c, list: DUNGEONS.filter((d) => d.category === c).map((d) => dungeonFor(d.id)!) })), [])

  const enter = (def: DungeonDef) => {
    let err: string | null = null
    mutate((d) => { err = enterDungeon(d, def.id) })
    if (err) { playSfx('deny'); return }
    setSelected(null)
    setPortal(def)
  }

  const finish = () => {
    let res: ReturnType<typeof clearDungeon> = null
    mutate((d) => { res = clearDungeon(d) })
    setResult(res)
  }

  if (run && runDef && run.status === 'boss' && runDef.boss) {
    return <BossBattle boss={runDef.boss} onVictory={finish} onDefeat={() => mutate((d) => failDungeon(d))} onFlee={() => mutate((d) => { if (d.activeRun) d.activeRun.status = 'active' })} />
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-black tracking-[0.15em] text-glow text-glow-sys">GATE REGISTRY</h1>
        <p className="text-sm text-muted">Each gate bundles real-world objectives behind a portal. Clear them, then face what guards the exit. One clear per gate per day.</p>
      </div>

      {run && runDef && (
        <HoloPanel tone="arcane" sweep tag="ACTIVE DUNGEON" title={runDef.name} art={runDef.art} artHeight="h-40" right={run.endsAt ? <div className={clsx('font-display text-lg font-bold tabular-nums', run.endsAt - now < 5 * 60_000 && 'text-danger animate-pulseGlow')}>{fmtDuration(run.endsAt - now)}</div> : null}>
          <p className="text-sm italic text-glow/70">{runDef.atmosphere}</p>
          <div className="mt-4 space-y-4">
            {runDef.objectives.map((o) => {
              const v = run.objectives[o.id] ?? 0
              return (
                <div key={o.id}>
                  <div className="mb-1 flex items-center justify-between font-display text-xs tracking-[0.15em]"><span className={v >= o.target ? 'text-sys' : ''}>{o.text}</span><span className="text-muted">{v} / {o.target} {o.unit}</span></div>
                  <StatBar value={v} max={o.target} showNumbers={false} height="h-1.5" color={v >= o.target ? 'sys' : 'arcane'} />
                  <div className="mt-2"><Stepper value={v} max={o.target} unit={o.unit} onChange={(n) => mutate((d) => setObjective(d, o.id, n))} disabled={v >= o.target} /></div>
                </div>
              )
            })}
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            {runDef.boss ? (
              <SysButton variant="danger" size="lg" disabled={!objectivesDone(state)} onClick={() => mutate((d) => beginBoss(d))}>FACE {runDef.boss.name.toUpperCase()}</SysButton>
            ) : (
              <SysButton variant="arcane" size="lg" disabled={!objectivesDone(state)} onClick={finish}>CLEAR DUNGEON</SysButton>
            )}
            <SysButton variant="ghost" onClick={() => { if (confirm('Abandon this dungeon? Progress inside it is lost.')) mutate((d) => abandonDungeon(d)) }}>ABANDON</SysButton>
          </div>
          {!objectivesDone(state) && <div className="mt-2 text-xs text-muted">Complete every objective to unlock the exit.</div>}
        </HoloPanel>
      )}

      {grouped.map(({ c, list }) => (
        <section key={c}>
          <div className="mb-2 flex items-baseline gap-3">
            <h2 className="font-display text-sm font-bold tracking-[0.3em] text-glow">{DUNGEON_CATEGORY_META[c].label.toUpperCase()}</h2>
            <span className="text-xs text-muted">{DUNGEON_CATEGORY_META[c].blurb}</span>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {list.map((def) => {
              const avail = dungeonAvailability(state, def)
              const clears = state.dungeonClears[def.id]?.count ?? 0
              const diff = DIFFICULTY_META[def.rank]
              const isActive = run?.dungeonId === def.id
              return (
                <motion.button key={def.id} type="button" whileHover={{ y: -3 }} onClick={() => { playSfx('open'); setSelected(def) }} className={clsx('group relative h-44 overflow-hidden clip-panel border text-left', isActive ? 'border-arcane shadow-arcane' : avail.ok ? 'border-sys/30 hover:border-sys/70 hover:shadow-holo' : 'border-glow/10')}>
                  <img src={def.art} alt="" className={clsx('absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-105', !avail.ok && !isActive && 'grayscale')} />
                  <div className="absolute inset-0 bg-gradient-to-t from-void via-void/60 to-transparent" />
                  <div className="absolute left-3 top-3 flex gap-1.5">
                    <Tag color={diff.color}>RANK {def.rank}</Tag>
                    {clears > 0 && <Tag className="bg-void/60 text-glow/80">CLEARED ×{clears}</Tag>}
                  </div>
                  <div className="absolute inset-x-0 bottom-0 p-3">
                    <div className="font-display text-base font-bold tracking-[0.12em]">{def.name}</div>
                    <div className="text-xs text-muted">Recommended Lv {def.recommendedLevel}{def.timeLimitMin ? ` · ${def.timeLimitMin} min` : ''}{def.boss ? ` · Boss: ${def.boss.name}` : ''}</div>
                    {!avail.ok && !isActive && <div className="mt-1 font-display text-[10px] tracking-[0.2em] text-ember">{avail.reason}</div>}
                    {isActive && <div className="mt-1 font-display text-[10px] tracking-[0.2em] text-arcane">IN PROGRESS</div>}
                  </div>
                </motion.button>
              )
            })}
          </div>
        </section>
      ))}

      <Modal open={Boolean(selected)} onClose={() => setSelected(null)} tag={selected ? DUNGEON_CATEGORY_META[selected.category].label.toUpperCase() : ''} title={selected?.name} wide>
        {selected && (
          <div className="grid gap-4 md:grid-cols-5">
            <div className="md:col-span-3">
              <div className="relative h-48 overflow-hidden clip-panel"><img src={selected.art} alt="" className="h-full w-full object-cover" /><div className="absolute left-3 top-3"><Tag color={DIFFICULTY_META[selected.rank].color}>RANK {selected.rank}</Tag></div></div>
              <p className="mt-3 text-sm text-glow/85">{selected.description}</p>
              <p className="mt-1 text-sm italic text-muted">{selected.atmosphere}</p>
              {selected.boss && (
                <div className="mt-4 flex items-center gap-3 border border-danger/30 bg-danger/5 p-3 clip-panel-sm">
                  <img src={selected.boss.art} alt="" className="h-16 w-16 flex-none object-cover clip-panel-sm" />
                  <div><div className="font-display text-[10px] tracking-[0.3em] text-danger">GATEKEEPER</div><div className="font-display text-sm font-bold">{selected.boss.name} · {selected.boss.title}</div><div className="text-xs text-muted">HP {selected.boss.hp} · ATK {selected.boss.attack}</div></div>
                </div>
              )}
            </div>
            <div className="md:col-span-2">
              <div className="font-display text-[10px] tracking-[0.3em] text-muted">OBJECTIVES</div>
              <ul className="mt-1 space-y-1 text-sm">{selected.objectives.map((o) => <li key={o.id}>◆ {o.text}: {o.target} {o.unit}</li>)}{selected.objectives.length === 0 && <li className="text-muted">Generated on entry.</li>}</ul>
              <div className="mt-4 font-display text-[10px] tracking-[0.3em] text-muted">REWARDS</div>
              <ul className="mt-1 space-y-1 text-sm">
                <li className="text-sys">+{selected.rewards.xp} XP (scales with level)</li>
                <li className="text-ember">+{selected.rewards.gold} gold</li>
                {selected.rewards.items?.map((i) => <li key={i}>{ITEM_BY_ID[i]?.name}</li>)}
                {selected.rewards.shadowChance > 0 && selected.boss && <li className="text-arcane">Shadow extraction chance (C-Rank+)</li>}
              </ul>
              <div className="mt-4 text-xs text-muted">Recommended level {selected.recommendedLevel}{selected.timeLimitMin ? ` · ${selected.timeLimitMin} minute limit` : ' · no time limit'}{selected.requiresRank ? ` · requires ${selected.requiresRank}-Rank` : ''}</div>
              <div className="mt-4">
                {(() => { const a = dungeonAvailability(state, selected); return <SysButton variant="arcane" size="lg" block disabled={!a.ok} onClick={() => enter(selected)}>{a.ok ? 'ENTER THE GATE' : a.reason}</SysButton> })()}
              </div>
            </div>
          </div>
        )}
      </Modal>

      <PortalTransition open={Boolean(portal)} art={portal?.art ?? ''} name={portal?.name ?? ''} rank={portal?.rank ?? 'E'} objectives={portal?.objectives.map((o) => `${o.text}: ${o.target} ${o.unit}`) ?? []} onDone={() => setPortal(null)} />

      <Modal open={Boolean(result)} onClose={() => setResult(null)} tag="DUNGEON CLEARED" title="Rewards granted" tone="ember">
        {result && (
          <div className="space-y-3 text-sm">
            <div className="grid grid-cols-2 gap-3 font-display">
              <div className="holo clip-panel-sm p-3 text-center"><div className="text-[9px] tracking-[0.3em] text-muted">XP</div><div className="text-2xl text-sys">+{result.xp}</div></div>
              <div className="holo clip-panel-sm p-3 text-center"><div className="text-[9px] tracking-[0.3em] text-muted">GOLD</div><div className="text-2xl text-ember">+{result.gold}</div></div>
            </div>
            {result.items.length > 0 && <div>Items: {result.items.map((i) => ITEM_BY_ID[i]?.name ?? i).join(', ')}</div>}
            {result.extraction && (
              <div className={clsx('border p-3 clip-panel-sm', result.extraction.success ? 'border-arcane/60 bg-arcane/10' : 'border-glow/10')}>
                <div className="font-display text-[10px] tracking-[0.3em] text-arcane">SHADOW EXTRACTION</div>
                {result.extraction.full ? <div>Your shadow is full. Raise your capacity to extract more.</div> : result.extraction.success ? <div>Success. {SHADOWS.find((s) => s.id === result.extraction?.id)?.name} has risen.</div> : <div>The soul slipped away. ({Math.round(result.extraction.chance * 100)}% chance)</div>}
              </div>
            )}
            <SysButton block onClick={() => setResult(null)}>CONTINUE</SysButton>
          </div>
        )}
      </Modal>
    </div>
  )
}
