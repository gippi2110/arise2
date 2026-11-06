import { motion, type Variants } from 'framer-motion'
import { useEffect, type ReactNode } from 'react'
import { playSfx, type SfxName } from '../audio'

export type IntroKind = 'materialize' | 'glow' | 'portal' | 'red' | 'shadows' | 'assemble' | 'skills' | 'inventory' | 'achievements' | 'plain'

const variants: Record<IntroKind, Variants> = {
  materialize: { hidden: { opacity: 0, scale: 0.96, filter: 'blur(14px) brightness(2)' }, show: { opacity: 1, scale: 1, filter: 'blur(0px) brightness(1)', transition: { duration: 0.7, ease: [0.2, 0.8, 0.2, 1] } } },
  glow: { hidden: { opacity: 0, y: 18, textShadow: '0 0 40px rgb(22,140,255)' }, show: { opacity: 1, y: 0, transition: { duration: 0.6, staggerChildren: 0.08 } } },
  portal: { hidden: { opacity: 0, clipPath: 'circle(0% at 50% 40%)' }, show: { opacity: 1, clipPath: 'circle(140% at 50% 40%)', transition: { duration: 1.1, ease: [0.3, 0.9, 0.2, 1] } } },
  red: { hidden: { opacity: 0, clipPath: 'inset(50% 0 50% 0)' }, show: { opacity: 1, clipPath: 'inset(0% 0 0% 0)', transition: { duration: 0.8, ease: 'easeOut' } } },
  shadows: { hidden: { opacity: 0, y: 60, filter: 'brightness(0.1) blur(6px)' }, show: { opacity: 1, y: 0, filter: 'brightness(1) blur(0px)', transition: { duration: 1, ease: 'easeOut' } } },
  assemble: { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.09, delayChildren: 0.1 } } },
  skills: { hidden: { opacity: 0, rotate: -3, scale: 0.9 }, show: { opacity: 1, rotate: 0, scale: 1, transition: { type: 'spring', stiffness: 120, damping: 16 } } },
  inventory: { hidden: { opacity: 0, x: 80, clipPath: 'inset(0 0 0 100%)' }, show: { opacity: 1, x: 0, clipPath: 'inset(0 0 0 0%)', transition: { duration: 0.7, ease: [0.2, 0.8, 0.2, 1] } } },
  achievements: { hidden: { opacity: 0, scale: 1.1, filter: 'brightness(3)' }, show: { opacity: 1, scale: 1, filter: 'brightness(1)', transition: { duration: 0.8 } } },
  plain: { hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0, transition: { duration: 0.35 } } },
}

export const childVariants: Variants = {
  hidden: { opacity: 0, x: -24, filter: 'blur(4px)' },
  show: { opacity: 1, x: 0, filter: 'blur(0px)', transition: { duration: 0.45 } },
}

const sfx: Record<IntroKind, SfxName | null> = {
  materialize: 'open', glow: 'accept', portal: 'portal', red: 'redgate', shadows: 'extract', assemble: 'open', skills: 'skill', inventory: 'open', achievements: 'coin', plain: null,
}

export default function SectionIntro({ kind, children, label }: { kind: IntroKind; children: ReactNode; label?: string }) {
  useEffect(() => {
    const s = sfx[kind]
    if (s) playSfx(s)
  }, [kind])
  return (
    <motion.div variants={variants[kind]} initial="hidden" animate="show" className="relative">
      {kind === 'red' && <motion.div className="pointer-events-none fixed inset-0 z-[5] bg-danger" initial={{ opacity: 0.6 }} animate={{ opacity: 0 }} transition={{ duration: 1.2 }} />}
      {kind === 'portal' && <motion.div className="pointer-events-none fixed inset-0 z-[5] bg-sys" initial={{ opacity: 0.35 }} animate={{ opacity: 0 }} transition={{ duration: 0.9 }} />}
      {label && (
        <motion.div initial={{ opacity: 0, letterSpacing: '0.9em' }} animate={{ opacity: 1, letterSpacing: '0.45em' }} transition={{ duration: 0.9 }} className="mb-3 font-display text-[10px] uppercase text-sys">
          {label}
        </motion.div>
      )}
      {children}
    </motion.div>
  )
}
