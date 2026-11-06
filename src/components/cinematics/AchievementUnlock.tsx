import { motion } from 'framer-motion'
import { useEffect } from 'react'
import type { Cinematic } from '../../game/types'
import { playSfx, speak } from '../../audio'
import { ACHIEVEMENT_BY_ID } from '../../game/content/achievements'
import Particles from '../ui/Particles'

export default function AchievementUnlock({ c }: { c: Extract<Cinematic, { kind: 'achievement' }> }) {
  const def = ACHIEVEMENT_BY_ID[c.achievementId]
  useEffect(() => {
    playSfx('achievement')
    const t = window.setTimeout(() => void speak(`Achievement unlocked. ${def?.name ?? ''}.`, 'epic'), 600)
    return () => window.clearTimeout(t)
  }, [c, def?.name])
  if (!def) return null
  return (
    <>
      <div className="absolute inset-0 bg-void/85" />
      <Particles mode="ember" density={70} />
      <motion.div className="holo clip-panel holo-ember relative mx-4 flex w-full max-w-md items-center gap-4 p-4" initial={{ y: -80, opacity: 0, rotateX: 40 }} animate={{ y: 0, opacity: 1, rotateX: 0 }} transition={{ type: 'spring', stiffness: 160, damping: 16, delay: 0.3 }}>
        <motion.img src={def.art} alt="" className="h-24 w-24 flex-none object-cover clip-panel-sm" initial={{ scale: 0, rotate: -30 }} animate={{ scale: 1, rotate: 0 }} transition={{ delay: 0.6, type: 'spring' }} style={{ boxShadow: '0 0 30px rgb(var(--c-accent) / 0.6)' }} />
        <div>
          <div className="font-display text-[10px] tracking-[0.4em] text-ember">ACHIEVEMENT UNLOCKED</div>
          <div className="mt-1 font-display text-lg font-black tracking-[0.15em] text-glow text-glow-ember">{def.name.toUpperCase()}</div>
          <div className="mt-1 text-sm text-glow/80">{def.description}</div>
          <div className="mt-2 font-display text-xs text-muted">+{def.xp} XP · +{def.gold} gold</div>
        </div>
      </motion.div>
    </>
  )
}
