/** Shared Web Audio graph: master -> destination, with sfx / music / voice buses and a procedural reverb. */
let ctx: AudioContext | null = null
let master: GainNode
let sfxBus: GainNode
let musicBus: GainNode
let voiceBus: GainNode
let reverb: ConvolverNode
let reverbReturn: GainNode
let unlocked = false

export function getCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null
  if (!ctx) {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    if (!AC) return null
    ctx = new AC()
    master = ctx.createGain()
    master.gain.value = 0.9
    const limiter = ctx.createDynamicsCompressor()
    limiter.threshold.value = -6
    limiter.knee.value = 12
    limiter.ratio.value = 12
    limiter.attack.value = 0.003
    limiter.release.value = 0.2
    master.connect(limiter).connect(ctx.destination)
    sfxBus = ctx.createGain()
    musicBus = ctx.createGain()
    voiceBus = ctx.createGain()
    sfxBus.connect(master)
    musicBus.connect(master)
    voiceBus.connect(master)
    reverb = ctx.createConvolver()
    reverb.buffer = impulse(ctx, 2.6, 2.8)
    reverbReturn = ctx.createGain()
    reverbReturn.gain.value = 0.55
    reverb.connect(reverbReturn).connect(master)
  }
  return ctx
}

export function buses() {
  getCtx()
  return { master, sfx: sfxBus, music: musicBus, voice: voiceBus, reverb }
}

export async function unlockAudio() {
  const c = getCtx()
  if (!c) return
  if (c.state === 'suspended') {
    try {
      await c.resume()
    } catch {
      /* resumed on a later gesture */
    }
  }
  unlocked = c.state === 'running'
}

export function isUnlocked() {
  return unlocked && ctx?.state === 'running'
}

export function setVolumes(v: { master: number; sfx: number; music: number; voice: number }) {
  const c = getCtx()
  if (!c) return
  const t = c.currentTime
  master.gain.setTargetAtTime(clamp(v.master), t, 0.05)
  sfxBus.gain.setTargetAtTime(clamp(v.sfx), t, 0.05)
  musicBus.gain.setTargetAtTime(clamp(v.music), t, 0.3)
  voiceBus.gain.setTargetAtTime(clamp(v.voice), t, 0.05)
}

const clamp = (n: number) => Math.max(0, Math.min(1, n))

function impulse(c: AudioContext, seconds: number, decay: number) {
  const rate = c.sampleRate
  const len = Math.floor(rate * seconds)
  const buf = c.createBuffer(2, len, rate)
  for (let ch = 0; ch < 2; ch++) {
    const data = buf.getChannelData(ch)
    for (let i = 0; i < len; i++) {
      const t = i / len
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - t, decay) * (1 - 0.3 * Math.sin(t * 40))
    }
  }
  return buf
}

/** Looping white-noise buffer used by the synth layers. */
let noiseBuf: AudioBuffer | null = null
export function noiseBuffer() {
  const c = getCtx()!
  if (!noiseBuf) {
    noiseBuf = c.createBuffer(1, c.sampleRate * 2, c.sampleRate)
    const d = noiseBuf.getChannelData(0)
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1
  }
  return noiseBuf
}
