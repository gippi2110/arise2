import { buses, getCtx, isUnlocked, noiseBuffer } from './engine'

export type Scene = 'awakening' | 'dashboard' | 'quests' | 'dungeons' | 'redgate' | 'shadows' | 'status' | 'skills' | 'inventory' | 'achievements' | 'battle' | 'none'

interface SceneDef { notes: number[]; type: OscillatorType; cutoff: number; pulse?: number; airy?: boolean; lfo: number }

const SCENES: Record<Exclude<Scene, 'none'>, SceneDef> = {
  awakening: { notes: [36.7, 55], type: 'sine', cutoff: 200, lfo: 0.05 },
  dashboard: { notes: [73.4, 110, 146.8, 174.6], type: 'sawtooth', cutoff: 420, lfo: 0.08, airy: true },
  quests: { notes: [55, 82.4, 110, 130.8], type: 'sawtooth', cutoff: 380, lfo: 0.07, airy: true },
  dungeons: { notes: [41.2, 61.7, 82.4, 98], type: 'sawtooth', cutoff: 300, pulse: 1.9, lfo: 0.06 },
  battle: { notes: [41.2, 49, 61.7, 82.4], type: 'sawtooth', cutoff: 520, pulse: 0.95, lfo: 0.3 },
  redgate: { notes: [46.2, 49, 69.3, 92.5], type: 'sawtooth', cutoff: 460, pulse: 1.15, lfo: 0.25 },
  shadows: { notes: [34.6, 69.3, 82.4, 103.8], type: 'sawtooth', cutoff: 260, lfo: 0.05 },
  status: { notes: [49, 73.4, 98, 116.5], type: 'triangle', cutoff: 600, lfo: 0.09, airy: true },
  skills: { notes: [61.7, 92.5, 123.5, 146.8], type: 'sawtooth', cutoff: 480, lfo: 0.1, airy: true },
  inventory: { notes: [43.7, 65.4, 87.3, 110], type: 'triangle', cutoff: 520, lfo: 0.07 },
  achievements: { notes: [65.4, 98, 130.8, 164.8], type: 'triangle', cutoff: 700, lfo: 0.08, airy: true },
}

interface Live { gain: GainNode; nodes: AudioScheduledSourceNode[]; timer: number | null }
let current: Live | null = null
let currentScene: Scene = 'none'
let enabled = true

export function setMusicEnabled(on: boolean) {
  enabled = on
  if (!on) stopMusic()
  else if (currentScene !== 'none') {
    const s = currentScene
    currentScene = 'none'
    setScene(s)
  }
}

export function stopMusic() {
  const c = getCtx()
  if (!c || !current) return
  const old = current
  current = null
  const t = c.currentTime
  old.gain.gain.cancelScheduledValues(t)
  old.gain.gain.setTargetAtTime(0.0001, t, 0.8)
  if (old.timer) window.clearInterval(old.timer)
  window.setTimeout(() => old.nodes.forEach((n) => { try { n.stop() } catch { /* already stopped */ } }), 3500)
}

export function setScene(scene: Scene) {
  if (scene === currentScene && current) return
  currentScene = scene
  const c = getCtx()
  if (!c || !enabled || !isUnlocked()) return
  stopMusic()
  if (scene === 'none') return
  const def = SCENES[scene]
  const { music } = buses()
  const t = c.currentTime
  const gain = c.createGain()
  gain.gain.setValueAtTime(0.0001, t)
  gain.gain.exponentialRampToValueAtTime(0.5, t + 3.5)
  const filter = c.createBiquadFilter()
  filter.type = 'lowpass'
  filter.frequency.value = def.cutoff
  filter.Q.value = 1.4
  const lfo = c.createOscillator()
  lfo.frequency.value = def.lfo
  const lfoGain = c.createGain()
  lfoGain.gain.value = def.cutoff * 0.45
  lfo.connect(lfoGain).connect(filter.frequency)
  lfo.start(t)
  const reverbSend = c.createGain()
  reverbSend.gain.value = 0.7
  filter.connect(gain)
  gain.connect(music)
  gain.connect(reverbSend).connect(buses().reverb)
  const nodes: AudioScheduledSourceNode[] = [lfo]
  def.notes.forEach((f, i) => {
    for (const det of [-6, 6]) {
      const o = c.createOscillator()
      o.type = def.type
      o.frequency.value = f
      o.detune.value = det + (i % 2 ? 3 : -3)
      const g = c.createGain()
      g.gain.value = (i === 0 ? 0.16 : 0.08) / def.notes.length
      o.connect(g).connect(filter)
      o.start(t)
      nodes.push(o)
    }
  })
  if (def.airy) {
    const n = c.createBufferSource()
    n.buffer = noiseBuffer()
    n.loop = true
    const nf = c.createBiquadFilter()
    nf.type = 'bandpass'
    nf.frequency.value = 2400
    nf.Q.value = 0.6
    const ng = c.createGain()
    ng.gain.value = 0.012
    n.connect(nf).connect(ng).connect(gain)
    n.start(t)
    nodes.push(n)
  }
  let timer: number | null = null
  if (def.pulse) {
    const pulse = () => {
      if (!current || currentScene !== scene) return
      const now = c.currentTime + 0.02
      const o = c.createOscillator()
      o.type = 'sine'
      o.frequency.setValueAtTime(70, now)
      o.frequency.exponentialRampToValueAtTime(32, now + 0.35)
      const g = c.createGain()
      g.gain.setValueAtTime(0.0001, now)
      g.gain.exponentialRampToValueAtTime(0.5, now + 0.01)
      g.gain.exponentialRampToValueAtTime(0.0001, now + 0.45)
      o.connect(g).connect(gain)
      o.start(now)
      o.stop(now + 0.5)
    }
    timer = window.setInterval(pulse, def.pulse * 1000)
  }
  current = { gain, nodes, timer }
}

export function getScene() {
  return currentScene
}
