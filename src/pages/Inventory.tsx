import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { useGame } from '../store/game'
import { ITEMS, RARITY_META } from '../game/content/items'
import { ATTRS } from '../game/content/attrs'
import type { EquipSlot, ItemCategory, ItemDef } from '../game/types'
import { buyItem, equipItem, unequip, useConsumable } from '../game/engine'
import HoloPanel from '../components/ui/HoloPanel'
import SysButton from '../components/ui/SysButton'
import Tag from '../components/ui/Tag'
import Modal from '../components/ui/Modal'
import Empty from '../components/ui/Empty'
import { playSfx, speak } from '../audio'
import clsx from '../lib/clsx'

const SLOTS: { k: EquipSlot; l: string }[] = [{ k: 'weapon', l: 'Weapon' }, { k: 'armor', l: 'Armor' }, { k: 'boots', l: 'Boots' }, { k: 'accessory', l: 'Accessory' }]
const CATS: { k: ItemCategory | 'all'; l: string }[] = [{ k: 'all', l: 'All' }, { k: 'weapon', l: 'Weapons' }, { k: 'armor', l: 'Armor' }, { k: 'accessory', l: 'Accessories' }, { k: 'potion', l: 'Potions' }, { k: 'special', l: 'Special' }, { k: 'skill-upgrade', l: 'Skill upgrades' }, { k: 'collectible', l: 'Collectibles' }]

