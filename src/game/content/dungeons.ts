import type { BossDef, DungeonDef } from '../types'

export const BOSSES: Record<string, BossDef> = {
  hollowKnight: { id: 'hollowKnight', name: 'Vorthak', title: 'The Hollow Knight', art: '/art/boss/hollow-knight.webp', hp: 600, attack: 18, attackInterval: 3200, description: 'An empty suit of armour animated by a grudge older than the gate itself.' },
  abyssSerpent: { id: 'abyssSerpent', name: 'Ssyrak', title: 'Serpent of the Abyss', art: '/art/boss/abyss-serpent.webp', hp: 900, attack: 24, attackInterval: 2800, description: 'Its venom dissolves mana. Strike fast or do not strike at all.' },
  ashSovereign: { id: 'ashSovereign', name: 'Ignaros', title: 'The Ash Sovereign', art: '/art/boss/ash-sovereign.webp', hp: 1400, attack: 34, attackInterval: 2600, description: 'Crowned in embers. Every breath it takes burns the air.' },
  frostWarden: { id: 'frostWarden', name: 'Hrimthur', title: 'The Frost Warden', art: '/art/boss/frost-warden.webp', hp: 1100, attack: 28, attackInterval: 3000, description: 'Guardian of the frozen dungeon. It does not rush. It never has to.' },
  architect: { id: 'architect', name: 'The Architect', title: 'Engine of the Ruins', art: '/art/boss/architect.webp', hp: 2200, attack: 42, attackInterval: 2400, description: 'Rune-forged, ancient, patient. It built this place to test you.' },
  crimsonHarbinger: { id: 'crimsonHarbinger', name: 'Malgrath', title: 'The Crimson Harbinger', art: '/art/boss/crimson-harbinger.webp', hp: 1800, attack: 40, attackInterval: 2200, description: 'Where the red gate opens, Malgrath is already waiting.' },
}

export const DUNGEONS: DungeonDef[] = [
  {
    id: 'goblin-cavern', name: 'Hollow Root Cavern', category: 'normal', rank: 'E', recommendedLevel: 1, art: '/art/dungeon/normal.webp',
    description: 'A damp E-rank cavern. Weak monsters, good practice. Clear the objectives, then face the gatekeeper.',
    atmosphere: 'Dripping water. Glowing crystals. Something breathing in the dark.',
    timeLimitMin: 120, boss: BOSSES.hollowKnight,
    objectives: [
      { id: 'o1', text: 'Push-ups', target: 30, unit: 'reps', category: 'exercise' },
      { id: 'o2', text: 'Squats', target: 30, unit: 'reps', category: 'exercise' },
      { id: 'o3', text: 'Drink water', target: 2, unit: 'glasses', category: 'hydration' },
    ],
    rewards: { xp: 180, gold: 120, shadowChance: 0.2 },
  },
  {
    id: 'serpent-nest', name: 'Serpent Nest', category: 'normal', rank: 'D', recommendedLevel: 8, art: '/art/dungeon/normal.webp',
    description: 'The nest of Ssyrak. Venom clouds hang over the lower tunnels.',
    atmosphere: 'Hissing. Violet mist. Scales scraping stone.',
    timeLimitMin: 120, boss: BOSSES.abyssSerpent,
    objectives: [
      { id: 'o1', text: 'Run', target: 3, unit: 'km', category: 'running' },
      { id: 'o2', text: 'Sit-ups', target: 50, unit: 'reps', category: 'exercise' },
      { id: 'o3', text: 'Read', target: 15, unit: 'pages', category: 'reading' },
    ],
    rewards: { xp: 320, gold: 210, shadowChance: 0.25 },
  },
  {
    id: 'crystal-collapse', name: 'Collapsing Crystal Rift', category: 'instant', rank: 'D', recommendedLevel: 10, art: '/art/dungeon/instant.webp',
    description: 'An instant dungeon that exists for twenty minutes. Finish before the rift closes.',
    atmosphere: 'Shattering glass. Time stutters. The floor is falling upward.',
    timeLimitMin: 20, boss: null, requiresRank: 'D',
    objectives: [
      { id: 'o1', text: 'Burpees', target: 25, unit: 'reps', category: 'exercise' },
      { id: 'o2', text: 'Plank', target: 3, unit: 'min', category: 'exercise' },
      { id: 'o3', text: 'Focused study', target: 10, unit: 'min', category: 'studying' },
    ],
    rewards: { xp: 260, gold: 160, shadowChance: 0 },
  },
  {
    id: 'frozen-keep', name: 'Frozen Keep', category: 'boss', rank: 'C', recommendedLevel: 20, art: '/art/dungeon/boss.webp',
    description: 'A boss dungeon. The objectives are light. The Warden is not.',
    atmosphere: 'Howling wind. Frost on the inside of your lungs.',
    timeLimitMin: 90, boss: BOSSES.frostWarden, requiresRank: 'B',
    objectives: [
      { id: 'o1', text: 'Warm-up push-ups', target: 40, unit: 'reps', category: 'exercise' },
      { id: 'o2', text: 'Cold shower or outdoor walk', target: 10, unit: 'min', category: 'walking' },
    ],
    rewards: { xp: 700, gold: 450, items: ['hp-potion'], shadowChance: 0.45 },
  },
  {
    id: 'ember-throne', name: 'Throne of Ash', category: 'boss', rank: 'B', recommendedLevel: 35, art: '/art/dungeon/event.webp',
    description: 'Ignaros waits at the top of a burning stair. Bring potions.',
    atmosphere: 'Heat shimmer. Ash falling like snow.',
    timeLimitMin: 90, boss: BOSSES.ashSovereign, requiresRank: 'B',
    objectives: [
      { id: 'o1', text: 'Stair climbs or step-ups', target: 200, unit: 'steps', category: 'walking' },
      { id: 'o2', text: 'Squats', target: 80, unit: 'reps', category: 'exercise' },
    ],
    rewards: { xp: 1200, gold: 800, items: ['mp-potion'], shadowChance: 0.5 },
  },
  {
    id: 'shadow-realm', name: 'The Realm Between', category: 'shadow', rank: 'B', recommendedLevel: 25, art: '/art/dungeon/shadow.webp',
    description: 'A shadow dungeon. Clearing it guarantees a Shadow Extraction attempt.',
    atmosphere: 'Violet fire. Whispers in a language you almost know.',
    timeLimitMin: 180, boss: BOSSES.hollowKnight, requiresRank: 'C',
    objectives: [
      { id: 'o1', text: 'Push-ups', target: 60, unit: 'reps', category: 'exercise' },
      { id: 'o2', text: 'Study or read', target: 45, unit: 'min', category: 'studying' },
      { id: 'o3', text: 'Walk', target: 4000, unit: 'steps', category: 'walking' },
    ],
    rewards: { xp: 900, gold: 500, shadowChance: 1 },
  },
  {
    id: 'daily-trial', name: 'Temple of Trials', category: 'daily', rank: 'D', recommendedLevel: 5, art: '/art/dungeon/daily.webp',
    description: 'The daily challenge. Its objectives change every day. One clear per day.',
    atmosphere: 'Runic steps rising into mist. A bell tolls somewhere above.',
    timeLimitMin: null, boss: null,
    objectives: [], // generated per day
    rewards: { xp: 240, gold: 150, shadowChance: 0.1 },
  },
  {
    id: 'ruins-architect', name: 'Ruins of the Architect', category: 'event', rank: 'A', recommendedLevel: 50, art: '/art/dungeon/event.webp',
    description: 'Special event dungeon. Open on weekends only. The Architect tests everything you have.',
    atmosphere: 'Grinding gears. Orange storm light through broken arches.',
    timeLimitMin: 240, boss: BOSSES.architect, weekendOnly: true, requiresRank: 'A',
    objectives: [
      { id: 'o1', text: 'Long run', target: 8, unit: 'km', category: 'running' },
      { id: 'o2', text: 'Deep work', target: 90, unit: 'min', category: 'coding' },
      { id: 'o3', text: 'Full-body circuit', target: 300, unit: 'reps', category: 'exercise' },
    ],
    rewards: { xp: 2600, gold: 1800, items: ['elixir'], shadowChance: 0.6 },
  },
  {
    id: 'red-gate', name: 'Red Gate', category: 'redgate', rank: 'A', recommendedLevel: 35, art: '/art/dungeon/redgate.webp',
    description: 'A special survival mode with its own rules. Enter through the Red Gate section.',
    atmosphere: 'A red sky that is not a sky.',
    timeLimitMin: 60, boss: BOSSES.crimsonHarbinger, requiresRank: 'B',
    objectives: [],
    rewards: { xp: 1500, gold: 1000, shadowChance: 0.5 },
  },
]

