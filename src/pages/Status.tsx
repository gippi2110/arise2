import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { useGame } from '../store/game'
import { ATTRS, CATEGORY_META } from '../game/content/attrs'
import { RANK_META } from '../game/content/ranks'
import type { AttrKey, QuestCategory, Workout } from '../game/types'
import { allocateStat, dayKey, equipmentBonuses, logTraining } from '../game/engine'
import { useDerived, useNow } from '../lib/hooks'
import HoloPanel from '../components/ui/HoloPanel'
import RadarChart from '../components/ui/RadarChart'
import StatBar from '../components/ui/StatBar'
import Bars from '../components/ui/Bars'
import SysButton from '../components/ui/SysButton'
import Modal from '../components/ui/Modal'
import Tag from '../components/ui/Tag'
import Empty from '../components/ui/Empty'
import { fmtDate, fmtDuration, fmtDateTime } from '../lib/format'
import { playSfx, speak } from '../audio'
import clsx from '../lib/clsx'
import { childVariants } from '../layout/SectionIntro'

type Tab = 'attributes' | 'analytics' | 'records' | 'training'

export default function Status() {
  const [tab, setTab] = useState<Tab>('attributes')
  const tabs: { k: Tab; l: string }[] = [{ k: 'attributes', l: 'Attributes' }, { k: 'analytics', l: 'Analytics' }, { k: 'records', l: 'Records' }, { k: 'training', l: 'Training Arena' }]
  return (
    <div className="space-y-4">
      <motion.div variants={childVariants}>
        <h1 className="font-display text-2xl font-black tracking-[0.15em] text-glow text-glow-sys">PLAYER STATUS</h1>
        <p className="text-sm text-muted">Everything the System knows about you.</p>
      </motion.div>
      <motion.div variants={childVariants} className="flex gap-1 overflow-x-auto">
        {tabs.map((t) => <button key={t.k} type="button" onClick={() => { setTab(t.k); playSfx('press') }} className={clsx('clip-panel-sm flex-none border px-4 py-2 font-display text-[11px] tracking-[0.25em]', tab === t.k ? 'border-sys bg-sys/15 text-glow shadow-holo' : 'border-glow/10 text-muted')}>{t.l.toUpperCase()}</button>)}
      </motion.div>
      {tab === 'attributes' && <Attributes />}
      {tab === 'analytics' && <Analytics />}
      {tab === 'records' && <Records />}
      {tab === 'training' && <Training />}
    </div>
  )
}

