export type AttrKey = 'strength' | 'agility' | 'vitality' | 'intelligence' | 'sense' | 'endurance' | 'discipline' | 'consistency'
export type Rank = 'E' | 'D' | 'C' | 'B' | 'A' | 'S' | 'NATIONAL'
export type Difficulty = 'E' | 'D' | 'C' | 'B' | 'A' | 'S'
export type QuestCategory = 'exercise' | 'walking' | 'running' | 'reading' | 'studying' | 'coding' | 'hydration' | 'sleep' | 'custom'
export type QuestCadence = 'daily' | 'weekly' | 'monthly' | 'secret'
export type Rarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' | 'mythic'
export type ItemCategory = 'weapon' | 'armor' | 'accessory' | 'potion' | 'special' | 'skill-upgrade' | 'collectible'
export type EquipSlot = 'weapon' | 'armor' | 'boots' | 'accessory'
export type DungeonCategory = 'normal' | 'instant' | 'redgate' | 'boss' | 'shadow' | 'daily' | 'event'
export type NoticeStyle = 'normal' | 'warning' | 'epic' | 'dark' | 'quest'
export type ThemeId = 'monarch' | 'ember'

export interface Quest {
  id: string
  name: string
  description: string
  category: QuestCategory
  cadence: QuestCadence
  difficulty: Difficulty
  target: number
  unit: string
  progress: number
  xp: number
  gold: number
  attrs: Partial<Record<AttrKey, number>>
  completedAt: number | null
  periodKey: string
  active: boolean
  penaltyXp: number
  secretHint?: string
  revealed?: boolean
  record: number
  timesCompleted: number
  createdAt: number
}

export interface DungeonObjective {
  id: string
  text: string
  target: number
  unit: string
  category: QuestCategory
}

export interface BossDef {
  id: string
  name: string
  title: string
  art: string
  hp: number
  attack: number
  attackInterval: number
  description: string
}

export interface DungeonDef {
  id: string
  name: string
  category: DungeonCategory
  rank: Difficulty
  recommendedLevel: number
  art: string
  description: string
  atmosphere: string
  timeLimitMin: number | null
  objectives: DungeonObjective[]
  boss: BossDef | null
  rewards: { xp: number; gold: number; items?: string[]; shadowChance: number }
  requiresRank?: Rank
  weekendOnly?: boolean
}

export interface ShadowDef {
  id: string
  name: string
  title: string
  klass: string
  art: string
  thumb: string
  personality: string
  abilities: string[]
  basePower: number
  unlock: { kind: 'boss' | 'dungeons' | 'streak' | 'attr' | 'quests' | 'redgate' | 'extraction'; value: number; attr?: AttrKey; label: string }
}

export interface ShadowState {
  id: string
  unlockedAt: number
  level: number
  xp: number
}

export interface SkillDef {
  id: string
  name: string
  art: string
  description: string
  kind: 'active' | 'passive'
  maxLevel: number
  mpCost: number
  cooldownSec: number
  unlock: { level: number; rank?: Rank; label: string }
  upgradeGold: (level: number) => number
  effect: (level: number) => string
}

export interface ItemDef {
  id: string
  name: string
  art: string
  category: ItemCategory
  slot?: EquipSlot
  rarity: Rarity
  description: string
  levelReq: number
  price: number
  attrs: Partial<Record<AttrKey, number>>
  battle?: { attack?: number; defense?: number; crit?: number }
  consumable?: { hp?: number; mp?: number; capacity?: number; resetStats?: boolean }
  unlockNote?: string
  stackable?: boolean
}

export interface AchievementDef {
  id: string
  name: string
  description: string
  art: string
  xp: number
  gold: number
  secret?: boolean
}

export interface Notification {
  id: string
  at: number
  style: NoticeStyle
  title: string
  body: string
  read: boolean
}