export const DUNGEON_CATEGORY_META: Record<string, { label: string; blurb: string }> = {
  normal: { label: 'Normal Dungeon', blurb: 'Standard gates. Clear objectives, defeat the gatekeeper.' },
  instant: { label: 'Instant Dungeon', blurb: 'Short-lived rifts. Fast, intense, timed.' },
  redgate: { label: 'Red Gate', blurb: 'Survival mode. Do not enter unprepared.' },
  boss: { label: 'Boss Dungeon', blurb: 'Light objectives, heavy boss.' },
  shadow: { label: 'Shadow Dungeon', blurb: 'Guaranteed extraction attempt.' },
  daily: { label: 'Daily Challenge', blurb: 'New objectives every day.' },
  event: { label: 'Special Event', blurb: 'Weekend-only. Highest rewards.' },
}

/** Daily trial objectives are derived from the date so every device agrees. */
export function dailyObjectives(dayKey: string) {
  let seed = 0
  for (const c of dayKey) seed = (seed * 31 + c.charCodeAt(0)) >>> 0
  const pool = [
    { text: 'Push-ups', target: 40, unit: 'reps', category: 'exercise' as const },
    { text: 'Squats', target: 50, unit: 'reps', category: 'exercise' as const },
    { text: 'Lunges', target: 40, unit: 'reps', category: 'exercise' as const },
    { text: 'Walk', target: 3000, unit: 'steps', category: 'walking' as const },
    { text: 'Run', target: 2, unit: 'km', category: 'running' as const },
    { text: 'Read', target: 12, unit: 'pages', category: 'reading' as const },
    { text: 'Study', target: 25, unit: 'min', category: 'studying' as const },
    { text: 'Code', target: 25, unit: 'min', category: 'coding' as const },
    { text: 'Water', target: 3, unit: 'glasses', category: 'hydration' as const },
  ]
  const picks: typeof pool = []
  let s = seed
  while (picks.length < 3) {
    s = (s * 1103515245 + 12345) >>> 0
    const p = pool[s % pool.length]
    if (!picks.includes(p)) picks.push(p)
  }
  return picks.map((p, i) => ({ id: `d${i}`, ...p }))
}
