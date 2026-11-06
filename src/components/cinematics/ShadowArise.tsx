import { motion } from 'framer-motion'
import { useEffect } from 'react'
import type { Cinematic } from '../../game/types'
import { playSfx, speak } from '../../audio'
import { SHADOWS } from '../../game/content/shadows'
import Particles from '../ui/Particles'
import MagicCircle from '../ui/MagicCircle'

export default function ShadowArise({ c }: { c: Extract<Cinematic, { kind: 'shadowArise' }> }) {
  const def = SHADOWS.find((s) => s.id === c.shadowId)
  useEffect(() => {
    playSfx('arise')
    const t = window.setTimeout(() => void speak('Arise.', 'dark'), 1900)
    const t2 = window.setTimeout(() => void speak(`${def?.name ?? 'A shadow'} has joined your army.`, 'dark'), 4200)
    return () => { window.clearTimeout(t); window.clearTimeout(t2) }
  }, [c, def?.name])
  if (!def) return null
  return (
    <>
      <motion.div className="absolute inset-0 bg-[#020104]" initial={{ opacity: 0 }} animate={{ opacity: 0.98 }} transition={{ duration: 0.8 }} />
      {/* black smoke */}
      <motion.div className="absolute inset-x-0 bottom-0 h-2/3" style={{ background: 'radial-gradient(ellipse at 50% 100%, rgba(20,8,40,0.95), rgba(5,2,10,0.7) 45%, transparent 70%)' }} initial={{ opacity: 0, scaleY: 0.2 }} animate={{ opacity: 1, scaleY: 1 }} transition={{ duration: 1.6, ease: 'easeOut' }} />
      <Particles mode="shadow" density={140} speed={1.3} />
      <motion.div className="absolute bottom-[12%]" initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 0.7 }} transition={{ delay: 0.6, duration: 1.2 }} style={{ transform: 'rotateX(70deg)' }}>
        <MagicCircle size={520} tone="arcane" />
      </motion.div>
      <div className="relative flex h-full w-full flex-col items-center justify-end pb-24">
        <motion.div
          className="relative h-[52vh] w-[70vw] max-w-sm overflow-hidden"
          initial={{ clipPath: 'inset(100% 0 0 0)', opacity: 0, filter: 'blur(12px) brightness(0.2)' }}
          animate={{ clipPath: 'inset(0% 0 0 0)', opacity: 1, filter: 'blur(0px) brightness(1)' }}
          transition={{ delay: 1.9, duration: 2.2, ease: [0.2, 0.8, 0.2, 1] }}
        >
          <img src={def.art} alt="" className="h-full w-full object-cover object-top" style={{ maskImage: 'linear-gradient(180deg, #000 70%, transparent 100%)', WebkitMaskImage: 'linear-gradient(180deg, #000 70%, transparent 100%)' }} />
          <div className="absolute inset-0 bg-gradient-to-t from-[#020104] via-transparent to-transparent" />
        </motion.div>
        <motion.div initial={{ opacity: 0, scale: 3, filter: 'blur(20px)' }} animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }} transition={{ delay: 1.95, duration: 0.5 }} className="absolute top-[14%] font-display text-6xl font-black tracking-[0.5em] text-arcane text-glow-arcane sm:text-8xl">
          ARISE.
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 4.2 }} className="absolute bottom-16 text-center">
          <div className="font-display text-xl font-bold tracking-[0.25em] text-glow">{def.name.toUpperCase()}</div>
          <div className="mt-1 font-display text-[11px] tracking-[0.35em] text-arcane">{def.title.toUpperCase()} · {def.klass.toUpperCase()}</div>
        </motion.div>
      </div>
    </>
  )
}
