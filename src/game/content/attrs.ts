import type { AttrKey, QuestCategory } from '../types'

export const ATTRS: { key: AttrKey; label: string; short: string; blurb: string }[] = [
  { key: 'strength', label: 'Strength', short: 'STR', blurb: 'Raw power. Grows through resistance training and bodyweight work.' },
  { key: 'agility', label: 'Agility', short: 'AGI', blurb: 'Speed and reflexes. Grows through running and movement.' },
  { key: 'vitality', label: 'Vitality', short: 'VIT', blurb: 'Life force and HP. Grows through exercise and sleep.' },
  { key: 'intelligence', label: 'Intelligence', short: 'INT', blurb: 'Knowledge and MP. Grows through study, reading and code.' },
  { key: 'sense', label: 'Sense', short: 'SEN', blurb: 'Perception and critical awareness. Grows through focus work.' },
  { key: 'endurance', label: 'Endurance', short: 'END', blurb: 'Stamina and defence. Grows through long-distance effort.' },
  { key: 'discipline', label: 'Discipline', short: 'DIS', blurb: 'The will to act. Grows every time you finish what you started.' },
  { key: 'consistency', label: 'Consistency', short: 'CON', blurb: 'The habit of showing up. Grows with streaks.' },
]

export const CATEGORY_META: Record<QuestCategory, { label: string; verb: string; defaultUnit: string }> = {
  exercise: { label: 'Exercise', verb: 'Train', defaultUnit: 'reps' },
  walking: { label: 'Walking', verb: 'Walk', defaultUnit: 'steps' },
  running: { label: 'Running', verb: 'Run', defaultUnit: 'km' },
  reading: { label: 'Reading', verb: 'Read', defaultUnit: 'pages' },
  studying: { label: 'Studying', verb: 'Study', defaultUnit: 'min' },
  coding: { label: 'Coding', verb: 'Code', defaultUnit: 'min' },
  hydration: { label: 'Hydration', verb: 'Drink', defaultUnit: 'glasses' },
  sleep: { label: 'Sleep', verb: 'Sleep', defaultUnit: 'hours' },
  custom: { label: 'Custom', verb: 'Complete', defaultUnit: 'units' },
}
