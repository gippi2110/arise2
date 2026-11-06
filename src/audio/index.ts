import type { Settings } from '../game/types'
import { setVolumes, unlockAudio } from './engine'
import { configureVoice } from './voice'
import { setMusicEnabled } from './music'

export { playSfx } from './sfx'
export type { SfxName } from './sfx'
export { setScene, stopMusic } from './music'
export type { Scene } from './music'
export { speak, stopVoice, listVoices } from './voice'
export type { VoiceStyle } from './voice'
export { unlockAudio, isUnlocked } from './engine'

let bound = false

export function applyAudioSettings(s: Settings, premiumAvailable: boolean) {
  setVolumes({ master: s.masterVolume, sfx: s.sfxVolume, music: s.musicVolume, voice: s.voiceVolume })
  configureVoice({ enabled: s.voiceEnabled, rate: s.voiceRate, pitch: s.voicePitch, voiceURI: s.voiceURI, premium: s.preferPremiumVoice && premiumAvailable })
  setMusicEnabled(s.musicEnabled)
}

/** Resume the AudioContext on the first user gesture (browser autoplay policy). */
export function bindAudioUnlock(onUnlocked?: () => void) {
  if (bound || typeof window === 'undefined') return
  bound = true
  const handler = () => {
    void unlockAudio().then(() => onUnlocked?.())
  }
  for (const ev of ['pointerdown', 'keydown', 'touchstart']) window.addEventListener(ev, handler, { passive: true })
}