function Attributes() {
  const state = useGame((s) => s.state)
  const mutate = useGame((s) => s.mutate)
  const d = useDerived()
  const eq = equipmentBonuses(state)
  const alloc = (k: AttrKey, n: number) => {
    mutate((s) => { allocateStat(s, k, n) })
    playSfx('accept')
    if (n >= 5) void speak('Your attributes have been strengthened.', 'normal')
  }
  return (
    <div className="grid gap-4 lg:grid-cols-5">
      <motion.div variants={childVariants} className="lg:col-span-2">
        <HoloPanel tag="DISTRIBUTION" title="Attribute profile" className="h-full">
          <RadarChart values={ATTRS.map((a) => ({ label: a.short, value: state.attrs[a.key] + (eq.attrs[a.key] ?? 0) }))} size={280} />
          <div className="mt-3 grid grid-cols-2 gap-2 font-display text-[10px] tracking-[0.2em]">
            {[['MAX HP', d.maxHp], ['MAX MP', d.maxMp], ['ATTACK', d.attack], ['DEFENSE', d.defense], ['CRIT CHANCE', `${d.critChance}%`], ['ARMY POWER', d.armyPower]].map(([k, v]) => <div key={String(k)} className="holo clip-panel-sm px-3 py-2"><div className="text-muted">{k}</div><div className="text-base text-glow">{v}</div></div>)}
          </div>
        </HoloPanel>
      </motion.div>
      <motion.div variants={childVariants} className="lg:col-span-3">
        <HoloPanel tag="ALLOCATION" title="Stat points" tone={state.statPoints > 0 ? 'ember' : 'sys'} right={<div className="text-right font-display"><div className="text-[9px] tracking-[0.3em] text-muted">AVAILABLE</div><div className={clsx('text-2xl font-black', state.statPoints > 0 ? 'text-ember' : 'text-glow')}>{state.statPoints}</div></div>}>
          <div className="space-y-3">
            {ATTRS.map((a) => {
              const bonus = eq.attrs[a.key] ?? 0
              return (
                <div key={a.key} className="flex items-center gap-3">
                  <div className="w-24 flex-none"><div className="font-display text-xs tracking-[0.2em]">{a.short}</div><div className="text-[10px] text-muted">{a.label}</div></div>
                  <div className="flex-1">
                    <StatBar value={state.attrs[a.key]} max={Math.max(50, Math.ceil((state.attrs[a.key] + 10) / 25) * 25)} showNumbers={false} height="h-2" color={bonus ? 'arcane' : 'sys'} />
                    <div className="mt-0.5 text-[10px] text-muted">{a.blurb}</div>
                  </div>
                  <div className="w-14 flex-none text-right font-display text-lg text-glow">{state.attrs[a.key]}{bonus ? <span className="text-xs text-arcane"> +{bonus}</span> : null}</div>
                  <div className="flex flex-none gap-1">
                    <button type="button" disabled={state.statPoints < 1} onClick={() => alloc(a.key, 1)} className="h-8 w-8 clip-panel-sm border border-sys/40 bg-sys/10 font-display text-xs disabled:opacity-30">+1</button>
                    <button type="button" disabled={state.statPoints < 5} onClick={() => alloc(a.key, 5)} className="h-8 w-8 clip-panel-sm border border-ember/40 bg-ember/10 font-display text-xs disabled:opacity-30">+5</button>
                  </div>
                </div>
              )
            })}
          </div>
          <div className="mt-4 border-t border-glow/10 pt-3 text-xs text-muted">Points come from levelling (3 per level). A Rune of Unmaking in the armory refunds every point.</div>
        </HoloPanel>
      </motion.div>
    </div>
  )
}

