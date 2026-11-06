import { AnimatePresence, motion } from 'framer-motion'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useGame } from '../store/game'
import { ATTRS } from '../game/content/attrs'
import type { AttrKey } from '../game/types'
import { playSfx, speak, setScene, unlockAudio, stopVoice } from '../audio'
import Particles from '../components/ui/Particles'
import MagicCircle from '../components/ui/MagicCircle'
import TypeWriter from '../components/ui/TypeWriter'
import SysButton from '../components/ui/SysButton'
import { checkAchievements, maxHp, maxMp } from '../game/engine'

const LINES = ['PLAYER DETECTED.', 'AN UNKNOWN ENTITY HAS ENTERED THE SYSTEM.', 'YOU HAVE BEEN SELECTED.', 'THE AWAKENING BEGINS NOW.', 'ARISE.']
const AVATARS = ['/art/avatar/a1.webp', '/art/avatar/a2.webp', '/art/avatar/a3.webp', '/art/avatar/a4.webp', '/art/avatar/a5.webp', '/art/avatar/a6.webp']

type Phase = 'touch' | 'black' | 'particles' | 'interface' | 'register' | 'exit'

export default function Awakening() {
  const nav = useNavigate()
  const [params] = useSearchParams()
  const replay = params.get('replay') === '1'
  const state = useGame((s) => s.state)
  const mutate = useGame((s) => s.mutate)
  const alreadyAwakened = Boolean(state.profile.awakenedAt)
  const [phase, setPhase] = useState<Phase>('touch')
  const [line, setLine] = useState(0)
  const [name, setName] = useState(state.profile.name || '')
  const [avatar, setAvatar] = useState(state.profile.avatar)
  const [alloc, setAlloc] = useState<Record<AttrKey, number>>(() => Object.fromEntries(ATTRS.map((a) => [a.key, 0])) as Record<AttrKey, number>)
  const pointsLeft = 10 - Object.values(alloc).reduce((a, b) => a + b, 0)

  useEffect(() => { setScene('awakening') }, [])

  // heartbeat during the dark phases
  useEffect(() => {
    if (phase !== 'black' && phase !== 'particles') return
    playSfx('heartbeat')
    const t = window.setInterval(() => playSfx('heartbeat'), 1150)
    return () => window.clearInterval(t)
  }, [phase])

  useEffect(() => {
    if (phase === 'black') { const t = window.setTimeout(() => setPhase('particles'), 2200); return () => window.clearTimeout(t) }
    if (phase === 'particles') { const t = window.setTimeout(() => { setPhase('interface'); playSfx('open') }, 3000); return () => window.clearTimeout(t) }
  }, [phase])

  // speak each line as it appears
  useEffect(() => {
    if (phase !== 'interface') return
    const text = LINES[line]
    if (!text) return
    const isArise = line === LINES.length - 1
    if (isArise) playSfx('arise')
    else playSfx(line === 0 ? 'warning' : 'accept')
    void speak(text.toLowerCase().replace(/\.$/, ''), isArise ? 'dark' : line === 0 ? 'warning' : 'normal')
    const t = window.setTimeout(() => {
      if (line < LINES.length - 1) setLine(line + 1)
      else if (alreadyAwakened && replay) setPhase('exit')
      else setPhase('register')
    }, isArise ? 4200 : 2600 + text.length * 40)
    return () => window.clearTimeout(t)
  }, [phase, line, alreadyAwakened, replay])

  useEffect(() => {
    if (phase !== 'exit') return
    playSfx('levelup')
    const t = window.setTimeout(() => nav('/', { replace: true }), 2000)
    return () => window.clearTimeout(t)
  }, [phase, nav])

  const begin = async () => {
    await unlockAudio()
    setPhase('black')
  }

  const skip = useCallback(() => {
    stopVoice()
    if (alreadyAwakened) { nav('/', { replace: true }); return }
    setPhase('register')
  }, [alreadyAwakened, nav])

  const canSubmit = name.trim().length >= 2 && pointsLeft === 0
  const submit = () => {
    if (!canSubmit) return
    mutate((d) => {
      d.profile.name = name.trim().slice(0, 24)
      d.profile.avatar = avatar
      d.profile.awakenedAt = d.profile.awakenedAt ?? Date.now()
      for (const a of ATTRS) d.attrs[a.key] += alloc[a.key]
      d.statPoints = Math.max(0, d.statPoints - 10)
      d.hp = maxHp(d)
      d.mp = maxMp(d)
      d.settings.introSeen = true
      d.cinematics = []
      checkAchievements(d)
    })
    void speak(`Welcome, ${name.trim()}. The System recognises you as its Player.`, 'epic')
    setPhase('exit')
  }

  const canSkip = (alreadyAwakened || state.settings.introSeen) && phase !== 'touch' && phase !== 'register' && phase !== 'exit'
  const particles = useMemo(() => phase !== 'touch' && phase !== 'black', [phase])

  return (
    <div className="fixed inset-0 overflow-hidden bg-[#020104] text-glow">
      <AnimatePresence>
        {particles && (
          <motion.div key="p" className="absolute inset-0" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 2.5 }}>
            <img src="/art/bg/awakening.webp" alt="" className="absolute inset-0 h-full w-full object-cover opacity-50" />
            <div className="absolute inset-0 bg-gradient-to-b from-[#020104]/60 via-transparent to-[#020104]" />
            <Particles mode="ambient" density={110} speed={0.8} />
          </motion.div>
        )}
      </AnimatePresence>

      {canSkip && (
        <button type="button" onClick={skip} className="absolute right-4 top-4 z-20 font-display text-[10px] tracking-[0.35em] text-glow/50 hover:text-glow safe-top">SKIP INTRO ›</button>
      )}

      <AnimatePresence mode="wait">
        {phase === 'touch' && (
          <motion.button key="touch" type="button" onClick={begin} className="absolute inset-0 flex flex-col items-center justify-center" exit={{ opacity: 0 }}>
            <motion.div animate={{ opacity: [0.2, 0.8, 0.2] }} transition={{ duration: 2.4, repeat: Infinity }} className="font-display text-[11px] tracking-[0.6em] text-sys">TOUCH TO INITIATE</motion.div>
            <div className="mt-3 text-xs tracking-[0.3em] text-glow/30">SOUND ON RECOMMENDED</div>
          </motion.button>
        )}

        {phase === 'interface' && (
          <motion.div key="iface" className="absolute inset-0 flex items-center justify-center px-5" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, scale: 1.1, filter: 'blur(10px)' }} transition={{ duration: 0.8 }}>
            <motion.div className="absolute" initial={{ scale: 0.3, opacity: 0 }} animate={{ scale: 1, opacity: 0.75 }} transition={{ duration: 2 }}>
              <MagicCircle size={Math.min(560, window.innerWidth * 1.15)} tone={line === LINES.length - 1 ? 'arcane' : 'sys'} />
            </motion.div>
            <motion.div className="holo clip-panel neon-edge relative w-full max-w-md" initial={{ scaleY: 0.02, opacity: 0 }} animate={{ scaleY: 1, opacity: 1 }} transition={{ duration: 0.6, ease: [0.2, 0.9, 0.2, 1] }}>
              <div className="flex items-center gap-3 border-b border-glow/10 px-5 py-3">
                <span className="clip-tag bg-sys px-2 py-0.5 font-display text-[10px] font-bold tracking-[0.35em] text-void">SYSTEM</span>
                <span className="font-display text-[10px] tracking-[0.3em] text-glow/60 animate-flicker">INITIALIZING PLAYER PROTOCOL</span>
              </div>
              <div className="flex min-h-[140px] items-center justify-center px-5 py-8 text-center">
                <AnimatePresence mode="wait">
                  <motion.div key={line} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className={line === LINES.length - 1 ? 'font-display text-5xl font-black tracking-[0.4em] text-arcane text-glow-arcane sm:text-6xl' : 'font-display text-lg font-bold tracking-[0.25em] text-glow text-glow-sys sm:text-2xl'}>
                    <TypeWriter text={LINES[line]} speed={line === LINES.length - 1 ? 120 : 45} sound={line !== LINES.length - 1} />
                  </motion.div>
                </AnimatePresence>
              </div>
              <div className="flex gap-1 px-5 pb-4">
                {LINES.map((_, i) => <div key={i} className={`h-0.5 flex-1 ${i <= line ? 'bg-sys shadow-[0_0_8px_rgb(var(--c-primary))]' : 'bg-glow/10'}`} />)}
              </div>
            </motion.div>
          </motion.div>
        )}

        {phase === 'register' && (
          <motion.div key="reg" className="absolute inset-0 overflow-y-auto px-4 py-8 safe-top" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 1.05 }} transition={{ duration: 0.6 }}>
            <div className="mx-auto max-w-xl">
              <div className="font-display text-[10px] tracking-[0.5em] text-sys">PLAYER REGISTRATION</div>
              <h1 className="mt-1 font-display text-2xl font-black tracking-[0.15em] text-glow text-glow-sys">ESTABLISH YOUR IDENTITY</h1>
              <p className="mt-2 text-sm text-glow/70">The System needs a name to address you by, a face to recognise, and a first shape for your power. All of it can change later. None of it will be forgotten.</p>

              <label className="mt-6 block font-display text-[10px] tracking-[0.35em] text-muted">PLAYER NAME</label>
              <input className="sys-input mt-1 font-display text-lg tracking-[0.2em]" value={name} onChange={(e) => setName(e.target.value)} maxLength={24} placeholder="JANGOPI" autoFocus />

              <div className="mt-6 font-display text-[10px] tracking-[0.35em] text-muted">AVATAR</div>
              <div className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-6">
                {AVATARS.map((a) => (
                  <button key={a} type="button" onClick={() => { setAvatar(a); playSfx('press') }} className={`clip-panel-sm relative aspect-square overflow-hidden border transition ${avatar === a ? 'border-sys shadow-holo' : 'border-glow/10 opacity-70 hover:opacity-100'}`}>
                    <img src={a} alt="" className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>

              <div className="mt-6 flex items-baseline justify-between">
                <div className="font-display text-[10px] tracking-[0.35em] text-muted">INITIAL ATTRIBUTES</div>
                <div className="font-display text-xs text-ember">{pointsLeft} POINTS REMAINING</div>
              </div>
              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                {ATTRS.map((a) => (
                  <div key={a.key} className="holo clip-panel-sm flex items-center justify-between px-3 py-2">
                    <div>
                      <div className="font-display text-xs tracking-[0.2em]">{a.label.toUpperCase()}</div>
                      <div className="text-[11px] text-muted">{a.blurb}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button type="button" className="h-8 w-8 border border-sys/40 font-display text-sm disabled:opacity-30" disabled={alloc[a.key] === 0} onClick={() => { setAlloc({ ...alloc, [a.key]: alloc[a.key] - 1 }); playSfx('press') }}>−</button>
                      <span className="w-8 text-center font-display text-base text-sys">{10 + alloc[a.key]}</span>
                      <button type="button" className="h-8 w-8 border border-sys/40 font-display text-sm disabled:opacity-30" disabled={pointsLeft === 0} onClick={() => { setAlloc({ ...alloc, [a.key]: alloc[a.key] + 1 }); playSfx('press') }}>+</button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-8 pb-10">
                <SysButton variant="arcane" size="lg" block disabled={!canSubmit} onClick={submit}>ARISE AS THE PLAYER</SysButton>
                {!canSubmit && <div className="mt-2 text-center text-xs text-muted">{name.trim().length < 2 ? 'Enter a name of at least two characters.' : 'Allocate all ten starting points.'}</div>}
              </div>
            </div>
          </motion.div>
        )}

        {phase === 'exit' && (
          <motion.div key="exit" className="absolute inset-0 flex items-center justify-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <motion.div className="absolute inset-0 bg-glow" initial={{ opacity: 0 }} animate={{ opacity: [0, 1, 0] }} transition={{ duration: 1.6, times: [0, 0.3, 1] }} />
            <Particles mode="burst" density={160} speed={1.6} />
            <motion.div initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.4 }} className="relative text-center">
              <div className="font-display text-[10px] tracking-[0.5em] text-sys">WELCOME, PLAYER</div>
              <div className="mt-2 font-display text-3xl font-black tracking-[0.25em] text-glow text-glow-white">{(name || state.profile.name || 'PLAYER').toUpperCase()}</div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
