import type { HTMLAttributes, ReactNode } from 'react'
import clsx from '../../lib/clsx'

type Tone = 'sys' | 'arcane' | 'ember' | 'danger'

interface Props extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  tone?: Tone
  tag?: string
  title?: ReactNode
  right?: ReactNode
  art?: string
  artHeight?: string
  noPad?: boolean
  sweep?: boolean
}

export default function HoloPanel({ tone = 'sys', tag, title, right, art, artHeight = 'h-32', noPad, sweep, className, children, ...rest }: Props) {
  const toneClass = tone === 'arcane' ? 'holo-arcane' : tone === 'ember' ? 'holo-ember' : tone === 'danger' ? 'holo-danger' : ''
  const tagColor = tone === 'arcane' ? 'bg-arcane/80' : tone === 'ember' ? 'bg-ember/80' : tone === 'danger' ? 'bg-danger/80' : 'bg-sys/80'
  return (
    <div className={clsx('holo clip-panel', toneClass, sweep && 'neon-edge', className)} {...rest}>
      {art && (
        <div className={clsx('relative w-full overflow-hidden', artHeight)}>
          <img src={art} alt="" className="h-full w-full object-cover" loading="lazy" />
          <div className="absolute inset-0 bg-gradient-to-t from-void via-void/40 to-transparent" />
        </div>
      )}
      {(tag || title || right) && (
        <div className={clsx('relative flex items-start justify-between gap-3', noPad ? 'px-4 pt-3' : 'px-4 pt-3')}>
          <div>
            {tag && <div className={clsx('clip-tag mb-1 inline-block px-2 py-0.5 font-display text-[10px] font-bold tracking-[0.3em] text-void', tagColor)}>{tag}</div>}
            {title && <div className="font-display text-sm font-bold tracking-[0.18em] uppercase">{title}</div>}
          </div>
          {right}
        </div>
      )}
      <div className={clsx('relative', !noPad && 'p-4')}>{children}</div>
    </div>
  )
}
