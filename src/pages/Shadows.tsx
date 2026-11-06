import { useState } from 'react'
import { motion } from 'framer-motion'
import { useGame } from '../store/game'
import { SHADOWS, shadowPower, shadowRank, shadowXpForLevel } from '../game/content/shadows'
import type { ShadowDef } from '../game/types'
import { armyPower, shadowCapacity } from '../game/engine'
import HoloPanel from '../components/ui/HoloPanel'
import StatBar from '../components/ui/StatBar'
import Tag from '../components/ui/Tag'
import Modal from '../components/ui/Modal'
import Particles from '../components/ui/Particles'
import { fmtDate } from '../lib/format'
import { playSfx } from '../audio'
import clsx from '../lib/clsx'

export default function Shadows() {
  const state = useGame((s) => s.state)
  const [sel, setSel] = useState<ShadowDef | null>(null)
  const cap = shadowCapacity(state)
  const power = armyPower(state)
  const owned = (id: string) => state.shadows.find((s) => s.id === id)
  const extraction = state.skills['shadow-extraction'] ?? 0
  const chance = extraction > 0 ? 35 + extraction * 12 : 15
  const highest = state.shadows.reduce((m, s) => Math.max(m, s.level), 0)

  return (
    <div className="relative space-y-5">
      <Particles mode="shadow" density={50} className="pointer-events-none fixed inset-0 h-full w-full" />
      <div className="relative grid gap-4 lg:grid-cols-3">
        <HoloPanel tone="arcane" sweep className="lg:col-span-2" noPad>
          <div className="relative h-44 overflow-hidden">
            <img src="/art/bg/shadows.webp" alt="" className="h-full w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-r from-void via-void/60 to-transparent" />
            <div className="absolute inset-0 flex flex-col justify-center p-5">
              <div className="font-display text-[10px] tracking-[0.5em] text-arcane">SHADOW MONARCH</div>
              <div className="font-display text-3xl font-black tracking-[0.15em] text-glow text-glow-arcane">{state.profile.name.toUpperCase()}'S ARMY</div>
              <div className="mt-1 text-sm text-glow/70">Those who fall before you may rise again, in your service.</div>
            </div>
          </div>
          <div className="grid grid-cols-2 divide-x divide-arcane/15 sm:grid-cols-4">
            {[['SOLDIERS', `${state.shadows.length} / ${cap}`], ['ARMY POWER', String(power)], ['HIGHEST LEVEL', String(highest)], ['EXTRACTION', `${chance}%`]].map(([k, v]) => (
              <div key={k} className="px-4 py-3"><div className="font-display text-[9px] tracking-[0.3em] text-muted">{k}</div><div className="font-display text-xl font-bold text-arcane">{v}</div></div>
            ))}
          </div>
        </HoloPanel>
        <HoloPanel tone="arcane" tag="SHADOW EXTRACTION" title="How shadows rise">
          <ul className="space-y-1.5 text-sm text-glow/80">
            <li>◆ Defeat a boss at C-Rank or higher for an extraction attempt.</li>
            <li>◆ Shadow dungeons guarantee an attempt.</li>
            <li>◆ Some shadows answer to feats instead: streaks, attributes, quests.</li>
            <li>◆ Capacity grows with level, Shadow Storage, and Shadow Cores.</li>
            <li>◆ Your army trains when you do: every quest feeds them XP.</li>
          </ul>
        </HoloPanel>
      </div>

      <div className="relative grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {SHADOWS.map((def, i) => {
          const o = owned(def.id)
          const p = o ? shadowPower(def, o.level) : def.basePower
          return (
            <motion.button key={def.id} type="button" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }} whileHover={{ y: -4 }} onClick={() => { playSfx(o ? 'extract' : 'open'); setSel(def) }} className={clsx('group relative aspect-[4/5] overflow-hidden clip-panel border text-left', o ? 'border-arcane/60 shadow-arcane' : 'border-glow/10')}>
              <img src={def.art} alt="" className={clsx('absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-105', !o && 'brightness-[0.15] blur-[2px] grayscale')} />
              <div className="absolute inset-0 bg-gradient-to-t from-void via-void/30 to-transparent" />
              {!o && <div className="absolute inset-0 flex items-center justify-center"><div className="font-display text-5xl text-glow/10">?</div></div>}
              <div className="absolute left-3 top-3"><Tag color={o ? '#b266ff' : '#8a94a6'}>{o ? shadowRank(o.level).toUpperCase() : 'UNKNOWN'}</Tag></div>
              <div className="absolute inset-x-0 bottom-0 p-3">
                <div className="font-display text-lg font-bold tracking-[0.12em]">{o ? def.name : '???'}</div>
                <div className="text-xs text-muted">{o ? `${def.title} · ${def.klass}` : def.unlock.label}</div>
                {o && (
                  <div className="mt-2">
                    <div className="flex justify-between font-display text-[9px] tracking-[0.2em] text-muted"><span>LV {o.level}</span><span>POWER {p}</span></div>
                    <StatBar value={o.xp} max={shadowXpForLevel(o.level)} showNumbers={false} height="h-1" color="arcane" />
                  </div>
                )}
              </div>
            </motion.button>
          )
        })}
      </div>

      <Modal open={Boolean(sel)} onClose={() => setSel(null)} tone="arcane" tag={sel && owned(sel.id) ? 'SHADOW PROFILE' : 'UNEXTRACTED'} title={sel ? (owned(sel.id) ? `${sel.name}, ${sel.title}` : 'An unknown soul') : ''} wide>
        {sel && (() => {
          const o = owned(sel.id)
          return (
            <div className="grid gap-4 md:grid-cols-5">
              <div className="relative aspect-[4/5] overflow-hidden clip-panel md:col-span-2"><img src={sel.art} alt="" className={clsx('h-full w-full object-cover', !o && 'brightness-[0.2] grayscale blur-[2px]')} /></div>
              <div className="md:col-span-3">
                {o ? (
                  <>
                    <div className="flex flex-wrap gap-1.5"><Tag color="#b266ff">{shadowRank(o.level).toUpperCase()}</Tag><Tag className="bg-glow/5 text-muted">{sel.klass}</Tag><Tag className="bg-glow/5 text-muted">SINCE {fmtDate(o.unlockedAt)}</Tag></div>
                    <p className="mt-3 text-sm italic text-glow/80">{sel.personality}</p>
                    <div className="mt-4 grid grid-cols-3 gap-2 font-display text-center">
                      <div className="holo clip-panel-sm p-2"><div className="text-[9px] tracking-[0.3em] text-muted">LEVEL</div><div className="text-xl text-arcane">{o.level}</div></div>
                      <div className="holo clip-panel-sm p-2"><div className="text-[9px] tracking-[0.3em] text-muted">POWER</div><div className="text-xl text-arcane">{shadowPower(sel, o.level)}</div></div>
                      <div className="holo clip-panel-sm p-2"><div className="text-[9px] tracking-[0.3em] text-muted">NEXT RANK</div><div className="text-xl text-arcane">LV {Math.ceil(o.level / 5) * 5 + 1}</div></div>
                    </div>
                    <div className="mt-3"><StatBar label="SHADOW XP" value={o.xp} max={shadowXpForLevel(o.level)} color="arcane" /></div>
                    <div className="mt-4 font-display text-[10px] tracking-[0.3em] text-muted">ABILITIES</div>
                    <ul className="mt-1 space-y-1 text-sm">{sel.abilities.map((a) => <li key={a}>◆ {a}</li>)}</ul>
                  </>
                ) : (
                  <>
                    <p className="text-sm text-glow/80">The System senses a soul that could serve you. Its shape is unclear.</p>
                    <div className="mt-4 border border-arcane/40 bg-arcane/10 p-3 clip-panel-sm"><div className="font-display text-[10px] tracking-[0.3em] text-arcane">CONDITION</div><div className="text-sm">{sel.unlock.label}</div></div>
                    <div className="mt-3 text-xs text-muted">Or: succeed at a Shadow Extraction after a boss fight. Souls rise in order of the Monarch's call.</div>
                    <div className="mt-4 font-display text-[10px] tracking-[0.3em] text-muted">CLASS</div><div className="text-sm">{sel.klass}</div>
                  </>
                )}
              </div>
            </div>
          )
        })()}
      </Modal>
    </div>
  )
}
