import { motion } from 'framer-motion'
import { useEffect } from 'react'
import type { Cinematic } from '../../game/types'
import { playSfx, speak } from '../../audio'
import MagicCircle from '../ui/MagicCircle'
import Particles from '../ui/Particles'
import NumberTicker from '../ui/NumberTicker'

export default function LevelUp({ c }: { c: Extract<Cinematic, { kind: 'levelUp' }> }) {
  useEffect(() => {
    playSfx('levelup')
    const t = window.setTimeout(() => void speak('Level up. Your strength has increased. New stat points available.', 'epic'), 1300)
    return () => window.clearTimeout(t)
  }, [c])
  return (
    <>
      <motion.div className="absolute inset-0 bg-void" initial={{ opacity: 0.6 }} animate={{ opacity: 0.88 }} />
      <motion.div className="absolute inset-0 bg-glow" initial={{ opacity: 0 }} animate={{ opacity: [0, 0, 0.9, 0] }} transition={{ duration: 1.9, times: [0, 0.68, 0.72, 1] }} />
      <Particles mode="burst" density={160} speed={1.6} />
      <motion.div className="absolute" initial={{ scale: 0.2, opacity: 0, rotate: -90 }} animate={{ scale: 1.1, opacity: 0.9, rotate: 0 }} transition={{ duration: 1.4, ease: 'easeOut' }}>
        <MagicCircle size={520} tone="arcane" />
      </motion.div>
      <motion.div className="absolute h-[2px] w-full bg-sys" initial={{ scaleX: 0, opacity: 0 }} animate={{ scaleX: [0, 1, 1], opacity: [0, 1, 0] }} transition={{ duration: 1.4, delay: 1.3 }} />
      <div className="relative mx-4 text-center">
        <motion.div initial={{ opacity: 0, scale: 2.5, filter: 'blur(14px)' }} animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }} transition={{ delay: 1.35, duration: 0.45, ease: 'easeOut' }} className="font-display text-5xl font-black tracking-[0.2em] text-glow text-glow-white sm:text-7xl">
          LEVEL UP!
        </motion.div>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.9 }} className="mt-6 flex items-center justify-center gap-5 font-display">
          <span className="text-3xl text-muted">{c.from}</span>
          <span className="text-sys">→</span>
          <span className="text-6xl font-black text-sys text-glow-sys"><NumberTicker value={c.to} /></span>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 2.5 }} className="mt-6 space-y-1 font-display text-xs tracking-[0.35em] text-glow/85">
          <div>YOUR STRENGTH HAS INCREASED.</div>
          <div className="text-ember">NEW STAT POINTS AVAILABLE: +{c.points}</div>
        </motion.div>
      </div>
    </>
  )
}
