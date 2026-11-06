interface Props { data: { label: string; value: number; hint?: string }[]; height?: number; color?: string; showValues?: boolean }

export default function Bars({ data, height = 120, color = 'rgb(var(--c-primary))', showValues }: Props) {
  const max = Math.max(1, ...data.map((d) => d.value))
  return (
    <div className="w-full">
      <div className="flex items-end gap-1" style={{ height }}>
        {data.map((d, i) => (
          <div key={i} className="group relative flex flex-1 flex-col items-center justify-end" title={d.hint ?? `${d.label}: ${d.value}`}>
            {showValues && d.value > 0 && <span className="mb-1 font-display text-[9px] text-glow/70">{d.value}</span>}
            <div className="w-full bar-track" style={{ height: `${Math.max(2, (d.value / max) * 100)}%` }}>
              <div className="h-full w-full" style={{ background: `linear-gradient(180deg, ${color}, ${color}55)`, boxShadow: `0 0 10px ${color}66` }} />
            </div>
          </div>
        ))}
      </div>
      <div className="mt-1 flex gap-1">
        {data.map((d, i) => (
          <div key={i} className="flex-1 truncate text-center font-display text-[9px] tracking-wider text-muted">{d.label}</div>
        ))}
      </div>
    </div>
  )
}
