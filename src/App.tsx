import { useEffect, useRef, useState } from 'react'
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { useAuth } from './store/auth'
import { useGame } from './store/game'
import { pullAndReconcile } from './lib/sync'
import { applyAudioSettings, bindAudioUnlock } from './audio'
import AppShell from './layout/AppShell'
import CinematicLayer from './components/cinematics/CinematicLayer'
import Awakening from './pages/Awakening'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Quests from './pages/Quests'
import Dungeons from './pages/Dungeons'
import RedGate from './pages/RedGate'
import Shadows from './pages/Shadows'
import Status from './pages/Status'
import Skills from './pages/Skills'
import Inventory from './pages/Inventory'
import Achievements from './pages/Achievements'
import Settings from './pages/Settings'
import Notifications from './pages/Notifications'
import History from './pages/History'

function Boot() {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-void">
      <div className="animate-pulseGlow font-display text-[10px] tracking-[0.6em] text-sys">CONNECTING TO THE SYSTEM</div>
    </div>
  )
}

function Gate() {
  const auth = useAuth()
  const awakened = useGame((s) => Boolean(s.state.profile.awakenedAt))
  const [offlineOk, setOfflineOk] = useState(false)
  const [pulled, setPulled] = useState(false)
  const pulling = useRef(false)
  const loc = useLocation()

  useEffect(() => { void auth.check() // eslint-disable-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (auth.status === 'authed' && !pulled && !pulling.current) {
      pulling.current = true
      void pullAndReconcile().finally(() => { setPulled(true); pulling.current = false })
    }
    if (auth.status !== 'authed') setPulled(false)
  }, [auth.status, pulled])

  if (auth.status === 'unknown') return <Boot />
  const allowed = auth.status === 'authed' || (auth.status === 'offline' && (offlineOk || awakened))
  if (!allowed) return <Login onOffline={() => setOfflineOk(true)} />
  if (auth.status === 'authed' && !pulled) return <Boot />
  if (!awakened && loc.pathname !== '/awakening') return <Navigate to="/awakening" replace />

  return (
    <Routes>
      <Route path="/awakening" element={<Awakening />} />
      <Route path="/login" element={<Navigate to="/" replace />} />
      <Route element={<AppShell />}>
        <Route index element={<Dashboard />} />
        <Route path="/quests" element={<Quests />} />
        <Route path="/dungeons" element={<Dungeons />} />
        <Route path="/red-gate" element={<RedGate />} />
        <Route path="/shadows" element={<Shadows />} />
        <Route path="/status" element={<Status />} />
        <Route path="/skills" element={<Skills />} />
        <Route path="/inventory" element={<Inventory />} />
        <Route path="/achievements" element={<Achievements />} />
        <Route path="/history" element={<History />} />
        <Route path="/notifications" element={<Notifications />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}

export default function App() {
  const settings = useGame((s) => s.state.settings)
  const voiceConfigured = useAuth((s) => s.voiceConfigured)

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', settings.theme)
    document.documentElement.setAttribute('data-motion', settings.reduceMotion ? 'reduce' : 'full')
    const meta = document.querySelector('meta[name="theme-color"]')
    if (meta) meta.setAttribute('content', settings.theme === 'ember' ? '#090604' : '#050509')
  }, [settings.theme, settings.reduceMotion])

  useEffect(() => {
    applyAudioSettings(settings, voiceConfigured)
  }, [settings, voiceConfigured])

  useEffect(() => {
    bindAudioUnlock(() => applyAudioSettings(useGame.getState().state.settings, useAuth.getState().voiceConfigured))
  }, [])

  return (
    <BrowserRouter>
      <Gate />
      <CinematicLayer />
    </BrowserRouter>
  )
}