function Analytics() {
  const state = useGame((s) => s.state)
  const days = useMemo(() => {
    const out: { key: string; label: string; xp: number; quests: number; gold: number }[] = []
    for (let i = 29; i >= 0; i--) {
      const dt = new Date(); dt.setDate(dt.getDate() - i)
      const key = dayKey(dt)
      const l = state.dailyLog[key]
      out.push({ key, label: String(dt.getDate()), xp: l?.xp ?? 0, quests: l?.quests ?? 0, gold: l?.gold ?? 0 })
    }
    return out
  }, [state.dailyLog])
  const week = days.slice(-7)
  const weekLabels = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']
  const cats = useMemo(() => {
    const totals: Partial<Record<QuestCategory, number>> = {}
    for (const l of Object.values(state.dailyLog)) for (const [c, n] of Object.entries(l.categories)) totals[c as QuestCategory] = (totals[c as QuestCategory] ?? 0) + (n ?? 0)
    return Object.entries(totals).sort((a, b) => (b[1] ?? 0) - (a[1] ?? 0))
  }, [state.dailyLog])
  const monthXp = days.reduce((s, d) => s + d.xp, 0)
  const weekXp = week.reduce((s, d) => s + d.xp, 0)
  const activeDays = days.filter((d) => d.quests > 0 || d.xp > 0).length
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <motion.div variants={childVariants}><HoloPanel tag="WEEKLY ACTIVITY" title={`${weekXp.toLocaleString()} XP this week`}><Bars data={week.map((d) => ({ label: weekLabels[new Date(d.key).getDay()], value: d.xp, hint: `${d.key}: ${d.xp} XP, ${d.quests} quests` }))} height={140} showValues /></HoloPanel></motion.div>
      <motion.div variants={childVariants}><HoloPanel tag="MONTHLY ACTIVITY" title={`${monthXp.toLocaleString()} XP in 30 days`} right={<Tag className="bg-sys/15 text-sys">{activeDays} ACTIVE DAYS</Tag>}><Bars data={days.map((d) => ({ label: Number(d.label) % 5 === 0 ? d.label : '', value: d.xp, hint: `${d.key}: ${d.xp} XP` }))} height={140} /></HoloPanel></motion.div>
      <motion.div variants={childVariants}><HoloPanel tag="QUESTS PER DAY" title="Completion rhythm"><Bars data={days.map((d) => ({ label: Number(d.label) % 5 === 0 ? d.label : '', value: d.quests, hint: `${d.key}: ${d.quests} quests` }))} height={110} color="rgb(var(--c-secondary))" /></HoloPanel></motion.div>
      <motion.div variants={childVariants}>
        <HoloPanel tag="TRAINING FOCUS" title="Category distribution">
          {cats.length === 0 ? <div className="text-sm text-muted">Complete quests to see where your effort goes.</div> : (
            <div className="space-y-2">{cats.map(([c, n]) => { const total = cats.reduce((s, x) => s + (x[1] ?? 0), 0); return <StatBar key={c} label={CATEGORY_META[c as QuestCategory].label.toUpperCase()} value={n ?? 0} max={total} suffix={` (${Math.round(((n ?? 0) / total) * 100)}%)`} color="arcane" /> })}</div>
          )}
        </HoloPanel>
      </motion.div>
      <motion.div variants={childVariants} className="lg:col-span-2">
        <HoloPanel tag="RANK PROGRESSION" title="Promotion history">
          <ol className="relative ml-2 border-l border-sys/30 pl-5">
            {state.rankHistory.map((r, i) => (
              <li key={i} className="relative mb-4 last:mb-0">
                <span className="absolute -left-[27px] top-0.5 h-3 w-3 rounded-full" style={{ background: RANK_META[r.rank].color, boxShadow: `0 0 10px ${RANK_META[r.rank].color}` }} />
                <div className="font-display text-sm font-bold tracking-[0.15em]">{RANK_META[r.rank].title}</div>
                <div className="text-xs text-muted">{fmtDate(r.at)} · level {r.level}</div>
              </li>
            ))}
          </ol>
        </HoloPanel>
      </motion.div>
    </div>
  )
}

function Records() {
  const state = useGame((s) => s.state)
  const bestDay = Object.entries(state.dailyLog).sort((a, b) => b[1].xp - a[1].xp)[0]
  const records = state.quests.filter((q) => q.record > 0).sort((a, b) => b.timesCompleted - a.timesCompleted)
  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <motion.div variants={childVariants} className="lg:col-span-1">
        <HoloPanel tag="PERSONAL RECORDS" title="Milestones" tone="ember" className="h-full">
          <div className="space-y-3 font-display">
            {[['BEST STREAK', `${state.streak.best} days`], ['MOST XP IN A DAY', bestDay ? `${bestDay[1].xp} (${bestDay[0]})` : '—'], ['TOTAL XP', state.totalXp.toLocaleString()], ['GOLD EARNED', state.stats.goldEarned.toLocaleString()], ['QUESTS DONE', String(state.stats.questsCompleted)], ['QUESTS FAILED', String(state.stats.questsFailed)], ['BOSSES SLAIN', String(state.stats.bossesDefeated)], ['DUNGEONS', String(state.stats.dungeonsCleared)], ['RED GATES', String(state.stats.redGatesCleared)]].map(([k, v]) => (
              <div key={k} className="flex items-baseline justify-between border-b border-glow/10 pb-1"><span className="text-[10px] tracking-[0.3em] text-muted">{k}</span><span className="text-sm text-glow">{v}</span></div>
            ))}
          </div>
        </HoloPanel>
      </motion.div>
      <motion.div variants={childVariants} className="lg:col-span-2">
        <HoloPanel tag="QUEST RECORDS" title="Best single-period performance" className="h-full">
          {records.length === 0 ? <Empty title="NO RECORDS YET" body="Progress any quest and your best effort is remembered here." /> : (
            <div className="grid gap-2 sm:grid-cols-2">
              {records.map((q) => (
                <div key={q.id} className="holo clip-panel-sm flex items-center justify-between px-3 py-2">
                  <div><div className="font-display text-xs tracking-[0.15em]">{q.name}</div><div className="text-[10px] text-muted">{CATEGORY_META[q.category].label} · completed {q.timesCompleted}×</div></div>
                  <div className="text-right font-display"><div className="text-lg text-ember">{q.record}</div><div className="text-[9px] text-muted">{q.unit}</div></div>
                </div>
              ))}
            </div>
          )}
          {state.trainingSessions.length > 0 && (
            <div className="mt-4">
              <div className="font-display text-[10px] tracking-[0.3em] text-muted">RECENT TRAINING</div>
              <div className="mt-1 space-y-1 text-sm">{state.trainingSessions.slice(0, 5).map((s) => <div key={s.id} className="flex justify-between border-b border-glow/5 py-1"><span>{state.workouts.find((w) => w.id === s.workoutId)?.name ?? 'Workout'}</span><span className="text-muted">{fmtDuration(s.durationSec * 1000)} · {s.volumeKg.toLocaleString()} vol · {fmtDateTime(s.at)}</span></div>)}</div>
            </div>
          )}
        </HoloPanel>
      </motion.div>
    </div>
  )
}

