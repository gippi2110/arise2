import { useState } from 'react'
import { motion } from 'framer-motion'
import { useGame } from '../store/game'
import { BOSSES } from '../game/content/dungeons'
import { RED_GATE_DIFFICULTIES, clearRedGate, closeRedGate, failRedGate, rankAtLeast, redGateTasksDone, setRedGateTask, startRedGate } from '../game/engine'
import { SHADOWS } from '../game/content/shadows'
import HoloPanel from '../components/ui/HoloPanel'
import SysButton from '../components/ui/SysButton'
import Stepper from '../components/ui/Stepper'
import StatBar from '../components/ui/StatBar'
import Tag from '../components/ui/Tag'
import Particles from '../components/ui/Particles'
import PortalTransition from '../components/cinematics/PortalTransition'
import BossBattle from '../components/BossBattle'
import { fmtDuration } from '../lib/format'
import { useNow } from '../lib/hooks'
import { playSfx } from '../audio'
import clsx from '../lib/clsx'

type Diff = keyof typeof RED_GATE_DIFFICULTIES

export default function RedGate() {
  const state = useGame((s) => s.state)
  const mutate = useGame((s) => s.mutate)
  const now = useNow(500)
  const rg = state.redGate
  const [portal, setPortal] = useState<Diff | null>(null)
  const [battle, setBattle] = useState(false)
  const [result, setResult] = useState<ReturnType<typeof clearRedGate> | null>(null)
  const boss = BOSSES.crimsonHarbinger

  const open = (d: Diff) => {
    let err: string | null = null
    mutate((s) => { err = startRedGate(s, d) })
    if (err) { playSfx('deny'); return }
    setPortal(d)
  }

  if (battle && rg?.status === 'active') {
    const cfg = RED_GATE_DIFFICULTIES[rg.difficulty]
    return <BossBattle boss={boss} red hpMult={cfg.bossHpMult} atkMult={cfg.bossAtkMult} onVictory={() => { let r: ReturnType<typeof clearRedGate> = null; mutate((s) => { r = clearRedGate(s) }); setResult(r); setBattle(false) }} onDefeat={() => { mutate((s) => failRedGate(s)); setBattle(false) }} />
  }

  return (
    <div className="relative space-y-5">
      <Particles mode="red" density={40} className="pointer-events-none fixed inset-0 h-full w-full" />
      <div className="relative">
        <div className="font-display text-[10px] tracking-[0.5em] text-danger animate-flicker">EMERGENCY PROTOCOL</div>
        <h1 className="font-display text-2xl font-black tracking-[0.15em] text-danger" style={{ textShadow: '0 0 20px rgb(var(--c-danger) / 0.8)' }}>RED GATE</h1>
        <p className="text-sm text-glow/70">A survival mode. The gate opens, the clock starts, and nothing leaves until the tasks are done and Malgrath falls. Fail the timer and the gate takes a piece of you.</p>
      </div>

      {rg && rg.status === 'active' && (
        <HoloPanel tone="danger" sweep tag="GATE OPEN" title={`${RED_GATE_DIFFICULTIES[rg.difficulty].label} Red Gate`} right={<div className={clsx('font-display text-2xl font-black tabular-nums text-danger', rg.endsAt - now < 5 * 60_000 && 'animate-pulseGlow')}>{fmtDuration(rg.endsAt - now)}</div>}>
          <StatBar value={rg.endsAt - now} max={rg.endsAt - rg.startedAt} showNumbers={false} color="danger" height="h-1.5" />
          <div className="mt-4 space-y-4">
            {rg.tasks.map((t) => (
              <div key={t.id}>
                <div className="mb-1 flex items-center justify-between font-display text-xs tracking-[0.15em]"><span className={t.progress >= t.target ? 'text-ember' : ''}>{t.text}</span><span className="text-muted">{t.progress} / {t.target} {t.unit}</span></div>
                <Stepper value={t.progress} max={t.target} unit={t.unit} onChange={(v) => mutate((s) => setRedGateTask(s, t.id, v))} disabled={t.progress >= t.target} />
              </div>
            ))}
          </div>
          <div className="mt-5 flex items-center gap-3 border border-danger/40 bg-danger/10 p-3 clip-panel-sm">
            <img src={boss.art} alt="" className="h-16 w-16 flex-none object-cover clip-panel-sm" />
            <div className="flex-1"><div className="font-display text-[10px] tracking-[0.3em] text-danger">WAITING AT THE EXIT</div><div className="font-display text-sm font-bold">{boss.name} · {boss.title}</div><div className="text-xs text-muted">HP ×{RED_GATE_DIFFICULTIES[rg.difficulty].bossHpMult} · ATK ×{RED_GATE_DIFFICULTIES[rg.difficulty].bossAtkMult}</div></div>
          </div>
          <div className="mt-4 flex gap-2">
            <SysButton variant="danger" size="lg" disabled={!redGateTasksDone(state)} onClick={() => setBattle(true)}>CONFRONT MALGRATH</SysButton>
            <SysButton variant="ghost" onClick={() => { if (confirm('Surrender the Red Gate? This counts as a failure.')) mutate((s) => failRedGate(s)) }}>SURRENDER</SysButton>
          </div>
        </HoloPanel>
      )}

      {rg && rg.status !== 'active' && (
        <HoloPanel tone={rg.status === 'cleared' ? 'ember' : 'danger'} tag={rg.status === 'cleared' ? 'SURVIVED' : 'FAILED'} title={rg.status === 'cleared' ? 'The gate is quiet' : 'The gate took its toll'}>
          <p className="text-sm text-glow/80">{rg.status === 'cleared' ? `You survived a ${RED_GATE_DIFFICULTIES[rg.difficulty].label} Red Gate. The Harbinger will remember.` : 'You were not ready. Train, equip, and return.'}</p>
          {result && (
            <div className="mt-3 grid grid-cols-2 gap-3 font-display">
              <div className="holo clip-panel-sm p-3 text-center"><div className="text-[9px] tracking-[0.3em] text-muted">XP</div><div className="text-2xl text-sys">+{result.xp}</div></div>
              <div className="holo clip-panel-sm p-3 text-center"><div className="text-[9px] tracking-[0.3em] text-muted">GOLD</div><div className="text-2xl text-ember">+{result.gold}</div></div>
              {result.extraction && <div className="col-span-2 text-sm">{result.extraction.success ? `Shadow extracted: ${SHADOWS.find((s) => s.id === result.extraction?.id)?.name}.` : result.extraction.full ? 'Shadow capacity full.' : `Extraction failed (${Math.round(result.extraction.chance * 100)}%).`}</div>}
            </div>
          )}
          <div className="mt-4"><SysButton onClick={() => { mutate((s) => closeRedGate(s)); setResult(null) }}>CLOSE THE GATE</SysButton></div>
        </HoloPanel>
      )}

      {!rg && (
        <div className="grid gap-3 md:grid-cols-3">
          {(Object.keys(RED_GATE_DIFFICULTIES) as Diff[]).map((k, i) => {
            const cfg = RED_GATE_DIFFICULTIES[k]
            const ok = rankAtLeast(state.rank, cfg.requiresRank) && !state.activeRun
            return (
              <motion.div key={k} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.12 }}>
                <HoloPanel tone="danger" className={clsx('h-full', !ok && 'opacity-60')} art="/art/dungeon/redgate.webp" artHeight="h-28" tag={cfg.label.toUpperCase()} title={`${cfg.minutes} minutes`} right={<Tag color="#ff3c3c">{cfg.requiresRank}-RANK</Tag>}>
                  <ul className="space-y-1 text-sm text-glow/80">
                    <li>◆ {cfg.tasks} survival tasks</li>
                    <li>◆ Malgrath at HP ×{cfg.bossHpMult}, ATK ×{cfg.bossAtkMult}</li>
                    <li className="text-sys">◆ +{cfg.xp} XP</li>
                    <li className="text-ember">◆ +{cfg.gold} gold, Shadow Core</li>
                    <li className="text-arcane">◆ Extraction attempt (C-Rank+)</li>
                  </ul>
                  <div className="mt-4"><SysButton variant="danger" block disabled={!ok} onClick={() => open(k)}>{ok ? 'OPEN THE RED GATE' : state.activeRun ? 'LEAVE YOUR DUNGEON FIRST' : `REQUIRES ${cfg.requiresRank}-RANK`}</SysButton></div>
                </HoloPanel>
              </motion.div>
            )
          })}
        </div>
      )}

      <HoloPanel tag="RECORD" title="Red Gate history" tone="danger">
        <div className="grid grid-cols-3 gap-3 font-display text-center">
          <div><div className="text-[9px] tracking-[0.3em] text-muted">CLEARED</div><div className="text-2xl text-glow">{state.stats.redGatesCleared}</div></div>
          <div><div className="text-[9px] tracking-[0.3em] text-muted">HARD+</div><div className="text-2xl text-glow">{state.stats.redGateHardCleared}</div></div>
          <div><div className="text-[9px] tracking-[0.3em] text-muted">NIGHTMARE</div><div className="text-2xl text-glow">{state.stats.redGateNightmareCleared}</div></div>
        </div>
      </HoloPanel>

      <PortalTransition open={Boolean(portal)} red art="/art/dungeon/redgate.webp" name="Red Gate" rank={portal ? RED_GATE_DIFFICULTIES[portal].label : ''} objectives={rg?.tasks.map((t) => `${t.text}: ${t.target} ${t.unit}`) ?? []} onDone={() => setPortal(null)} />
    </div>
  )
}
