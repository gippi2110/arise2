import type { ButtonHTMLAttributes } from 'react'
import clsx from '../../lib/clsx'
import { playSfx } from '../../audio'

type Variant = 'primary' | 'arcane' | 'ember' | 'ghost' | 'danger'
type Size = 'sm' | 'md' | 'lg'

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  silent?: boolean
  block?: boolean
}

const styles: Record<Variant, string> = {
  primary: 'bg-sys/15 text-glow border-sys/60 hover:bg-sys/30 hover:shadow-holo active:bg-sys/40',
  arcane: 'bg-arcane/20 text-glow border-arcane/70 hover:bg-arcane/35 hover:shadow-arcane active:bg-arcane/45',
  ember: 'bg-ember/15 text-glow border-ember/70 hover:bg-ember/30 hover:shadow-ember active:bg-ember/40',
  ghost: 'bg-transparent text-glow/80 border-glow/20 hover:border-glow/50 hover:bg-glow/5',
  danger: 'bg-danger/15 text-glow border-danger/70 hover:bg-danger/30 active:bg-danger/40',
}
const sizes: Record<Size, string> = {
  sm: 'px-3 py-1.5 text-[11px] tracking-[0.2em]',
  md: 'px-4 py-2.5 text-xs tracking-[0.25em]',
  lg: 'px-6 py-3.5 text-sm tracking-[0.3em]',
}

export default function SysButton({ variant = 'primary', size = 'md', silent, block, className, onClick, disabled, children, ...rest }: Props) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={(e) => {
        if (!silent) playSfx(disabled ? 'deny' : 'press')
        onClick?.(e)
      }}
      className={clsx(
        'clip-panel-sm relative inline-flex items-center justify-center gap-2 border font-display font-bold uppercase transition-all duration-150 select-none',
        'disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:shadow-none',
        'active:scale-[0.97]',
        styles[variant], sizes[size], block && 'w-full', className,
      )}
      {...rest}
    >
      {children}
    </button>
  )
}
