import { useEffect, useRef } from 'react'

type Mode = 'ambient' | 'shadow' | 'red' | 'ember' | 'burst'

interface Props { mode?: Mode; density?: number; className?: string; speed?: number }

interface P { x: number; y: number; vx: number; vy: number; r: number; life: number; max: number; hue: number }

export default function Particles({ mode = 'ambient', density = 60, className, speed = 1 }: Props) {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const reduce = document.documentElement.getAttribute('data-motion') === 'reduce'
    let raf = 0
    let w = 0, h = 0
    const dpr = Math.min(2, window.devicePixelRatio || 1)
    const ps: P[] = []
    const resize = () => {
      const rect = canvas.getBoundingClientRect()
      w = rect.width; h = rect.height
      canvas.width = w * dpr; canvas.height = h * dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(canvas)
    const palette = () => {
      if (mode === 'red') return [0, 350, 15][Math.floor(Math.random() * 3)]
      if (mode === 'ember') return [25, 35, 15][Math.floor(Math.random() * 3)]
      if (mode === 'shadow') return [270, 280, 265][Math.floor(Math.random() * 3)]
      return Math.random() < 0.6 ? 212 : 270
    }
    const spawn = (): P => {
      const max = 240 + Math.random() * 300
      if (mode === 'shadow' || mode === 'burst') {
        return { x: w * 0.5 + (Math.random() - 0.5) * w * (mode === 'burst' ? 0.1 : 0.8), y: mode === 'burst' ? h * 0.55 : h + 10, vx: (Math.random() - 0.5) * (mode === 'burst' ? 4 : 0.4), vy: mode === 'burst' ? -(1 + Math.random() * 5) : -(0.4 + Math.random() * 1.2), r: 1 + Math.random() * 3, life: 0, max, hue: palette() }
      }
      return { x: Math.random() * w, y: Math.random() * h, vx: (Math.random() - 0.5) * 0.25, vy: -(0.15 + Math.random() * 0.45), r: 0.6 + Math.random() * 2, life: Math.random() * max, max, hue: palette() }
    }
    const count = reduce ? Math.floor(density / 3) : density
    for (let i = 0; i < count; i++) ps.push(spawn())
    const draw = () => {
      ctx.clearRect(0, 0, w, h)
      ctx.globalCompositeOperation = 'lighter'
      for (let i = 0; i < ps.length; i++) {
        const p = ps[i]
        p.life += speed
        p.x += p.vx * speed + Math.sin((p.life + i) * 0.02) * 0.2
        p.y += p.vy * speed
        if (mode === 'burst') p.vy += 0.03
        const t = p.life / p.max
        const a = Math.sin(Math.PI * Math.min(1, t)) * 0.9
        if (t >= 1 || p.y < -20 || p.x < -20 || p.x > w + 20) { ps[i] = spawn(); continue }
        const sat = mode === 'shadow' ? 70 : 95
        const light = mode === 'shadow' ? 45 : 65
        const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 4)
        grad.addColorStop(0, `hsla(${p.hue},${sat}%,${light}%,${a})`)
        grad.addColorStop(1, `hsla(${p.hue},${sat}%,${light}%,0)`)
        ctx.fillStyle = grad
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.r * 4, 0, Math.PI * 2)
        ctx.fill()
      }
      raf = requestAnimationFrame(draw)
    }
    if (reduce) {
      draw()
      cancelAnimationFrame(raf)
    } else raf = requestAnimationFrame(draw)
    return () => { cancelAnimationFrame(raf); ro.disconnect() }
  }, [mode, density, speed])
  return <canvas ref={ref} className={className ?? 'pointer-events-none absolute inset-0 h-full w-full'} aria-hidden />
}
