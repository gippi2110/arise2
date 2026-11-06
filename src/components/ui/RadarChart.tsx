import { motion } from 'framer-motion'

interface Props { values: { label: string; value: number }[]; max?: number; size?: number }

export default function RadarChart({ values, max, size = 280 }: Props) {
  const n = values.length
  const cx = size / 2, cy = size / 2, r = size * 0.38
  const m = max ?? Math.max(20, ...values.map((v) => v.value)) * 1.1
  const pt = (i: number, f: number) => {
    const a = -Math.PI / 2 + (i / n) * Math.PI * 2
    return [cx + Math.cos(a) * r * f, cy + Math.sin(a) * r * f] as const
  }
  const poly = values.map((v, i) => pt(i, Math.min(1, v.value / m)).join(',')).join(' ')
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="mx-auto block overflow-visible">
      {[0.25, 0.5, 0.75, 1].map((f) => (
        <polygon key={f} points={values.map((_, i) => pt(i, f).join(',')).join(' ')} fill="none" stroke="rgb(var(--c-primary))" strokeOpacity={0.18 + f * 0.1} strokeWidth="1" />
      ))}
      {values.map((_, i) => {
        const [x, y] = pt(i, 1)
        return <line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke="rgb(var(--c-primary))" strokeOpacity="0.2" />
      })}
      <motion.polygon
        points={poly}
        fill="rgb(var(--c-primary))"
        fillOpacity="0.22"
        stroke="rgb(var(--c-primary))"
        strokeWidth="2"
        style={{ filter: 'drop-shadow(0 0 8px rgb(var(--c-primary)))' }}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 90, damping: 16 }}
        transform-origin={`${cx} ${cy}`}
      />
      {values.map((v, i) => {
        const [x, y] = pt(i, 1.17)
        const [px, py] = pt(i, Math.min(1, v.value / m))
        return (
          <g key={v.label}>
            <circle cx={px} cy={py} r="3" fill="rgb(var(--c-text))" />
            <text x={x} y={y} textAnchor="middle" dominantBaseline="middle" className="font-display" fontSize="10" fill="rgb(var(--c-text))" fillOpacity="0.85" letterSpacing="2">{v.label}</text>
            <text x={x} y={y + 12} textAnchor="middle" dominantBaseline="middle" fontSize="11" fill="rgb(var(--c-primary))" fontWeight="700">{v.value}</text>
          </g>
        )
      })}
    </svg>
  )
}
