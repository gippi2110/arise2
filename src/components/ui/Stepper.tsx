import { useEffect, useState } from 'react'
import { playSfx } from '../../audio'
import clsx from '../../lib/clsx'

interface Props { value: number; max: number; unit: string; onChange: (v: number) => void; disabled?: boolean; step?: number }

/** Progress input used for quests and dungeon objectives: quick steps, direct entry, and a slider. */
export default function Stepper({ value, max, unit, onChange, disabled, step }: Props) {
  const [text, setText] = useState(String(value))
  useEffect(() => setText(String(value)), [value])
  const s = step ?? (max >= 1000 ? 500 : max >= 100 ? 10 : max >= 20 ? 5 : 1)
  const commit = (v: number) => {
    if (disabled) return
    const next = Math.max(0, Math.min(max, Number.isFinite(v) ? v : 0))
    onChange(next)
    playSfx(next >= max ? 'accept' : 'press')
  }
  const btn = 'clip-panel-sm border border-sys/40 bg-sys/10 px-3 py-2 font-display text-xs font-bold hover:bg-sys/25 disabled:opacity-30 active:scale-95'
  return (
    <div className={clsx('flex flex-col gap-2', disabled && 'opacity-60')}>
      <div className="flex items-center gap-2">
        <button type="button" className={btn} disabled={disabled} onClick={() => commit(value - s)}>−{s}</button>
        <input
          className="sys-input flex-1 text-center font-display text-base tabular-nums"
          inputMode="decimal"
          value={text}
          disabled={disabled}
          onChange={(e) => setText(e.target.value)}
          onBlur={() => commit(parseFloat(text))}
          onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur() }}
        />
        <span className="w-14 text-xs text-muted">{unit}</span>
        <button type="button" className={btn} disabled={disabled} onClick={() => commit(value + s)}>+{s}</button>
      </div>
      <input type="range" min={0} max={max} step={max >= 100 ? 1 : 0.5} value={value} disabled={disabled} onChange={(e) => onChange(Number(e.target.value))} onPointerUp={() => playSfx('press')} className="w-full" />
    </div>
  )
}
