import { motion } from 'framer-motion'
import { useEffect } from 'react'
import type { Cinematic } from '../../game/types'
import { playSfx, speak } from '../../audio'
import TypeWriter from '../ui/TypeWriter'
import clsx from '../../lib/clsx'

type Notice = Extract<Cinematic, { kind: 'notice' }>

export default function SystemNotice({ c }: { c: Notice }) {
  useEffect(() => {
    playSfx(c.style === 'warning' ? 'warning' : c.style === 'dark' ? 'extract' : c.style === 'epic' ? 'complete' : c.style === 'quest' ? 'accept' : 'open')
    const voiceStyle = c.style === 'warning' ? 'warning' : c.style === 'dark' ? 'dark' : c.style === 'epic' ? 'epic' : 'normal'
    void speak(c.voice ?? `${c.title}. ${c.lines.join('. ')}`, voiceStyle)
  }, [c])
  const tone = c.style === 'warning' ? 'holo-danger' : c.style === 'dark' ? 'holo-arcane' : c.style === 'epic' ? 'holo-ember' : ''
  const tagBg = c.style === 'warning' ? 'bg-danger' : c.style === 'dark' ? 'bg-arcane' : c.style === 'epic' ? 'bg-ember' : 'bg-sys'
  const tag = c.style === 'warning' ? 'WARNING' : c.style === 'quest' ? 'QUEST' : 'SYSTEM'
  return (
    <>
      <div className={clsx('absolute inset-0', c.style === 'warning' ? 'bg-[#2a0008]/70' : 'bg-void/70')} />
      <motion.div
        className={clsx('holo clip-panel neon-edge relative mx-4 w-full max-w-md', tone)}
        initial={{ scaleY: 0.05, opacity: 0, filter: 'blur(10px)' }}
        animate={{ scaleY: 1, opacity: 1, filter: 'blur(0px)' }}
        transition={{ duration: 0.45, ease: [0.2, 0.9, 0.2, 1] }}
      >
        <div className="flex items-center gap-3 border-b border-glow/10 px-5 py-3">
          <span className={clsx('clip-tag px-2 py-0.5 font-display text-[10px] font-bold tracking-[0.35em] text-void', tagBg)}>{tag}</span>
          <span className="font-display text-xs tracking-[0.25em] text-glow/70 animate-flicker">NOTIFICATION</span>
        </div>
        <div className="px-5 py-5">
          <div className={clsx('font-display text-lg font-black tracking-[0.2em] sm:text-xl', c.style === 'warning' ? 'text-danger text-glow-ember' : c.style === 'epic' ? 'text-ember text-glow-ember' : 'text-glow text-glow-sys')}>
            <TypeWriter text={c.title} speed={28} />
          </div>
          <div className="mt-3 space-y-1.5 text-base leading-snug text-glow/90">
            {c.lines.map((l, i) => (
              <motion.p key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.6 + i * 0.35 }}>{l}</motion.p>
            ))}
          </div>
        </div>
      </motion.div>
    </>
  )
}
