import type { ShadowDef } from '../types'

export const SHADOW_RANKS = ['Soldier', 'Elite', 'Knight', 'Elite Knight', 'Commander', 'Marshal', 'Grand Marshal'] as const

export const SHADOWS: ShadowDef[] = [
  { id: 'igneel', name: 'Igneel', title: 'The Silent Blade', klass: 'Knight Commander', art: '/art/shadow/igneel.webp', thumb: '/art/shadow/igneel-thumb.webp', personality: 'Loyal to the point of silence. Kneels before every battle. Never retreats.', abilities: ['Crimson Guard: absorbs the first boss strike each battle', 'Greatsword Arc: heavy auto-attack'], basePower: 12, unlock: { kind: 'boss', value: 1, label: 'Defeat your first boss' } },
  { id: 'fang', name: 'Fang', title: 'The Hunger', klass: 'Shadow Beast', art: '/art/shadow/fang.webp', thumb: '/art/shadow/fang-thumb.webp', personality: 'Restless. Circles the enemy before it strikes. Growls at nothing.', abilities: ['Rend: fast bleeding strikes', 'Scent: reveals weak points, raising crit chance'], basePower: 8, unlock: { kind: 'dungeons', value: 3, label: 'Clear 3 dungeons' } },
  { id: 'veyra', name: 'Veyra', title: 'The Far Eye', klass: 'Shadow Archer', art: '/art/shadow/veyra.webp', thumb: '/art/shadow/veyra-thumb.webp', personality: 'Watches from the back. Speaks only when the shot is certain.', abilities: ['Piercing Volley: ranged auto-attack', 'Marked Prey: bonus damage against bosses below half HP'], basePower: 10, unlock: { kind: 'streak', value: 7, label: 'Hold a 7-day streak' } },
  { id: 'morrow', name: 'Morrow', title: 'The Hollow Scholar', klass: 'Shadow Mage', art: '/art/shadow/morrow.webp', thumb: '/art/shadow/morrow-thumb.webp', personality: 'Mutters formulas. Finds boredom more frightening than death.', abilities: ['Arc Lightning: burst damage', 'Mana Siphon: restores MP during battle'], basePower: 11, unlock: { kind: 'attr', value: 30, attr: 'intelligence', label: 'Reach Intelligence 30' } },
  { id: 'nyx', name: 'Nyx', title: 'The Unseen', klass: 'Shadow Assassin', art: '/art/shadow/nyx.webp', thumb: '/art/shadow/nyx-thumb.webp', personality: 'You never see Nyx arrive. You only see what is left.', abilities: ['Backstab: critical strikes', 'Vanish: dodges one boss attack per battle'], basePower: 13, unlock: { kind: 'extraction', value: 3, label: 'Clear 3 Instant dungeons' } },
  { id: 'brakk', name: 'Brakk', title: 'The Wall', klass: 'Shadow Berserker', art: '/art/shadow/brakk.webp', thumb: '/art/shadow/brakk-thumb.webp', personality: 'Laughs when hit. Hits back harder.', abilities: ['Cleave: massive slow strikes', 'Bulwark: reduces incoming damage'], basePower: 16, unlock: { kind: 'attr', value: 40, attr: 'strength', label: 'Reach Strength 40' } },
  { id: 'seren', name: 'Seren', title: 'The Quiet Light', klass: 'Shadow Priestess', art: '/art/shadow/seren.webp', thumb: '/art/shadow/seren-thumb.webp', personality: 'Gentle, even in the dark. Hums while she mends.', abilities: ['Mending Dusk: restores HP each tick', 'Ward: raises defence of the whole army'], basePower: 7, unlock: { kind: 'quests', value: 100, label: 'Complete 100 quests' } },
  { id: 'kurogane', name: 'Kurogane', title: 'The Black Wyrm', klass: 'Shadow Dragon', art: '/art/shadow/kurogane.webp', thumb: '/art/shadow/kurogane-thumb.webp', personality: 'Ancient. Bored by anything smaller than a gate.', abilities: ['Void Breath: devastating area damage', 'Wyrm\'s Pride: army power +20%'], basePower: 28, unlock: { kind: 'redgate', value: 1, label: 'Clear a Red Gate on Hard or above' } },
]

export function shadowXpForLevel(level: number) {
  return Math.round(80 * Math.pow(level, 1.6))
}

export function shadowRank(level: number) {
  const idx = Math.min(SHADOW_RANKS.length - 1, Math.floor((level - 1) / 5))
  return SHADOW_RANKS[idx]
}

export function shadowPower(def: ShadowDef, level: number) {
  return Math.round(def.basePower * (1 + (level - 1) * 0.18))
}
