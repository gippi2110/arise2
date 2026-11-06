import { buses, getCtx, isUnlocked } from './engine'

export type VoiceStyle = 'normal' | 'warning' | 'epic' | 'dark'

interface VoiceConfig {
  enabled: boolean
  rate: number
  pitch: number
  voiceURI: string | null
  premium: boolean
}

let cfg: VoiceConfig = { enabled: true, rate: 0.82, pitch: 0.45, voiceURI: null, premium: false }
const premiumCache = new Map<string, AudioBuffer>()
let premiumFailed = false
let currentPremium: AudioBufferSourceNode | null = null

export function configureVoice(next: Partial<VoiceConfig>) {
  cfg = { ...cfg, ...next }
}

const MALE_HINTS = ['male', 'daniel', 'george', 'david', 'mark', 'james', 'fred', 'alex', 'arthur', 'rishi', 'aaron', 'oliver', 'ryan', 'guy', 'brian', 'christopher', 'eric', 'reed', 'rocko', 'grandpa', 'bruce', 'thomas', 'matthew', 'liam', 'jorge', 'diego']
const FEMALE_HINTS = ['female', 'samantha', 'victoria', 'karen', 'moira', 'tessa', 'fiona', 'zira', 'susan', 'hazel', 'allison', 'ava', 'kate', 'serena', 'emma', 'jenny', 'aria', 'sonia', 'libby', 'natasha', 'anna', 'amelie', 'joana', 'catherine', 'linda', 'heather', 'kathy', 'veena', 'alice', 'martha', 'nicky', 'shelley', 'sandy', 'flo', 'grandma', 'princess', 'lekha', 'laura', 'monica', 'paulina']

export function listVoices() {
  if (typeof speechSynthesis === 'undefined') return [] as { uri: string; name: string; lang: string; likelyMale: boolean }[]
  return speechSynthesis.getVoices().map((v) => {
    const n = v.name.toLowerCase()
    const likelyMale = MALE_HINTS.some((h) => n.includes(h)) && !FEMALE_HINTS.some((h) => n.includes(h))
    return { uri: v.voiceURI, name: v.name, lang: v.lang, likelyMale }
  })
}

function pickVoice(): SpeechSynthesisVoice | null {
  if (typeof speechSynthesis === 'undefined') return null
  const voices = speechSynthesis.getVoices()
  if (!voices.length) return null
  if (cfg.voiceURI) {
    const chosen = voices.find((v) => v.voiceURI === cfg.voiceURI)
    if (chosen) return chosen
  }
  const english = voices.filter((v) => v.lang.toLowerCase().startsWith('en'))
  const pool = english.length ? english : voices
  const score = (v: SpeechSynthesisVoice) => {
    const n = v.name.toLowerCase()
    let s = 0
    if (MALE_HINTS.some((h) => n.includes(h))) s += 10
    if (FEMALE_HINTS.some((h) => n.includes(h))) s -= 20
    if (n.includes('google uk english male')) s += 8
    if (n.includes('daniel') || n.includes('george') || n.includes('arthur')) s += 4
    if (n.includes('natural') || n.includes('neural') || n.includes('premium') || n.includes('enhanced')) s += 3
    if (v.localService) s += 1
    return s
  }
  return [...pool].sort((a, b) => score(b) - score(a))[0] ?? null
}

/** Low "presence" layer that plays under the spoken line so the System always feels heavy. */
function presence(durationSec: number, style: VoiceStyle) {
  const c = getCtx()
  if (!c || !isUnlocked()) return
  const { voice, reverb } = buses()
  const t = c.currentTime
  const o = c.createOscillator()
  o.type = 'sine'
  o.frequency.value = style === 'warning' ? 46 : 55
  const o2 = c.createOscillator()
  o2.type = 'sawtooth'
  o2.frequency.value = style === 'dark' ? 41 : 55
  const f = c.createBiquadFilter()
  f.type = 'lowpass'
  f.frequency.value = 160
  const g = c.createGain()
  g.gain.setValueAtTime(0.0001, t)
  g.gain.exponentialRampToValueAtTime(style === 'epic' ? 0.2 : 0.14, t + 0.25)
  g.gain.setValueAtTime(style === 'epic' ? 0.2 : 0.14, t + durationSec)
  g.gain.exponentialRampToValueAtTime(0.0001, t + durationSec + 0.9)
  const send = c.createGain()
  send.gain.value = 0.35
  o.connect(g)
  o2.connect(f).connect(g)
  g.connect(voice)
  g.connect(send).connect(reverb)
  o.start(t)
  o2.start(t)
  o.stop(t + durationSec + 1)
  o2.stop(t + durationSec + 1)
}

async function speakPremium(text: string, style: VoiceStyle): Promise<boolean> {
  const c = getCtx()
  if (!c || premiumFailed) return false
  const key = `${style}:${text}`
  let buf = premiumCache.get(key)
  if (!buf) {
    const res = await fetch(`/api/voice?text=${encodeURIComponent(text)}&style=${style}`, { credentials: 'same-origin' })
    if (res.status === 404) {
      premiumFailed = true
      return false
    }
    if (!res.ok) return false
    buf = await c.decodeAudioData(await res.arrayBuffer())
    premiumCache.set(key, buf)
  }
  stopVoice()
  const { voice, reverb } = buses()
  const src = c.createBufferSource()
  src.buffer = buf
  src.playbackRate.value = style === 'dark' ? 0.92 : 0.97
  const low = c.createBiquadFilter()
  low.type = 'lowshelf'
  low.frequency.value = 160
  low.gain.value = 7
  const send = c.createGain()
  send.gain.value = style === 'epic' || style === 'dark' ? 0.5 : 0.3
  src.connect(low)
  low.connect(voice)
  low.connect(send).connect(reverb)
  src.start()
  currentPremium = src
  presence(buf.duration / src.playbackRate.value, style)
  return true
}

export function stopVoice() {
  if (typeof speechSynthesis !== 'undefined') speechSynthesis.cancel()
  if (currentPremium) {
    try { currentPremium.stop() } catch { /* already stopped */ }
    currentPremium = null
  }
}

/** Speak a System line. Dramatic pauses are written as " ... " in the text. */
export async function speak(text: string, style: VoiceStyle = 'normal') {
  if (!cfg.enabled || !text) return
  if (cfg.premium && (await speakPremium(text, style).catch(() => false))) return
  if (typeof speechSynthesis === 'undefined') return
  stopVoice()
  const u = new SpeechSynthesisUtterance(text.replace(/\.\.\./g, ','))
  const v = pickVoice()
  if (v) u.voice = v
  const pitchAdj = style === 'warning' ? -0.08 : style === 'dark' ? -0.15 : style === 'epic' ? -0.05 : 0
  const rateAdj = style === 'dark' ? -0.12 : style === 'epic' ? -0.08 : style === 'warning' ? -0.04 : 0
  u.pitch = Math.max(0.1, Math.min(2, cfg.pitch + pitchAdj))
  u.rate = Math.max(0.5, Math.min(1.6, cfg.rate + rateAdj))
  u.volume = 1
  const words = text.split(/\s+/).length
  presence(Math.min(12, 0.6 + (words / 2.2) / u.rate), style)
  speechSynthesis.speak(u)
}

if (typeof speechSynthesis !== 'undefined') {
  speechSynthesis.onvoiceschanged = () => {
    /* voices loaded; pickVoice() reads the live list */
  }
}
