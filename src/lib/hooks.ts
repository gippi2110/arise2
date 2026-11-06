import { useEffect, useMemo, useState, useSyncExternalStore } from 'react'
import { useGame } from '../store/game'
import { battleStats, shadowCapacity, xpToNext } from '../game/engine'
import { getSyncStatus, subscribeSync } from './sync'

export function useNow(intervalMs = 1000) {
  const [now, setNow] = useState(Date.now())
  useEffect(() => {
    const t = window.setInterval(() => setNow(Date.now()), intervalMs)
    return () => window.clearInterval(t)
  }, [intervalMs])
  return now
}

export function useDerived() {
  const state = useGame((s) => s.state)
  return useMemo(() => ({ ...battleStats(state), xpNext: xpToNext(state), capacity: shadowCapacity(state) }), [state])
}

export function useSyncStatus() {
  return useSyncExternalStore(subscribeSync, getSyncStatus, getSyncStatus)
}

export function useMediaQuery(q: string) {
  const [m, setM] = useState(() => (typeof window !== 'undefined' ? window.matchMedia(q).matches : false))
  useEffect(() => {
    const mq = window.matchMedia(q)
    const fn = () => setM(mq.matches)
    mq.addEventListener('change', fn)
    return () => mq.removeEventListener('change', fn)
  }, [q])
  return m
}
