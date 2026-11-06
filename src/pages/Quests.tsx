import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useGame } from '../store/game'
import type { AttrKey, Difficulty, Quest, QuestCadence, QuestCategory } from '../game/types'
import { ATTRS, CATEGORY_META } from '../game/content/attrs'
import { DIFFICULTY_META } from '../game/content/ranks'
import { questRewards } from '../game/content/quests'
import { createQuest, periodEnd, setQuestProgress, updateQuest } from '../game/engine'
import HoloPanel from '../components/ui/HoloPanel'
import SysButton from '../components/ui/SysButton'
import Stepper from '../components/ui/Stepper'
import StatBar from '../components/ui/StatBar'
import Tag from '../components/ui/Tag'
import Modal from '../components/ui/Modal'
import Empty from '../components/ui/Empty'
import { fmtDuration } from '../lib/format'
import { useNow } from '../lib/hooks'
import { playSfx } from '../audio'
import clsx from '../lib/clsx'

const TABS: { key: QuestCadence; label: string; blurb: string }[] = [
  { key: 'daily', label: 'Daily', blurb: 'Reset every midnight. Finish them all to extend your streak.' },
  { key: 'weekly', label: 'Weekly', blurb: 'Reset Monday. Bigger targets, bigger rewards.' },
  { key: 'monthly', label: 'Monthly', blurb: 'Reset on the first. Long campaigns.' },
  { key: 'secret', label: 'Secret', blurb: 'Hidden until the System decides you are ready.' },
]

type Form = { name: string; description: string; category: QuestCategory; cadence: QuestCadence; difficulty: Difficulty; target: number; unit: string; attrs: Partial<Record<AttrKey, number>> }

export default function Quests() {
  const state = useGame((s) => s.state)
  const mutate = useGame((s) => s.mutate)
  const [tab, setTab] = useState<QuestCadence>('daily')
  const [editing, setEditing] = useState<Quest | null>(null)
  const [creating, setCreating] = useState(false)
  const [showInactive, setShowInactive] = useState(false)
  const now = useNow(1000)
  const list = useMemo(() => state.quests.filter((q) => q.cadence === tab && (showInactive || q.active) && (q.cadence !== 'secret' || q.revealed || showInactive)), [state.quests, tab, showInactive])
  const end = periodEnd(tab)
  const done = list.filter((q) => q.completedAt).length

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-black tracking-[0.15em] text-glow text-glow-sys">QUEST LOG</h1>
          <p className="text-sm text-muted">{TABS.find((t) => t.key === tab)?.blurb}</p>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => setShowInactive((v) => !v)} className={clsx('font-display text-[10px] tracking-[0.25em]', showInactive ? 'text-sys' : 'text-muted')}>{showInactive ? 'HIDE INACTIVE' : 'SHOW INACTIVE'}</button>
          <SysButton variant="ember" onClick={() => setCreating(true)}>+ CREATE QUEST</SysButton>
        </div>
      </div>

      <div className="flex gap-1 overflow-x-auto">
        {TABS.map((t) => {
          const count = state.quests.filter((q) => q.cadence === t.key && q.active && (q.revealed || t.key !== 'secret')).length
          return (
            <button key={t.key} type="button" onClick={() => { setTab(t.key); playSfx('press') }} className={clsx('clip-panel-sm relative flex-none border px-4 py-2 font-display text-[11px] tracking-[0.25em] transition', tab === t.key ? 'border-sys bg-sys/15 text-glow shadow-holo' : 'border-glow/10 text-muted hover:text-glow')}>
              {t.label.toUpperCase()} <span className="ml-1 text-[9px] opacity-70">{count}</span>
            </button>
          )
        })}
      </div>

      {list.length > 0 && (
        <div className="flex items-center justify-between font-display text-[10px] tracking-[0.3em] text-muted">
          <span>{done} / {list.length} COMPLETE</span>
          {end && <span>RESETS IN {fmtDuration(end - now)}</span>}
        </div>
      )}

      <AnimatePresence mode="popLayout">
        {list.length === 0 ? (
          <Empty title={tab === 'secret' ? 'NOTHING REVEALED YET' : 'NO QUESTS HERE'} body={tab === 'secret' ? 'Secret quests surface when hidden conditions are met. Keep your streak alive and sharpen your senses.' : 'Create a quest tuned to your real capabilities. The System rewards honesty more than ambition.'} />
        ) : (
          <motion.div layout className="grid gap-3 md:grid-cols-2">
            {list.map((q) => <QuestCard key={q.id} q={q} now={now} onEdit={() => setEditing(q)} onProgress={(v) => mutate((d) => setQuestProgress(d, q.id, v))} />)}
          </motion.div>
        )}
      </AnimatePresence>

      <QuestEditor
        open={creating || Boolean(editing)}
        quest={editing}
        onClose={() => { setCreating(false); setEditing(null) }}
        onSave={(f) => {
          mutate((d) => {
            if (editing) updateQuest(d, editing.id, f)
            else createQuest(d, f)
          })
          playSfx('accept')
          setCreating(false); setEditing(null)
        }}
        onToggle={editing ? () => { mutate((d) => updateQuest(d, editing.id, { active: !editing.active })); setEditing(null) } : undefined}
        onDelete={editing ? () => { mutate((d) => { d.quests = d.quests.filter((x) => x.id !== editing.id) }); playSfx('deny'); setEditing(null) } : undefined}
      />
    </div>
  )
}

