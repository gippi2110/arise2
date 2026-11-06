import type { Rank, Difficulty } from '../types'

export const RANKS: Rank[] = ['E', 'D', 'C', 'B', 'A', 'S', 'NATIONAL']

export const RANK_META: Record<Rank, { label: string; title: string; color: string; art: string; minLevel: number; requirements: string[]; unlocks: string }> = {
  E: { label: 'E', title: 'E-Rank Hunter', color: '#8A94A6', art: '/art/rank/e.webp', minLevel: 1, requirements: ['Awaken'], unlocks: 'Daily quests, Normal dungeons' },
  D: { label: 'D', title: 'D-Rank Hunter', color: '#58C37A', art: '/art/rank/d.webp', minLevel: 10, requirements: ['Reach level 10', 'Clear 3 dungeons'], unlocks: 'Instant dungeons, Weekly missions' },
  C: { label: 'C', title: 'C-Rank Hunter', color: '#168CFF', art: '/art/rank/c.webp', minLevel: 20, requirements: ['Reach level 20', 'Clear 10 dungeons', '7-day streak'], unlocks: 'Shadow dungeons, Shadow Extraction' },
  B: { label: 'B', title: 'B-Rank Hunter', color: '#8FB8FF', art: '/art/rank/b.webp', minLevel: 35, requirements: ['Reach level 35', 'Defeat 5 bosses', '14-day streak'], unlocks: 'Boss dungeons, Red Gate (normal)' },
  A: { label: 'A', title: 'A-Rank Hunter', color: '#B266FF', art: '/art/rank/a.webp', minLevel: 50, requirements: ['Reach level 50', 'Clear 1 Red Gate', '200 quests completed'], unlocks: 'Red Gate (hard), Ruler\'s Authority' },
  S: { label: 'S', title: 'S-Rank Hunter', color: '#FF7100', art: '/art/rank/s.webp', minLevel: 70, requirements: ['Reach level 70', 'Clear 3 Red Gates', '30-day streak', 'Command 5 shadows'], unlocks: 'Red Gate (nightmare), Shadow Exchange' },
  NATIONAL: { label: 'N', title: 'National Level Hunter', color: '#FFB347', art: '/art/rank/national.webp', minLevel: 100, requirements: ['Reach level 100', 'Command 8 shadows', '500 quests completed', 'Clear a Nightmare Red Gate'], unlocks: 'The Monarch\'s Throne' },
}

export const DIFFICULTY_META: Record<Difficulty, { color: string; mult: number; label: string }> = {
  E: { color: '#8A94A6', mult: 1, label: 'E' },
  D: { color: '#58C37A', mult: 1.35, label: 'D' },
  C: { color: '#168CFF', mult: 1.8, label: 'C' },
  B: { color: '#8FB8FF', mult: 2.4, label: 'B' },
  A: { color: '#B266FF', mult: 3.2, label: 'A' },
  S: { color: '#FF7100', mult: 4.5, label: 'S' },
}

export function xpForLevel(level: number) {
  return Math.round(120 * Math.pow(level, 1.45))
}

export function rankIndex(rank: Rank) {
  return RANKS.indexOf(rank)
}
