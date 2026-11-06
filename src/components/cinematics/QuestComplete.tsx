import { motion } from 'framer-motion'
import { useEffect } from 'react'
import type { Cinematic } from '../../game/types'
import { playSfx, speak } from '../../audio'
import MagicCircle from '../ui/MagicCircle'
import Particles from '../ui/Particles'
import NumberTicker from '../ui/NumberTicker'

export default function QuestComplete({ c }: { c: Extract<Cinematic, { kind: 'questComplete' }> }) {
  useEffect(() => {
    playSfx('complete')
    void speak('Quest completed. Rewards have been granted.', 'normal')
  }, [c])
  return (
    <>
      <div className="absolute inset-0 bg-void/80" />
      <Particles mode="burst" density={90} speed={1.4} />
      <MagicCircle size={420} className="absolute opacity-60" />
      <div className="relative mx-4 text-center">
        <motion.div initial={{ opacity: 0, y: 20, letterSpacing: '0.6em' }} animate={{ opacity: 1, y: 0, letterSpacing: '0.3em' }} transition={{ duration: 0.6 }} className="font-display text-2xl font-black text-glow text-glow-sys sm:text-4xl">
          QUEST COMPLETED.
        </motion.div>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.9 }} className="mt-2 font-display text-xs tracking-[0.4em] text-sys">
          REWARDS HAVE BEEN GRANTED.
        </motion.div>
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 1.3 }} className="mt-6 text-lg text-glow/80">{c.questName}</motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.7 }} className="mt-4 flex items-center justify-center gap-8 font-display">
          <div><div className="text-[10px] tracking-[0.3em] text-muted">EXPERIENCE</div><div className="text-2xl font-bold text-sys">+<NumberTicker value={c.xp} /></div></div>
          <div><div className="text-[10px] tracking-[0.3em] text-muted">GOLD</div><div className="text-2xl font-bold text-ember">+<NumberTicker value={c.gold} /></div></div>
        </motion.div>
      </div>
    </>
  )
}