function QuestCard({ q, now, onEdit, onProgress }: { q: Quest; now: number; onEdit: () => void; onProgress: (v: number) => void }) {
  const diff = DIFFICULTY_META[q.difficulty]
  const end = periodEnd(q.cadence)
  const complete = Boolean(q.completedAt)
  const mult = useGame((s) => s.state.settings.activityRewards[q.category]?.xpMultiplier ?? 1)
  return (
    <motion.div layout initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}>
      <HoloPanel tone={complete ? 'sys' : q.cadence === 'secret' ? 'arcane' : 'sys'} noPad className={clsx(!q.active && 'opacity-50', complete && 'ring-1 ring-sys/40')}>
        <div className="p-4">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-1.5">
                <Tag color={diff.color}>{q.difficulty}-RANK</Tag>
                <Tag className="bg-glow/5 text-muted">{CATEGORY_META[q.category].label}</Tag>
                {complete && <Tag className="bg-sys text-void">COMPLETE</Tag>}
                {!q.active && <Tag className="bg-glow/10 text-muted">INACTIVE</Tag>}
              </div>
              <div className={clsx('mt-1.5 font-display text-base font-bold tracking-[0.12em]', complete && 'text-sys')}>{q.name}</div>
              <div className="text-sm text-muted">{q.description}</div>
            </div>
            <button type="button" onClick={() => { playSfx('press'); onEdit() }} className="flex-none font-display text-[10px] tracking-[0.25em] text-muted hover:text-glow">EDIT</button>
          </div>
          <div className="mt-3">
            <StatBar value={q.progress} max={q.target} suffix={` ${q.unit}`} color={complete ? 'sys' : 'arcane'} height="h-2" />
          </div>
          <div className="mt-3">
            <Stepper value={q.progress} max={q.target} unit={q.unit} onChange={onProgress} disabled={complete || !q.active} />
          </div>
        </div>
        <div className="flex items-center justify-between border-t border-glow/10 px-4 py-2 font-display text-[10px] tracking-[0.2em] text-muted">
          <span><span className="text-sys">+{Math.round(q.xp * mult)} XP</span> · <span className="text-ember">+{q.gold} G</span> · {Object.entries(q.attrs).filter(([, v]) => v).map(([k, v]) => `${ATTRS.find((a) => a.key === k)?.short} +${v}`).join(' ')}</span>
          {end && !complete && <span className={clsx(end - now < 3 * 3600_000 && 'text-danger')}>{fmtDuration(end - now)}</span>}
          {complete && <span>RECORD {q.record} {q.unit}</span>}
        </div>
      </HoloPanel>
    </motion.div>
  )
}

