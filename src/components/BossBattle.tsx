import { AnimatePresence, motion } from 'framer-motion'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { BossDef } from '../game/types'
import { useGame } from '../store/game'
import { battleStats, useConsumable } from '../game/engine'
import { SKILLS } from '../game/content/skills'
import { ITEMS } from '../game/content/items'
import { playSfx, speak } from '../audio'
import StatBar from './ui/StatBar'
import Particles from './ui/Particles'
import clsx from '../lib/clsx'

interface Props { boss: BossDef; hpMult?: number; atkMult?: number; red?: boolean; onVictory: () => void; onDefeat: () => void; onFlee?: () => void }

type Phase = 'intro' | 'fight' | 'victory' | 'defeat'
interface Log { id: number; text: string; tone: 'player' | 'boss' | 'sys' | 'crit' }

export default function BossBattle({ boss, hpMult = 1, atkMult = 1, red, onVictory, onDefeat, onFlee }: Props) {
  const state = useGame((s) => s.state)
  const mutate = useGame((s) => s.mutate)
  const stats = useMemo(() => battleStats(state), [state])
  const bossMax = Math.round(boss.hp * hpMult)
  const [bossHp, setBossHp] = useState(bossMax)
  const [phase, setPhase] = useState<Phase>('intro')
  const [marker, setMarker] = useState(0)
  const [cooldownUntil, setCooldownUntil] = useState(0)
  const [skillCd, setSkillCd] = useState<Record<string, number>>({})
  const [bloodlustUntil, setBloodlustUntil] = useState(0)
  const [stealth, setStealth] = useState(0)
  const [exchange, setExchange] = useState(false)
  const [log, setLog] = useState<Log[]>([])
  const [shake, setShake] = useState(0)
  const [flash, setFlash] = useState<'hit' | 'crit' | 'hurt' | null>(null)
  const [bossTell, setBossTell] = useState(false)
  const guards = useRef({ igneel: state.shadows.some((s) => s.id === 'igneel'), nyx: state.shadows.some((s) => s.id === 'nyx') })
  const logId = useRef(0)
  const phaseRef = useRef<Phase>('intro')
  phaseRef.current = phase
  const bossHpRef = useRef(bossHp)
  bossHpRef.current = bossHp
  const stealthRef = useRef(stealth); stealthRef.current = stealth
  const exchangeRef = useRef(exchange); exchangeRef.current = exchange
  const bloodRef = useRef(bloodlustUntil); bloodRef.current = bloodlustUntil

  const potions = ITEMS.filter((i) => i.category === 'potion' && (state.inventory[i.id] ?? 0) > 0)
  const activeSkills = SKILLS.filter((s) => s.kind === 'active' && s.id !== 'shadow-extraction' && (state.skills[s.id] ?? 0) > 0)

  const push = useCallback((text: string, tone: Log['tone'] = 'sys') => {
    setLog((l) => [{ id: ++logId.current, text, tone }, ...l].slice(0, 6))
  }, [])

  // intro
  useEffect(() => {
    playSfx(red ? 'redgate' : 'warning')
    void speak(`${boss.name}, ${boss.title}, stands before you. Show the System what you are.`, red ? 'warning' : 'dark')
    const t = window.setTimeout(() => { setPhase('fight'); push(`${boss.name} enters the arena.`) }, 3200)
    return () => window.clearTimeout(t)
  }, [boss, red, push])

  // timing marker
  useEffect(() => {
    if (phase !== 'fight') return
    let raf = 0
    const start = performance.now()
    const loop = (t: number) => {
      const p = ((t - start) % 1300) / 1300
      setMarker(Math.abs(Math.sin(p * Math.PI)) * 100)
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [phase])

  const damagePlayer = useCallback((raw: number, source: string) => {
    const s = useGame.getState().state
    const st = battleStats(s)
    const dmg = Math.max(3, Math.round((raw - st.defense * 0.5) * (0.85 + Math.random() * 0.3)))
    const nextHp = Math.max(0, s.hp - dmg)
    mutate((d) => { d.hp = nextHp }, { silent: true })
    playSfx('hurt')
    setFlash('hurt'); setShake((n) => n + 1)
    push(`${source} hits you for ${dmg}.`, 'boss')
    if (nextHp <= 0) {
      setPhase('defeat')
      playSfx('warning')
      void speak('You are not ready.', 'warning')
      window.setTimeout(onDefeat, 3200)
    }
  }, [mutate, onDefeat, push])

  // boss attacks
  useEffect(() => {
    if (phase !== 'fight') return
    const interval = Math.max(1200, boss.attackInterval / Math.max(0.6, atkMult * 0.9))
    const tell = window.setInterval(() => {
      setBossTell(true)
      window.setTimeout(() => {
        setBossTell(false)
        if (phaseRef.current !== 'fight') return
        if (stealthRef.current > 0) { setStealth((n) => n - 1); push(`${boss.name} swings at empty shadow. Miss.`, 'sys'); return }
        if (exchangeRef.current) {
          setExchange(false)
          const s = useGame.getState().state
          const counter = Math.round(battleStats(s).armyPower * (1 + (s.skills['shadow-exchange'] ?? 0) * 0.4))
          setBossHp((h) => Math.max(0, h - counter))
          playSfx('crit')
          push(`Shadow Exchange! Your shadow takes the blow and counters for ${counter}.`, 'crit')
          return
        }
        if (guards.current.igneel) { guards.current.igneel = false; playSfx('hit'); push('Igneel steps in and absorbs the strike.', 'sys'); return }
        if (guards.current.nyx && Math.random() < 0.35) { guards.current.nyx = false; push('Nyx pulls you out of the way. Dodged.', 'sys'); return }
        const blood = Date.now() < bloodRef.current ? 0.7 : 1
        damagePlayer(boss.attack * atkMult * blood, boss.name)
      }, 650)
    }, interval)
    return () => window.clearInterval(tell)
  }, [phase, boss, atkMult, damagePlayer, push])

  // shadow army auto-attacks
  useEffect(() => {
    if (phase !== 'fight') return
    const t = window.setInterval(() => {
      const s = useGame.getState().state
      if (!s.shadows.length) return
      const st = battleStats(s)
      const dmg = Math.round(st.armyPower * 0.5 * (0.8 + Math.random() * 0.4))
      if (dmg > 0) {
        setBossHp((h) => Math.max(0, h - dmg))
        push(`Your shadows strike for ${dmg}.`, 'player')
        playSfx('hit')
      }
      if (s.shadows.some((x) => x.id === 'seren')) mutate((d) => { d.hp = Math.min(st.maxHp, d.hp + Math.round(st.maxHp * 0.02)) }, { silent: true })
      if (s.shadows.some((x) => x.id === 'morrow')) mutate((d) => { d.mp = Math.min(st.maxMp, d.mp + 3) }, { silent: true })
    }, 2000)
    return () => window.clearInterval(t)
  }, [phase, mutate, push])

  // victory check
  useEffect(() => {
    if (phase === 'fight' && bossHp <= 0) {
      setPhase('victory')
      playSfx('bossDefeat')
      window.setTimeout(() => void speak(red ? 'The red gate has been cleared.' : 'The dungeon has been cleared.', 'epic'), 900)
      window.setTimeout(onVictory, 4200)
    }
  }, [bossHp, phase, onVictory, red])

  const strike = () => {
    if (phase !== 'fight' || Date.now() < cooldownUntil) return
    const s = useGame.getState().state
    const st = battleStats(s)
    const inZone = marker > 40 && marker < 60
    const perfect = marker > 47 && marker < 53
    const critRoll = Math.random() * 100 < st.critChance + (s.shadows.some((x) => x.id === 'fang') ? 5 : 0)
    const crit = perfect || (inZone && critRoll) || (critRoll && Math.random() < 0.3)
    const blood = Date.now() < bloodlustUntil ? 1.3 + (s.skills.bloodlust ?? 0) * 0.1 : 1
    const veyra = s.shadows.some((x) => x.id === 'veyra') && bossHpRef.current < bossMax / 2 ? 1.25 : 1
    const base = st.attack * (inZone ? 1.15 : 0.9) * blood * veyra * (0.9 + Math.random() * 0.2)
    const dmg = Math.round(base * (crit ? st.critMult : 1) * (perfect ? 1.25 : 1))
    setBossHp((h) => Math.max(0, h - dmg))
    setCooldownUntil(Date.now() + 1100)
    playSfx(crit ? 'crit' : 'hit')
    setFlash(crit ? 'crit' : 'hit'); setShake((n) => n + 1)
    push(crit ? `CRITICAL! You strike for ${dmg}.` : `You strike for ${dmg}.`, crit ? 'crit' : 'player')
  }

  const useSkill = (id: string) => {
    const def = SKILLS.find((x) => x.id === id)
    const lvl = state.skills[id] ?? 0
    if (!def || lvl <= 0 || phase !== 'fight') return
    if ((skillCd[id] ?? 0) > Date.now()) { playSfx('deny'); return }
    if (state.mp < def.mpCost) { playSfx('deny'); push('Not enough MP.', 'sys'); return }
    mutate((d) => { d.mp -= def.mpCost }, { silent: true })
    setSkillCd((c) => ({ ...c, [id]: Date.now() + def.cooldownSec * 1000 }))
    playSfx('skill')
    void speak(def.name, 'dark')
    if (id === 'rulers-authority') {
      const dmg = Math.round(stats.attack * (2.5 + lvl * 0.6))
      setBossHp((h) => Math.max(0, h - dmg)); setFlash('crit'); setShake((n) => n + 2)
      push(`Ruler's Authority crushes ${boss.name} for ${dmg}.`, 'crit')
    } else if (id === 'stealth') {
      setStealth(1 + Math.floor(lvl / 2)); push('You vanish. The next attacks will miss.', 'sys')
    } else if (id === 'bloodlust') {
      setBloodlustUntil(Date.now() + (8 + lvl) * 1000); push('Bloodlust. Your killing intent fills the arena.', 'sys')
    } else if (id === 'shadow-exchange') {
      setExchange(true); push('Shadow Exchange primed. The next blow is not yours to take.', 'sys')
    }
  }

  const drink = (id: string) => {
    let err: string | null = null
    mutate((d) => { err = useConsumable(d, id) }, { silent: true })
    if (err) { playSfx('deny'); push(err, 'sys') } else { playSfx('potion'); push('You drink a potion.', 'sys') }
  }

  const bossPct = bossHp / bossMax
  const cdLeft = Math.max(0, cooldownUntil - Date.now())

  return (
    <div className={clsx('fixed inset-0 z-[90] overflow-hidden', red ? 'bg-[#120306]' : 'bg-void')}>
      <motion.img key={boss.art} src={boss.art} alt="" className="absolute inset-0 h-full w-full object-cover" initial={{ scale: 1.3, opacity: 0, filter: 'blur(20px) brightness(0.2)' }} animate={{ scale: phase === 'victory' ? 1.1 : 1, opacity: phase === 'victory' ? 0.25 : 0.6, filter: phase === 'victory' ? 'blur(6px) brightness(0.3) grayscale(1)' : 'blur(0px) brightness(0.75)' }} transition={{ duration: phase === 'intro' ? 3 : 1.5 }} />
      <div className="absolute inset-0 bg-gradient-to-t from-void via-void/40 to-void/60" />
      <Particles mode={red ? 'red' : 'shadow'} density={50} />
      <AnimatePresence>{flash && <motion.div key={flash + shake} className={clsx('pointer-events-none absolute inset-0', flash === 'hurt' ? 'bg-danger' : flash === 'crit' ? 'bg-ember' : 'bg-sys')} initial={{ opacity: flash === 'hurt' ? 0.45 : 0.3 }} animate={{ opacity: 0 }} transition={{ duration: 0.45 }} onAnimationComplete={() => setFlash(null)} />}</AnimatePresence>

      <motion.div key={shake} className="relative flex h-full flex-col" animate={{ x: [0, -8, 7, -4, 0], y: [0, 4, -3, 2, 0] }} transition={{ duration: 0.35 }}>
        {/* Boss header */}
        <div className="px-4 pt-4 safe-top">
          <div className="mx-auto max-w-2xl">
            <div className="flex items-end justify-between">
              <div>
                <div className={clsx('font-display text-[10px] tracking-[0.5em]', red ? 'text-danger' : 'text-arcane')}>{red ? 'RED GATE BOSS' : 'BOSS'}</div>
                <div className="font-display text-2xl font-black tracking-[0.15em] text-glow text-glow-white sm:text-3xl">{boss.name.toUpperCase()}</div>
                <div className="text-sm text-muted">{boss.title}</div>
              </div>
              <AnimatePresence>{bossTell && <motion.div initial={{ opacity: 0, scale: 0.6 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="font-display text-xs tracking-[0.3em] text-danger animate-pulseGlow">INCOMING</motion.div>}</AnimatePresence>
            </div>
            <div className="mt-2">
              <StatBar value={bossHp} max={bossMax} color={bossPct < 0.3 ? 'danger' : red ? 'danger' : 'arcane'} height="h-3.5" />
            </div>
          </div>
        </div>

        <div className="flex-1" onClick={phase === 'fight' ? strike : undefined} />

        {/* Combat log */}
        <div className="pointer-events-none absolute left-1/2 top-[32%] w-full max-w-md -translate-x-1/2 px-4">
          <AnimatePresence>
            {log.slice(0, 4).map((l, i) => (
              <motion.div key={l.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1 - i * 0.22, y: 0 }} exit={{ opacity: 0 }} className={clsx('text-center font-display text-xs tracking-[0.15em]', l.tone === 'crit' ? 'text-ember text-glow-ember' : l.tone === 'boss' ? 'text-danger' : l.tone === 'player' ? 'text-sys' : 'text-glow/80')}>{l.text}</motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Player controls */}
        <div className="holo border-t border-sys/20 px-4 pb-6 pt-3 safe-bottom">
          <div className="mx-auto max-w-2xl">
            <div className="grid grid-cols-2 gap-3">
              <StatBar label="HP" value={state.hp} max={stats.maxHp} color="hp" />
              <StatBar label="MP" value={state.mp} max={stats.maxMp} color="mp" />
            </div>
            {/* Timing bar */}
            <div className="relative mt-3 h-6 w-full overflow-hidden clip-panel-sm bar-track">
              <div className="absolute inset-y-0 left-[40%] w-[20%] bg-sys/25" />
              <div className="absolute inset-y-0 left-[47%] w-[6%] bg-ember/50" />
              <div className="absolute inset-y-0 w-1 bg-glow shadow-[0_0_10px_rgb(var(--c-text))]" style={{ left: `calc(${marker}% - 2px)` }} />
              {cdLeft > 0 && <div className="absolute inset-0 bg-void/60" style={{ width: `${(cdLeft / 1100) * 100}%` }} />}
            </div>
            <div className="mt-3 flex gap-2">
              <button type="button" onClick={strike} disabled={phase !== 'fight' || cdLeft > 0} className={clsx('clip-panel-sm relative flex-1 border py-4 font-display text-base font-black tracking-[0.35em] transition active:scale-95 disabled:opacity-50', red ? 'border-danger bg-danger/20 hover:bg-danger/35' : 'border-sys bg-sys/20 hover:bg-sys/35', Date.now() < bloodlustUntil && 'shadow-ember')}>
                STRIKE
              </button>
              {onFlee && phase === 'fight' && <button type="button" onClick={() => { playSfx('deny'); onFlee() }} className="clip-panel-sm border border-glow/20 px-3 font-display text-[10px] tracking-[0.25em] text-muted">FLEE</button>}
            </div>
            <div className="mt-2 flex gap-1.5 overflow-x-auto pb-1">
              {activeSkills.map((s) => {
                const left = Math.max(0, (skillCd[s.id] ?? 0) - Date.now())
                const pct = left / (s.cooldownSec * 1000)
                return (
                  <button key={s.id} type="button" onClick={() => useSkill(s.id)} className="relative h-14 w-14 flex-none overflow-hidden clip-panel-sm border border-arcane/50" title={`${s.name} (${s.mpCost} MP)`}>
                    <img src={s.art} alt="" className="h-full w-full object-cover" />
                    {left > 0 && <div className="absolute inset-0" style={{ background: `conic-gradient(rgb(var(--c-bg) / 0.85) ${pct * 360}deg, transparent 0)` }} />}
                    <div className="absolute bottom-0 left-0 right-0 bg-void/70 text-center font-display text-[8px] text-sys">{s.mpCost} MP</div>
                  </button>
                )
              })}
              {potions.map((p) => (
                <button key={p.id} type="button" onClick={() => drink(p.id)} className="relative h-14 w-14 flex-none overflow-hidden clip-panel-sm border border-ember/50" title={p.name}>
                  <img src={p.art} alt="" className="h-full w-full object-cover" />
                  <div className="absolute right-0 top-0 bg-ember px-1 font-display text-[9px] font-bold text-void">{state.inventory[p.id]}</div>
                </button>
              ))}
              {activeSkills.length === 0 && potions.length === 0 && <div className="text-[11px] text-muted">No active skills or potions. Buy potions in the armory, learn skills in the skill tree.</div>}
            </div>
          </div>
        </div>
      </motion.div>

      <AnimatePresence>
        {phase === 'intro' && (
          <motion.div className="absolute inset-0 flex items-center justify-center" exit={{ opacity: 0 }}>
            <motion.div initial={{ opacity: 0, scale: 3, filter: 'blur(20px)' }} animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }} transition={{ delay: 0.8, duration: 0.6 }} className="text-center">
              <div className={clsx('font-display text-xs tracking-[0.6em]', red ? 'text-danger' : 'text-arcane')}>WARNING</div>
              <div className="mt-2 font-display text-4xl font-black tracking-[0.2em] text-glow text-glow-white sm:text-6xl">{boss.name.toUpperCase()}</div>
              <div className="mt-2 text-sm text-glow/70">{boss.description}</div>
            </motion.div>
          </motion.div>
        )}
        {phase === 'victory' && (
          <motion.div className="absolute inset-0 flex items-center justify-center bg-void/60" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <Particles mode="burst" density={140} speed={1.5} />
            <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.6, type: 'spring' }} className="text-center">
              <div className="font-display text-xs tracking-[0.6em] text-ember">BOSS DEFEATED</div>
              <div className="mt-2 font-display text-4xl font-black tracking-[0.2em] text-glow text-glow-ember sm:text-6xl">{red ? 'GATE CLEARED' : 'DUNGEON CLEARED'}</div>
            </motion.div>
          </motion.div>
        )}
        {phase === 'defeat' && (
          <motion.div className="absolute inset-0 flex items-center justify-center bg-[#1a0008]/80" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <motion.div initial={{ scale: 1.4, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center">
              <div className="font-display text-xs tracking-[0.6em] text-danger">SYSTEM</div>
              <div className="mt-2 font-display text-4xl font-black tracking-[0.2em] text-danger sm:text-6xl">YOU ARE NOT READY.</div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
