import clsx from '../../lib/clsx'

export default function Tag({ children, color, className }: { children: React.ReactNode; color?: string; className?: string }) {
  return (
    <span
      className={clsx('clip-tag inline-block px-2 py-0.5 font-display text-[10px] font-bold uppercase tracking-[0.25em]', className)}
      style={color ? { background: `${color}26`, color, boxShadow: `inset 0 0 0 1px ${color}80` } : undefined}
    >
      {children}
    </span>
  )
}