function QuestEditor({ open, quest, onClose, onSave, onToggle, onDelete }: { open: boolean; quest: Quest | null; onClose: () => void; onSave: (f: Form) => void; onToggle?: () => void; onDelete?: () => void }) {
  const defaults = useGame((s) => s.state.settings.activityRewards)
  const [f, setF] = useState<Form | null>(null)
  const form: Form = f ?? (quest
    ? { name: quest.name, description: quest.description, category: quest.category, cadence: quest.cadence, difficulty: quest.difficulty, target: quest.target, unit: quest.unit, attrs: { ...quest.attrs } }
    : { name: '', description: '', category: 'exercise', cadence: 'daily', difficulty: 'D', target: 50, unit: 'reps', attrs: { ...defaults.exercise.attrs } })
  const set = (patch: Partial<Form>) => setF({ ...form, ...patch })
  const rewards = questRewards(form.difficulty, form.cadence)
  const close = () => { setF(null); onClose() }
  return (
    <Modal open={open} onClose={close} tag={quest ? 'EDIT QUEST' : 'QUEST CREATOR'} title={quest ? quest.name : 'Define a new mission'}>
      <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); if (form.name.trim()) { onSave({ ...form, name: form.name.trim() }); setF(null) } }}>
        <div>
          <label className="font-display text-[10px] tracking-[0.3em] text-muted">NAME</label>
          <input className="sys-input mt-1" value={form.name} onChange={(e) => set({ name: e.target.value })} required maxLength={40} placeholder="Push-ups" />
        </div>
        <div>
          <label className="font-display text-[10px] tracking-[0.3em] text-muted">DESCRIPTION</label>
          <input className="sys-input mt-1" value={form.description} onChange={(e) => set({ description: e.target.value })} maxLength={120} placeholder="Why this matters." />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="font-display text-[10px] tracking-[0.3em] text-muted">CATEGORY</label>
            <select className="sys-input mt-1" value={form.category} onChange={(e) => { const c = e.target.value as QuestCategory; set({ category: c, unit: CATEGORY_META[c].defaultUnit, attrs: { ...defaults[c].attrs } }) }}>
              {(Object.keys(CATEGORY_META) as QuestCategory[]).map((c) => <option key={c} value={c}>{CATEGORY_META[c].label}</option>)}
            </select>
          </div>
          <div>
            <label className="font-display text-[10px] tracking-[0.3em] text-muted">CADENCE</label>
            <select className="sys-input mt-1" value={form.cadence} onChange={(e) => set({ cadence: e.target.value as QuestCadence })}>
              <option value="daily">Daily</option><option value="weekly">Weekly</option><option value="monthly">Monthly</option><option value="secret">Secret (one-time)</option>
            </select>
          </div>
          <div>
            <label className="font-display text-[10px] tracking-[0.3em] text-muted">TARGET</label>
            <input className="sys-input mt-1" type="number" min={1} step="any" value={form.target} onChange={(e) => set({ target: Math.max(1, Number(e.target.value)) })} />
          </div>
          <div>
            <label className="font-display text-[10px] tracking-[0.3em] text-muted">UNIT</label>
            <input className="sys-input mt-1" value={form.unit} onChange={(e) => set({ unit: e.target.value })} maxLength={12} />
          </div>
        </div>
        <div>
          <label className="font-display text-[10px] tracking-[0.3em] text-muted">DIFFICULTY</label>
          <div className="mt-1 flex gap-1">
            {(Object.keys(DIFFICULTY_META) as Difficulty[]).map((dk) => (
              <button key={dk} type="button" onClick={() => { set({ difficulty: dk }); playSfx('press') }} className="flex-1 clip-panel-sm border py-2 font-display text-xs font-bold" style={{ borderColor: form.difficulty === dk ? DIFFICULTY_META[dk].color : 'rgb(var(--c-text) / 0.1)', background: form.difficulty === dk ? `${DIFFICULTY_META[dk].color}26` : 'transparent', color: form.difficulty === dk ? DIFFICULTY_META[dk].color : undefined }}>{dk}</button>
            ))}
          </div>
          <div className="mt-1 font-display text-[10px] tracking-[0.2em] text-muted">REWARD <span className="text-sys">+{rewards.xp} XP</span> · <span className="text-ember">+{rewards.gold} GOLD</span> · PENALTY -{rewards.penaltyXp} XP</div>
        </div>
        <div>
          <label className="font-display text-[10px] tracking-[0.3em] text-muted">ATTRIBUTE GAINS ON COMPLETION</label>
          <div className="mt-1 grid grid-cols-4 gap-1.5">
            {ATTRS.map((a) => (
              <label key={a.key} className="clip-panel-sm border border-glow/10 px-2 py-1 text-center">
                <div className="font-display text-[9px] tracking-widest text-muted">{a.short}</div>
                <input className="w-full bg-transparent text-center font-display text-sm text-sys outline-none" type="number" min={0} max={5} value={form.attrs[a.key] ?? 0} onChange={(e) => set({ attrs: { ...form.attrs, [a.key]: Math.max(0, Math.min(5, Number(e.target.value))) } })} />
              </label>
            ))}
          </div>
        </div>
        <div className="flex flex-wrap gap-2 pt-2">
          <SysButton type="submit" variant="arcane" className="flex-1">{quest ? 'SAVE CHANGES' : 'ACCEPT QUEST'}</SysButton>
          {onToggle && <SysButton variant="ghost" onClick={onToggle}>{quest?.active ? 'DEACTIVATE' : 'ACTIVATE'}</SysButton>}
          {onDelete && <SysButton variant="danger" onClick={() => { if (confirm('Delete this quest permanently?')) onDelete() }}>DELETE</SysButton>}
        </div>
      </form>
    </Modal>
  )
}