export interface HistoryEvent {
  id: string
  at: number
  kind: 'quest' | 'level' | 'rank' | 'dungeon' | 'boss' | 'shadow' | 'achievement' | 'purchase' | 'skill' | 'penalty' | 'login' | 'training' | 'redgate' | 'stat'
  title: string
  xp: number
  gold: number
  synced?: boolean
}

export type Cinematic =
  | { kind: 'notice'; style: NoticeStyle; title: string; lines: string[]; voice?: string; id: string }
  | { kind: 'questComplete'; questName: string; xp: number; gold: number; id: string }
  | { kind: 'levelUp'; from: number; to: number; points: number; id: string }
  | { kind: 'rankUp'; from: Rank; to: Rank; id: string }
  | { kind: 'shadowArise'; shadowId: string; id: string }
  | { kind: 'achievement'; achievementId: string; id: string }

export interface WorkoutExercise {
  id: string
  name: string
  sets: number
  reps: number
  weightKg: number
}

export interface Workout {
  id: string
  name: string
  exercises: WorkoutExercise[]
  attrs: Partial<Record<AttrKey, number>>
  xp: number
  timesDone: number
  bestDurationSec: number | null
}

export interface TrainingSession {
  id: string
  workoutId: string
  at: number
  durationSec: number
  volumeKg: number
  xp: number
}

export interface ActivityReward {
  xpMultiplier: number
  attrs: Partial<Record<AttrKey, number>>
}

export interface Settings {
  theme: ThemeId
  masterVolume: number
  voiceVolume: number
  sfxVolume: number
  musicVolume: number
  voiceEnabled: boolean
  musicEnabled: boolean
  voiceRate: number
  voicePitch: number
  voiceURI: string | null
  preferPremiumVoice: boolean
  reduceMotion: boolean
  penaltiesEnabled: boolean
  penaltyPercent: number
  introSeen: boolean
  activityRewards: Record<QuestCategory, ActivityReward>
}

export interface RedGateRun {
  difficulty: 'normal' | 'hard' | 'nightmare'
  startedAt: number
  endsAt: number
  tasks: { id: string; text: string; target: number; unit: string; progress: number; category: QuestCategory }[]
  bossDefeated: boolean
  status: 'active' | 'cleared' | 'failed'
}

export interface DungeonRun {
  dungeonId: string
  startedAt: number
  endsAt: number | null
  objectives: Record<string, number>
  bossDefeated: boolean
  status: 'active' | 'boss' | 'cleared' | 'failed'
}

export interface GameState {
  schema: number
  profile: {
    name: string
    title: string
    avatar: string
    awakenedAt: number | null
  }
  level: number
  rank: Rank
  xp: number
  totalXp: number
  gold: number
  statPoints: number
  attrs: Record<AttrKey, number>
  hp: number
  mp: number
  quests: Quest[]
  streak: { current: number; best: number; lastFullDay: string | null }
  login: { lastRewardDay: string | null; streak: number }
  dungeonClears: Record<string, { count: number; lastClearedDay: string | null }>
  stats: {
    questsCompleted: number
    dungeonsCleared: number
    bossesDefeated: number
    redGatesCleared: number
    redGateHardCleared: number
    redGateNightmareCleared: number
    instantCleared: number
    normalCleared: number
    bossDungeonsCleared: number
    questsFailed: number
    goldEarned: number
    extractionsAttempted: number
  }
  shadows: ShadowState[]
  shadowCapacityBonus: number
  skills: Record<string, number>
  inventory: Record<string, number>
  equipment: Partial<Record<EquipSlot, string>>
  achievements: Record<string, number>
  notifications: Notification[]
  history: HistoryEvent[]
  rankHistory: { rank: Rank; at: number; level: number }[]
  dailyLog: Record<string, { xp: number; quests: number; questsTotal: number; gold: number; categories: Partial<Record<QuestCategory, number>> }>
  workouts: Workout[]
  trainingSessions: TrainingSession[]
  activeRun: DungeonRun | null
  redGate: RedGateRun | null
  settings: Settings
  cinematics: Cinematic[]
  savedAt: number
}
