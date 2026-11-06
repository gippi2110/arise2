import type { Quest, QuestCategory, Difficulty, AttrKey, QuestCadence } from '../types'
import { DIFFICULTY_META } from './ranks'

export interface QuestTemplate {
  name: string
  description: string
  category: QuestCategory
  cadence: QuestCadence
  difficulty: Difficulty
  target: number
  unit: string
  secretHint?: string
}

/** Default attribute gains for each category when a quest is completed. */
export const CATEGORY_ATTRS: Record<QuestCategory, Partial<Record<AttrKey, number>>> = {
  exercise: { strength: 2, vitality: 1 },
  walking: { agility: 1, endurance: 2 },
  running: { agility: 2, endurance: 1 },
  reading: { intelligence: 2, sense: 1 },
  studying: { intelligence: 2, discipline: 1 },
  coding: { intelligence: 2, sense: 1 },
  hydration: { vitality: 1, consistency: 1 },
  sleep: { vitality: 2, consistency: 1 },
  custom: { discipline: 2 },
}

/** Base rewards by difficulty, before cadence multipliers. */
export function questRewards(difficulty: Difficulty, cadence: QuestCadence) {
  const mult = DIFFICULTY_META[difficulty].mult
  const cadenceMult = cadence === 'daily' ? 1 : cadence === 'weekly' ? 4.5 : cadence === 'monthly' ? 14 : 6
  return {
    xp: Math.round(40 * mult * cadenceMult),
    gold: Math.round(25 * mult * cadenceMult),
    penaltyXp: Math.round(15 * mult * cadenceMult),
  }
}

export const DEFAULT_QUESTS: QuestTemplate[] = [
  { name: 'Push-ups', description: 'The first law of strength: push the earth away.', category: 'exercise', cadence: 'daily', difficulty: 'D', target: 100, unit: 'reps' },
  { name: 'Sit-ups', description: 'A hunter\'s core never breaks.', category: 'exercise', cadence: 'daily', difficulty: 'D', target: 100, unit: 'reps' },
  { name: 'Squats', description: 'Legs carry you through every gate.', category: 'exercise', cadence: 'daily', difficulty: 'D', target: 100, unit: 'reps' },
  { name: 'Running', description: 'Outrun what hunts you.', category: 'running', cadence: 'daily', difficulty: 'C', target: 10, unit: 'km' },
  { name: 'Hydration', description: 'Mana flows through water.', category: 'hydration', cadence: 'daily', difficulty: 'E', target: 8, unit: 'glasses' },
  { name: 'Reading', description: 'Knowledge is the sharpest dagger.', category: 'reading', cadence: 'daily', difficulty: 'E', target: 20, unit: 'pages' },
  { name: 'Deep Study', description: 'Focused study, no distractions.', category: 'studying', cadence: 'daily', difficulty: 'D', target: 60, unit: 'min' },
  { name: 'Sleep Schedule', description: 'Recover. Even monarchs sleep.', category: 'sleep', cadence: 'daily', difficulty: 'E', target: 7, unit: 'hours' },
  { name: 'Weekly Distance', description: 'Cover ground across the week.', category: 'walking', cadence: 'weekly', difficulty: 'C', target: 50000, unit: 'steps' },
  { name: 'Coding Sprint', description: 'Build something real this week.', category: 'coding', cadence: 'weekly', difficulty: 'C', target: 300, unit: 'min' },
  { name: 'Monthly Volume', description: 'One thousand reps of anything that burns.', category: 'exercise', cadence: 'monthly', difficulty: 'B', target: 1000, unit: 'reps' },
  { name: 'The Long Read', description: 'Finish two books this month.', category: 'reading', cadence: 'monthly', difficulty: 'C', target: 2, unit: 'books' },
  { name: 'Midnight Training', description: 'Train when no one is watching.', category: 'exercise', cadence: 'secret', difficulty: 'B', target: 200, unit: 'reps', secretHint: 'Complete every daily quest three days in a row.' },
  { name: 'The Silent Hour', description: 'One hour. No screen. No noise. Just you.', category: 'custom', cadence: 'secret', difficulty: 'A', target: 60, unit: 'min', secretHint: 'Reach Sense 25.' },
]

export function makeQuest(t: QuestTemplate, periodKey: string, now = Date.now()): Quest {
  const r = questRewards(t.difficulty, t.cadence)
  return {
    id: `q_${now.toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
    name: t.name,
    description: t.description,
    category: t.category,
    cadence: t.cadence,
    difficulty: t.difficulty,
    target: t.target,
    unit: t.unit,
    progress: 0,
    xp: r.xp,
    gold: r.gold,
    attrs: { ...CATEGORY_ATTRS[t.category] },
    completedAt: null,
    periodKey,
    active: true,
    penaltyXp: r.penaltyXp,
    secretHint: t.secretHint,
    revealed: t.cadence !== 'secret',
    record: 0,
    timesCompleted: 0,
    createdAt: now,
  }
}
