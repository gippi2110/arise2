import type { ItemDef, Rarity } from '../types'

export const RARITY_META: Record<Rarity, { label: string; color: string; glow: string }> = {
  common: { label: 'Common', color: '#9AA4B8', glow: 'rgba(154,164,184,0.35)' },
  uncommon: { label: 'Uncommon', color: '#58C37A', glow: 'rgba(88,195,122,0.4)' },
  rare: { label: 'Rare', color: '#168CFF', glow: 'rgba(22,140,255,0.45)' },
  epic: { label: 'Epic', color: '#B266FF', glow: 'rgba(178,102,255,0.5)' },
  legendary: { label: 'Legendary', color: '#FF7100', glow: 'rgba(255,113,0,0.55)' },
  mythic: { label: 'Mythic', color: '#FFD166', glow: 'rgba(255,209,102,0.6)' },
}

export const ITEMS: ItemDef[] = [
  { id: 'kasaka-fang', name: "Serpent's Fang", art: '/art/item/kasaka-fang.webp', category: 'weapon', slot: 'weapon', rarity: 'rare', description: 'A dagger carved from the fang of Ssyrak. The venom never dried.', levelReq: 8, price: 650, attrs: { agility: 3, sense: 2 }, battle: { attack: 14, crit: 8 } },
  { id: 'knight-killer', name: 'Knight Killer', art: '/art/item/knight-killer.webp', category: 'weapon', slot: 'weapon', rarity: 'epic', description: 'A longsword forged to pierce plate. It hums near armour.', levelReq: 20, price: 2400, attrs: { strength: 5, agility: 2 }, battle: { attack: 30, crit: 5 } },
  { id: 'demon-spear', name: "Sovereign's Spear", art: '/art/item/demon-spear.webp', category: 'weapon', slot: 'weapon', rarity: 'legendary', description: 'Pulled from the Throne of Ash. The tip still burns.', levelReq: 40, price: 9000, attrs: { strength: 9, endurance: 3 }, battle: { attack: 62, crit: 10 } },
  { id: 'hunters-hood', name: "Hunter's Hood", art: '/art/item/hunters-hood.webp', category: 'armor', slot: 'armor', rarity: 'common', description: 'Worn leather, faint runes. Better than nothing. Much better.', levelReq: 1, price: 180, attrs: { endurance: 1, sense: 1 }, battle: { defense: 4 } },
  { id: 'shadow-plate', name: 'Shadow Plate', art: '/art/item/shadow-plate.webp', category: 'armor', slot: 'armor', rarity: 'epic', description: 'Armour grown from compressed shadow. Weightless. Unbreakable so far.', levelReq: 25, price: 3200, attrs: { vitality: 6, endurance: 5 }, battle: { defense: 22 } },
  { id: 'wind-boots', name: 'Windstep Boots', art: '/art/item/wind-boots.webp', category: 'armor', slot: 'boots', rarity: 'uncommon', description: 'Each step lands a little before you take it.', levelReq: 5, price: 420, attrs: { agility: 4 }, battle: { defense: 3, crit: 3 } },
  { id: 'monarch-ring', name: "Monarch's Ring", art: '/art/item/monarch-ring.webp', category: 'accessory', slot: 'accessory', rarity: 'legendary', description: 'Black metal, violet stone. The army answers faster when you wear it.', levelReq: 35, price: 7000, attrs: { intelligence: 5, sense: 4, discipline: 3 }, battle: { attack: 12, defense: 8 } },
  { id: 'elixir-pendant', name: 'Elixir Pendant', art: '/art/item/elixir-pendant.webp', category: 'accessory', slot: 'accessory', rarity: 'rare', description: 'A vial of blue elixir on a chain. Steadies the breath, steadies the mind.', levelReq: 10, price: 900, attrs: { vitality: 3, intelligence: 3 }, battle: { defense: 5 } },
  { id: 'hp-potion', name: 'Vital Draught', art: '/art/item/hp-potion.webp', category: 'potion', rarity: 'common', description: 'Restores 120 HP in battle.', levelReq: 1, price: 60, attrs: {}, consumable: { hp: 120 }, stackable: true },
  { id: 'mp-potion', name: 'Mana Draught', art: '/art/item/mp-potion.webp', category: 'potion', rarity: 'common', description: 'Restores 60 MP in battle.', levelReq: 1, price: 60, attrs: {}, consumable: { mp: 60 }, stackable: true },
  { id: 'elixir', name: 'Elixir of Life', art: '/art/item/elixir.webp', category: 'potion', rarity: 'epic', description: 'Fully restores HP and MP.', levelReq: 15, price: 700, attrs: {}, consumable: { hp: 99999, mp: 99999 }, stackable: true },
  { id: 'shadow-core', name: 'Shadow Core', art: '/art/item/shadow-core.webp', category: 'special', rarity: 'epic', description: 'Consume to permanently raise your shadow capacity by one.', levelReq: 20, price: 2500, attrs: {}, consumable: { capacity: 1 }, stackable: true },
  { id: 'rune-stone', name: 'Rune of Unmaking', art: '/art/item/rune-stone.webp', category: 'skill-upgrade', rarity: 'rare', description: 'Returns every allocated stat point. Rebuild yourself.', levelReq: 10, price: 1200, attrs: {}, consumable: { resetStats: true }, stackable: true },
  { id: 'crown-fragment', name: "Fragment of the Monarch's Crown", art: '/art/item/crown-fragment.webp', category: 'collectible', rarity: 'mythic', description: 'A relic. It does nothing. It does not need to.', levelReq: 70, price: 50000, attrs: { discipline: 5, consistency: 5 }, unlockNote: 'Only an S-Rank may hold this.' },
]

export const ITEM_BY_ID = Object.fromEntries(ITEMS.map((i) => [i.id, i])) as Record<string, ItemDef>
