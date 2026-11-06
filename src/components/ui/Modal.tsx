import { AnimatePresence, motion } from 'framer-motion'
import type { ReactNode } from 'react'
import { useEffect } from 'react'
import clsx from '../../lib/clsx'
import { playSfx } from '../../audio'

interface Props { open: boolean; onClose: () => void; title?: ReactNode; tag?: string; children: ReactNode; wide?: boolean; tone?: 'sys' | 'arcane' | 'ember' | 'danger' }

export default function Modal({ open, onClose, title, tag, children, wide, tone = 'sys' }: Props) {
  useEffect(() => {
    if (open) playSfx('open')
  }, [open])
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = '' }
  }, [open, onClose])
  const toneClass = tone === 'arcane' ? 'holo-arcane' : tone === 'ember' ? 'holo-ember' : tone === 'danger' ? 'holo-danger' : ''
  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-[80] flex items-end justify-center sm:items-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <div className="absolute inset-0 bg-void/80 backdrop-blur-sm" onClick={onClose} />
          <motion.div
            className={clsx('holo clip-panel relative max-h-[92vh] w-full overflow-y-auto sm:max-w-lg', wide && 'sm:max-w-3xl', toneClass)}
            initial={{ y: 60, opacity: 0, scale: 0.98 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 40, opacity: 0, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 260, damping: 26 }}
          >
            <div className="sticky top-0 z-10 flex items-start justify-between gap-3 border-b border-sys/20 bg-void/80 px-4 py-3 backdrop-blur">
              <div>
                {tag && <div className="clip-tag mb-1 inline-block bg-sys/80 px-2 py-0.5 font-display text-[10px] font-bold tracking-[0.3em] text-void">{tag}</div>}
                {title && <div className="font-display text-sm font-bold uppercase tracking-[0.18em]">{title}</div>}
              </div>
              <button type="button" onClick={() => { playSfx('press'); onClose() }} aria-label="Close" className="font-display text-xs tracking-widest text-muted hover:text-glow">CLOSE ✕</button>
            </div>
            <div className="relative p-4 safe-bottom">{children}</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