export default function Inventory() {
  const state = useGame((s) => s.state)
  const mutate = useGame((s) => s.mutate)
  const [tab, setTab] = useState<'inventory' | 'armory'>('inventory')
  const [cat, setCat] = useState<ItemCategory | 'all'>('all')
  const [sel, setSel] = useState<ItemDef | null>(null)
  const [msg, setMsg] = useState<string | null>(null)
  const owned = useMemo(() => ITEMS.filter((i) => (state.inventory[i.id] ?? 0) > 0), [state.inventory])
  const list = (tab === 'inventory' ? owned : ITEMS).filter((i) => cat === 'all' || i.category === cat)
  const equippedId = (slot: EquipSlot) => state.equipment[slot]
  const isEquipped = (id: string) => Object.values(state.equipment).includes(id)

  const buy = (i: ItemDef) => {
    let err: string | null = null
    mutate((d) => { err = buyItem(d, i.id) })
    setMsg(err)
    if (err) playSfx('deny'); else { playSfx('coin'); void speak('Item acquired.', 'normal') }
  }
  const equip = (i: ItemDef) => { mutate((d) => equipItem(d, i.id)); playSfx('skill'); setSel(null) }
  const use = (i: ItemDef) => {
    let err: string | null = null
    mutate((d) => { err = useConsumable(d, i.id) })
    setMsg(err)
    if (err) playSfx('deny'); else playSfx('potion')
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div><h1 className="font-display text-2xl font-black tracking-[0.15em] text-glow text-glow-sys">INVENTORY</h1><p className="text-sm text-muted">Equip what you earn. Spend gold earned inside the System. Nothing here costs real money.</p></div>
        <div className="font-display text-right"><div className="text-[9px] tracking-[0.3em] text-muted">GOLD</div><div className="text-xl text-ember">{state.gold.toLocaleString()}</div></div>
      </div>

      <HoloPanel tag="EQUIPMENT" title="Loadout" noPad>
        <div className="grid grid-cols-2 gap-2 p-3 sm:grid-cols-4">
          {SLOTS.map((s) => {
            const id = equippedId(s.k)
            const item = id ? ITEMS.find((i) => i.id === id) : null
            return (
              <button key={s.k} type="button" onClick={() => { if (item) { playSfx('open'); setSel(item) } else { setTab('armory'); setCat(s.k === 'boots' ? 'armor' : s.k); playSfx('press') } }} className={clsx('clip-panel-sm relative flex items-center gap-2 border p-2 text-left', item ? 'border-sys/40 bg-sys/5' : 'border-dashed border-glow/15')}>
                <div className="h-14 w-14 flex-none overflow-hidden clip-panel-sm bg-void/60">{item && <img src={item.art} alt="" className="h-full w-full object-cover" style={{ boxShadow: `inset 0 0 20px ${RARITY_META[item.rarity].glow}` }} />}</div>
                <div className="min-w-0"><div className="font-display text-[9px] tracking-[0.3em] text-muted">{s.l.toUpperCase()}</div><div className="truncate font-display text-xs" style={{ color: item ? RARITY_META[item.rarity].color : undefined }}>{item ? item.name : 'Empty'}</div></div>
              </button>
            )
          })}
        </div>
      </HoloPanel>

      <div className="flex flex-wrap items-center gap-2">
        <div className="flex gap-1">
          {(['inventory', 'armory'] as const).map((t) => <button key={t} type="button" onClick={() => { setTab(t); playSfx('press') }} className={clsx('clip-panel-sm border px-4 py-2 font-display text-[11px] tracking-[0.25em]', tab === t ? 'border-sys bg-sys/15 text-glow shadow-holo' : 'border-glow/10 text-muted')}>{t === 'inventory' ? `INVENTORY (${owned.length})` : 'ARMORY'}</button>)}
        </div>
        <div className="flex-1" />
        <select className="sys-input w-auto py-1.5 text-xs" value={cat} onChange={(e) => setCat(e.target.value as ItemCategory | 'all')}>{CATS.map((c) => <option key={c.k} value={c.k}>{c.l}</option>)}</select>
      </div>

      {list.length === 0 ? <Empty title="NOTHING HERE" body={tab === 'inventory' ? 'Clear dungeons and visit the armory to fill your inventory.' : 'No items in this category.'} /> : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {list.map((i, idx) => {
            const r = RARITY_META[i.rarity]
            const count = state.inventory[i.id] ?? 0
            const locked = state.level < i.levelReq
            return (
              <motion.button key={i.id} type="button" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.04 }} onClick={() => { playSfx('open'); setMsg(null); setSel(i) }} className="holo clip-panel relative p-3 text-left" style={{ boxShadow: `0 0 0 1px ${r.color}66, 0 0 22px ${r.glow}` }}>
                <div className="relative aspect-square overflow-hidden clip-panel-sm"><img src={i.art} alt="" className={clsx('h-full w-full object-cover', locked && tab === 'armory' && 'grayscale brightness-75')} />{count > 1 && <div className="absolute right-1 top-1 bg-void/80 px-1.5 font-display text-[10px] font-bold">×{count}</div>}{isEquipped(i.id) && <div className="absolute left-1 top-1 clip-tag bg-sys px-1.5 font-display text-[9px] font-bold text-void">EQUIPPED</div>}</div>
                <div className="mt-2 font-display text-[9px] tracking-[0.3em]" style={{ color: r.color }}>{r.label.toUpperCase()}</div>
                <div className="truncate font-display text-sm font-bold tracking-[0.08em]">{i.name}</div>
                <div className="mt-1 flex items-center justify-between font-display text-[10px] text-muted"><span>LV {i.levelReq}</span>{tab === 'armory' && <span className="text-ember">{i.price.toLocaleString()} G</span>}</div>
              </motion.button>
            )
          })}
        </div>
      )}

      <Modal open={Boolean(sel)} onClose={() => setSel(null)} tag={sel ? RARITY_META[sel.rarity].label.toUpperCase() : ''} title={sel?.name}>
        {sel && (() => {
          const r = RARITY_META[sel.rarity]
          const count = state.inventory[sel.id] ?? 0
          const locked = state.level < sel.levelReq
          return (
            <div className="space-y-4">
              <div className="flex gap-4">
                <img src={sel.art} alt="" className="h-32 w-32 flex-none object-cover clip-panel-sm" style={{ boxShadow: `0 0 30px ${r.glow}` }} />
                <div>
                  <div className="flex flex-wrap gap-1.5"><Tag color={r.color}>{r.label}</Tag><Tag className="bg-glow/5 text-muted">{sel.category}</Tag>{sel.slot && <Tag className="bg-glow/5 text-muted">{sel.slot}</Tag>}</div>
                  <p className="mt-2 text-sm text-glow/85">{sel.description}</p>
                  <div className={clsx('mt-2 font-display text-[10px] tracking-[0.2em]', locked ? 'text-danger' : 'text-muted')}>REQUIRES LEVEL {sel.levelReq}{sel.unlockNote ? ` · ${sel.unlockNote}` : ''}</div>
                </div>
              </div>
              {(Object.keys(sel.attrs).length > 0 || sel.battle) && (
                <div className="grid grid-cols-3 gap-2 font-display text-center text-xs">
                  {Object.entries(sel.attrs).map(([k, v]) => <div key={k} className="holo clip-panel-sm p-2"><div className="text-[9px] tracking-[0.3em] text-muted">{ATTRS.find((a) => a.key === k)?.short}</div><div className="text-sys">+{v}</div></div>)}
                  {sel.battle?.attack && <div className="holo clip-panel-sm p-2"><div className="text-[9px] tracking-[0.3em] text-muted">ATTACK</div><div className="text-ember">+{sel.battle.attack}</div></div>}
                  {sel.battle?.defense && <div className="holo clip-panel-sm p-2"><div className="text-[9px] tracking-[0.3em] text-muted">DEFENSE</div><div className="text-ember">+{sel.battle.defense}</div></div>}
                  {sel.battle?.crit && <div className="holo clip-panel-sm p-2"><div className="text-[9px] tracking-[0.3em] text-muted">CRIT</div><div className="text-ember">+{sel.battle.crit}%</div></div>}
                </div>
              )}
              {msg && <div className="border border-danger/50 bg-danger/10 px-3 py-2 text-xs">{msg}</div>}
              <div className="flex flex-wrap gap-2">
                {count > 0 && sel.slot && !isEquipped(sel.id) && <SysButton variant="arcane" className="flex-1" disabled={locked} onClick={() => equip(sel)}>EQUIP</SysButton>}
                {isEquipped(sel.id) && sel.slot && <SysButton variant="ghost" className="flex-1" onClick={() => { mutate((d) => unequip(d, sel.slot!)); playSfx('press'); setSel(null) }}>UNEQUIP</SysButton>}
                {count > 0 && sel.consumable && !sel.consumable.hp && !sel.consumable.mp && <SysButton variant="arcane" className="flex-1" onClick={() => use(sel)}>USE</SysButton>}
                {count > 0 && sel.consumable && (sel.consumable.hp || sel.consumable.mp) && <SysButton variant="arcane" className="flex-1" onClick={() => use(sel)}>DRINK (restores HP/MP)</SysButton>}
                {(count === 0 || sel.stackable) && <SysButton variant="ember" className="flex-1" disabled={locked || state.gold < sel.price} onClick={() => buy(sel)}>BUY · {sel.price.toLocaleString()} G</SysButton>}
              </div>
              {count > 0 && <div className="font-display text-[10px] tracking-[0.2em] text-muted">OWNED ×{count}</div>}
            </div>
          )
        })()}
      </Modal>
    </div>
  )
}
