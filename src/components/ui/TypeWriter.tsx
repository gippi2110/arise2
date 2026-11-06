import { useEffect, useState } from 'react'
import { playSfx } from '../../audio'

interface Props { text: string; speed?: number; delay?: number; className?: string; onDone?: () => void; sound?: boolean }

export default function TypeWriter({ text, speed = 38, delay = 0, className, onDone, sound = true }: Props) {
  const [n, setN] = useState(0)
  useEffect(() => {
    setN(0)
    let i = 0
    let timer: number
    const start = window.setTimeout(() => {
      timer = window.setInterval(() => {
        i += 1
        setN(i)
        if (sound && i % 2 === 0 && text[i - 1] !== ' ') playSfx('type')
        if (i >= text.length) {
          window.clearInterval(timer)
          onDone?.()
        }
      }, speed)
    }, delay)
    return () => { window.clearTimeout(start); window.clearInterval(timer) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text])
  return (
    <span className={className}>
      {text.slice(0, n)}
      {n < text.length && <span className="animate-pulseGlow">▌</span>}
    </span>
  )
}
