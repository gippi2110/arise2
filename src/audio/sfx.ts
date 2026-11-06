import { buses, getCtx, isUnlocked, noiseBuffer } from './engine'

export type SfxName =
  | 'press' | 'open' | 'accept' | 'complete' | 'levelup' | 'rank' | 'portal' | 'bossDefeat' | 'extract' | 'warning'
  | 'hit' | 'crit' | 'hurt' | 'heartbeat' | 'type' | 'achievement' | 'arise' | 'deny' | 'skill' | 'potion' | 'coin' | 'redgate'

interface Env { a?: number; d: number; peak: number; end?: number }

function env(g: GainNode, t: number, e: Env) {
  const a = e.a ?? 0.005
  g.gain.cancelScheduledValues(t)
  g.gain.setValueAtTime(0.0001, t)
  g.gain.exponentialRampToValueAtTime(Math.max(0.0001, e.peak), t + a)
  g.gain.exponentialRampToValueAtTime(Math.max(0.0001, e.end ?? 0.0001), t + a + e.d)
}

function tone(type: OscillatorType, f0: number, f1: number, t: number, e: Env, dest: AudioNode, filter?: { type: BiquadFilterType; f0: number; f1?: number; q?: number }, detune = 0) {
  const c = getCtx()!
  const o = c.createOscillator()
  o.type = type
  o.detune.value = detune
  o.frequency.setValueAtTime(f0, t)
  if (f1 !== f0) o.frequency.exponentialRampToValueAtTime(Math.max(1, f1), t + (e.a ?? 0.005) + e.d)
  const g = c.createGain()
  env(g, t, e)
  let node: AudioNode = o
  if (filter) {
    const fl = c.createBiquadFilter()
    fl.type = filter.type
    fl.Q.value = filter.q ?? 1
    fl.frequency.setValueAtTime(filter.f0, t)
    if (filter.f1) fl.frequency.exponentialRampToValueAtTime(filter.f1, t + e.d)
    node.connect(fl)
    node = fl
  }
  node.connect(g).connect(dest)
  o.start(t)
  o.stop(t + (e.a ?? 0.005) + e.d + 0.05)
}

function noise(t: number, e: Env, dest: AudioNode, filter: { type: BiquadFilterType; f0: number; f1?: number; q?: number }, distort = false) {
  const c = getCtx()!
  const src = c.createBufferSource()
  src.buffer = noiseBuffer()
  src.loop = true
  const fl = c.createBiquadFilter()
  fl.type = filter.type
  fl.Q.value = filter.q ?? 1
  fl.frequency.setValueAtTime(filter.f0, t)
  if (filter.f1) fl.frequency.exponentialRampToValueAtTime(filter.f1, t + e.d)
  const g = c.createGain()
  env(g, t, e)
  let node: AudioNode = fl
  if (distort) {
    const ws = c.createWaveShaper()
    const curve = new Float32Array(256)
    for (let i = 0; i < 256; i++) {
      const x = (i / 128) - 1
      curve[i] = Math.tanh(x * 3)
    }
    ws.curve = curve
    fl.connect(ws)
    node = ws
  }
  src.connect(fl)
  node.connect(g).connect(dest)
  src.start(t)
  src.stop(t + (e.a ?? 0.005) + e.d + 0.05)
}

function send(dest: AudioNode, amount: number) {
  const c = getCtx()!
  const g = c.createGain()
  g.gain.value = amount
  g.connect(buses().reverb)
  const merge = c.createGain()
  merge.connect(dest)
  merge.connect(g)
  return merge
}

const chordUp = (root: number, intervals: number[]) => intervals.map((i) => root * Math.pow(2, i / 12))