function Training() {
  const state = useGame((s) => s.state)
  const mutate = useGame((s) => s.mutate)
  const [editing, setEditing] = useState<Workout | 'new' | null>(null)
  const [session, setSession] = useState<{ workoutId: string; startedAt: number; done: Record<string, boolean> } | null>(null)
  const now = useNow(1000)
  const w = session ? state.workouts.find((x) => x.id === session.workoutId) : null
  const allDone = w ? w.exercises.every((e) => session?.done[e.id]) : false

  const finish = () => {
    if (!session) return
    mutate((d) => { logTraining(d, session.workoutId, Math.round((Date.now() - session.startedAt) / 1000)) })
    setSession(null)
  }

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <motion.div variants={childVariants} className="lg:col-span-2">
        {session && w ? (
          <HoloPanel tone="ember" sweep tag="SESSION ACTIVE" title={w.name} right={<div className="font-display text-2xl font-black tabular-nums text-ember">{fmtDuration(now - session.startedAt)}</div>}>
            <div className="space-y-2">
              {w.exercises.map((e) => (
                <button key={e.id} type="button" onClick={() => { playSfx(session.done[e.id] ? 'press' : 'accept'); setSession({ ...session, done: { ...session.done, [e.id]: !session.done[e.id] } }) }} className={clsx('flex w-full items-center justify-between clip-panel-sm border px-3 py-3 text-left', session.done[e.id] ? 'border-ember/60 bg-ember/10' : 'border-glow/15')}>
                  <div><div className="font-display text-sm tracking-[0.12em]">{e.name}</div><div className="text-xs text-muted">{e.sets} × {e.reps}{e.weightKg ? ` @ ${e.weightKg} kg` : ''}</div></div>
                  <div className={clsx('font-display text-xs tracking-[0.3em]', session.done[e.id] ? 'text-ember' : 'text-muted')}>{session.done[e.id] ? 'DONE' : 'TAP WHEN DONE'}</div>
                </button>
              ))}
            </div>
            <div className="mt-4 flex gap-2">
              <SysButton variant="ember" size="lg" disabled={!allDone} onClick={finish}>COMPLETE TRAINING</SysButton>
              <SysButton variant="ghost" onClick={() => { if (confirm('Abort this session?')) setSession(null) }}>ABORT</SysButton>
            </div>
          </HoloPanel>
        ) : (
          <HoloPanel tag="TRAINING ARENA" title="Configured workouts" art="/art/bg/training.webp" artHeight="h-36" right={<SysButton size="sm" variant="ember" onClick={() => setEditing('new')}>+ NEW</SysButton>}>
            <div className="space-y-2">
              {state.workouts.map((wk) => (
                <div key={wk.id} className="holo clip-panel-sm flex flex-col gap-2 p-3 sm:flex-row sm:items-center">
                  <div className="flex-1">
                    <div className="font-display text-sm font-bold tracking-[0.12em]">{wk.name}</div>
                    <div className="text-xs text-muted">{wk.exercises.map((e) => `${e.name} ${e.sets}×${e.reps}`).join(' · ')}</div>
                    <div className="mt-1 font-display text-[10px] tracking-[0.2em] text-muted"><span className="text-sys">+{wk.xp} XP</span> · {Object.entries(wk.attrs).filter(([, v]) => v).map(([k, v]) => `${ATTRS.find((a) => a.key === k)?.short} +${v}`).join(' ')} · done {wk.timesDone}× {wk.bestDurationSec ? `· best ${fmtDuration(wk.bestDurationSec * 1000)}` : ''}</div>
                  </div>
                  <div className="flex gap-2">
                    <SysButton size="sm" variant="ghost" onClick={() => setEditing(wk)}>EDIT</SysButton>
                    <SysButton size="sm" variant="ember" onClick={() => { playSfx('portal'); void speak('Training begins. Do not stop until it is done.', 'normal'); setSession({ workoutId: wk.id, startedAt: Date.now(), done: {} }) }}>BEGIN</SysButton>
                  </div>
                </div>
              ))}
              {state.workouts.length === 0 && <Empty title="NO WORKOUTS" body="Configure a workout to begin training in the arena." />}
            </div>
          </HoloPanel>
        )}
      </motion.div>
      <motion.div variants={childVariants}>
        <HoloPanel tag="PERFORMANCE" title="Training log" className="h-full">
          <div className="grid grid-cols-2 gap-2 font-display text-center">
            <div className="holo clip-panel-sm p-2"><div className="text-[9px] tracking-[0.3em] text-muted">SESSIONS</div><div className="text-xl text-glow">{state.trainingSessions.length}</div></div>
            <div className="holo clip-panel-sm p-2"><div className="text-[9px] tracking-[0.3em] text-muted">TOTAL VOLUME</div><div className="text-xl text-glow">{state.trainingSessions.reduce((s, x) => s + x.volumeKg, 0).toLocaleString()}</div></div>
          </div>
          <div className="mt-3 space-y-1 text-sm">
            {state.trainingSessions.slice(0, 8).map((s) => <div key={s.id} className="flex justify-between border-b border-glow/5 py-1"><span className="truncate">{state.workouts.find((x) => x.id === s.workoutId)?.name ?? 'Workout'}</span><span className="flex-none text-muted">{fmtDuration(s.durationSec * 1000)} · +{s.xp} XP</span></div>)}
            {state.trainingSessions.length === 0 && <div className="text-muted">No sessions logged yet.</div>}
          </div>
        </HoloPanel>
      </motion.div>
      <WorkoutEditor target={editing} onClose={() => setEditing(null)} />
    </div>
  )
}

