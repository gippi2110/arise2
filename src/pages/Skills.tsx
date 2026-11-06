import { useState } from 'react'
import { motion } from 'framer-motion'
import { useGame } from '../store/game'
import { SKILLS } from '../game/content/skills'
import type { SkillDef } from '../game/types'
import { rankAtLeast, upgradeSkill } from '../game/engine'
import HoloPanel from '../components/ui/HoloPanel'
import SysButton from '../components/ui/SysButton'
import Tag from '../components/ui/Tag'
import Modal from '../components/ui/Modal'
import MagicCircle from '../components/ui/MagicCircle'
import { playSfx, speak } from '../audio'
import clsx from '../lib/clsx'

const TIERS: { label: string; ids: string[] }[] = [
  { label: 'TIER I · HUNTER', ids: ['dagger-mastery', 'stealth'] },
  { label: 'TIER II · PREDATOR', ids: ['bloodlust'] },
  { label: 'TIER III · NECROMANCER', ids: ['shadow-extraction', 'shadow-storage'] },
  { label: 'TIER IV · RULER', ids: ['rulers-authority'] },
  { label: 'TIER V · MONARCH', ids: ['shadow-exchange'] },
]

export default function Skills() {
  const state = useGame((s) => s.state)
  const mutate = useGame((s) => s.mutate)
  const [sel, setSel] = useState<SkillDef | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const lvl = (id: string) => state.skills[id] ?? 0
  const unlocked = (s: SkillDef) => state.level >= s.unlock.level && rankAtLeast(state.rank, s.unlock.rank)

  const upgrade = (s: SkillDef) => {
    let err: string | null = null
    mutate((d) => { err = upgradeSkill(d, s.id) })
    setError(err)
    if (err) playSfx('deny')
  }
  const activate = (s: SkillDef) => {
    playSfx('skill')
    void speak(s.name, 'dark')
    setPreview(s.id)
    window.setTimeout(() => setPreview(null), Math.max(1500, Math.min(6000, s.cooldownSec * 250)))
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-black tracking-[0.15em] text-glow text-glow-arcane">SKILL TREE</h1>
          <p className="text-sm text-muted">Virtual abilities earned through progression. Active skills are used in boss fights and cost MP. Passives always apply.</p>
        </div>
        <div className="font-display text-right"><div className="text-[9px] tracking-[0.3em] text-muted">GOLD</div><div className="text-xl text-ember">{state.gold.toLocaleString()}</div></div>
      </div>

      <div className="relative">
        <MagicCircle size={700} tone="arcane" className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.07]" />
        <div className="relative space-y-6">
          {TIERS.map((tier, ti) => (
            <div key={tier.label}>
              <div className="mb-2 flex items-center gap-3"><div className="h-px flex-1 bg-gradient-to-r from-transparent via-arcane/50 to-transparent" /><span className="font-display text-[10px] tracking-[0.4em] text-arcane">{tier.label}</span><div className="h-px flex-1 bg-gradient-to-r from-transparent via-arcane/50 to-transparent" /></div>
              <div className={clsx('grid gap-3', tier.ids.length > 1 ? 'sm:grid-cols-2' : 'mx-auto max-w-md')}>
                {tier.ids.map((id, i) => {
                  const s = SKILLS.find((x) => x.id === id)!
                  const l = lvl(id)
                  const un = unlocked(s)
                  const isPreview = preview === id
                  return (
                    <motion.button key={id} type="button" initial={{ opacity: 0, scale: 0.9, rotate: -2 }} animate={{ opacity: 1, scale: 1, rotate: 0 }} transition={{ delay: ti * 0.12 + i * 0.08, type: 'spring' }} onClick={() => { playSfx('open'); setError(null); setSel(s) }} className={clsx('holo clip-panel relative flex gap-4 p-3 text-left', l > 0 ? 'holo-arcane' : !un && 'opacity-60')}>
                      <div className="relative h-24 w-24 flex-none overflow-hidden clip-panel-sm">
                        <img src={s.art} alt="" className={clsx('h-full w-full object-cover', !un && 'grayscale brightness-50')} />
                        {isPreview && <motion.div className="absolute inset-0 bg-arcane/40" initial={{ opacity: 1 }} animate={{ opacity: 0 }} transition={{ duration: 1.2 }} />}
                        {isPreview && <div className="absolute inset-0 animate-spinSlow" style={{ background: 'conic-gradient(rgb(var(--c-secondary) / 0.7), transparent 60%)', animationDuration: '1.5s' }} />}
                        {l === 0 && <div className="absolute inset-0 flex items-center justify-center bg-void/40 font-display text-[9px] tracking-[0.3em]">{un ? 'LEARN' : 'LOCKED'}</div>}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-1.5"><Tag className={s.kind === 'active' ? 'bg-arcane/30 text-arcane' : 'bg-sys/20 text-sys'}>{s.kind}</Tag>{s.kind === 'active' && <Tag className="bg-glow/5 text-muted">{s.mpCost} MP · {s.cooldownSec}s</Tag>}</div>
                        <div className="mt-1 font-display text-base font-bold tracking-[0.12em]">{s.name}</div>
                        <div className="line-clamp-2 text-xs text-muted">{s.description}</div>
                        <div className="mt-2 flex items-center gap-1">{Array.from({ length: s.maxLevel }).map((_, k) => <span key={k} className={clsx('h-1.5 w-6 clip-tag', k < l ? 'bg-arcane shadow-[0_0_8px_rgb(var(--c-secondary))]' : 'bg-glow/10')} />)}<span className="ml-2 font-display text-[10px] text-muted">LV {l}/{s.maxLevel}</span></div>
                        {!un && <div className="mt-1 font-display text-[10px] tracking-[0.2em] text-ember">{s.unlock.label}</div>}
                      </div>
                    </motion.button>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      <Modal open={Boolean(sel)} onClose={() => setSel(null)} tone="arcane" tag={sel?.kind.toUpperCase()} title={sel?.name}>
        {sel && (() => {
          const l = lvl(sel.id)
          const un = unlocked(sel)
          const cost = sel.upgradeGold(l)
          return (
            <div className="space-y-4">
              <div className="flex gap-4">
                <img src={sel.art} alt="" className="h-28 w-28 flex-none object-cover clip-panel-sm" style={{ boxShadow: '0 0 24px rgb(var(--c-secondary) / 0.5)' }} />
                <div className="text-sm text-glow/85">{sel.description}</div>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="holo clip-panel-sm p-3"><div className="font-display text-[9px] tracking-[0.3em] text-muted">CURRENT</div><div>{l > 0 ? sel.effect(l) : 'Not learned'}</div></div>
                <div className="holo clip-panel-sm p-3"><div className="font-display text-[9px] tracking-[0.3em] text-muted">NEXT</div><div>{l < sel.maxLevel ? sel.effect(l + 1) : 'Mastered'}</div></div>
              </div>
              <HoloPanel noPad className="px-3 py-2 text-xs"><div className="font-display text-[9px] tracking-[0.3em] text-muted">UNLOCK</div><div className={un ? 'text-sys' : 'text-ember'}>{sel.unlock.label} {un ? '· met' : '· not yet'}</div></HoloPanel>
              {error && <div className="border border-danger/50 bg-danger/10 px-3 py-2 text-xs">{error}</div>}
              <div className="flex flex-wrap gap-2">
                <SysButton variant="arcane" className="flex-1" disabled={!un || l >= sel.maxLevel || state.gold < cost} onClick={() => upgrade(sel)}>{l >= sel.maxLevel ? 'MASTERED' : l === 0 ? `LEARN · ${cost} G` : `UPGRADE · ${cost} G`}</SysButton>
                {sel.kind === 'active' && l > 0 && <SysButton variant="ghost" onClick={() => activate(sel)}>PREVIEW ACTIVATION</SysButton>}
              </div>
            </div>
          )
        })()}
      </Modal>
    </div>
  )
}
