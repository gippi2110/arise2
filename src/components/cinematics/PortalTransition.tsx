import { AnimatePresence, motion } from 'framer-motion'
import { useEffect } from 'react'
import { playSfx, speak } from '../../audio'
import MagicCircle from '../ui/MagicCircle'
import Particles from '../ui/Particles'

interface Props { open: boolean; art: string; name: string; rank: string; red?: boolean; onDone: () => void; objectives: string[] }

/** Dungeon entrance: artwork, rank, portal, objectives. */
export default function PortalTransition({ open, art, name, rank, red, onDone, objectives }: Props) {
  useEffect(() => {
    if (!open) return
    playSfx(red ? 'redgate' : 'portal')
    const v = window.setTimeout(() => void speak(red ? 'A red gate has opened. Survive.' : `Entering ${name}. ${rank} rank dungeon. Clear the objectives.`, red ? 'warning' : 'dark'), 900)
    const t = window.setTimeout(onDone, 6200)
    return () => { window.clearTimeout(t); window.clearTimeout(v) }
  }, [open, name, rank, red, onDone])
  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-[95] overflow-hidden bg-void" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, transition: { duration: 0.6 } }} onClick={onDone}>
          <motion.img src={art} alt="" className="absolute inset-0 h-full w-full object-cover" initial={{ scale: 1.25, opacity: 0 }} animate={{ scale: 1, opacity: 0.55 }} transition={{ duration: 5 }} />
          <div className="absolute inset-0 bg-gradient-to-t from-void via-void/40 to-void/70" />
          <Particles mode={red ? 'red' : 'ambient'} density={100} speed={1.4} />
          <motion.div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2" initial={{ scale: 0, rotate: 0 }} animate={{ scale: [0, 1.15, 1], rotate: 180 }} transition={{ duration: 2.4, ease: 'easeOut' }}>
            <MagicCircle size={Math.min(520, window.innerWidth * 1.1)} tone={red ? 'danger' : 'sys'} />
          </motion.div>
          <motion.div className="absolute left-1/2 top-1/2 h-[46vmin] w-[46vmin] -translate-x-1/2 -translate-y-1/2 rounded-full" style={{ background: red ? 'radial-gradient(circle, rgba(255,40,40,0.55), rgba(90,0,10,0.3) 50%, transparent 70%)' : 'radial-gradient(circle, rgba(22,140,255,0.5), rgba(114,21,200,0.3) 50%, transparent 70%)', filter: 'blur(6px)' }} initial={{ scale: 0 }} animate={{ scale: [0, 1.6, 1.2] }} transition={{ duration: 2.2, delay: 0.6 }} />
          <div className="relative flex h-full flex-col items-center justify-center px-6 text-center">
            <motion.div initial={{ opacity: 0, letterSpacing: '0.7em' }} animate={{ opacity: 1, letterSpacing: '0.35em' }} transition={{ delay: 0.3, duration: 1 }} className={`font-display text-xs ${red ? 'text-danger' : 'text-sys'}`}>
              {red ? 'RED GATE DETECTED' : 'GATE OPENING'}
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.2 }} className="mt-3 font-display text-3xl font-black tracking-[0.15em] text-glow text-glow-white sm:text-5xl">
              {name.toUpperCase()}
            </motion.div>
            <motion.div initial={{ opacity: 0, scale: 2 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 1.8, type: 'spring' }} className={`mt-4 clip-panel-sm border px-4 py-1 font-display text-sm font-bold tracking-[0.4em] ${red ? 'border-danger text-danger' : 'border-sys text-sys'}`}>
              RANK {rank}
            </motion.div>
            <motion.ul initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 3.2 }} className="mt-8 space-y-1.5 font-display text-xs tracking-[0.2em] text-glow/85">
              <li className="text-muted">MISSION OBJECTIVES</li>
              {objectives.map((o, i) => (
                <motion.li key={i} initial={{ opacity: 0, x: -14 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 3.4 + i * 0.3 }}>◆ {o}</motion.li>
              ))}
            </motion.ul>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