export function playSfx(name: SfxName) {
  const c = getCtx()
  if (!c || !isUnlocked()) return
  const { sfx } = buses()
  const t = c.currentTime + 0.01
  const wet = send(sfx, 0.5)
  const dry = sfx
  switch (name) {
    case 'press':
      tone('sine', 120, 58, t, { d: 0.13, peak: 0.5 }, dry)
      noise(t, { d: 0.05, peak: 0.22 }, dry, { type: 'bandpass', f0: 1900, q: 5 })
      noise(t + 0.02, { d: 0.09, peak: 0.12 }, dry, { type: 'lowpass', f0: 500 })
      break
    case 'open':
      tone('sawtooth', 170, 760, t, { a: 0.02, d: 0.34, peak: 0.16 }, wet, { type: 'lowpass', f0: 900, f1: 3200, q: 2 })
      tone('sine', 1318, 1318, t + 0.12, { d: 0.4, peak: 0.07 }, wet)
      tone('sine', 1975, 1975, t + 0.2, { d: 0.45, peak: 0.05 }, wet)
      noise(t, { d: 0.3, peak: 0.08 }, wet, { type: 'highpass', f0: 4000 })
      break
    case 'type':
      tone('sine', 1400, 1050, t, { d: 0.045, peak: 0.07 }, dry)
      break
    case 'accept':
      tone('sine', 523, 523, t, { d: 0.16, peak: 0.22 }, wet)
      tone('triangle', 527, 527, t, { d: 0.16, peak: 0.1 }, wet)
      tone('sine', 784, 784, t + 0.14, { d: 0.32, peak: 0.22 }, wet)
      tone('triangle', 790, 790, t + 0.14, { d: 0.32, peak: 0.1 }, wet)
      break
    case 'coin':
      tone('sine', 1568, 1568, t, { d: 0.12, peak: 0.14 }, wet)
      tone('sine', 2093, 2093, t + 0.07, { d: 0.25, peak: 0.12 }, wet)
      break
    case 'complete':
      tone('sine', 170, 42, t, { d: 0.75, peak: 0.6 }, dry)
      noise(t, { d: 0.28, peak: 0.32 }, wet, { type: 'lowpass', f0: 2500, f1: 300 })
      for (const [i, f] of chordUp(523.25, [0, 4, 7, 12]).entries()) tone('triangle', f, f, t + 0.05 + i * 0.03, { a: 0.02, d: 1.3, peak: 0.11 }, wet)
      break
    case 'achievement':
      tone('sawtooth', 80, 1600, t, { a: 0.02, d: 0.5, peak: 0.1 }, wet, { type: 'lowpass', f0: 400, f1: 5000 })
      tone('sine', 180, 40, t + 0.45, { d: 0.9, peak: 0.6 }, dry)
      for (const [i, f] of chordUp(392, [0, 4, 7, 12, 16]).entries()) tone('triangle', f, f, t + 0.45 + i * 0.04, { a: 0.02, d: 1.8, peak: 0.1 }, wet)
      noise(t + 0.45, { d: 1.6, peak: 0.12 }, wet, { type: 'highpass', f0: 5000 })
      break
    case 'levelup': {
      tone('sawtooth', 110, 1400, t, { a: 0.05, d: 1.3, peak: 0.14 }, wet, { type: 'lowpass', f0: 500, f1: 6000, q: 3 })
      noise(t, { a: 0.6, d: 0.8, peak: 0.2 }, wet, { type: 'bandpass', f0: 400, f1: 6000, q: 1.5 })
      const hit = t + 1.35
      tone('sine', 190, 34, hit, { d: 1.0, peak: 0.75 }, dry)
      noise(hit, { d: 0.5, peak: 0.45 }, wet, { type: 'lowpass', f0: 3000, f1: 200 }, true)
      chordUp(261.6, [0, 4, 7, 12, 16, 19, 24, 28]).forEach((f, i) => tone('triangle', f, f, hit + 0.05 + i * 0.07, { a: 0.01, d: 1.4, peak: 0.09 }, wet))
      break
    }
    case 'rank': {
      const root = 55
      for (const [i, f] of chordUp(root, [0, 7, 12, 19, 24]).entries()) {
        tone('sawtooth', f, f, t, { a: 1.1, d: 1.6, peak: 0.08 }, wet, { type: 'lowpass', f0: 300, f1: 2400 }, -8 + i * 4)
        tone('sawtooth', f, f, t, { a: 1.1, d: 1.6, peak: 0.08 }, wet, { type: 'lowpass', f0: 300, f1: 2400 }, 8 - i * 4)
      }
      tone('sine', 110, 30, t + 1.1, { d: 1.6, peak: 0.8 }, dry)
      noise(t + 1.1, { d: 2.6, peak: 0.16 }, wet, { type: 'highpass', f0: 6000 })
      noise(t + 1.1, { d: 0.5, peak: 0.4 }, wet, { type: 'lowpass', f0: 1800, f1: 150 }, true)
      break
    }
    case 'portal':
      tone('sine', 48, 48, t, { a: 0.4, d: 2.2, peak: 0.45 }, dry)
      tone('sawtooth', 96, 96, t, { a: 0.5, d: 2.2, peak: 0.12 }, wet, { type: 'lowpass', f0: 180, f1: 900, q: 6 })
      tone('sawtooth', 96, 96, t, { a: 0.5, d: 2.2, peak: 0.12 }, wet, { type: 'lowpass', f0: 180, f1: 900, q: 6 }, 9)
      noise(t, { a: 0.8, d: 1.6, peak: 0.3 }, wet, { type: 'bandpass', f0: 200, f1: 5000, q: 2 })
      tone('sine', 1760, 880, t + 1.6, { d: 0.9, peak: 0.06 }, wet)
      break
    case 'redgate':
      tone('sawtooth', 46, 46, t, { a: 0.3, d: 2.4, peak: 0.2 }, wet, { type: 'lowpass', f0: 160, f1: 700, q: 8 })
      tone('sawtooth', 49, 49, t, { a: 0.3, d: 2.4, peak: 0.2 }, wet, { type: 'lowpass', f0: 160, f1: 700, q: 8 })
      tone('sine', 80, 28, t + 0.2, { d: 1.6, peak: 0.7 }, dry)
      noise(t, { a: 0.6, d: 2.0, peak: 0.35 }, wet, { type: 'bandpass', f0: 150, f1: 2500, q: 1 }, true)
      break
    case 'bossDefeat':
      tone('sine', 130, 26, t, { d: 1.5, peak: 0.85 }, dry)
      noise(t, { d: 1.3, peak: 0.5 }, wet, { type: 'lowpass', f0: 900, f1: 80 }, true)
      noise(t + 0.05, { d: 0.25, peak: 0.3 }, dry, { type: 'highpass', f0: 2000 })
      tone('square', 55, 27, t + 0.1, { d: 1.2, peak: 0.18 }, wet, { type: 'lowpass', f0: 200 })
      break
    case 'extract':
    case 'arise': {
      tone('sawtooth', 36, 36, t, { a: 0.8, d: 2.6, peak: 0.22 }, wet, { type: 'lowpass', f0: 140, f1: 420, q: 7 })
      tone('sawtooth', 54.4, 54.4, t, { a: 0.8, d: 2.6, peak: 0.18 }, wet, { type: 'lowpass', f0: 140, f1: 420, q: 7 }, 6)
      noise(t, { a: 1.4, d: 1.2, peak: 0.28 }, wet, { type: 'bandpass', f0: 3000, f1: 180, q: 3 })
      tone('sine', 440, 215, t + 0.4, { a: 0.3, d: 1.8, peak: 0.07 }, wet)
      if (name === 'arise') {
        tone('sine', 64, 30, t + 1.9, { d: 1.6, peak: 0.9 }, dry)
        noise(t + 1.9, { d: 2.2, peak: 0.25 }, wet, { type: 'bandpass', f0: 420, q: 9 })
        noise(t + 1.9, { d: 0.5, peak: 0.4 }, wet, { type: 'lowpass', f0: 1200, f1: 120 }, true)
      }
      break
    }
    case 'warning':
      tone('square', 55, 52, t, { d: 0.26, peak: 0.26 }, wet, { type: 'lowpass', f0: 380 })
      tone('square', 55, 52, t + 0.46, { d: 0.26, peak: 0.26 }, wet, { type: 'lowpass', f0: 380 })
      tone('sine', 466, 466, t, { a: 0.05, d: 0.9, peak: 0.07 }, wet)
      tone('sine', 494, 494, t, { a: 0.05, d: 0.9, peak: 0.07 }, wet)
      tone('sine', 90, 40, t, { d: 0.5, peak: 0.5 }, dry)
      break
    case 'deny':
      tone('square', 220, 110, t, { d: 0.28, peak: 0.14 }, wet, { type: 'lowpass', f0: 800 })
      tone('sine', 110, 55, t, { d: 0.3, peak: 0.3 }, dry)
      break
    case 'hit':
      noise(t, { d: 0.09, peak: 0.42 }, dry, { type: 'bandpass', f0: 900, q: 1 })
      tone('sine', 220, 70, t, { d: 0.12, peak: 0.35 }, dry)
      break
    case 'crit':
      noise(t, { d: 0.18, peak: 0.5 }, wet, { type: 'bandpass', f0: 1500, f1: 300, q: 1 })
      tone('sine', 260, 60, t, { d: 0.22, peak: 0.5 }, dry)
      tone('sine', 1760, 1760, t + 0.02, { d: 0.35, peak: 0.12 }, wet)
      tone('sine', 2637, 2637, t + 0.05, { d: 0.3, peak: 0.08 }, wet)
      break
    case 'hurt':
      noise(t, { d: 0.26, peak: 0.45 }, dry, { type: 'lowpass', f0: 320 })
      tone('sine', 95, 48, t, { d: 0.32, peak: 0.5 }, dry)
      tone('sawtooth', 70, 50, t, { d: 0.2, peak: 0.1 }, wet, { type: 'lowpass', f0: 250 })
      break
    case 'heartbeat':
      tone('sine', 52, 40, t, { d: 0.16, peak: 0.7 }, dry)
      tone('sine', 52, 38, t + 0.3, { d: 0.2, peak: 0.55 }, dry)
      break
    case 'skill':
      tone('sawtooth', 300, 1200, t, { a: 0.02, d: 0.3, peak: 0.12 }, wet, { type: 'bandpass', f0: 600, f1: 3000, q: 3 })
      tone('sine', 880, 1760, t + 0.1, { d: 0.4, peak: 0.1 }, wet)
      noise(t, { d: 0.35, peak: 0.12 }, wet, { type: 'highpass', f0: 3000 })
      tone('sine', 140, 60, t + 0.05, { d: 0.3, peak: 0.3 }, dry)
      break
    case 'potion':
      tone('sine', 660, 990, t, { a: 0.03, d: 0.3, peak: 0.12 }, wet)
      tone('sine', 990, 1320, t + 0.1, { a: 0.03, d: 0.4, peak: 0.1 }, wet)
      noise(t, { a: 0.1, d: 0.4, peak: 0.08 }, wet, { type: 'bandpass', f0: 2500, q: 2 })
      break
  }
}
