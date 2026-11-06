import { AnimatePresence, motion } from 'framer-motion'
import { useCallback, useEffect, useMemo, useRef } from 'react'
import { useGame } from '../../store/game'
import type { Cinematic } from '../../game/types'
import SystemNotice from './SystemNotice'
import QuestComplete from './QuestComplete'
import LevelUp from './LevelUp'
import RankUp from './RankUp'
import ShadowArise from './ShadowArise'
import AchievementUnlock from './AchievementUnlock'

/** Plays queued cinematics one at a time. Tap anywhere to advance. */
export default function CinematicLayer() {
  const queue = useGame((s) => s.state.cinematics)
  const mutate = useGame((s) => s.mutate)
  const current = queue[0]
  const timer = useRef<number | null>(null)

  const advance = useCallback(() => {
    if (timer.current) window.clearTimeout(timer.current)
    timer.current = null
    mutate((d) => { d.cinematics.shift() }, { silent: true })
  }, [mutate])

  const duration = useMemo(() => (current ? durationFor(current) : 0), [current])

  useEffect(() => {
    if (!current) return
    timer.current = window.setTimeout(advance, duration)
    return () => { if (timer.current) window.clearTimeout(timer.current) }
  }, [current, duration, advance])

  return (
    <AnimatePresence>
      {current && (
        <motion.div
          key={current.id}
          className="fixed inset-0 z-[100] flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.35 } }}
          onClick={advance}
          role="dialog"
          aria-live="assertive"
        >
          {current.kind === 'notice' && <SystemNotice c={current} />}
          {current.kind === 'questComplete' && <QuestComplete c={current} />}
          {current.kind === 'levelUp' && <LevelUp c={current} />}
          {current.kind === 'rankUp' && <RankUp c={current} />}
          {current.kind === 'shadowArise' && <ShadowArise c={current} />}
          {current.kind === 'achievement' && <AchievementUnlock c={current} />}
          <div className="pointer-events-none absolute bottom-6 left-0 right-0 text-center font-display text-[10px] tracking-[0.4em] text-glow/40 safe-bottom">TAP TO CONTINUE</div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

function durationFor(c: Cinematic) {
  switch (c.kind) {
    case 'notice': return 3800 + c.lines.join(' ').length * 28
    case 'questComplete': return 4200
    case 'levelUp': return 6200
    case 'rankUp': return 7000
    case 'shadowArise': return 7500
    case 'achievement': return 4800
  }
}