function WorkoutEditor({ target, onClose }: { target: Workout | 'new' | null; onClose: () => void }) {
  const mutate = useGame((s) => s.mutate)
  const [draft, setDraft] = useState<Workout | null>(null)
  const base: Workout = target === 'new' || !target
    ? { id: `w_${Date.now().toString(36)}`, name: '', exercises: [{ id: 'e1', name: 'Push-ups', sets: 3, reps: 15, weightKg: 0 }], attrs: { strength: 2, vitality: 1 }, xp: 100, timesDone: 0, bestDurationSec: null }
    : target
  const w = draft ?? base
  const set = (p: Partial<Workout>) => setDraft({ ...w, ...p })
  const close = () => { setDraft(null); onClose() }
  const save = () => {
    if (!w.name.trim() || w.exercises.length === 0) return
    mutate((d) => {
      const i = d.workouts.findIndex((x) => x.id === w.id)
      const clean = { ...w, name: w.name.trim(), xp: Math.max(10, Math.min(400, w.xp)) }
      if (i >= 0) d.workouts[i] = clean
      else d.workouts.push(clean)
    })
    playSfx('accept'); close()
  }
  return (
    <Modal open={Boolean(target)} onClose={close} tag="WORKOUT" title={target === 'new' ? 'Configure workout' : 'Edit workout'}>
      <div className="space-y-3">
        <div><label className="font-display text-[10px] tracking-[0.3em] text-muted">NAME</label><input className="sys-input mt-1" value={w.name} onChange={(e) => set({ name: e.target.value })} placeholder="Upper body destruction" /></div>
        <div>
          <label className="font-display text-[10px] tracking-[0.3em] text-muted">EXERCISES</label>
          <div className="mt-1 space-y-2">
            {w.exercises.map((e, i) => (
              <div key={e.id} className="grid grid-cols-12 gap-1">
                <input className="sys-input col-span-5" value={e.name} onChange={(ev) => { const ex = [...w.exercises]; ex[i] = { ...e, name: ev.target.value }; set({ exercises: ex }) }} placeholder="Exercise" />
                <input className="sys-input col-span-2" type="number" min={1} value={e.sets} onChange={(ev) => { const ex = [...w.exercises]; ex[i] = { ...e, sets: Math.max(1, Number(ev.target.value)) }; set({ exercises: ex }) }} title="Sets" />
                <input className="sys-input col-span-2" type="number" min={1} value={e.reps} onChange={(ev) => { const ex = [...w.exercises]; ex[i] = { ...e, reps: Math.max(1, Number(ev.target.value)) }; set({ exercises: ex }) }} title="Reps" />
                <input className="sys-input col-span-2" type="number" min={0} value={e.weightKg} onChange={(ev) => { const ex = [...w.exercises]; ex[i] = { ...e, weightKg: Math.max(0, Number(ev.target.value)) }; set({ exercises: ex }) }} title="kg" />
                <button type="button" className="col-span-1 text-danger" onClick={() => set({ exercises: w.exercises.filter((x) => x.id !== e.id) })}>✕</button>
              </div>
            ))}
            <div className="grid grid-cols-12 gap-1 font-display text-[9px] tracking-widest text-muted"><span className="col-span-5">NAME</span><span className="col-span-2">SETS</span><span className="col-span-2">REPS</span><span className="col-span-2">KG</span></div>
            <SysButton size="sm" variant="ghost" onClick={() => set({ exercises: [...w.exercises, { id: `e${Date.now().toString(36)}`, name: '', sets: 3, reps: 10, weightKg: 0 }] })}>+ ADD EXERCISE</SysButton>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div><label className="font-display text-[10px] tracking-[0.3em] text-muted">XP REWARD (10–400)</label><input className="sys-input mt-1" type="number" min={10} max={400} value={w.xp} onChange={(e) => set({ xp: Number(e.target.value) })} /></div>
        </div>
        <div>
          <label className="font-display text-[10px] tracking-[0.3em] text-muted">ATTRIBUTE GAINS</label>
          <div className="mt-1 grid grid-cols-4 gap-1.5">{ATTRS.map((a) => <label key={a.key} className="clip-panel-sm border border-glow/10 px-2 py-1 text-center"><div className="font-display text-[9px] tracking-widest text-muted">{a.short}</div><input className="w-full bg-transparent text-center font-display text-sm text-sys outline-none" type="number" min={0} max={5} value={w.attrs[a.key] ?? 0} onChange={(e) => set({ attrs: { ...w.attrs, [a.key]: Math.max(0, Math.min(5, Number(e.target.value))) } })} /></label>)}</div>
        </div>
        <div className="flex gap-2 pt-2">
          <SysButton variant="ember" className="flex-1" onClick={save} disabled={!w.name.trim() || w.exercises.length === 0}>SAVE WORKOUT</SysButton>
          {target !== 'new' && target && <SysButton variant="danger" onClick={() => { if (confirm('Delete this workout?')) { mutate((d) => { d.workouts = d.workouts.filter((x) => x.id !== target.id) }); close() } }}>DELETE</SysButton>}
        </div>
      </div>
    </Modal>
  )
}
