import type {
  AttrKey, Cinematic, Difficulty, DungeonDef, GameState, HistoryEvent, NoticeStyle, Quest, QuestCadence, QuestCategory, Rank, Settings,
} from './types'
import { ATTRS } from './content/attrs'
import { RANKS, RANK_META, xpForLevel } from './content/ranks'
import { CATEGORY_ATTRS, DEFAULT_QUESTS, makeQuest, questRewards } from './content/quests'
import { DUNGEONS, dailyObjectives } from './content/dungeons'
import { SHADOWS, shadowPower, shadowXpForLevel } from './content/shadows'
import { SKILL_BY_ID } from './content/skills'
import { ITEM_BY_ID } from './content/items'
import { ACHIEVEMENTS } from './content/achievements'

export const SCHEMA_VERSION = 1
export const STAT_POINTS_PER_LEVEL = 3

// ---------- time helpers ----------
export function dayKey(d = new Date()) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}
export function monthKey(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}
export function weekKey(d = new Date()) {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()))
  const dayNum = date.getUTCDay() || 7
  date.setUTCDate(date.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1))
  const week = Math.ceil(((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7)
  return `${date.getUTCFullYear()}-W${String(week).padStart(2, '0')}`
}
export function periodKey(cadence: QuestCadence, d = new Date()) {
  if (cadence === 'daily') return dayKey(d)
  if (cadence === 'weekly') return weekKey(d)
  if (cadence === 'monthly') return monthKey(d)
  return 'secret'
}
export function periodEnd(cadence: QuestCadence, d = new Date()) {
  const end = new Date(d)
  if (cadence === 'daily') end.setHours(24, 0, 0, 0)
  else if (cadence === 'weekly') {
    const day = end.getDay() || 7
    end.setDate(end.getDate() + (8 - day))
    end.setHours(0, 0, 0, 0)
  } else if (cadence === 'monthly') {
    end.setMonth(end.getMonth() + 1, 1)
    end.setHours(0, 0, 0, 0)
  } else return null
  return end.getTime()
}
export function previousDay(key: string) {
  const [y, m, d] = key.split('-').map(Number)
  const date = new Date(y, m - 1, d - 1)
  return dayKey(date)
}
export function isWeekend(d = new Date()) {
  const day = d.getDay()
  return day === 0 || day === 6
}

const uid = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 9)}`

// ---------- initial state ----------
export function defaultSettings(): Settings {
  const activityRewards = Object.fromEntries(
    (Object.keys(CATEGORY_ATTRS) as QuestCategory[]).map((c) => [c, { xpMultiplier: 1, attrs: { ...CATEGORY_ATTRS[c] } }]),
  ) as Settings['activityRewards']
  return {
    theme: 'monarch',
    masterVolume: 0.9,
    voiceVolume: 1,
    sfxVolume: 0.8,
    musicVolume: 0.35,
    voiceEnabled: true,
    musicEnabled: true,
    voiceRate: 0.82,
    voicePitch: 0.45,
    voiceURI: null,
    preferPremiumVoice: true,
    reduceMotion: false,
    penaltiesEnabled: true,
    penaltyPercent: 100,
    introSeen: false,
    activityRewards,
  }
}

export function initialState(): GameState {
  const now = Date.now()
  return {
    schema: SCHEMA_VERSION,
    profile: { name: '', title: 'The Awakened', avatar: '/art/avatar/a1.webp', awakenedAt: null },
    level: 1,
    rank: 'E',
    xp: 0,
    totalXp: 0,
    gold: 100,
    statPoints: 10,
    attrs: Object.fromEntries(ATTRS.map((a) => [a.key, 10])) as Record<AttrKey, number>,
    hp: 186,
    mp: 103,
    quests: DEFAULT_QUESTS.map((t) => makeQuest(t, periodKey(t.cadence), now)),
    streak: { current: 0, best: 0, lastFullDay: null },
    login: { lastRewardDay: null, streak: 0 },
    dungeonClears: {},
    stats: {
      questsCompleted: 0, dungeonsCleared: 0, bossesDefeated: 0, redGatesCleared: 0, redGateHardCleared: 0, redGateNightmareCleared: 0,
      instantCleared: 0, normalCleared: 0, bossDungeonsCleared: 0, questsFailed: 0, goldEarned: 0, extractionsAttempted: 0,
    },
    shadows: [],
    shadowCapacityBonus: 0,
    skills: {},
    inventory: { 'hp-potion': 2, 'mp-potion': 1 },
    equipment: {},
    achievements: {},
    notifications: [],
    history: [],
    rankHistory: [{ rank: 'E', at: now, level: 1 }],
    dailyLog: {},
    workouts: [
      {
        id: 'w_default', name: 'Hunter Foundations', xp: 120, timesDone: 0, bestDurationSec: null,
        attrs: { strength: 2, vitality: 1, endurance: 1 },
        exercises: [
          { id: 'e1', name: 'Push-ups', sets: 4, reps: 20, weightKg: 0 },
          { id: 'e2', name: 'Squats', sets: 4, reps: 25, weightKg: 0 },
          { id: 'e3', name: 'Plank (seconds)', sets: 3, reps: 60, weightKg: 0 },
        ],
      },
    ],
    trainingSessions: [],
    activeRun: null,
    redGate: null,
    settings: defaultSettings(),
    cinematics: [],
    savedAt: now,
  }
}

// ---------- derived values ----------
export function equipmentBonuses(s: GameState) {
  const attrs: Partial<Record<AttrKey, number>> = {}
  let attack = 0, defense = 0, crit = 0
  for (const id of Object.values(s.equipment)) {
    const item = id ? ITEM_BY_ID[id] : undefined
    if (!item) continue
    for (const [k, v] of Object.entries(item.attrs)) attrs[k as AttrKey] = (attrs[k as AttrKey] ?? 0) + (v ?? 0)
    attack += item.battle?.attack ?? 0
    defense += item.battle?.defense ?? 0
    crit += item.battle?.crit ?? 0
  }
  return { attrs, attack, defense, crit }
}

export function effectiveAttrs(s: GameState): Record<AttrKey, number> {
  const eq = equipmentBonuses(s).attrs
  return Object.fromEntries(ATTRS.map((a) => [a.key, s.attrs[a.key] + (eq[a.key] ?? 0)])) as Record<AttrKey, number>
}

export function maxHp(s: GameState) {
  const a = effectiveAttrs(s)
  return 100 + a.vitality * 8 + s.level * 6
}
export function maxMp(s: GameState) {
  const a = effectiveAttrs(s)
  return 40 + a.intelligence * 6 + s.level * 3
}

export function shadowCapacity(s: GameState) {
  return 2 + Math.floor(s.level / 5) + (s.skills['shadow-storage'] ?? 0) + s.shadowCapacityBonus
}

export function armyPower(s: GameState) {
  const storage = s.skills['shadow-storage'] ?? 0
  let total = 0
  for (const sh of s.shadows) {
    const def = SHADOWS.find((d) => d.id === sh.id)
    if (def) total += shadowPower(def, sh.level)
  }
  const wyrm = s.shadows.some((sh) => sh.id === 'kurogane') ? 1.2 : 1
  return Math.round(total * (1 + storage * 0.05) * wyrm)
}

export function battleStats(s: GameState) {
  const a = effectiveAttrs(s)
  const eq = equipmentBonuses(s)
  const dagger = s.skills['dagger-mastery'] ?? 0
  return {
    attack: Math.round(8 + a.strength * 1.2 + a.agility * 0.4 + eq.attack),
    defense: Math.round(a.endurance * 0.6 + a.vitality * 0.3 + eq.defense),
    critChance: Math.min(75, Math.round(5 + a.sense * 0.5 + eq.crit + dagger * 6)),
    critMult: 1.6 + dagger * 0.1,
    maxHp: maxHp(s),
    maxMp: maxMp(s),
    armyPower: armyPower(s),
  }
}

export function xpToNext(s: GameState) {
  return xpForLevel(s.level)
}

export function rankRequirementsMet(s: GameState, rank: Rank): { met: boolean; checks: { label: string; ok: boolean }[] } {
  const shadows = s.shadows.length
  const st = s.stats
  const table: Record<Rank, { label: string; ok: boolean }[]> = {
    E: [],
    D: [
      { label: 'Reach level 10', ok: s.level >= 10 },
      { label: 'Clear 3 dungeons', ok: st.dungeonsCleared >= 3 },
    ],
    C: [
      { label: 'Reach level 20', ok: s.level >= 20 },
      { label: 'Clear 10 dungeons', ok: st.dungeonsCleared >= 10 },
      { label: 'Best streak 7 days', ok: s.streak.best >= 7 },
    ],
    B: [
      { label: 'Reach level 35', ok: s.level >= 35 },
      { label: 'Defeat 5 bosses', ok: st.bossesDefeated >= 5 },
      { label: 'Best streak 14 days', ok: s.streak.best >= 14 },
    ],
    A: [
      { label: 'Reach level 50', ok: s.level >= 50 },
      { label: 'Clear 1 Red Gate', ok: st.redGatesCleared >= 1 },
      { label: 'Complete 200 quests', ok: st.questsCompleted >= 200 },
    ],
    S: [
      { label: 'Reach level 70', ok: s.level >= 70 },
      { label: 'Clear 3 Red Gates', ok: st.redGatesCleared >= 3 },
      { label: 'Best streak 30 days', ok: s.streak.best >= 30 },
      { label: 'Command 5 shadows', ok: shadows >= 5 },
    ],
    NATIONAL: [
      { label: 'Reach level 100', ok: s.level >= 100 },
      { label: 'Command 8 shadows', ok: shadows >= 8 },
      { label: 'Complete 500 quests', ok: st.questsCompleted >= 500 },
      { label: 'Clear a Nightmare Red Gate', ok: st.redGateNightmareCleared >= 1 },
    ],
  }
  const checks = table[rank]
  return { met: checks.every((c) => c.ok), checks }
}

export function nextRank(rank: Rank): Rank | null {
  const i = RANKS.indexOf(rank)
  return i < RANKS.length - 1 ? RANKS[i + 1] : null
}

export function rankAtLeast(have: Rank, need: Rank | undefined) {
  if (!need) return true
  return RANKS.indexOf(have) >= RANKS.indexOf(need)
}

// ---------- mutation helpers (operate on an immer draft) ----------
type CinematicInput = Cinematic extends infer C ? (C extends { id: string } ? Omit<C, 'id'> : never) : never

export function pushCinematic(d: GameState, c: CinematicInput) {
  d.cinematics.push({ ...c, id: uid() } as Cinematic)
}

export function notify(d: GameState, style: NoticeStyle, title: string, body: string, opts?: { voice?: string; silent?: boolean; lines?: string[] }) {
  d.notifications.unshift({ id: uid(), at: Date.now(), style, title, body, read: false })
  if (d.notifications.length > 200) d.notifications.length = 200
  if (!opts?.silent) pushCinematic(d, { kind: 'notice', style, title, lines: opts?.lines ?? [body], voice: opts?.voice })
}

export function addHistory(d: GameState, kind: HistoryEvent['kind'], title: string, xp = 0, gold = 0) {
  d.history.unshift({ id: uid(), at: Date.now(), kind, title, xp, gold, synced: false })
  if (d.history.length > 1500) d.history.length = 1500
  const key = dayKey()
  const log = (d.dailyLog[key] ??= { xp: 0, quests: 0, questsTotal: 0, gold: 0, categories: {} })
  log.xp += Math.max(0, xp)
  log.gold += Math.max(0, gold)
}

export function grantGold(d: GameState, amount: number) {
  if (amount <= 0) return
  d.gold += amount
  d.stats.goldEarned += amount
}

export function addAttrs(d: GameState, attrs: Partial<Record<AttrKey, number>>) {
  const changed: string[] = []
  for (const [k, v] of Object.entries(attrs)) {
    if (!v) continue
    d.attrs[k as AttrKey] += v
    changed.push(`${ATTRS.find((a) => a.key === k)?.short ?? k} +${v}`)
  }
  return changed
}

export function grantXp(d: GameState, amount: number) {
  if (amount <= 0) return
  d.xp += amount
  d.totalXp += amount
  const from = d.level
  let points = 0
  while (d.xp >= xpForLevel(d.level)) {
    d.xp -= xpForLevel(d.level)
    d.level += 1
    points += STAT_POINTS_PER_LEVEL
  }
  if (d.level > from) {
    d.statPoints += points
    d.hp = maxHp(d)
    d.mp = maxMp(d)
    pushCinematic(d, { kind: 'levelUp', from, to: d.level, points })
    d.notifications.unshift({ id: uid(), at: Date.now(), style: 'epic', title: 'LEVEL UP', body: `You reached level ${d.level}. ${points} new stat points available.`, read: false })
    addHistory(d, 'level', `Reached level ${d.level}`)
    checkRankUp(d)
    checkShadowUnlocks(d)
  }
}

export function losXp(d: GameState, amount: number) {
  if (amount <= 0) return 0
  const lost = Math.min(d.xp, amount)
  d.xp -= lost
  return lost
}

export function checkRankUp(d: GameState) {
  let promoted = false
  let next = nextRank(d.rank)
  while (next && rankRequirementsMet(d, next).met) {
    const from = d.rank
    d.rank = next
    d.rankHistory.push({ rank: next, at: Date.now(), level: d.level })
    pushCinematic(d, { kind: 'rankUp', from, to: next })
    d.notifications.unshift({ id: uid(), at: Date.now(), style: 'epic', title: 'RANK PROMOTION', body: `You are now ${RANK_META[next].title}. Unlocked: ${RANK_META[next].unlocks}.`, read: false })
    addHistory(d, 'rank', `Promoted to ${RANK_META[next].title}`)
    promoted = true
    next = nextRank(d.rank)
  }
  if (promoted) checkAchievements(d)
}

export function unlockAchievement(d: GameState, id: string) {
  if (d.achievements[id]) return false
  const def = ACHIEVEMENTS.find((a) => a.id === id)
  if (!def) return false
  d.achievements[id] = Date.now()
  pushCinematic(d, { kind: 'achievement', achievementId: id })
  d.notifications.unshift({ id: uid(), at: Date.now(), style: 'epic', title: 'ACHIEVEMENT UNLOCKED', body: `${def.name}: ${def.description}`, read: false })
  addHistory(d, 'achievement', `Achievement: ${def.name}`, def.xp, def.gold)
  grantGold(d, def.gold)
  grantXp(d, def.xp)
  return true
}

export function checkAchievements(d: GameState) {
  const st = d.stats
  const maxSkill = Math.max(0, ...Object.values(d.skills))
  const conditions: [string, boolean][] = [
    ['first-awakening', d.profile.awakenedAt !== null],
    ['first-quest', st.questsCompleted >= 1],
    ['first-dungeon', st.dungeonsCleared >= 1],
    ['first-promotion', d.rank !== 'E'],
    ['streak-7', d.streak.best >= 7],
    ['streak-30', d.streak.best >= 30],
    ['quests-100', st.questsCompleted >= 100],
    ['boss-slayer', st.bossesDefeated >= 10],
    ['red-gate-survivor', st.redGatesCleared >= 1],
    ['first-shadow', d.shadows.length >= 1],
    ['shadow-monarch', d.shadows.length >= SHADOWS.length],
    ['gold-hoarder', st.goldEarned >= 10000],
    ['skill-master', maxSkill >= 5],
    ['ultimate-hunter', d.rank === 'NATIONAL'],
  ]
  for (const [id, ok] of conditions) if (ok) unlockAchievement(d, id)
}

export function unlockShadow(d: GameState, id: string) {
  if (d.shadows.some((s) => s.id === id)) return false
  if (d.shadows.length >= shadowCapacity(d)) return false
  const def = SHADOWS.find((s) => s.id === id)
  if (!def) return false
  d.shadows.push({ id, unlockedAt: Date.now(), level: 1, xp: 0 })
  pushCinematic(d, { kind: 'shadowArise', shadowId: id })
  d.notifications.unshift({ id: uid(), at: Date.now(), style: 'dark', title: 'SHADOW EXTRACTED', body: `${def.name}, ${def.title}, has joined your army.`, read: false })
  addHistory(d, 'shadow', `Extracted ${def.name}`)
  checkAchievements(d)
  return true
}

export function checkShadowUnlocks(d: GameState) {
  for (const def of SHADOWS) {
    if (d.shadows.some((s) => s.id === def.id)) continue
    const u = def.unlock
    let ok = false
    if (u.kind === 'boss') ok = d.stats.bossesDefeated >= u.value
    else if (u.kind === 'dungeons') ok = d.stats.dungeonsCleared >= u.value
    else if (u.kind === 'streak') ok = d.streak.best >= u.value
    else if (u.kind === 'attr' && u.attr) ok = d.attrs[u.attr] >= u.value
    else if (u.kind === 'quests') ok = d.stats.questsCompleted >= u.value
    else if (u.kind === 'extraction') ok = d.stats.instantCleared >= u.value
    else if (u.kind === 'redgate') ok = d.stats.redGateHardCleared >= u.value
    if (ok) unlockShadow(d, def.id)
  }
}

/** Attempt a shadow extraction after a boss. Returns the extracted shadow id or null. */
export function attemptExtraction(d: GameState, bonusChance: number) {
  d.stats.extractionsAttempted += 1
  const skill = d.skills['shadow-extraction'] ?? 0
  const chance = Math.min(0.95, bonusChance + (skill > 0 ? 0.35 + skill * 0.12 : 0.15))
  const target = SHADOWS.find((s) => !d.shadows.some((o) => o.id === s.id))
  if (!target || d.shadows.length >= shadowCapacity(d)) return { success: false, chance, id: null as string | null, full: true }
  const roll = Math.random()
  if (roll <= chance) {
    unlockShadow(d, target.id)
    return { success: true, chance, id: target.id, full: false }
  }
  return { success: false, chance, id: null as string | null, full: false }
}

export function grantShadowXp(d: GameState, amount: number) {
  for (const sh of d.shadows) {
    sh.xp += amount
    while (sh.xp >= shadowXpForLevel(sh.level) && sh.level < 35) {
      sh.xp -= shadowXpForLevel(sh.level)
      sh.level += 1
      if (sh.level % 5 === 1) {
        const def = SHADOWS.find((s) => s.id === sh.id)
        d.notifications.unshift({ id: uid(), at: Date.now(), style: 'dark', title: 'SHADOW EVOLVED', body: `${def?.name ?? 'A shadow'} has evolved. Its power grows.`, read: false })
      }
    }
  }
}

// ---------- quests ----------
export function currentDailyQuests(d: GameState) {
  return d.quests.filter((q) => q.cadence === 'daily' && q.active)
}

function markDayLog(d: GameState) {
  const key = dayKey()
  const daily = currentDailyQuests(d)
  const log = (d.dailyLog[key] ??= { xp: 0, quests: 0, questsTotal: 0, gold: 0, categories: {} })
  log.questsTotal = daily.length
  log.quests = daily.filter((q) => q.completedAt).length
}

export function evaluateStreak(d: GameState) {
  const daily = currentDailyQuests(d)
  if (daily.length === 0) return
  const today = dayKey()
  const allDone = daily.every((q) => q.completedAt)
  if (!allDone || d.streak.lastFullDay === today) return
  if (d.streak.lastFullDay === previousDay(today)) d.streak.current += 1
  else d.streak.current = 1
  d.streak.lastFullDay = today
  d.streak.best = Math.max(d.streak.best, d.streak.current)
  const bonus = Math.min(200, 20 * d.streak.current)
  addAttrs(d, { consistency: 1, discipline: d.streak.current % 7 === 0 ? 1 : 0 })
  grantGold(d, bonus)
  notify(d, 'epic', 'DAILY QUEST COMPLETE', `Every daily mission is done. Streak: ${d.streak.current} day${d.streak.current === 1 ? '' : 's'}. Bonus ${bonus} gold granted.`, { voice: 'You have completed your daily quest. Your discipline is noted.' })
  addHistory(d, 'quest', `Daily streak ${d.streak.current}`, 0, bonus)
  grantXp(d, bonus)
  checkShadowUnlocks(d)
  checkAchievements(d)
}

export function completeQuest(d: GameState, q: Quest) {
  if (q.completedAt) return
  q.completedAt = Date.now()
  q.timesCompleted += 1
  const mult = d.settings.activityRewards[q.category]?.xpMultiplier ?? 1
  const xp = Math.round(q.xp * mult)
  const gold = q.gold
  d.stats.questsCompleted += 1
  const changed = addAttrs(d, q.attrs)
  grantGold(d, gold)
  addHistory(d, 'quest', `Completed ${q.name}`, xp, gold)
  const log = d.dailyLog[dayKey()]
  if (log) log.categories[q.category] = (log.categories[q.category] ?? 0) + 1
  pushCinematic(d, { kind: 'questComplete', questName: q.name, xp, gold })
  d.notifications.unshift({ id: uid(), at: Date.now(), style: 'quest', title: 'QUEST COMPLETED', body: `${q.name}: +${xp} XP, +${gold} gold${changed.length ? `, ${changed.join(', ')}` : ''}.`, read: false })
  grantXp(d, xp)
  grantShadowXp(d, Math.round(xp * 0.4))
  if (q.cadence === 'secret') unlockAchievement(d, 'silent-hour')
  markDayLog(d)
  evaluateStreak(d)
  revealSecrets(d)
  checkShadowUnlocks(d)
  checkAchievements(d)
}

export function setQuestProgress(d: GameState, id: string, value: number) {
  const q = d.quests.find((x) => x.id === id)
  if (!q || !q.active) return
  const v = Math.max(0, Math.min(q.target, Math.round(value * 100) / 100))
  if (q.completedAt) {
    // Completed quests keep their reward; progress can still be raised to track overachievement records.
    q.progress = Math.max(q.progress, v)
    q.record = Math.max(q.record, q.progress)
    return
  }
  q.progress = v
  q.record = Math.max(q.record, v)
  if (q.progress >= q.target) completeQuest(d, q)
}

export function revealSecrets(d: GameState) {
  for (const q of d.quests) {
    if (q.cadence !== 'secret' || q.revealed) continue
    if (q.name === 'Midnight Training' && d.streak.current >= 3) q.revealed = true
    if (q.name === 'The Silent Hour' && d.attrs.sense >= 25) q.revealed = true
    if (q.revealed) notify(d, 'dark', 'SECRET QUEST REVEALED', `A hidden mission has surfaced: ${q.name}.`, { voice: 'A secret quest has been revealed.' })
  }
}

/** Roll quests into the current period, applying failure penalties where configured. */
export function rolloverQuests(d: GameState) {
  const failed: Quest[] = []
  for (const q of d.quests) {
    if (q.cadence === 'secret') continue
    const key = periodKey(q.cadence)
    if (q.periodKey === key) continue
    if (q.active && !q.completedAt && q.progress < q.target) failed.push(q)
    q.periodKey = key
    q.progress = 0
    q.completedAt = null
  }
  if (failed.length) {
    d.stats.questsFailed += failed.length
    let lost = 0
    if (d.settings.penaltiesEnabled) {
      for (const q of failed) lost += losXp(d, Math.round(q.penaltyXp * (d.settings.penaltyPercent / 100)))
    }
    const names = failed.slice(0, 3).map((q) => q.name).join(', ') + (failed.length > 3 ? ` and ${failed.length - 3} more` : '')
    notify(d, 'warning', 'QUEST FAILED', `${failed.length} mission${failed.length === 1 ? '' : 's'} expired incomplete: ${names}.${lost ? ` Penalty: -${lost} XP.` : ' No penalty applied.'}`, {
      voice: 'You have failed to complete your quest. The System is watching.',
    })
    addHistory(d, 'penalty', `${failed.length} quest${failed.length === 1 ? '' : 's'} failed`, -lost, 0)
  }
  // Streak break: a full day passed without completing every daily quest.
  const today = dayKey()
  if (d.streak.current > 0 && d.streak.lastFullDay && d.streak.lastFullDay !== today && d.streak.lastFullDay !== previousDay(today)) {
    notify(d, 'warning', 'STREAK BROKEN', `Your ${d.streak.current}-day streak has ended. Begin again.`, { voice: 'Your streak has been broken.' })
    d.streak.current = 0
  }
  // Abandon expired dungeon runs.
  if (d.activeRun && d.activeRun.endsAt && Date.now() > d.activeRun.endsAt && d.activeRun.status !== 'cleared') {
    d.activeRun = null
    notify(d, 'warning', 'DUNGEON COLLAPSED', 'The gate closed before you finished. The dungeon was lost.', { voice: 'The gate has closed. You were not fast enough.' })
  }
  if (d.redGate && d.redGate.status === 'active' && Date.now() > d.redGate.endsAt) {
    d.redGate.status = 'failed'
    notify(d, 'warning', 'RED GATE FAILED', 'Time ran out inside the Red Gate.', { voice: 'You were not ready.' })
  }
  markDayLog(d)
}

export function dailyLogin(d: GameState) {
  const today = dayKey()
  if (d.login.lastRewardDay === today) return
  d.login.streak = d.login.lastRewardDay === previousDay(today) ? d.login.streak + 1 : 1
  d.login.lastRewardDay = today
  const gold = 40 + Math.min(10, d.login.streak) * 15
  const xp = 20 + Math.min(10, d.login.streak) * 8
  grantGold(d, gold)
  addHistory(d, 'login', `Daily login (day ${d.login.streak})`, xp, gold)
  notify(d, 'normal', 'DAILY LOGIN REWARD', `Day ${d.login.streak}. +${gold} gold, +${xp} XP. Your daily quest has arrived.`, { voice: 'Player. Your daily quest has arrived.' })
  grantXp(d, xp)
  d.hp = maxHp(d)
  d.mp = maxMp(d)
}

export function createQuest(d: GameState, input: { name: string; description: string; category: QuestCategory; cadence: QuestCadence; difficulty: Difficulty; target: number; unit: string; attrs?: Partial<Record<AttrKey, number>> }) {
  const q = makeQuest({ ...input }, periodKey(input.cadence))
  q.attrs = input.attrs ?? { ...(d.settings.activityRewards[input.category]?.attrs ?? CATEGORY_ATTRS[input.category]) }
  q.revealed = true
  d.quests.push(q)
  return q
}

export function updateQuest(d: GameState, id: string, patch: Partial<Pick<Quest, 'name' | 'description' | 'category' | 'difficulty' | 'target' | 'unit' | 'attrs' | 'active' | 'cadence'>>) {
  const q = d.quests.find((x) => x.id === id)
  if (!q) return
  Object.assign(q, patch)
  if (patch.difficulty || patch.cadence) {
    const r = questRewards(q.difficulty, q.cadence)
    q.xp = r.xp
    q.gold = r.gold
    q.penaltyXp = r.penaltyXp
  }
  if (patch.cadence) q.periodKey = periodKey(q.cadence)
  q.target = Math.max(1, q.target)
  q.progress = Math.min(q.progress, q.target)
}

// ---------- stats & shop ----------
export function allocateStat(d: GameState, key: AttrKey, amount = 1) {
  const n = Math.min(amount, d.statPoints)
  if (n <= 0) return 0
  d.attrs[key] += n
  d.statPoints -= n
  d.hp = Math.min(d.hp, maxHp(d))
  addHistory(d, 'stat', `Allocated ${n} point${n === 1 ? '' : 's'} to ${ATTRS.find((a) => a.key === key)?.label}`)
  checkShadowUnlocks(d)
  revealSecrets(d)
  return n
}

export function buyItem(d: GameState, id: string) {
  const item = ITEM_BY_ID[id]
  if (!item) return 'Unknown item.'
  if (d.level < item.levelReq) return `Requires level ${item.levelReq}.`
  if (item.id === 'crown-fragment' && !rankAtLeast(d.rank, 'S')) return 'Only an S-Rank may hold this.'
  if (d.gold < item.price) return 'Not enough gold.'
  if (!item.stackable && (d.inventory[id] ?? 0) >= 1) return 'Already owned.'
  d.gold -= item.price
  d.inventory[id] = (d.inventory[id] ?? 0) + 1
  addHistory(d, 'purchase', `Purchased ${item.name}`, 0, -item.price)
  d.notifications.unshift({ id: uid(), at: Date.now(), style: 'normal', title: 'ITEM ACQUIRED', body: `${item.name} added to inventory.`, read: false })
  return null
}

export function equipItem(d: GameState, id: string) {
  const item = ITEM_BY_ID[id]
  if (!item?.slot || !(d.inventory[id] ?? 0)) return
  if (d.level < item.levelReq) return
  d.equipment[item.slot] = id
  d.hp = Math.min(d.hp, maxHp(d))
}

export function unequip(d: GameState, slot: keyof GameState['equipment']) {
  delete d.equipment[slot]
  d.hp = Math.min(d.hp, maxHp(d))
  d.mp = Math.min(d.mp, maxMp(d))
}

export function useConsumable(d: GameState, id: string): string | null {
  const item = ITEM_BY_ID[id]
  if (!item?.consumable || !(d.inventory[id] ?? 0)) return 'Nothing to use.'
  const c = item.consumable
  if (c.capacity) {
    d.shadowCapacityBonus += c.capacity
    notify(d, 'dark', 'SHADOW CAPACITY INCREASED', `Your shadow can now hold ${shadowCapacity(d)} soldiers.`, { silent: true })
  }
  if (c.resetStats) {
    const base = 10
    let refund = 0
    for (const a of ATTRS) {
      refund += Math.max(0, d.attrs[a.key] - base)
      d.attrs[a.key] = Math.min(d.attrs[a.key], base)
    }
    d.statPoints += refund
    notify(d, 'normal', 'STATS RESET', `${refund} stat points returned.`, { silent: true })
  }
  if (c.hp || c.mp) {
    if (d.hp >= maxHp(d) && d.mp >= maxMp(d)) return 'You are already at full strength.'
    d.hp = Math.min(maxHp(d), d.hp + (c.hp ?? 0))
    d.mp = Math.min(maxMp(d), d.mp + (c.mp ?? 0))
  }
  d.inventory[id] -= 1
  if (d.inventory[id] <= 0) delete d.inventory[id]
  return null
}

export function upgradeSkill(d: GameState, id: string): string | null {
  const def = SKILL_BY_ID[id]
  if (!def) return 'Unknown skill.'
  const level = d.skills[id] ?? 0
  if (level >= def.maxLevel) return 'Already mastered.'
  if (d.level < def.unlock.level || !rankAtLeast(d.rank, def.unlock.rank)) return `Locked: ${def.unlock.label}.`
  const cost = def.upgradeGold(level)
  if (d.gold < cost) return `Need ${cost} gold.`
  d.gold -= cost
  d.skills[id] = level + 1
  addHistory(d, 'skill', `${level === 0 ? 'Acquired' : 'Upgraded'} ${def.name} (Lv ${level + 1})`, 0, -cost)
  notify(d, 'epic', level === 0 ? 'NEW SKILL ACQUIRED' : 'SKILL UPGRADED', `${def.name} is now level ${level + 1}. ${def.effect(level + 1)}.`, { voice: level === 0 ? 'New skill acquired.' : 'Your skill has grown stronger.' })
  checkAchievements(d)
  return null
}

// ---------- dungeons ----------
export function dungeonFor(id: string): DungeonDef | undefined {
  const def = DUNGEONS.find((x) => x.id === id)
  if (!def) return undefined
  if (def.category === 'daily') return { ...def, objectives: dailyObjectives(dayKey()) }
  return def
}

export function dungeonAvailability(d: GameState, def: DungeonDef): { ok: boolean; reason?: string } {
  if (def.category === 'redgate') return { ok: false, reason: 'Enter through the Red Gate section.' }
  if (def.requiresRank && !rankAtLeast(d.rank, def.requiresRank)) return { ok: false, reason: `Requires ${def.requiresRank}-Rank.` }
  if (def.weekendOnly && !isWeekend()) return { ok: false, reason: 'Opens on weekends only.' }
  const clear = d.dungeonClears[def.id]
  if (clear?.lastClearedDay === dayKey()) return { ok: false, reason: 'Cleared today. The gate reopens tomorrow.' }
  if (d.activeRun && d.activeRun.dungeonId !== def.id) return { ok: false, reason: 'You are already inside another dungeon.' }
  return { ok: true }
}

export function enterDungeon(d: GameState, id: string): string | null {
  const def = dungeonFor(id)
  if (!def) return 'Unknown gate.'
  if (d.activeRun?.dungeonId === id) return null
  const avail = dungeonAvailability(d, def)
  if (!avail.ok) return avail.reason ?? 'Unavailable.'
  d.activeRun = {
    dungeonId: id,
    startedAt: Date.now(),
    endsAt: def.timeLimitMin ? Date.now() + def.timeLimitMin * 60_000 : null,
    objectives: Object.fromEntries(def.objectives.map((o) => [o.id, 0])),
    bossDefeated: false,
    status: 'active',
  }
  d.notifications.unshift({ id: uid(), at: Date.now(), style: 'normal', title: 'DUNGEON ENTERED', body: `You entered ${def.name}.`, read: false })
  return null
}

export function setObjective(d: GameState, objectiveId: string, value: number) {
  const run = d.activeRun
  if (!run || run.status === 'cleared') return
  const def = dungeonFor(run.dungeonId)
  const obj = def?.objectives.find((o) => o.id === objectiveId)
  if (!obj) return
  run.objectives[objectiveId] = Math.max(0, Math.min(obj.target, value))
}

export function objectivesDone(d: GameState) {
  const run = d.activeRun
  if (!run) return false
  const def = dungeonFor(run.dungeonId)
  if (!def) return false
  return def.objectives.every((o) => (run.objectives[o.id] ?? 0) >= o.target)
}

export function beginBoss(d: GameState) {
  if (!d.activeRun || !objectivesDone(d)) return
  d.activeRun.status = 'boss'
}

export function abandonDungeon(d: GameState) {
  if (!d.activeRun) return
  const def = dungeonFor(d.activeRun.dungeonId)
  d.activeRun = null
  notify(d, 'warning', 'DUNGEON ABANDONED', `You left ${def?.name ?? 'the dungeon'} without clearing it.`, { voice: 'You have retreated.' })
}

export function clearDungeon(d: GameState): { xp: number; gold: number; items: string[]; extraction: ReturnType<typeof attemptExtraction> | null } | null {
  const run = d.activeRun
  if (!run) return null
  const def = dungeonFor(run.dungeonId)
  if (!def) return null
  const bossKilled = Boolean(def.boss)
  const xp = Math.round(def.rewards.xp * (1 + d.level * 0.01))
  const gold = def.rewards.gold
  const items = def.rewards.items ?? []
  d.stats.dungeonsCleared += 1
  if (def.category === 'instant') d.stats.instantCleared += 1
  if (def.category === 'normal') d.stats.normalCleared += 1
  if (def.category === 'boss') d.stats.bossDungeonsCleared += 1
  if (bossKilled) d.stats.bossesDefeated += 1
  const clear = (d.dungeonClears[def.id] ??= { count: 0, lastClearedDay: null })
  clear.count += 1
  clear.lastClearedDay = dayKey()
  for (const it of items) d.inventory[it] = (d.inventory[it] ?? 0) + 1
  grantGold(d, gold)
  addHistory(d, bossKilled ? 'boss' : 'dungeon', `Cleared ${def.name}${def.boss ? ` and defeated ${def.boss.name}` : ''}`, xp, gold)
  // Category-based real-world attribute gains from the objectives.
  const attrs: Partial<Record<AttrKey, number>> = {}
  for (const o of def.objectives) for (const [k, v] of Object.entries(d.settings.activityRewards[o.category]?.attrs ?? {})) attrs[k as AttrKey] = (attrs[k as AttrKey] ?? 0) + Math.ceil((v ?? 0) / 2)
  addAttrs(d, attrs)
  d.activeRun = null
  d.notifications.unshift({ id: uid(), at: Date.now(), style: 'epic', title: 'DUNGEON CLEARED', body: `${def.name} cleared. +${xp} XP, +${gold} gold${items.length ? `, ${items.map((i) => ITEM_BY_ID[i]?.name ?? i).join(', ')}` : ''}.`, read: false })
  grantXp(d, xp)
  grantShadowXp(d, Math.round(xp * 0.6))
  let extraction: ReturnType<typeof attemptExtraction> | null = null
  checkShadowUnlocks(d)
  if (bossKilled && def.rewards.shadowChance > 0 && rankAtLeast(d.rank, 'C')) extraction = attemptExtraction(d, def.rewards.shadowChance * 0.5)
  checkRankUp(d)
  checkAchievements(d)
  return { xp, gold, items, extraction }
}

export function failDungeon(d: GameState) {
  const run = d.activeRun
  if (!run) return
  const def = dungeonFor(run.dungeonId)
  d.activeRun = null
  d.hp = Math.max(1, Math.round(maxHp(d) * 0.3))
  const xp = Math.round((def?.rewards.xp ?? 0) * 0.15)
  addHistory(d, 'dungeon', `Fell in ${def?.name ?? 'a dungeon'}`, xp, 0)
  notify(d, 'warning', 'YOU ARE NOT READY', `${def?.boss?.name ?? 'The dungeon'} has defeated you. You crawl back through the gate with ${xp} XP of experience and nothing else.`, { voice: 'You are not ready.' })
  grantXp(d, xp)
}

// ---------- red gate ----------
export const RED_GATE_DIFFICULTIES = {
  normal: { label: 'Normal', minutes: 60, tasks: 3, bossHpMult: 1, bossAtkMult: 1, xp: 1500, gold: 1000, requiresRank: 'B' as Rank },
  hard: { label: 'Hard', minutes: 45, tasks: 4, bossHpMult: 1.6, bossAtkMult: 1.35, xp: 3200, gold: 2200, requiresRank: 'A' as Rank },
  nightmare: { label: 'Nightmare', minutes: 30, tasks: 5, bossHpMult: 2.4, bossAtkMult: 1.8, xp: 7000, gold: 5000, requiresRank: 'S' as Rank },
}

export function startRedGate(d: GameState, difficulty: keyof typeof RED_GATE_DIFFICULTIES): string | null {
  const cfg = RED_GATE_DIFFICULTIES[difficulty]
  if (!rankAtLeast(d.rank, cfg.requiresRank)) return `Requires ${cfg.requiresRank}-Rank.`
  if (d.redGate?.status === 'active') return 'A Red Gate is already open.'
  if (d.activeRun) return 'Leave your current dungeon first.'
  const pool: { text: string; target: number; unit: string; category: QuestCategory }[] = [
    { text: 'Push-ups', target: 60, unit: 'reps', category: 'exercise' },
    { text: 'Squats', target: 80, unit: 'reps', category: 'exercise' },
    { text: 'Burpees', target: 30, unit: 'reps', category: 'exercise' },
    { text: 'Sprint intervals', target: 8, unit: 'rounds', category: 'running' },
    { text: 'Walk briskly', target: 2000, unit: 'steps', category: 'walking' },
    { text: 'Water', target: 2, unit: 'glasses', category: 'hydration' },
    { text: 'Focused reading', target: 10, unit: 'pages', category: 'reading' },
    { text: 'Mountain climbers', target: 60, unit: 'reps', category: 'exercise' },
  ]
  const tasks = [...pool].sort(() => Math.random() - 0.5).slice(0, cfg.tasks).map((t, i) => ({ id: `rg${i}`, ...t, progress: 0 }))
  const now = Date.now()
  d.redGate = { difficulty, startedAt: now, endsAt: now + cfg.minutes * 60_000, tasks, bossDefeated: false, status: 'active' }
  d.notifications.unshift({ id: uid(), at: now, style: 'warning', title: 'RED GATE OPENED', body: `You stepped into a ${cfg.label} Red Gate. ${cfg.minutes} minutes to survive.`, read: false })
  return null
}

export function setRedGateTask(d: GameState, id: string, value: number) {
  const t = d.redGate?.tasks.find((x) => x.id === id)
  if (!t || d.redGate?.status !== 'active') return
  t.progress = Math.max(0, Math.min(t.target, value))
}

export function redGateTasksDone(d: GameState) {
  return Boolean(d.redGate && d.redGate.tasks.every((t) => t.progress >= t.target))
}

export function clearRedGate(d: GameState) {
  const rg = d.redGate
  if (!rg || rg.status !== 'active') return null
  const cfg = RED_GATE_DIFFICULTIES[rg.difficulty]
  rg.status = 'cleared'
  rg.bossDefeated = true
  d.stats.redGatesCleared += 1
  d.stats.bossesDefeated += 1
  if (rg.difficulty !== 'normal') d.stats.redGateHardCleared += 1
  if (rg.difficulty === 'nightmare') d.stats.redGateNightmareCleared += 1
  grantGold(d, cfg.gold)
  d.inventory['shadow-core'] = (d.inventory['shadow-core'] ?? 0) + 1
  addAttrs(d, { strength: 2, endurance: 2, discipline: 2 })
  addHistory(d, 'redgate', `Survived a ${cfg.label} Red Gate`, cfg.xp, cfg.gold)
  d.notifications.unshift({ id: uid(), at: Date.now(), style: 'epic', title: 'RED GATE CLEARED', body: `You survived. +${cfg.xp} XP, +${cfg.gold} gold, Shadow Core acquired.`, read: false })
  grantXp(d, cfg.xp)
  grantShadowXp(d, Math.round(cfg.xp * 0.5))
  checkShadowUnlocks(d)
  const extraction = rankAtLeast(d.rank, 'C') ? attemptExtraction(d, 0.3) : null
  checkRankUp(d)
  checkAchievements(d)
  return { xp: cfg.xp, gold: cfg.gold, extraction }
}

export function failRedGate(d: GameState) {
  if (!d.redGate) return
  d.redGate.status = 'failed'
  d.hp = Math.max(1, Math.round(maxHp(d) * 0.2))
  addHistory(d, 'redgate', 'Fell inside a Red Gate')
  notify(d, 'warning', 'RED GATE FAILED', 'Malgrath stands over you. The gate spits you out, barely alive.', { voice: 'You are not ready. Return when you are stronger.' })
}

export function closeRedGate(d: GameState) {
  d.redGate = null
}

// ---------- training ----------
export function logTraining(d: GameState, workoutId: string, durationSec: number) {
  const w = d.workouts.find((x) => x.id === workoutId)
  if (!w) return null
  const volume = w.exercises.reduce((s, e) => s + e.sets * e.reps * Math.max(1, e.weightKg), 0)
  const xp = Math.round(w.xp * (d.settings.activityRewards.exercise?.xpMultiplier ?? 1))
  w.timesDone += 1
  if (w.bestDurationSec === null || durationSec < w.bestDurationSec) w.bestDurationSec = durationSec
  d.trainingSessions.unshift({ id: uid(), workoutId, at: Date.now(), durationSec, volumeKg: volume, xp })
  if (d.trainingSessions.length > 500) d.trainingSessions.length = 500
  const changed = addAttrs(d, w.attrs)
  const gold = Math.round(xp * 0.5)
  grantGold(d, gold)
  addHistory(d, 'training', `Training: ${w.name}`, xp, gold)
  notify(d, 'quest', 'TRAINING COMPLETE', `${w.name} finished in ${Math.round(durationSec / 60)} min. +${xp} XP, +${gold} gold${changed.length ? `, ${changed.join(', ')}` : ''}.`, { voice: 'Training complete. Your body remembers.' })
  grantXp(d, xp)
  grantShadowXp(d, Math.round(xp * 0.3))
  checkShadowUnlocks(d)
  return { xp, gold }
}

// ---------- migration ----------
export function migrate(raw: unknown): GameState {
  const base = initialState()
  if (!raw || typeof raw !== 'object') return base
  const s = raw as Partial<GameState>
  const merged: GameState = {
    ...base,
    ...s,
    profile: { ...base.profile, ...(s.profile ?? {}) },
    attrs: { ...base.attrs, ...(s.attrs ?? {}) },
    stats: { ...base.stats, ...(s.stats ?? {}) },
    streak: { ...base.streak, ...(s.streak ?? {}) },
    login: { ...base.login, ...(s.login ?? {}) },
    settings: { ...base.settings, ...(s.settings ?? {}), activityRewards: { ...base.settings.activityRewards, ...(s.settings?.activityRewards ?? {}) } },
    cinematics: [],
    schema: SCHEMA_VERSION,
  }
  return merged
}
