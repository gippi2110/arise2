import { useState } from 'react'
import { motion } from 'framer-motion'
import { useGame } from '../store/game'
import { ACHIEVEMENTS } from '../game/content/achievements'
import type { AchievementDef } from '../game/types'
import HoloPanel from '../components/ui/HoloPanel'
import Modal from '../components/ui/Modal'
import Tag from '../components/ui/Tag'
import StatBar from '../components/ui/StatBar'
import { fmtDateTime } from '../lib/format'
import { playSfx } from '../audio'
import clsx from '../lib/clsx'

export default function Achievements() {
  const state = useGame((s) => s.state)
  const [sel, setSel] = useState<AchievementDef | null>(null)
  const unlocked = ACHIEVEMENTS.filter((a) => state.achievements[a.id]).length
  const visible = ACHIEVEMENTS.filter((a) => !a.secret || state.achievements[a.id])
  const progress = (id: string): string | null => {
    const st = state.stats
    switch (id) {
      case 'streak-7': return `${Math.min(7, state.streak.best)} / 7 days`
      case 'streak-30': return `${Math.min(30, state.streak.best)} / 30 days`
      case 'quests-100': return `${Math.min(100, st.questsCompleted)} / 100`
      case 'boss-slayer': return `${Math.min(10, st.bossesDefeated)} / 10`
      case 'gold-hoarder': return `${Math.min(10000, st.goldEarned).toLocaleString()} / 10,000`
      case 'shadow-monarch': return `${state.shadows.length} / 8 shadows`
      case 'skill-master': return `best skill level ${Math.max(0, ...Object.values(state.skills))} / 5`
      default: return null
    }
  }
  return (
    <div className="space-y-4">
      <HoloPanel tone="ember" sweep noPad>
        <div className="relative h-36 overflow-hidden">
          <img src="/art/bg/achievements.webp" alt="" className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-void via-void/60 to-transparent" />
          <div className="absolute inset-0 flex flex-col justify-center p-5">
            <div className="font-display text-[10px] tracking-[0.5em] text-ember">ACHIEVEMENT HALL</div>
            <div className="font-display text-3xl font-black tracking-[0.15em] text-glow text-glow-ember">{unlocked} / {ACHIEVEMENTS.length}</div>
            <div className="mt-2 max-w-xs"><StatBar value={unlocked} max={ACHIEVEMENTS.length} showNumbers={false} color="ember" height="h-1.5" /></div>
          </div>
        </div>
      </HoloPanel>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {visible.map((a, i) => {
          const at = state.achievements[a.id]
          const p = progress(a.id)
          return (
            <motion.button key={a.id} type="button" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.05 }} onClick={() => { playSfx(at ? 'coin' : 'open'); setSel(a) }} className={clsx('holo clip-panel p-3 text-left', at ? 'holo-ember' : 'opacity-70')}>
              <div className="relative aspect-square overflow-hidden clip-panel-sm">
                <img src={a.art} alt="" className={clsx('h-full w-full object-cover', !at && 'grayscale brightness-[0.35]')} />
                {!at && <div className="absolute inset-0 flex items-center justify-center font-display text-[10px] tracking-[0.3em] text-glow/60">LOCKED</div>}
              </div>
              <div className="mt-2 font-display text-sm font-bold tracking-[0.08em]">{a.name}</div>
              <div className="line-clamp-2 text-[11px] text-muted">{a.description}</div>
              <div className="mt-1 font-display text-[9px] tracking-[0.2em]">{at ? <span className="text-ember">UNLOCKED</span> : p ? <span className="text-muted">{p}</span> : <span className="text-muted">LOCKED</span>}</div>
            </motion.button>
          )
        })}
      </div>
      <Modal open={Boolean(sel)} onClose={() => setSel(null)} tone="ember" tag="ACHIEVEMENT" title={sel?.name}>
        {sel && (
          <div className="flex gap-4">
            <img src={sel.art} alt="" className={clsx('h-32 w-32 flex-none object-cover clip-panel-sm', !state.achievements[sel.id] && 'grayscale brightness-50')} style={{ boxShadow: '0 0 30px rgb(var(--c-accent) / 0.4)' }} />
            <div className="space-y-2 text-sm">
              <div className="flex gap-1.5">{state.achievements[sel.id] ? <Tag className="bg-ember text-void">UNLOCKED</Tag> : <Tag className="bg-glow/10 text-muted">LOCKED</Tag>}{sel.secret && <Tag className="bg-arcane/30 text-arcane">SECRET</Tag>}</div>
              <p className="text-glow/85">{sel.description}</p>
              <div className="font-display text-xs text-muted">REWARD <span className="text-sys">+{sel.xp} XP</span> · <span className="text-ember">+{sel.gold} G</span></div>
              {state.achievements[sel.id] ? <div className="text-xs text-muted">Unlocked {fmtDateTime(state.achievements[sel.id])}</div> : progress(sel.id) && <div className="text-xs text-muted">Progress: {progress(sel.id)}</div>}
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
