import type { AchievementDef } from '../types'

export const ACHIEVEMENTS: AchievementDef[] = [
  { id: 'first-awakening', name: 'First Awakening', description: 'You heard the System and did not look away.', art: '/art/ach/first-awakening.webp', xp: 50, gold: 50 },
  { id: 'first-quest', name: 'First Blood', description: 'Complete your first quest.', art: '/art/ach/quests-100.webp', xp: 60, gold: 40 },
  { id: 'first-dungeon', name: 'First Dungeon Cleared', description: 'Walk into a gate and walk back out.', art: '/art/ach/first-dungeon.webp', xp: 150, gold: 100 },
  { id: 'first-promotion', name: 'First Rank Promotion', description: 'The Association had to update your file.', art: '/art/ach/first-promotion.webp', xp: 300, gold: 200 },
  { id: 'streak-7', name: '7-Day Streak', description: 'Seven days. Every daily quest. No excuses.', art: '/art/ach/streak-7.webp', xp: 400, gold: 250 },
  { id: 'streak-30', name: '30-Day Streak', description: 'A month of discipline. Most hunters never see this.', art: '/art/ach/streak-30.webp', xp: 2000, gold: 1200 },
  { id: 'quests-100', name: '100 Quests Completed', description: 'A hundred missions. The System takes notice.', art: '/art/ach/quests-100.webp', xp: 1200, gold: 800 },
  { id: 'boss-slayer', name: 'Boss Slayer', description: 'Defeat 10 bosses.', art: '/art/boss/hollow-knight.webp', xp: 900, gold: 600 },
  { id: 'red-gate-survivor', name: 'Red Gate Survivor', description: 'Clear a Red Gate.', art: '/art/dungeon/redgate.webp', xp: 1500, gold: 1000 },
  { id: 'first-shadow', name: 'Arise', description: 'Extract your first shadow.', art: '/art/skill/shadow-extraction.webp', xp: 500, gold: 300 },
  { id: 'shadow-monarch', name: 'Shadow Monarch', description: 'Command every shadow.', art: '/art/ach/shadow-monarch.webp', xp: 5000, gold: 3000 },
  { id: 'gold-hoarder', name: 'Treasury of the Monarch', description: 'Earn 10,000 gold in total.', art: '/art/item/crown-fragment.webp', xp: 800, gold: 500 },
  { id: 'skill-master', name: 'Skill Master', description: 'Max out any skill.', art: '/art/skill/rulers-authority.webp', xp: 1000, gold: 600 },
  { id: 'ultimate-hunter', name: 'Ultimate Hunter', description: 'Reach National Level.', art: '/art/ach/ultimate-hunter.webp', xp: 10000, gold: 10000 },
  { id: 'silent-hour', name: 'The Silent Hour', description: 'Complete a secret quest.', art: '/art/skill/stealth.webp', xp: 600, gold: 400, secret: true },
]

export const ACHIEVEMENT_BY_ID = Object.fromEntries(ACHIEVEMENTS.map((a) => [a.id, a])) as Record<string, AchievementDef>
