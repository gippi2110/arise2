import type { SkillDef } from '../types'

export const SKILLS: SkillDef[] = [
  {
    id: 'shadow-extraction', name: 'Shadow Extraction', art: '/art/skill/shadow-extraction.webp', kind: 'active', maxLevel: 5, mpCost: 0, cooldownSec: 0,
    description: 'Pull the soul of a fallen boss into your service. Used automatically after a boss falls.',
    unlock: { level: 20, rank: 'C', label: 'Reach C-Rank' },
    upgradeGold: (l) => 400 + l * 350,
    effect: (l) => `${35 + l * 12}% extraction success chance`,
  },
  {
    id: 'shadow-storage', name: 'Shadow Storage', art: '/art/skill/shadow-storage.webp', kind: 'passive', maxLevel: 5, mpCost: 0, cooldownSec: 0,
    description: 'Store your army inside your own shadow. Each level widens the army you can command.',
    unlock: { level: 20, rank: 'C', label: 'Reach C-Rank' },
    upgradeGold: (l) => 350 + l * 300,
    effect: (l) => `+${l} shadow capacity, army power +${l * 5}%`,
  },
  {
    id: 'rulers-authority', name: "Ruler's Authority", art: '/art/skill/rulers-authority.webp', kind: 'active', maxLevel: 5, mpCost: 30, cooldownSec: 18,
    description: 'Crush the enemy with telekinetic force. Massive burst damage.',
    unlock: { level: 50, rank: 'A', label: 'Reach A-Rank' },
    upgradeGold: (l) => 900 + l * 700,
    effect: (l) => `Deals ${250 + l * 60}% of your attack as damage`,
  },
  {
    id: 'stealth', name: 'Stealth', art: '/art/skill/stealth.webp', kind: 'active', maxLevel: 5, mpCost: 14, cooldownSec: 20,
    description: 'Fade from sight. The boss loses track of you and its next strikes miss.',
    unlock: { level: 5, label: 'Reach level 5' },
    upgradeGold: (l) => 150 + l * 180,
    effect: (l) => `Next ${1 + Math.floor(l / 2)} boss attack(s) miss`,
  },
  {
    id: 'bloodlust', name: 'Bloodlust', art: '/art/skill/bloodlust.webp', kind: 'active', maxLevel: 5, mpCost: 18, cooldownSec: 22,
    description: 'Release killing intent. The boss falters and your strikes land harder for a time.',
    unlock: { level: 12, rank: 'D', label: 'Reach D-Rank and level 12' },
    upgradeGold: (l) => 250 + l * 220,
    effect: (l) => `+${30 + l * 10}% damage for ${8 + l}s, boss attack -30%`,
  },
  {
    id: 'dagger-mastery', name: 'Dagger Mastery', art: '/art/skill/dagger-mastery.webp', kind: 'passive', maxLevel: 5, mpCost: 0, cooldownSec: 0,
    description: 'Every strike finds the gap in the armour.',
    unlock: { level: 3, label: 'Reach level 3' },
    upgradeGold: (l) => 120 + l * 150,
    effect: (l) => `+${l * 6}% critical chance, +${l * 10}% critical damage`,
  },
  {
    id: 'shadow-exchange', name: 'Shadow Exchange', art: '/art/skill/shadow-exchange.webp', kind: 'active', maxLevel: 5, mpCost: 22, cooldownSec: 26,
    description: 'Swap places with one of your shadows. It takes the hit meant for you and strikes back.',
    unlock: { level: 70, rank: 'S', label: 'Reach S-Rank' },
    upgradeGold: (l) => 1400 + l * 900,
    effect: (l) => `Negate next boss attack and counter for ${100 + l * 40}% army power`,
  },
]

export const SKILL_BY_ID = Object.fromEntries(SKILLS.map((s) => [s.id, s])) as Record<string, SkillDef>
