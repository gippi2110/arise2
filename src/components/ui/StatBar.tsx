import { motion } from 'framer-motion'
import clsx from '../../lib/clsx'

interface Props {
  label?: string
  value: number
  max: number
  color?: 'sys' | 'arcane' | 'ember' | 'danger' | 'hp' | 'mp' | string
  height?: string
  showNumbers?: boolean
  suffix?: string
  className?: string
}

const colorMap: Record<string, string> = {
  sys: 'linear-gradient(90deg, rgb(var(--c-primary)), rgb(var(--c-text)))',
  arcane: 'linear-gradient(90deg, rgb(var(--c-secondary)), rgb(var(--c-primary)))',
  ember: 'linear-gradient(90deg, rgb(var(--c-accent)), #ffd166)',
  danger: 'linear-gradient(90deg, #8a0f1f, rgb(var(--c-danger)))',
  hp: 'linear-gradient(90deg, #c2183a, #ff5c7a)',
  mp: 'linear-gradient(90deg, rgb(var(--c-primary)), #7fd1ff)',
}

export default function StatBar({ label, value, max, color = 'sys', height = 'h-2', showNumbers = true, suffix = '', className }: Props) {
  const pct = max > 0 ? Math.max(0, Math.min(100, (value / max) * 100)) : 0
  return (
    <div className={className}>
      {(label || showNumbers) && (
        <div className="mb-1 flex items-baseline justify-between text-xs">
          {label && <span className="font-display tracking-[0.2em] text-muted">{label}</span>}
          {showNumbers && (
            <span className="font-display tabular-nums text-glow/90">
              {Math.round(value).toLocaleString()}<span className="text-muted"> / {Math.round(max).toLocaleString()}{suffix}</span>
            </span>
          )}
        </div>
      )}
      <div className={clsx('bar-track w-full overflow-hidden', height)}>
        <motion.div
          className={clsx('bar-fill h-full', height)}
          style={{ background: colorMap[color] ?? color }}
          initial={false}
          animate={{ width: `${pct}%` }}
          transition={{ type: 'spring', stiffness: 80, damping: 20 }}
        />
      </div>
    </div>
  )
}
