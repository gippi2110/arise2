import { motion } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'
import { useAuth } from '../store/auth'
import { useGame } from '../store/game'
import { ApiError } from '../lib/api'
import { playSfx, speak, unlockAudio } from '../audio'
import Particles from '../components/ui/Particles'
import MagicCircle from '../components/ui/MagicCircle'
import SysButton from '../components/ui/SysButton'

export default function Login({ onOffline }: { onOffline: () => void }) {
  const auth = useAuth()
  const localSave = useGame((s) => Boolean(s.state.profile.awakenedAt))
  const [email, setEmail] = useState(() => localStorage.getItem('shadow-system:last-email') ?? '')
  const [step, setStep] = useState<'email' | 'code'>('email')
  const [code, setCode] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const codeRef = useRef<HTMLInputElement>(null)

  useEffect(() => { if (step === 'code') codeRef.current?.focus() }, [step])

  const request = async () => {
    await unlockAudio()
    setError(null); setInfo(null); setBusy(true)
    try {
      const res = await auth.requestCode(email.trim())
      localStorage.setItem('shadow-system:last-email', email.trim())
      playSfx('accept')
      void speak('Authentication code dispatched.', 'normal')
      setInfo(res.delivered ? 'A six-digit access code has been sent to your email. It expires in ten minutes.' : 'Email delivery is not configured yet. The access code was written to the Netlify function log for this request (Netlify dashboard → Logs → Functions → api). Add a RESEND_API_KEY to receive codes by email.')
      setStep('code')
    } catch (e) {
      playSfx('deny')
      setError(e instanceof ApiError ? e.message : 'The System could not be reached. Check your connection.')
    } finally { setBusy(false) }
  }

  const verify = async () => {
    setError(null); setBusy(true)
    try {
      await auth.verify(email.trim(), code)
      playSfx('complete')
    } catch (e) {
      playSfx('warning')
      setError(e instanceof ApiError ? e.message : 'Verification failed.')
      setBusy(false)
    }
  }

  return (
    <div className="fixed inset-0 overflow-y-auto bg-void text-glow">
      <img src="/art/bg/awakening.webp" alt="" className="fixed inset-0 h-full w-full object-cover opacity-50" />
      <div className="fixed inset-0 bg-gradient-to-b from-void/60 via-void/70 to-void" />
      <Particles mode="ambient" density={70} className="pointer-events-none fixed inset-0 h-full w-full" />
      <div className="relative flex min-h-full items-center justify-center px-4 py-10">
        <motion.div className="absolute" initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 0.5 }} transition={{ duration: 1.5 }}>
          <MagicCircle size={Math.min(620, window.innerWidth * 1.3)} />
        </motion.div>
        <motion.div className="holo clip-panel neon-edge relative w-full max-w-md" initial={{ scaleY: 0.05, opacity: 0 }} animate={{ scaleY: 1, opacity: 1 }} transition={{ duration: 0.5, ease: [0.2, 0.9, 0.2, 1] }}>
          <div className="flex items-center gap-3 border-b border-glow/10 px-5 py-3">
            <span className="clip-tag bg-sys px-2 py-0.5 font-display text-[10px] font-bold tracking-[0.35em] text-void">SYSTEM</span>
            <span className="font-display text-[10px] tracking-[0.3em] text-glow/60">PLAYER AUTHENTICATION</span>
          </div>
          <div className="px-5 py-6">
            <h1 className="font-display text-xl font-black tracking-[0.2em] text-glow text-glow-sys">IDENTIFY YOURSELF</h1>
            <p className="mt-2 text-sm text-glow/70">
              {auth.claimed
                ? 'This System already answers to one Player. Enter the registered email to receive an access code.'
                : 'No Player has claimed this System yet. The first email verified becomes its permanent owner.'}
            </p>

            {step === 'email' && (
              <form className="mt-5 space-y-3" onSubmit={(e) => { e.preventDefault(); void request() }}>
                <label className="block font-display text-[10px] tracking-[0.35em] text-muted">EMAIL</label>
                <input className="sys-input" type="email" required autoComplete="email" inputMode="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
                <SysButton type="submit" block size="lg" disabled={busy || !email.includes('@')}>{busy ? 'CONTACTING THE SYSTEM…' : 'SEND ACCESS CODE'}</SysButton>
              </form>
            )}

            {step === 'code' && (
              <form className="mt-5 space-y-3" onSubmit={(e) => { e.preventDefault(); void verify() }}>
                <div className="text-xs text-muted">Code sent to <span className="text-glow">{email}</span>. <button type="button" className="text-sys underline-offset-2 hover:underline" onClick={() => { setStep('email'); setCode(''); setInfo(null) }}>Change</button></div>
                <label className="block font-display text-[10px] tracking-[0.35em] text-muted">ACCESS CODE</label>
                <input ref={codeRef} className="sys-input text-center font-display text-3xl tracking-[0.6em]" inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="••••••" />
                <SysButton type="submit" variant="arcane" block size="lg" disabled={busy || code.length !== 6}>{busy ? 'VERIFYING…' : 'ENTER THE SYSTEM'}</SysButton>
                <button type="button" disabled={busy} onClick={() => void request()} className="block w-full text-center font-display text-[10px] tracking-[0.3em] text-muted hover:text-glow">RESEND CODE</button>
              </form>
            )}

            {info && <div className="mt-4 border border-sys/30 bg-sys/10 px-3 py-2 text-xs text-glow/85">{info}</div>}
            {error && <div className="mt-4 border border-danger/50 bg-danger/10 px-3 py-2 text-xs text-glow">{error}</div>}
            {auth.status === 'offline' && (
              <div className="mt-4 border border-ember/40 bg-ember/10 px-3 py-2 text-xs">
                The System server cannot be reached.
                {localSave && <> A save file exists on this device. <button type="button" className="font-display tracking-widest text-ember" onClick={onOffline}>ENTER OFFLINE ›</button></>}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  )
}
