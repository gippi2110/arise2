import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useGame } from '../store/game'
import { useDerived, useNow } from '../lib/hooks'
import { ATTRS } from '../game/content/attrs'
import { RANK_META } from '../game/content/ranks'
import { currentDailyQuests, setQuestProgress, rankRequirementsMet, nextRank, dungeonFor } from '../game/engine'
import { RED_GATE_DIFFICULTIES } from '../game/engine'
import HoloPanel from '../components/ui/HoloPanel'
import StatBar from '../components/ui/StatBar'
import RadarChart from '../components/ui/RadarChart'
import ProgressRing from '../components/ui/ProgressRing'
import NumberTicker from '../components/ui/NumberTicker'
import SysButton from '../components/ui/SysButton'
import Tag from '../components/ui/Tag'
import { fmtDuration, relTime } from '../lib/format'
import { childVariants } from '../layout/SectionIntro'

export default function Dashboard() {
  const state = useGame((s) => s.state)
  const mutate = useGame((s) => s.mutate)
  const d = useDerived()
  const now = useNow(1000)
  const rank = RANK_META[state.rank]
  const daily = currentDailyQuests(state)
  const done = daily.filter((q) => q.completedAt).length
  const next = nextRank(state.rank)
  const req = next ? rankRequirementsMet(state, next) : null
  const run = state.activeRun ? dungeonFor(state.activeRun.dungeonId) : null
  const recent = state.notifications.slice(0, 4)

  return (
    <div className="grid gap-4 lg:grid-cols-12">
      {/* Hero */}
      <motion.div variants={childVariants} className="lg:col-span-8">
        <HoloPanel sweep noPad className="overflow-hidden">
          <div className="relative flex flex-col gap-5 p-5 sm:flex-row sm:items-center">
            <div className="relative mx-auto h-36 w-36 flex-none sm:mx-0 sm:h-44 sm:w-44">
              <div className="absolute inset-0 animate-spinSlow rounded-full border border-dashed border-sys/50" />
              <div className="absolute inset-2 animate-spinRev rounded-full border border-arcane/50" />
              <img src={state.profile.avatar} alt="" className="absolute inset-4 h-[calc(100%-2rem)] w-[calc(100%-2rem)] rounded-full object-cover" style={{ boxShadow: `0 0 40px ${rank.color}88` }} />
              <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 clip-tag px-3 py-0.5 font-display text-xs font-black tracking-[0.3em] text-void" style={{ background: rank.color }}>{rank.label}-RANK</div>
            </div>
            <div className="min-w-0 flex-1">
              <div className="font-display text-[10px] tracking-[0.5em] text-sys">PLAYER</div>
              <div className="truncate font-display text-3xl font-black tracking-[0.12em] text-glow text-glow-sys">{state.profile.name.toUpperCase()}</div>
              <div className="mt-0.5 text-sm text-muted">{rank.title} · {state.profile.title}</div>
              <div className="mt-4 flex items-end gap-3">
                <div className="font-display"><span className="text-[10px] tracking-[0.3em] text-muted">LEVEL</span><div className="text-4xl font-black leading-none text-glow"><NumberTicker value={state.level} /></div></div>
                <div className="flex-1 pb-1"><StatBar label="EXPERIENCE" value={state.xp} max={d.xpNext} color="sys" height="h-2.5" /></div>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-3">
                <StatBar label="HP" value={state.hp} max={d.maxHp} color="hp" />
                <StatBar label="MP" value={state.mp} max={d.maxMp} color="mp" />
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 divide-x divide-y divide-sys/10 border-t border-sys/15 sm:grid-cols-4 sm:divide-y-0">
            {[
              ['GOLD', state.gold.toLocaleString(), 'text-ember'],
              ['STAT POINTS', String(state.statPoints), state.statPoints > 0 ? 'text-ember animate-pulseGlow' : 'text-glow'],
              ['STREAK', `${state.streak.current}d`, 'text-sys'],
              ['SHADOW ARMY', `${state.shadows.length} / ${d.capacity}`, 'text-arcane'],
            ].map(([k, v, c]) => (
              <div key={k} className="px-4 py-3">
                <div className="font-display text-[9px] tracking-[0.3em] text-muted">{k}</div>
                <div className={`font-display text-xl font-bold ${c}`}>{v}</div>
              </div>
            ))}
          </div>
        </HoloPanel>
      </motion.div>

      {/* Daily quest status */}
      <motion.div variants={childVariants} className="lg:col-span-4">
        <HoloPanel tag="DAILY QUEST" title="The path to becoming stronger" className="h-full" right={<ProgressRing pct={daily.length ? done / daily.length : 0} size={54}><span className="font-display text-xs font-bold">{done}/{daily.length}</span></ProgressRing>}>
          <div className="space-y-2">
            {daily.slice(0, 5).map((q) => (
              <div key={q.id} className="flex items-center gap-2">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className={`truncate font-display tracking-wider ${q.completedAt ? 'text-sys line-through opacity-70' : ''}`}>{q.name}</span>
                    <span className="font-display tabular-nums text-muted">{q.progress}/{q.target}</span>
                  </div>
                  <StatBar value={q.progress} max={q.target} showNumbers={false} height="h-1" color={q.completedAt ? 'sys' : 'arcane'} />
                </div>
                {!q.completedAt && (
                  <button type="button" onClick={() => mutate((s) => setQuestProgress(s, q.id, q.progress + Math.max(1, Math.round(q.target / 10))))} className="clip-tag border border-sys/40 bg-sys/10 px-2 py-1 font-display text-[10px] font-bold hover:bg-sys/25">+</button>
                )}
              </div>
            ))}
            {daily.length === 0 && <div className="text-sm text-muted">No daily quests are active. Create some in the quest log.</div>}
          </div>
          <div className="mt-4 flex items-center justify-between text-[11px] text-muted">
            <span>Resets in {fmtDuration(new Date().setHours(24, 0, 0, 0) - now)}</span>
            <Link to="/quests" className="font-display tracking-[0.25em] text-sys">OPEN LOG ›</Link>
          </div>
        </HoloPanel>
      </motion.div>

      {/* Active threats */}
      {(run || state.redGate?.status === 'active') && (
        <motion.div variants={childVariants} className="lg:col-span-12">
          <HoloPanel tone={state.redGate?.status === 'active' ? 'danger' : 'arcane'} noPad className="overflow-hidden">
            <div className="flex flex-col items-start gap-3 p-4 sm:flex-row sm:items-center">
              <div className="flex-1">
                <div className="font-display text-[10px] tracking-[0.4em] text-ember">{state.redGate?.status === 'active' ? 'RED GATE ACTIVE' : 'DUNGEON IN PROGRESS'}</div>
                <div className="font-display text-lg font-bold tracking-[0.15em]">{state.redGate?.status === 'active' ? `${RED_GATE_DIFFICULTIES[state.redGate.difficulty].label} Red Gate` : run?.name}</div>
                <div className="text-sm text-muted">
                  {state.redGate?.status === 'active' ? `Time remaining ${fmtDuration(state.redGate.endsAt - now)}` : state.activeRun?.endsAt ? `Gate closes in ${fmtDuration(state.activeRun.endsAt - now)}` : 'No time limit'}
                </div>
              </div>
              <Link to={state.redGate?.status === 'active' ? '/red-gate' : '/dungeons'}><SysButton variant={state.redGate?.status === 'active' ? 'danger' : 'arcane'}>RETURN TO THE FIGHT</SysButton></Link>
            </div>
          </HoloPanel>
        </motion.div>
      )}

      {/* Attributes */}
      <motion.div variants={childVariants} className="lg:col-span-5">
        <HoloPanel tag="ATTRIBUTES" title="Combat profile" className="h-full" right={<Link to="/status" className="font-display text-[10px] tracking-[0.3em] text-sys">ALLOCATE ›</Link>}>
          <RadarChart values={ATTRS.map((a) => ({ label: a.short, value: state.attrs[a.key] }))} size={260} />
          <div className="mt-2 grid grid-cols-3 gap-2 font-display text-[10px] tracking-[0.2em]">
            <div className="text-center"><div className="text-muted">ATTACK</div><div className="text-base text-glow">{d.attack}</div></div>
            <div className="text-center"><div className="text-muted">DEFENSE</div><div className="text-base text-glow">{d.defense}</div></div>
            <div className="text-center"><div className="text-muted">CRIT</div><div className="text-base text-glow">{d.critChance}%</div></div>
          </div>
        </HoloPanel>
      </motion.div>

      {/* Next rank + stats */}
      <motion.div variants={childVariants} className="lg:col-span-4">
        <HoloPanel tag="PROGRESSION" title={next ? `Path to ${RANK_META[next].label}-Rank` : 'National Level'} tone="ember" className="h-full">
          {req ? (
            <ul className="space-y-2">
              {req.checks.map((c) => (
                <li key={c.label} className="flex items-center gap-2 text-sm">
                  <span className={`clip-tag px-1.5 font-display text-[9px] ${c.ok ? 'bg-sys text-void' : 'border border-glow/20 text-muted'}`}>{c.ok ? 'DONE' : 'OPEN'}</span>
                  <span className={c.ok ? 'text-glow/60 line-through' : ''}>{c.label}</span>
                </li>
              ))}
            </ul>
          ) : <div className="text-sm text-glow/80">You stand at the summit. The Monarch's Throne is yours.</div>}
          <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 border-t border-glow/10 pt-3 font-display text-[10px] tracking-[0.2em] text-muted">
            <div>MISSIONS <span className="float-right text-glow">{state.stats.questsCompleted}</span></div>
            <div>DUNGEONS <span className="float-right text-glow">{state.stats.dungeonsCleared}</span></div>
            <div>BOSSES <span className="float-right text-glow">{state.stats.bossesDefeated}</span></div>
            <div>BEST STREAK <span className="float-right text-glow">{state.streak.best}d</span></div>
          </div>
        </HoloPanel>
      </motion.div>

      {/* Recent system events */}
      <motion.div variants={childVariants} className="lg:col-span-3">
        <HoloPanel tag="SYSTEM LOG" title="Recent" className="h-full" right={<Link to="/notifications" className="font-display text-[10px] tracking-[0.3em] text-sys">ALL ›</Link>}>
          <div className="space-y-3">
            {recent.map((n) => (
              <div key={n.id} className="border-l-2 pl-2 text-xs" style={{ borderColor: n.style === 'warning' ? 'rgb(var(--c-danger))' : n.style === 'epic' ? 'rgb(var(--c-accent))' : n.style === 'dark' ? 'rgb(var(--c-secondary))' : 'rgb(var(--c-primary))' }}>
                <div className="font-display tracking-[0.15em] text-glow/90">{n.title}</div>
                <div className="text-muted">{relTime(n.at)}</div>
              </div>
            ))}
            {recent.length === 0 && <div className="text-sm text-muted">The System is quiet. For now.</div>}
          </div>
        </HoloPanel>
      </motion.div>

      {/* Quick gates */}
      <motion.div variants={childVariants} className="lg:col-span-12">
        <div className="grid gap-3 sm:grid-cols-3">
          {[
            { to: '/dungeons', art: '/art/dungeon/normal.webp', k: 'GATES', t: 'Enter a dungeon', d: 'Objectives, then the boss.' },
            { to: '/red-gate', art: '/art/dungeon/redgate.webp', k: 'EMERGENCY', t: 'Red Gate', d: `Survival mode · ${state.rank === 'E' || state.rank === 'D' || state.rank === 'C' ? 'B-Rank required' : 'available'}` },
            { to: '/shadows', art: '/art/bg/shadows.webp', k: 'ARMY', t: 'Shadow Monarch', d: `${state.shadows.length} shadows under command.` },
          ].map((c) => (
            <Link key={c.to} to={c.to} className="group relative h-28 overflow-hidden clip-panel border border-sys/20">
              <img src={c.art} alt="" className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-110" />
              <div className="absolute inset-0 bg-gradient-to-r from-void via-void/70 to-transparent" />
              <div className="relative flex h-full flex-col justify-center p-4">
                <Tag className="w-max bg-sys/20 text-sys">{c.k}</Tag>
                <div className="mt-1 font-display text-base font-bold tracking-[0.15em]">{c.t}</div>
                <div className="text-xs text-muted">{c.d}</div>
              </div>
            </Link>
          ))}
        </div>
      </motion.div>
    </div>
  )
}
