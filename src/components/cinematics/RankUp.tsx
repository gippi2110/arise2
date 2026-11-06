import { motion } from 'framer-motion'
import { useEffect } from 'react'
import type { Cinematic } from '../../game/types'
import { playSfx, speak } from '../../audio'
import { RANK_META } from '../../game/content/ranks'
import MagicCircle from '../ui/MagicCircle'
import Particles from '../ui/Particles'

export default function RankUp({ c }: { c: Extract<Cinematic, { kind: 'rankUp' }> }) {
  const meta = RANK_META[c.to]
  useEffect(() => {
    playSfx('rank')
    const t = window.setTimeout(() => void speak(`Your rank has increased. You are now ${meta.title}.`, 'epic'), 1500)
    return () => window.clearTimeout(t)
  }, [c, meta.title])
  return (
    <>
      <div className="absolute inset-0 bg-void/92" />
      <motion.div className="absolute inset-0" style={{ background: `radial-gradient(circle at center, ${meta.color}55, transparent 60%)` }} initial={{ opacity: 0, scale: 0.4 }} animate={{ opacity: [0, 0, 1, 0.5], scale: [0.4, 0.4, 1.6, 1.2] }} transition={{ duration: 3, times: [0, 0.35, 0.45, 1] }} />
      <Particles mode="ember" density={120} speed={1.2} />
      <motion.div className="absolute" initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 0.8 }} transition={{ duration: 1.3 }}>
        <MagicCircle size={560} tone="ember" />
      </motion.div>
      <div className="relative mx-4 flex flex-col items-center text-center">
        <motion.div initial={{ opacity: 0, letterSpacing: '0.8em' }} animate={{ opacity: 1, letterSpacing: '0.4em' }} transition={{ duration: 1.1 }} className="font-display text-xs text-ember">
          RANK PROMOTION
        </motion.div>
        <motion.div className="relative mt-5 h-48 w-48 sm:h-60 sm:w-60" initial={{ scale: 0, rotate: -40, opacity: 0 }} animate={{ scale: 1, rotate: 0, opacity: 1 }} transition={{ delay: 1.1, type: 'spring', stiffness: 120, damping: 14 }}>
          <img src={meta.art} alt="" className="h-full w-full rounded-full object-cover" style={{ boxShadow: `0 0 60px ${meta.color}aa, 0 0 0 2px ${meta.color}` }} />
          <div className="absolute inset-0 flex items-center justify-center font-display text-7xl font-black text-glow text-glow-white">{meta.label}</div>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.9 }} className="mt-6 font-display text-2xl font-black tracking-[0.2em] text-glow text-glow-ember sm:text-3xl">
          {meta.title.toUpperCase()}
        </motion.div>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2.6 }} className="mt-3 flex items-center gap-4 font-display text-sm text-muted">
          <span>{RANK_META[c.from].label}-RANK</span><span className="text-ember">→</span><span className="text-glow">{meta.label}-RANK</span>
        </motion.div>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 3.2 }} className="mt-4 max-w-sm text-sm text-glow/80">
          Unlocked: {meta.unlocks}
        </motion.div>
      </div>
    </>
  )
}
