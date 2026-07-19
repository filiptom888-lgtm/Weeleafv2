import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import { gsap } from 'gsap'
import useStore from '../../store/useStore'
import { api } from '../../api/wlApi'
import { uploadCoinImageFile } from '../../utils/coinImageUpload'
import { WL, accountInputCls, accountInputStyle, accountCardStyle, accountLabelCls } from '../../styles/modalTheme'
import AccountTabBar from './AccountTabBar'
import UserAvatar from './UserAvatar'

const LOCKED_COIN_IDS = ['shop', 'member']
const inputCls = accountInputCls
const inputStyle = accountInputStyle

async function applyCoinImageUpload(coinId, file, setImageUrl) {
  try {
    const url = await uploadCoinImageFile(coinId, file)
    setImageUrl(url)
  } catch (err) {
    window.alert(err?.message || 'Kunne ikke uploade billede')
  }
}

/* ─── Product editor (used inside ShopAdmin) ─────────────────────────── */
function ProductEditor({ product, catColor, onSave, onCancel }) {
  const [draft, setDraft] = useState({ ...product })
  const set = (patch) => setDraft((d) => ({ ...d, ...patch }))
  const inputCls = 'w-full text-sm rounded-lg px-3 py-2 outline-none border transition-colors'
  const inputStyle = accountInputStyle

  return (
    <div className="rounded-xl p-3 space-y-2" style={{ background: 'rgba(255,255,255,0.8)', border: `1px solid ${catColor}28` }}>
      <input className={inputCls} value={draft.name} onChange={(e) => set({ name: e.target.value })} placeholder="Produktnavn" />
      <textarea className={`${inputCls} resize-none`} rows={3} value={draft.desc || ''} onChange={(e) => set({ desc: e.target.value })} placeholder="Produktbeskrivelse…" />
      <div className="grid grid-cols-2 gap-2">
        <input className={inputCls} value={draft.price || ''} onChange={(e) => set({ price: e.target.value })} placeholder="Pris (valgfri)" />
        <input className={inputCls} value={draft.link || ''} onChange={(e) => set({ link: e.target.value })} placeholder="Link URL" />
      </div>
      <input className={inputCls} value={(!draft.imageUrl || draft.imageUrl.startsWith('data:')) ? '' : draft.imageUrl} onChange={(e) => set({ imageUrl: e.target.value })} placeholder="Billede URL" />
      <label className="flex items-center gap-2 cursor-pointer px-3 py-2 rounded-lg border border-dashed  transition-colors">
        <span>📁</span>
        <span className="text-xs" style={{ color: WL.textSoft }}>Upload billede</span>
        <input type="file" accept="image/*" className="hidden" onChange={(e) => {
          const file = e.target.files?.[0]
          if (!file) return
          const reader = new FileReader()
          reader.onload = (ev) => set({ imageUrl: ev.target.result })
          reader.readAsDataURL(file)
          e.target.value = ''
        }} />
      </label>
      {draft.imageUrl && (
        <div className="flex items-center gap-2">
          <img src={draft.imageUrl} alt="" className="w-14 h-10 object-cover rounded-lg" onError={(e) => (e.target.style.opacity = '0.3')} />
          <button onClick={() => set({ imageUrl: '' })} className="text-[10px] text-red-400/60 hover:text-red-400 transition-colors">× Fjern</button>
        </div>
      )}
      <div className="flex gap-2 pt-1">
        <button onClick={() => onSave(draft)} className="flex-1 py-2 rounded-xl text-xs font-semibold text-white" style={{ background: `${catColor}22`, border: `1px solid ${catColor}44` }}>Gem</button>
        <button onClick={onCancel} className="px-3 py-2 rounded-xl text-xs text-inherit border transition-colors" style={{ borderColor: WL.borderLight }}>Annuller</button>
      </div>
    </div>
  )
}

/* ─── Shop admin ─────────────────────────────────────────────────────── */
function ShopAdmin() {
  const { shopCategories, addShopCategory, deleteShopCategory, addShopProduct, updateShopProduct, deleteShopProduct, resetShop } = useStore()
  const [expandedCatId, setExpandedCatId] = useState(null)
  const [editingKey, setEditingKey] = useState(null) // `new-${catId}` or productId
  const [addingCat, setAddingCat] = useState(false)
  const [newCat, setNewCat] = useState({ label: '', icon: '🛍️', color: '#60a5fa' })
  const inputCls = 'w-full text-sm rounded-lg px-3 py-2 outline-none border transition-colors'
  const inputStyle = accountInputStyle
  const CAT_COLORS = ['#60a5fa', '#86efac', '#fbbf24', '#c084fc', '#f472b6', '#34d399']

  return (
    <div className="space-y-3">
      {shopCategories.map((cat) => (
        <div key={cat.id} className="rounded-xl overflow-hidden" style={{ border: `1px solid ${WL.borderLight}` }}>
          {/* Category header */}
          <div
            className="flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors"
            style={{ background: expandedCatId === cat.id ? `${cat.color}12` : 'rgba(255,255,255,0.03)' }}
            onClick={() => setExpandedCatId(expandedCatId === cat.id ? null : cat.id)}
          >
            <span className="text-xl">{cat.icon}</span>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium" style={{ color: WL.text }}>{cat.label}</div>
              <div className="text-[10px]" style={{ color: WL.textSoft }}>{cat.products?.length ?? 0} produkter</div>
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); if (window.confirm(`Slet "${cat.label}"?`)) deleteShopCategory(cat.id) }}
              className="hover:text-red-500 transition-colors text-base leading-none px-1"
              style={{ color: WL.textSoft }}
            >×</button>
            <span className="text-xs" style={{ color: WL.textSoft }}>{expandedCatId === cat.id ? '▴' : '▾'}</span>
          </div>

          {/* Products */}
          {expandedCatId === cat.id && (
            <div className="px-3 pb-3 pt-1 space-y-2 border-t" style={{ borderColor: WL.borderLight }}>
              {(cat.products ?? []).length === 0 && (
                <p className="text-[11px] px-1 py-1" style={{ color: WL.textSoft }}>Ingen produkter endnu.</p>
              )}
              {(cat.products ?? []).map((p) => (
                <div key={p.id}>
                  {editingKey === p.id ? (
                    <ProductEditor
                      product={p}
                      catColor={cat.color}
                      onSave={(draft) => { updateShopProduct(cat.id, p.id, draft); setEditingKey(null) }}
                      onCancel={() => setEditingKey(null)}
                    />
                  ) : (
                    <div className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{ background: 'rgba(255,255,255,0.72)' }}>
                      {p.imageUrl && (
                        <img src={p.imageUrl} alt="" className="w-8 h-8 object-cover rounded-lg flex-shrink-0" onError={(e) => (e.target.style.display = 'none')} />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="text-sm truncate" style={{ color: WL.textMuted }}>{p.name || '(navnløs)'}</div>
                        {p.price && <div className="text-[10px]" style={{ color: cat.color }}>{p.price}</div>}
                      </div>
                      <button onClick={() => setEditingKey(p.id)} className="hover:opacity-80 transition-colors text-sm px-1" style={{ color: WL.textMuted }}>✏</button>
                      <button onClick={() => deleteShopProduct(cat.id, p.id)} className="hover:text-red-500 transition-colors text-base leading-none" style={{ color: WL.textSoft }}>×</button>
                    </div>
                  )}
                </div>
              ))}
              {editingKey === `new-${cat.id}` ? (
                <ProductEditor
                  product={{ id: `p-${Date.now()}`, name: '', desc: '', price: '', imageUrl: '', link: '' }}
                  catColor={cat.color}
                  onSave={(draft) => { addShopProduct(cat.id, draft); setEditingKey(null) }}
                  onCancel={() => setEditingKey(null)}
                />
              ) : (
                <button
                  onClick={() => setEditingKey(`new-${cat.id}`)}
                  className="w-full text-xs py-2 rounded-lg border border-dashed text-inherit hover:text-inherit  transition-colors mt-1"
                >+ Tilføj produkt</button>
              )}
            </div>
          )}
        </div>
      ))}

      {/* Add category */}
      {addingCat ? (
        <div className="rounded-xl p-4 space-y-3" style={{ background: 'rgba(255,255,255,0.72)', border: '1px solid rgba(255,255,255,0.10)' }}>
          <div className="grid grid-cols-2 gap-2">
            <input className={inputCls} value={newCat.label} onChange={(e) => setNewCat((d) => ({ ...d, label: e.target.value }))} placeholder="Kategorinavn" />
            <input className={inputCls} value={newCat.icon} onChange={(e) => setNewCat((d) => ({ ...d, icon: e.target.value }))} placeholder="Ikon (emoji)" />
          </div>
          <div className="flex gap-2">
            {CAT_COLORS.map((c) => (
              <button key={c} onClick={() => setNewCat((d) => ({ ...d, color: c }))} className="w-6 h-6 rounded-full flex-shrink-0 transition-transform hover:scale-125" style={{ background: c, boxShadow: newCat.color === c ? `0 0 0 2px white, 0 0 8px ${c}` : 'none' }} />
            ))}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => {
                if (!newCat.label.trim()) return
                addShopCategory({ id: `cat-${Date.now()}`, label: newCat.label.trim(), icon: newCat.icon, color: newCat.color, products: [] })
                setNewCat({ label: '', icon: '🛍️', color: '#60a5fa' })
                setAddingCat(false)
              }}
              className="flex-1 py-2 rounded-xl text-sm font-semibold text-white transition-all"
              style={{ background: 'rgba(96,165,250,0.2)', border: '1px solid rgba(96,165,250,0.4)' }}
            >Gem kategori</button>
            <button onClick={() => setAddingCat(false)} className="px-4 py-2 rounded-xl text-sm text-inherit border transition-colors" style={{ borderColor: WL.borderLight }}>Annuller</button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setAddingCat(true)}
          className="w-full py-2.5 rounded-xl text-sm font-semibold transition-all"
          style={{ background: 'rgba(96,165,250,0.12)', border: '1px solid rgba(96,165,250,0.25)', color: '#93c5fd' }}
        >+ Tilføj kategori</button>
      )}

      <button
        onClick={() => { if (window.confirm('Nulstil shop til standard?')) resetShop() }}
        className="w-full py-2 rounded-xl text-xs border transition-colors"
        style={{ color: WL.textMuted, borderColor: WL.borderLight }}
      >↺ Nulstil shop</button>
    </div>
  )
}

/* ─── Pending shop approvals ─────────────────────────────────────────── */
function PendingShopAdmin() {
  const { pendingShopSubmissions, approveShopSubmission, rejectShopSubmission } = useStore()
  const pending = pendingShopSubmissions.filter((s) => s.status === 'pending')
  const reviewed = pendingShopSubmissions.filter((s) => s.status !== 'pending')

  const handleApprove = async (id) => {
    const res = await approveShopSubmission(id)
    if (!res?.ok) window.alert(res?.error || 'Kunne ikke godkende produktet.')
  }

  const handleReject = async (id) => {
    if (!window.confirm('Afvis dette produktforslag?')) return
    const res = await rejectShopSubmission(id)
    if (!res?.ok) window.alert(res?.error || 'Kunne ikke afvise produktet.')
  }

  return (
    <div className="space-y-4">
      <p className="text-xs leading-relaxed" style={{ color: WL.textMuted }}>
        Medlemmer kan foreslå produkter fra Login-noden. Godkendte produkter vises i Shop.
      </p>

      {pending.length === 0 && (
        <div className="flex flex-col items-center py-10 gap-2 rounded-xl" style={{ background: 'rgba(255,255,255,0.65)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <span className="text-3xl opacity-30">✅</span>
          <p className="text-xs" style={{ color: WL.textSoft }}>Ingen afventende produkter</p>
        </div>
      )}

      {pending.map((sub) => (
        <div
          key={sub.id}
          className="rounded-xl overflow-hidden"
          style={{ background: 'rgba(255,255,255,0.72)', border: '1px solid rgba(251,191,36,0.25)' }}
        >
          <div className="px-4 py-3 flex items-start gap-3 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
            {sub.product.imageUrl ? (
              <img src={sub.product.imageUrl} alt="" className="w-14 h-14 rounded-lg object-cover flex-shrink-0" onError={(e) => (e.target.style.display = 'none')} />
            ) : (
              <div className="w-14 h-14 rounded-lg flex items-center justify-center text-2xl flex-shrink-0" style={{ background: `${sub.categoryColor}18` }}>
                {sub.categoryIcon || '🛍️'}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold" style={{ color: WL.text }}>{sub.product.name}</div>
              <div className="text-[10px] text-inherit mt-0.5">
                {sub.categoryLabel} · {sub.userName} · {new Date(sub.submittedAt).toLocaleDateString('da-DK')}
              </div>
              {sub.product.price && (
                <div className="text-xs mt-1" style={{ color: sub.categoryColor }}>{sub.product.price}</div>
              )}
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded-full flex-shrink-0" style={{ background: 'rgba(251,191,36,0.15)', color: '#fbbf24', border: '1px solid rgba(251,191,36,0.3)' }}>
              Afventer
            </span>
          </div>
          {sub.product.desc && (
            <p className="px-4 py-3 text-xs text-inherit leading-relaxed line-clamp-4">{sub.product.desc}</p>
          )}
          <div className="px-4 pb-4 flex gap-2">
            <button
              onClick={() => handleApprove(sub.id)}
              className="flex-1 py-2 rounded-xl text-xs font-semibold text-white transition-all"
              style={{ background: 'rgba(74,222,128,0.22)', border: '1px solid rgba(74,222,128,0.4)', color: WL.green }}
            >
              ✓ Godkend
            </button>
            <button
              onClick={() => handleReject(sub.id)}
              className="flex-1 py-2 rounded-xl text-xs font-semibold transition-all"
              style={{ background: 'rgba(248,113,113,0.12)', border: '1px solid rgba(248,113,113,0.3)', color: '#fca5a5' }}
            >
              ✕ Afvis
            </button>
          </div>
        </div>
      ))}

      {reviewed.length > 0 && (
        <div className="pt-2 space-y-2">
          <div className="text-[10px] uppercase tracking-widest" style={{ color: WL.textSoft }}>Seneste beslutninger</div>
          {reviewed.slice(0, 8).map((sub) => (
            <div key={sub.id} className="flex items-center gap-2 px-3 py-2 rounded-lg text-[11px]" style={{ background: 'rgba(255,255,255,0.65)' }}>
              <span>{sub.status === 'approved' ? '✓' : '✕'}</span>
              <span className="text-inherit truncate flex-1">{sub.product.name}</span>
              <span className={sub.status === 'approved' ? 'text-green-400/70' : 'text-red-400/50'}>
                {sub.status === 'approved' ? 'Godkendt' : 'Afvist'}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

/* ─── Colour presets ─────────────────────────────────────────────────── */
const COLOR_PRESETS = [
  { color: '#4ade80', emissiveColor: '#22c55e', label: 'Green' },
  { color: WL.green, emissiveColor: '#4ade80', label: 'Mint' },
  { color: '#fbbf24', emissiveColor: '#f59e0b', label: 'Amber' },
  { color: '#60a5fa', emissiveColor: '#3b82f6', label: 'Blue' },
  { color: '#c084fc', emissiveColor: '#a855f7', label: 'Purple' },
  { color: '#f472b6', emissiveColor: '#ec4899', label: 'Pink' },
  { color: '#34d399', emissiveColor: '#10b981', label: 'Teal' },
  { color: '#fb923c', emissiveColor: '#f97316', label: 'Orange' },
  { color: '#e2e8f0', emissiveColor: '#cbd5e1', label: 'Silver' },
  { color: '#f87171', emissiveColor: '#ef4444', label: 'Red' },
]

/* ─── Blank new coin template ────────────────────────────────────────── */
function blankCoin(existingCount) {
  return {
    id: `coin-${Date.now()}`,
    label: 'NEW',
    subtitle: 'New Node',
    color: '#4ade80',
    emissiveColor: '#22c55e',
    angle: Math.round((existingCount / 7) * 360),
    imageUrl: '',
    content: {
      title: 'New Coin',
      tagline: 'Add your tagline here.',
      sections: [
        { heading: '✨ Section Title', text: 'Add your content here.' },
      ],
    },
  }
}

/* ─── Single coin editor row ─────────────────────────────────────────── */
function CoinRow({ coin, index, onEdit, onDelete, isEditing, onSelect }) {
  return (
    <div
      className="flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer transition-colors"
      style={{
        background: isEditing ? `${coin.color}15` : 'rgba(255,255,255,0.04)',
        border: `1px solid ${isEditing ? coin.color + '55' : 'rgba(255,255,255,0.08)'}`,
      }}
      onClick={onSelect}
    >
      {/* Colour dot */}
      <span
        className="w-4 h-4 rounded-full flex-shrink-0 border-2"
        style={{ background: coin.color, borderColor: coin.emissiveColor, boxShadow: `0 0 8px ${coin.color}55` }}
      />

      {/* Thumbnail */}
      {coin.imageUrl ? (
        <img src={coin.imageUrl} alt="" className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
      ) : (
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold"
          style={{ background: `${coin.color}22`, color: coin.color }}
        >
          {coin.label.slice(0, 2)}
        </div>
      )}

      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium truncate" style={{ color: WL.text }}>{coin.subtitle}</div>
        <div className="text-[10px] text-inherit">{coin.label} · {coin.angle}°</div>
      </div>

      {LOCKED_COIN_IDS.includes(coin.id) ? (
        <span className="text-xs px-1" style={{ color: WL.textSoft }} title="Låst — kan ikke slettes">🔒</span>
      ) : (
        <button
          className="hover:text-red-500 transition-colors text-base leading-none px-1"
          style={{ color: WL.textSoft }}
          onClick={(e) => { e.stopPropagation(); onDelete() }}
          title="Delete coin"
        >
          ×
        </button>
      )}
    </div>
  )
}

/* ─── Full editor for selected coin ─────────────────────────────────── */
function CoinEditor({ coin, onSave, onClose }) {
  const [draft, setDraft] = useState(() => ({
    ...coin,
    content: {
      ...coin.content,
      sections: coin.content?.sections ? [...coin.content.sections.map(s => ({ ...s }))] : [],
    },
  }))

  const set = (patch) => setDraft((d) => ({ ...d, ...patch }))
  const setSec = (i, patch) =>
    setDraft((d) => {
      const sections = d.content.sections.map((s, idx) => idx === i ? { ...s, ...patch } : s)
      return { ...d, content: { ...d.content, sections } }
    })
  const addSection = () =>
    setDraft((d) => ({
      ...d,
      content: { ...d.content, sections: [...d.content.sections, { heading: '✨ New Section', text: '' }] },
    }))
  const removeSection = (i) =>
    setDraft((d) => ({
      ...d,
      content: { ...d.content, sections: d.content.sections.filter((_, idx) => idx !== i) },
    }))

  const inputClass = accountInputCls

  const isLocked = LOCKED_COIN_IDS.includes(coin.id)

  if (isLocked) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl" style={{ background: 'rgba(255,200,50,0.06)', border: '1px solid rgba(255,200,50,0.18)' }}>
          <span>🔒</span>
          <p className="text-xs text-yellow-200/60">Dette coin er låst. Du kan kun ændre billedet.</p>
        </div>

        {/* Image-only editor */}
        <div className="space-y-2">
          <label className="text-[10px] uppercase tracking-widest" style={{ color: WL.textSoft }}>Coin Image</label>
          <label className="flex items-center gap-3 cursor-pointer px-3 py-2.5 rounded-xl border border-dashed transition-colors hover:border-green-500/40 hover:bg-green-500/5" style={{ borderColor: 'rgba(255,255,255,0.15)' }}>
            <span className="text-xl">📁</span>
            <div>
              <div className="text-sm" style={{ color: WL.textMuted }}>Upload billede</div>
              <div className="text-[10px]" style={{ color: WL.textSoft }}>PNG, JPG, GIF, WebP</div>
            </div>
            <input type="file" accept="image/*" className="hidden" onChange={(e) => {
              const file = e.target.files?.[0]; if (!file) return
              applyCoinImageUpload(draft.id, file, (url) => set({ imageUrl: url }))
              e.target.value = ''
            }} />
          </label>
          <input className={inputClass} value={(!draft.imageUrl || draft.imageUrl.startsWith('data:')) ? '' : draft.imageUrl} onChange={(e) => set({ imageUrl: e.target.value })} placeholder="https://example.com/image.png" />
          {draft.imageUrl && (
            <div className="flex items-center gap-3">
              <img src={draft.imageUrl} alt="" className="w-16 h-16 rounded-full object-cover border-2" style={{ borderColor: draft.color + '88' }} />
              <button onClick={() => set({ imageUrl: '' })} className="text-[10px] text-red-400/70 hover:text-red-400 transition-colors">× Fjern billede</button>
            </div>
          )}
        </div>

        <div className="flex gap-2 pt-2">
          <button onClick={() => onSave(draft)} className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white transition-all" style={{ background: 'rgba(74,222,128,0.3)', border: '1px solid rgba(74,222,128,0.4)' }}>Gem billede</button>
          <button onClick={onClose} className="px-4 py-2.5 rounded-xl text-sm text-inherit hover:text-inherit border transition-colors" style={{ borderColor: WL.borderLight }}>Annuller</button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Identity */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-[10px] uppercase tracking-widest" style={{ color: WL.textSoft }}>Label</label>
          <input className={inputClass} value={draft.label} onChange={(e) => set({ label: e.target.value })} placeholder="WL" />
        </div>
        <div>
          <label className="text-[10px] uppercase tracking-widest" style={{ color: WL.textSoft }}>Subtitle</label>
          <input className={inputClass} value={draft.subtitle} onChange={(e) => set({ subtitle: e.target.value })} placeholder="The Core" />
        </div>
      </div>

      {/* Orbit angle */}
      <div>
        <label className="text-[10px] uppercase tracking-widest" style={{ color: WL.textSoft }}>
          Orbit angle — {draft.angle}°
        </label>
        <input
          type="range" min={0} max={359} value={draft.angle}
          onChange={(e) => set({ angle: Number(e.target.value) })}
          className="w-full accent-green-400 mt-1"
        />
      </div>

      {/* Coin Image */}
      <div className="space-y-2">
        <label className="text-[10px] uppercase tracking-widest" style={{ color: WL.textSoft }}>Coin Image</label>

        {/* Upload button */}
        <label
          className="flex items-center gap-3 cursor-pointer px-3 py-2.5 rounded-xl border border-dashed transition-colors hover:border-green-500/40 hover:bg-green-500/5"
          style={{ borderColor: 'rgba(255,255,255,0.15)' }}
        >
          <span className="text-xl">📁</span>
          <div>
            <div className="text-sm" style={{ color: WL.textMuted }}>Upload image</div>
            <div className="text-[10px]" style={{ color: WL.textSoft }}>PNG, JPG, WebP — optimized & saved on server</div>
          </div>
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (!file) return
              applyCoinImageUpload(draft.id, file, (url) => set({ imageUrl: url }))
              e.target.value = ''
            }}
          />
        </label>

        {/* ─── OR paste URL ─── */}
        <div className="flex items-center gap-2">
          <div className="flex-1 h-px bg-white/10" />
          <span className="text-[10px] text-inherit">or paste URL</span>
          <div className="flex-1 h-px bg-white/10" />
        </div>
        <input
          className={inputClass}
          value={(!draft.imageUrl || draft.imageUrl.startsWith('data:')) ? '' : draft.imageUrl}
          onChange={(e) => set({ imageUrl: e.target.value })}
          placeholder="https://example.com/image.png"
        />

        {/* Preview + clear */}
        {draft.imageUrl && (
          <div className="flex items-center gap-3">
            <div className="relative">
              <img
                src={draft.imageUrl}
                alt=""
                className="w-16 h-16 rounded-full object-cover border-2"
                style={{ borderColor: draft.color + '88' }}
                onError={(e) => (e.target.style.opacity = '0.3')}
              />
              {/* Colour ring overlay preview */}
              <div
                className="absolute inset-0 rounded-full pointer-events-none"
                style={{ boxShadow: `0 0 0 2px ${draft.color}55, 0 0 16px ${draft.color}44` }}
              />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs text-inherit truncate">
                {draft.imageUrl.startsWith('data:') ? '📎 Uploaded file' : draft.imageUrl}
              </div>
              <button
                onClick={() => set({ imageUrl: '' })}
                className="mt-1 text-[10px] text-red-400/70 hover:text-red-400 transition-colors"
              >
                × Remove image
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Colour presets */}
      <div>
        <label className="text-[10px] uppercase tracking-widest" style={{ color: WL.textSoft }}>Colour</label>
        <div className="flex flex-wrap gap-2 mt-1.5">
          {COLOR_PRESETS.map((p) => (
            <button
              key={p.color}
              title={p.label}
              onClick={() => set({ color: p.color, emissiveColor: p.emissiveColor })}
              className="w-6 h-6 rounded-full transition-transform hover:scale-125"
              style={{
                background: p.color,
                boxShadow: draft.color === p.color ? `0 0 0 2px white, 0 0 8px ${p.color}` : 'none',
              }}
            />
          ))}
        </div>
        {/* Manual hex */}
        <div className="flex gap-2 mt-2">
          <input
            className={`${inputClass} flex-1`}
            value={draft.color}
            onChange={(e) => set({ color: e.target.value })}
            placeholder="#4ade80"
          />
          <input
            className={`${inputClass} flex-1`}
            value={draft.emissiveColor}
            onChange={(e) => set({ emissiveColor: e.target.value })}
            placeholder="#22c55e (emissive)"
          />
        </div>
      </div>

      {/* Modal content */}
      <div className="border-t  pt-4 space-y-3">
        <label className="text-[10px] uppercase tracking-widest" style={{ color: WL.textSoft }}>Modal Content</label>
        <input className={inputClass} value={draft.content?.title || ''} onChange={(e) => setDraft((d) => ({ ...d, content: { ...d.content, title: e.target.value } }))} placeholder="Modal title" />
        <input className={inputClass} value={draft.content?.tagline || ''} onChange={(e) => setDraft((d) => ({ ...d, content: { ...d.content, tagline: e.target.value } }))} placeholder="Tagline / subtitle" />

        {/* Sections */}
        <div className="space-y-3">
          {(draft.content?.sections || []).map((sec, i) => (
            <div key={i} className="rounded-xl p-3 space-y-2" style={{ background: 'rgba(255,255,255,0.72)', border: `1px solid ${WL.borderLight}` }}>
              <div className="flex items-center gap-2">
                <input
                  className={`${inputClass} flex-1`}
                  value={sec.heading}
                  onChange={(e) => setSec(i, { heading: e.target.value })}
                  placeholder="Section heading"
                />
                <button onClick={() => removeSection(i)} className="hover:text-red-500 transition-colors text-lg leading-none flex-shrink-0" style={{ color: WL.textSoft }}>×</button>
              </div>
              <textarea
                className={`${inputClass} resize-none`}
                rows={3}
                value={sec.text || ''}
                onChange={(e) => setSec(i, { text: e.target.value })}
                placeholder="Section body text…"
              />
            </div>
          ))}

          <button
            onClick={addSection}
            className="w-full text-xs py-2 rounded-lg border border-dashed text-inherit hover:text-inherit  transition-colors"
          >
            + Add Section
          </button>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-2">
        <button
          onClick={() => onSave(draft)}
          className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all text-white"
          style={{ background: 'linear-gradient(135deg, rgba(74,222,128,0.3), rgba(16,185,129,0.25))', border: '1px solid rgba(74,222,128,0.4)' }}
        >
          Save Changes
        </button>
        <button
          onClick={onClose}
          className="px-4 py-2.5 rounded-xl text-sm border transition-colors"
          style={{ color: WL.textMuted, borderColor: WL.borderLight }}
        >
          Cancel
        </button>
      </div>
    </div>
  )
}
/* ─── Blog admin ─────────────────────────────────────────────────────── */
function BlogAdmin() {
  const { blogPosts, addBlogPost, updateBlogPost, deleteBlogPost, resetBlog } = useStore()
  const [editingId, setEditingId] = useState(null)
  const [isNew, setIsNew] = useState(false)
  const [draft, setDraft] = useState(null)
  const inputCls = accountInputCls

  const openNew = () => {
    setDraft({ id: `post-${Date.now()}`, title: '', author: '', date: new Date().toISOString(), body: '', tags: '' })
    setIsNew(true)
    setEditingId(null)
  }
  const openEdit = (post) => {
    setDraft({ ...post, tags: (post.tags || []).join(', ') })
    setIsNew(false)
    setEditingId(post.id)
  }
  const closeEditor = () => { setDraft(null); setEditingId(null); setIsNew(false) }

  const handleSave = async () => {
    if (!draft?.title?.trim()) return
    const post = {
      ...draft,
      tags: draft.tags ? draft.tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
    }
    if (isNew) await addBlogPost(post)
    else await updateBlogPost(post.id, post)
    closeEditor()
  }

  const sorted = [...blogPosts].sort((a, b) => new Date(b.date) - new Date(a.date))

  if (draft) {
    return (
      <div className="space-y-3">
        <button onClick={closeEditor} className="flex items-center gap-1.5 text-xs text-inherit hover:text-inherit transition-colors">← Tilbage til liste</button>
        <h3 className="text-sm font-semibold text-inherit">{isNew ? 'Nyt indlæg' : 'Rediger indlæg'}</h3>
        <input className={inputCls} value={draft.title} onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))} placeholder="Titel" />
        <div className="grid grid-cols-2 gap-2">
          <input className={inputCls} value={draft.author} onChange={(e) => setDraft((d) => ({ ...d, author: e.target.value }))} placeholder="Forfatter" />
          <input className={inputCls} type="datetime-local" value={draft.date ? draft.date.slice(0, 16) : ''} onChange={(e) => setDraft((d) => ({ ...d, date: new Date(e.target.value).toISOString() }))} />
        </div>
        <textarea
          className={`${inputCls} resize-none`}
          rows={10}
          value={draft.body}
          onChange={(e) => setDraft((d) => ({ ...d, body: e.target.value }))}
          placeholder="Skriv indlægget her. Tomme linjer bliver til afsnit."
        />
        <input className={inputCls} value={draft.tags} onChange={(e) => setDraft((d) => ({ ...d, tags: e.target.value }))} placeholder="Tags (komma-adskilt): hamp, bæredygtighed" />

        {/* Image */}
        <div className="space-y-2">
          <label className="text-[10px] uppercase tracking-widest" style={{ color: WL.textSoft }}>Billede (valgfrit)</label>
          <label
            className="flex items-center gap-3 cursor-pointer px-3 py-2.5 rounded-xl border border-dashed transition-colors hover:border-teal-500/40 hover:bg-teal-500/5"
            style={{ borderColor: 'rgba(255,255,255,0.15)' }}
          >
            <span className="text-xl">📁</span>
            <div>
              <div className="text-sm" style={{ color: WL.textMuted }}>Upload billede</div>
              <div className="text-[10px]" style={{ color: WL.textSoft }}>PNG, JPG, WebP</div>
            </div>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (!file) return
                const reader = new FileReader()
                reader.onload = (ev) => setDraft((d) => ({ ...d, imageUrl: ev.target.result }))
                reader.readAsDataURL(file)
                e.target.value = ''
              }}
            />
          </label>
          <div className="flex items-center gap-2">
            <div className="flex-1 h-px bg-white/10" />
            <span className="text-[10px] text-inherit">eller indsæt URL</span>
            <div className="flex-1 h-px bg-white/10" />
          </div>
          <input
            className={inputCls}
            value={(!draft.imageUrl || draft.imageUrl.startsWith('data:')) ? '' : (draft.imageUrl || '')}
            onChange={(e) => setDraft((d) => ({ ...d, imageUrl: e.target.value }))}
            placeholder="https://example.com/billede.jpg"
          />
          {draft.imageUrl && (
            <div className="flex items-center gap-3">
              <img
                src={draft.imageUrl}
                alt=""
                className="w-24 h-16 object-cover rounded-xl flex-shrink-0"
                style={{ border: '1px solid rgba(52,211,153,0.3)' }}
                onError={(e) => (e.target.style.opacity = '0.3')}
              />
              <button
                onClick={() => setDraft((d) => ({ ...d, imageUrl: '' }))}
                className="text-[10px] text-red-400/60 hover:text-red-400 transition-colors"
              >× Fjern billede</button>
            </div>
          )}
        </div>

        <div className="flex gap-2 pt-1">
          <button
            onClick={handleSave}
            disabled={!draft.title?.trim()}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-40"
            style={{ background: 'rgba(52,211,153,0.2)', border: '1px solid rgba(52,211,153,0.4)' }}
          >Udgiv</button>
          <button onClick={closeEditor} className="px-4 py-2.5 rounded-xl text-sm text-inherit border transition-colors" style={{ borderColor: WL.borderLight }}>Annuller</button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <p className="text-xs leading-relaxed" style={{ color: WL.textMuted }}>
        Medlemmer skriver indlæg via Login-noden. Her kan admin moderere alle opslag.
      </p>
      {sorted.length === 0 && (
        <p className="text-inherit text-xs px-1">Ingen indlæg endnu.</p>
      )}
      {sorted.map((post) => (
        <div
          key={post.id}
          className="flex items-start gap-3 px-3 py-3 rounded-xl"
          style={{ background: 'rgba(255,255,255,0.72)', border: `1px solid ${WL.borderLight}` }}
        >
          <div className="flex-1 min-w-0">
            <div className="text-sm text-inherit font-medium leading-snug truncate">{post.title}</div>
            <div className="text-[10px] text-inherit mt-0.5">{post.author} · {post.date ? new Date(post.date).toLocaleDateString('da-DK') : ''}</div>
          </div>
          <button onClick={() => openEdit(post)} className="hover:opacity-80 transition-colors text-sm px-1 flex-shrink-0" style={{ color: WL.textMuted }}>✏</button>
          <button onClick={() => { if (window.confirm('Slet indlæg?')) deleteBlogPost(post.id) }} className="hover:text-red-500 transition-colors text-base leading-none flex-shrink-0" style={{ color: WL.textSoft }}>×</button>
        </div>
      ))}

      <button
        onClick={openNew}
        className="w-full py-2.5 rounded-xl text-sm font-semibold transition-all"
        style={{ background: 'rgba(52,211,153,0.12)', border: '1px solid rgba(52,211,153,0.25)', color: '#6ee7b7' }}
      >+ Nyt indlæg</button>

      <button
        onClick={() => { if (window.confirm('Nulstil blog til standard?')) resetBlog() }}
        className="w-full py-2 rounded-xl text-xs border transition-colors"
        style={{ color: WL.textMuted, borderColor: WL.borderLight }}
      >↺ Nulstil blog</button>
    </div>
  )
}
/* ─── Stats admin ───────────────────────────────────────────────────── */
function StatsAdmin() {
  const { stats, updateStats, resetStats } = useStore()
  const [local, setLocal] = useState(stats)

  const inputCls = accountInputCls
  const labelCls = accountLabelCls

  const handleChange = (id, field, val) => {
    setLocal((prev) => prev.map((s) => s.id === id ? { ...s, [field]: val } : s))
  }

  const addStat = () => {
    const newStat = { id: `stat_${Date.now()}`, label: 'Ny tæller', value: 0, suffix: '' }
    setLocal((prev) => [...prev, newStat])
  }

  const removeStat = (id) => {
    setLocal((prev) => prev.filter((s) => s.id !== id))
  }

  const save = () => {
    const parsed = local.map((s) => ({ ...s, value: Number(s.value) || 0 }))
    updateStats(parsed)
  }

  const reset = () => {
    resetStats()
    setLocal(useStore.getState().stats)
  }

  return (
    <div className="space-y-4">
      <p className="text-xs text-inherit">Vises som en tæller-bar i bunden af skærmen (synlig for alle besøgende).</p>
      <div className="space-y-3">
        {local.map((stat) => (
          <div key={stat.id} className="rounded-xl p-3 space-y-2" style={{ background: 'rgba(255,200,80,0.06)', border: '1px solid rgba(255,200,80,0.12)' }}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-semibold" style={{ color: '#f0c070' }}>{stat.label || 'Tæller'}</span>
              <button onClick={() => removeStat(stat.id)} className="hover:text-red-500 text-sm transition-colors" style={{ color: WL.textSoft }}>×</button>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="col-span-2">
                <label className={labelCls}>Label</label>
                <input className={inputCls} value={stat.label} onChange={(e) => handleChange(stat.id, 'label', e.target.value)} placeholder="Medlemmer" />
              </div>
              <div>
                <label className={labelCls}>Suffix</label>
                <input className={inputCls} value={stat.suffix} onChange={(e) => handleChange(stat.id, 'suffix', e.target.value)} placeholder="kg" />
              </div>
            </div>
            <div>
              <label className={labelCls}>Tal</label>
              <input type="number" className={inputCls} value={stat.value} onChange={(e) => handleChange(stat.id, 'value', e.target.value)} placeholder="0" />
            </div>
          </div>
        ))}
      </div>
      <button onClick={addStat} className="w-full py-2 rounded-xl text-xs font-semibold transition-all" style={{ background: 'rgba(255,200,80,0.08)', border: '1px solid rgba(255,200,80,0.2)', color: '#f0c070' }}>
        + Tilføj tæller
      </button>
      <button onClick={save} className="w-full py-2 rounded-xl text-xs font-semibold text-white/90 transition-all" style={{ background: 'rgba(74,222,128,0.15)', border: '1px solid rgba(74,222,128,0.3)' }}>
        💾 Gem tæller
      </button>
      <button onClick={reset} className="w-full py-2 rounded-xl text-xs text-inherit hover:opacity-80 transition-colors">↺ Nulstil tæller</button>
    </div>
  )
}

/* ─── Donation admin ────────────────────────────────────────────────── */
function DonationAdmin() {
  const { donationConfig, setDonationConfig, resetDonationConfig } = useStore()
  const [local, setLocal] = useState(donationConfig)
  const inputCls = accountInputCls

  // Keep local in sync if store changes externally
  useEffect(() => { setLocal(donationConfig) }, [donationConfig])

  const set = (key, val) => setLocal((p) => ({ ...p, [key]: val }))

  const handleQrUpload = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => set('qrImageUrl', ev.target.result)
    reader.readAsDataURL(file)
  }

  const handleSave = () => setDonationConfig(local)

  return (
    <div className="space-y-4">
      <div className="text-[11px] uppercase tracking-widest font-semibold" style={{ color: WL.textSoft }}>💳 Betalingsinfo</div>

      {/* MobilePay number */}
      <div>
        <label className="block text-xs mb-1" style={{ color: WL.textSoft }}>MobilePay nummer</label>
        <input
          className={inputCls}
          placeholder="f.eks. 12345"
          value={local.mobilepay}
          onChange={(e) => set('mobilepay', e.target.value)}
        />
      </div>

      {/* Donation link */}
      <div>
        <label className="block text-xs mb-1" style={{ color: WL.textSoft }}>Betalingslink (MobilePay / Swish / andet)</label>
        <input
          className={inputCls}
          placeholder="https://mobilepay.dk/..."
          value={local.link}
          onChange={(e) => set('link', e.target.value)}
        />
      </div>

      {/* QR code */}
      <div>
        <label className="block text-xs mb-1" style={{ color: WL.textSoft }}>QR-kode URL</label>
        <input
          className={inputCls}
          placeholder="https://... eller upload herunder"
          value={local.qrImageUrl}
          onChange={(e) => set('qrImageUrl', e.target.value)}
        />
      </div>
      <div>
        <label className="block text-xs mb-1" style={{ color: WL.textSoft }}>Upload QR-billede</label>
        <input type="file" accept="image/*" onChange={handleQrUpload}
          className="w-full text-xs text-inherit file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-medium file:bg-white/80 file:text-inherit hover:file:bg-white/20 cursor-pointer" />
      </div>

      {/* Preview */}
      {local.qrImageUrl && (
        <div className="flex flex-col items-center gap-2 py-3">
          <div className="text-xs" style={{ color: WL.textSoft }}>Forhåndsvisning</div>
          <img src={local.qrImageUrl} alt="QR preview" className="w-36 h-36 object-contain rounded-xl border " />
        </div>
      )}

      {/* Save / Reset */}
      <div className="flex gap-2 pt-1">
        <button onClick={handleSave}
          className="flex-1 py-2 rounded-xl text-xs font-bold transition-all"
          style={{ background: 'rgba(236,72,153,0.25)', border: '1px solid rgba(236,72,153,0.4)', color: '#f9a8d4' }}
        >💾 Gem</button>
        <button onClick={() => { if (window.confirm('Nulstil betalingsinfo?')) { resetDonationConfig(); setLocal({ mobilepay: '', link: '', qrImageUrl: '' }) } }}
          className="px-3 py-2 rounded-xl text-xs font-semibold text-inherit hover:opacity-80 transition-colors"
          style={{ background: 'rgba(255,255,255,0.72)', border: `1px solid ${WL.borderLight}` }}
        >↺ Nulstil</button>
      </div>
    </div>
  )
}
/* ─── GitHub publish admin ───────────────────────────────────────────── */

async function publishConfigToGitHub({ token, owner, repo, branch }, config) {
  const path = 'public/wl-config.json'
  const apiBase = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`
  const headers = { Authorization: `token ${token}`, Accept: 'application/vnd.github.v3+json', 'Content-Type': 'application/json' }

  // 1. Get current file SHA
  const getRes = await fetch(`${apiBase}?ref=${branch}`, { headers })
  if (!getRes.ok && getRes.status !== 404) throw new Error(`GitHub GET fejl: ${getRes.status}`)
  const current = getRes.ok ? await getRes.json() : null
  const sha = current?.sha

  // 2. Encode and push
  const content = btoa(unescape(encodeURIComponent(JSON.stringify(config, null, 2))))
  const body = { message: 'admin: opdater wl-config.json', content, branch, ...(sha ? { sha } : {}) }
  const putRes = await fetch(apiBase, { method: 'PUT', headers, body: JSON.stringify(body) })
  if (!putRes.ok) {
    const err = await putRes.json().catch(() => ({}))
    throw new Error(err.message || `GitHub PUT fejl: ${putRes.status}`)
  }
  return true
}

function PublishAdmin() {
  const githubSettings = useStore((s) => s.githubSettings)
  const setGithubSettings = useStore((s) => s.setGithubSettings)
  const [status, setStatus] = useState('idle') // idle | loading | ok | error
  const [errMsg, setErrMsg] = useState('')
  const [showToken, setShowToken] = useState(false)
  const inputCls = accountInputCls

  const save = (patch) => setGithubSettings(patch)

  const handlePublish = async () => {
    if (!githubSettings.token) { setErrMsg('Indsæt dit GitHub token først'); setStatus('error'); return }
    setStatus('loading'); setErrMsg('')
    try {
      const { coins, shopCategories, blogPosts, donationConfig } = useStore.getState()
      await publishConfigToGitHub(githubSettings, { coins, shopCategories, blogPosts, donationConfig })
      setStatus('ok')
      setTimeout(() => setStatus('idle'), 4000)
    } catch (e) {
      setErrMsg(e.message)
      setStatus('error')
    }
  }

  return (
    <div className="space-y-5">
      <div className="text-[11px] uppercase tracking-widest font-semibold" style={{ color: WL.textSoft }}>🚀 Publicér Live</div>

      {/* Info box */}
      <div className="rounded-xl p-3 text-xs text-inherit space-y-1" style={{ background: 'rgba(74,222,128,0.06)', border: '1px solid rgba(74,222,128,0.15)' }}>
        <p>Gem dine ændringer direkte til GitHub. Siden genbygges automatisk (~1 min), og alle brugere ser de nye indstillinger.</p>
      </div>

      {/* Token */}
      <div>
        <label className="block text-xs mb-1" style={{ color: WL.textSoft }}>
          GitHub Personal Access Token
          <a href="https://github.com/settings/tokens/new?scopes=repo&description=WL+Admin" target="_blank" rel="noopener noreferrer" className="ml-2 text-green-400/70 hover:text-green-400 underline">Opret token ↗</a>
        </label>
        <div className="flex gap-2">
          <input
            className={inputCls}
            type={showToken ? 'text' : 'password'}
            value={githubSettings.token}
            onChange={(e) => save({ token: e.target.value })}
            placeholder="ghp_xxxxxxxxxxxx"
          />
          <button onClick={() => setShowToken(s => !s)} className="px-2 text-inherit hover:opacity-80 text-xs">{showToken ? '🙈' : '👁'}</button>
        </div>
        <p className="text-[10px] text-inherit mt-1">Gemmes i databasen. Vælg scope: <code className="text-inherit">repo</code> (eller <code className="text-inherit">contents:write</code> for fine-grained).</p>
      </div>

      {/* Repo settings */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-xs mb-1" style={{ color: WL.textSoft }}>GitHub bruger / org</label>
          <input className={inputCls} value={githubSettings.owner} onChange={(e) => save({ owner: e.target.value })} placeholder="filiptom888-lgtm" />
        </div>
        <div>
          <label className="block text-xs mb-1" style={{ color: WL.textSoft }}>Repository navn</label>
          <input className={inputCls} value={githubSettings.repo} onChange={(e) => save({ repo: e.target.value })} placeholder="Weeleafv2" />
        </div>
      </div>
      <div>
        <label className="block text-xs mb-1" style={{ color: WL.textSoft }}>Branch</label>
        <input className={inputCls} value={githubSettings.branch} onChange={(e) => save({ branch: e.target.value })} placeholder="main" />
      </div>

      {/* Publish button */}
      <button
        onClick={handlePublish}
        disabled={status === 'loading'}
        className="w-full py-3 rounded-xl text-sm font-bold transition-all disabled:opacity-50"
        style={{ background: status === 'ok' ? 'rgba(74,222,128,0.3)' : status === 'error' ? 'rgba(248,113,113,0.2)' : 'rgba(74,222,128,0.2)', border: `1px solid ${status === 'ok' ? 'rgba(74,222,128,0.5)' : status === 'error' ? 'rgba(248,113,113,0.4)' : 'rgba(74,222,128,0.35)'}`, color: status === 'error' ? '#fca5a5' : '#86efac' }}
      >
        {status === 'loading' ? '⏳ Publicerer…' : status === 'ok' ? '✅ Publiceret! Siden genbygges…' : status === 'error' ? '❌ Fejl — prøv igen' : '🚀 Publicér Live'}
      </button>

      {status === 'error' && errMsg && (
        <p className="text-xs text-red-400/80 break-all">{errMsg}</p>
      )}
    </div>
  )
}

/* ─── Users admin ───────────────────────────────────────────────────── */
function formatUserDate(iso) {
  try {
    return new Date(iso).toLocaleDateString('da-DK', { day: 'numeric', month: 'short', year: 'numeric' })
  } catch {
    return '—'
  }
}

function UsersAdmin() {
  const PAGE_SIZE = 20
  const currentUser = useStore((s) => s.currentUser)
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [sortKey, setSortKey] = useState('createdAt')
  const [sortDir, setSortDir] = useState('desc')
  const [filter, setFilter] = useState('')
  const [page, setPage] = useState(1)
  const [busyId, setBusyId] = useState(null)

  const loadUsers = useCallback(async () => {
    setLoading(true)
    setError('')
    const res = await api.fetchUsers()
    if (res.ok) setUsers(res.users || [])
    else setError(res.error || 'Kunne ikke hente brugere')
    setLoading(false)
  }, [])

  useEffect(() => {
    loadUsers()
  }, [loadUsers])

  useEffect(() => {
    setPage(1)
  }, [filter, sortKey, sortDir])

  const toggleSort = (key) => {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    else {
      setSortKey(key)
      setSortDir(key === 'createdAt' ? 'desc' : 'asc')
    }
  }

  const sortedUsers = useMemo(() => {
    const q = filter.trim().toLowerCase()
    let list = users
    if (q) {
      list = list.filter(
        (u) =>
          u.email.toLowerCase().includes(q) ||
          u.name.toLowerCase().includes(q) ||
          u.role.toLowerCase().includes(q)
      )
    }
    return [...list].sort((a, b) => {
      let av = a[sortKey]
      let bv = b[sortKey]
      if (sortKey === 'createdAt') {
        av = new Date(av || 0).getTime()
        bv = new Date(bv || 0).getTime()
      } else {
        av = (av || '').toString().toLowerCase()
        bv = (bv || '').toString().toLowerCase()
      }
      if (av < bv) return sortDir === 'asc' ? -1 : 1
      if (av > bv) return sortDir === 'asc' ? 1 : -1
      return 0
    })
  }, [users, sortKey, sortDir, filter])

  const totalPages = Math.max(1, Math.ceil(sortedUsers.length / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)
  const pageUsers = sortedUsers.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)
  const rangeStart = sortedUsers.length === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1
  const rangeEnd = Math.min(safePage * PAGE_SIZE, sortedUsers.length)

  const sortIndicator = (key) => {
    if (sortKey !== key) return ''
    return sortDir === 'asc' ? ' ↑' : ' ↓'
  }

  const handleRoleChange = async (user, nextRole) => {
    if (user.role === nextRole) return
    const label = nextRole === 'admin' ? 'admin' : 'medlem'
    if (!window.confirm(`Gør ${user.email} til ${label}?`)) return
    setBusyId(user.id)
    const res = await api.updateUserRole(user.id, nextRole)
    setBusyId(null)
    if (!res.ok) {
      window.alert(res.error || 'Kunne ikke opdatere rolle')
      return
    }
    setUsers((prev) => prev.map((u) => (u.id === user.id ? res.user : u)))
  }

  const handleDelete = async (user) => {
    if (!window.confirm(`Slet brugeren ${user.email}?\n\nIndlæg bevares, men kobles fra kontoen. Dette kan ikke fortrydes.`)) return
    setBusyId(user.id)
    const res = await api.deleteUser(user.id)
    setBusyId(null)
    if (!res.ok) {
      window.alert(res.error || 'Kunne ikke slette bruger')
      return
    }
    setUsers((prev) => prev.filter((u) => u.id !== user.id))
  }

  const thBtn =
    'text-left text-[10px] uppercase tracking-wider font-semibold transition-colors'
  const thStyle = { color: WL.textSoft }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <input
          type="search"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Søg e-mail, navn eller rolle…"
          className={`flex-1 ${inputCls}`}
          style={inputStyle}
        />
        <button
          type="button"
          onClick={loadUsers}
          className="text-xs px-3 py-2 rounded-xl font-semibold"
          style={{ color: WL.green, border: `1px solid ${WL.border}`, background: 'rgba(255,255,255,0.75)' }}
        >
          ↻ Opdater
        </button>
      </div>

      {loading && <p className="text-sm" style={{ color: WL.textSoft }}>Henter brugere…</p>}
      {error && <p className="text-sm" style={{ color: '#b91c1c' }}>{error}</p>}

      {!loading && !error && (
        <div className="rounded-xl overflow-hidden" style={{ border: `1px solid ${WL.borderLight}` }}>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr style={{ background: 'rgba(255,255,255,0.8)' }}>
                  <th className="px-3 py-2.5 w-12" style={thStyle}>Avatar</th>
                  <th className="px-3 py-2.5">
                    <button type="button" className={thBtn} style={thStyle} onClick={() => toggleSort('name')}>
                      Navn{sortIndicator('name')}
                    </button>
                  </th>
                  <th className="px-3 py-2.5">
                    <button type="button" className={thBtn} style={thStyle} onClick={() => toggleSort('email')}>
                      E-mail{sortIndicator('email')}
                    </button>
                  </th>
                  <th className="px-3 py-2.5">
                    <button type="button" className={thBtn} style={thStyle} onClick={() => toggleSort('role')}>
                      Rolle{sortIndicator('role')}
                    </button>
                  </th>
                  <th className="px-3 py-2.5">
                    <button type="button" className={thBtn} style={thStyle} onClick={() => toggleSort('createdAt')}>
                      Oprettet{sortIndicator('createdAt')}
                    </button>
                  </th>
                  <th className="px-3 py-2.5 text-[10px] uppercase tracking-wider font-semibold" style={thStyle}>
                    Handling
                  </th>
                </tr>
              </thead>
              <tbody>
                {pageUsers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-3 py-8 text-center" style={{ color: WL.textSoft }}>
                      Ingen brugere fundet
                    </td>
                  </tr>
                ) : (
                  pageUsers.map((user) => {
                    const isSelf = user.id === currentUser?.id
                    const isAdmin = user.role === 'admin'
                    return (
                      <tr
                        key={user.id}
                        className="border-t"
                        style={{
                          borderColor: WL.borderLight,
                          background: isSelf ? 'rgba(61,158,95,0.08)' : 'rgba(255,255,255,0.45)',
                        }}
                      >
                        <td className="px-3 py-2.5">
                          <UserAvatar
                            name={user.name}
                            avatarId={user.avatarId}
                            avatarUrl={user.avatarUrl}
                            size={36}
                            rounded="square"
                          />
                        </td>
                        <td className="px-3 py-2.5 font-medium" style={{ color: WL.text }}>{user.name}</td>
                        <td className="px-3 py-2.5 break-all" style={{ color: WL.textMuted }}>{user.email}</td>
                        <td className="px-3 py-2.5">
                          <span
                            className="text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase"
                            style={{
                              background: isAdmin ? 'rgba(61,158,95,0.15)' : 'rgba(255,255,255,0.7)',
                              color: isAdmin ? WL.green : WL.textMuted,
                              border: `1px solid ${isAdmin ? 'rgba(61,158,95,0.35)' : WL.borderLight}`,
                            }}
                          >
                            {isAdmin ? 'Admin' : 'Medlem'}
                          </span>
                        </td>
                        <td className="px-3 py-2.5 text-xs whitespace-nowrap" style={{ color: WL.textMuted }}>
                          {formatUserDate(user.createdAt)}
                        </td>
                        <td className="px-3 py-2.5">
                          <div className="flex flex-wrap gap-1.5">
                            {isAdmin ? (
                              <button
                                type="button"
                                disabled={busyId === user.id || isSelf}
                                onClick={() => handleRoleChange(user, 'member')}
                                className="text-[11px] px-2.5 py-1 rounded-lg disabled:opacity-40"
                                style={{ color: WL.textMuted, border: `1px solid ${WL.borderLight}` }}
                              >
                                Fjern admin
                              </button>
                            ) : (
                              <button
                                type="button"
                                disabled={busyId === user.id}
                                onClick={() => handleRoleChange(user, 'admin')}
                                className="text-[11px] px-2.5 py-1 rounded-lg disabled:opacity-40"
                                style={{ color: WL.green, border: '1px solid rgba(61,158,95,0.35)', background: 'rgba(61,158,95,0.12)' }}
                              >
                                Gør admin
                              </button>
                            )}
                            <button
                              type="button"
                              disabled={busyId === user.id || isSelf}
                              onClick={() => handleDelete(user)}
                              className="text-[11px] px-2.5 py-1 rounded-lg disabled:opacity-40"
                              style={{ color: '#b91c1c', border: '1px solid rgba(220,38,38,0.25)', background: 'rgba(220,38,38,0.06)' }}
                            >
                              Slet
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {!loading && !error && sortedUsers.length > 0 && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <p className="text-xs" style={{ color: WL.textSoft }}>
            Viser {rangeStart}–{rangeEnd} af {sortedUsers.length} bruger{sortedUsers.length === 1 ? '' : 'e'}
            {filter.trim() ? ' (filtreret)' : ''}
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={safePage <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="text-xs px-3 py-1.5 rounded-lg disabled:opacity-40"
              style={{ color: WL.textMuted, border: `1px solid ${WL.borderLight}` }}
            >
              ← Forrige
            </button>
            <span className="text-xs tabular-nums" style={{ color: WL.textSoft }}>
              Side {safePage} / {totalPages}
            </span>
            <button
              type="button"
              disabled={safePage >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="text-xs px-3 py-1.5 rounded-lg disabled:opacity-40"
              style={{ color: WL.textMuted, border: `1px solid ${WL.borderLight}` }}
            >
              Næste →
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

/* ─── Admin dashboard (embedded in account modal) ─────────────────── */
export function AdminDashboard() {
  const { coins, addCoin, updateCoin, deleteCoin, resetCoins, pendingShopSubmissions, refreshAdminData } = useStore()
  const [editingId, setEditingId] = useState(null)
  const [activeTab, setActiveTab] = useState('coins')

  useEffect(() => {
    refreshAdminData()
  }, [refreshAdminData])

  const handleSave = useCallback((draft) => {
    updateCoin(draft.id, draft)
    setEditingId(null)
  }, [updateCoin])

  const handleAdd = useCallback(() => {
    const coin = blankCoin(coins.length)
    addCoin(coin)
    setEditingId(coin.id)
  }, [coins.length, addCoin])

  const handleDelete = useCallback((id) => {
    if (LOCKED_COIN_IDS.includes(id)) return
    if (window.confirm('Delete this coin from the orbit?')) deleteCoin(id)
  }, [deleteCoin])

  const exportConfig = () => {
    const { coins: c, shopCategories, blogPosts, donationConfig } = useStore.getState()
    const blob = new Blob([JSON.stringify({ coins: c, shopCategories, blogPosts, donationConfig }, null, 2)], {
      type: 'application/json',
    })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = 'wl-config.json'
    a.click()
    URL.revokeObjectURL(a.href)
  }

  const pendingCount = pendingShopSubmissions.filter((s) => s.status === 'pending').length
  const editingCoin = editingId ? coins.find((c) => c.id === editingId) : null

  const tabs = [
    { key: 'coins', label: 'Nodes', icon: '🌿' },
    { key: 'users', label: 'Brugere', icon: '👥' },
    { key: 'shop', label: 'Shop', icon: '🛍️' },
    { key: 'approvals', label: pendingCount ? `Godkend (${pendingCount})` : 'Godkend', icon: '✅' },
    { key: 'blog', label: 'Blog', icon: '📝' },
    { key: 'donation', label: 'Give', icon: '💳' },
    { key: 'stats', label: 'Tæller', icon: '📊' },
    { key: 'publish', label: 'Publicér', icon: '🚀' },
  ]

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="rounded-2xl p-4 mb-4 flex-shrink-0" style={accountCardStyle}>
        <h2 className="text-lg font-bold" style={{ color: WL.text }}>Admin panel</h2>
        <p className="text-xs mt-1 leading-relaxed" style={{ color: WL.textMuted }}>
          Administrer nodes, brugere, shop og indhold for hele WeeLeaf.
        </p>
        <div className="flex gap-2 mt-3">
          <div className="flex-1 py-2 rounded-xl text-center" style={{ background: 'rgba(255,255,255,0.65)' }}>
            <div className="text-lg font-bold" style={{ color: WL.text }}>{coins.length}</div>
            <div className="text-[9px] uppercase tracking-wider" style={{ color: WL.textSoft }}>Nodes</div>
          </div>
          <div className="flex-1 py-2 rounded-xl text-center" style={{ background: 'rgba(255,255,255,0.65)' }}>
            <div className="text-lg font-bold" style={{ color: pendingCount ? WL.gold : WL.text }}>{pendingCount}</div>
            <div className="text-[9px] uppercase tracking-wider" style={{ color: WL.textSoft }}>Afventer</div>
          </div>
        </div>
      </div>

      <div className="pb-3 flex-shrink-0">
        <AccountTabBar tabs={tabs} active={activeTab} onChange={(key) => { setActiveTab(key); setEditingId(null) }} />
      </div>

      <div className="flex-1 overflow-y-auto min-h-0 space-y-4 pb-2">
        {activeTab === 'shop' && <ShopAdmin />}
        {activeTab === 'users' && <UsersAdmin />}
        {activeTab === 'approvals' && <PendingShopAdmin />}
        {activeTab === 'blog' && <BlogAdmin />}
        {activeTab === 'stats' && <StatsAdmin />}
        {activeTab === 'donation' && <DonationAdmin />}
        {activeTab === 'publish' && <PublishAdmin />}

        {activeTab === 'coins' && (
          <>
            {!editingId && (
              <>
                <div className="space-y-2">
                  {coins.map((coin, i) => (
                    <CoinRow
                      key={coin.id}
                      coin={coin}
                      index={i}
                      isEditing={editingId === coin.id}
                      onSelect={() => setEditingId(editingId === coin.id ? null : coin.id)}
                      onDelete={() => handleDelete(coin.id)}
                      onEdit={() => setEditingId(coin.id)}
                    />
                  ))}
                </div>
                <div className="flex flex-wrap gap-2 pt-2">
                  <button
                    type="button"
                    onClick={handleAdd}
                    className="flex-1 min-w-[140px] py-2.5 rounded-xl text-sm font-semibold"
                    style={{ background: 'rgba(61,158,95,0.2)', border: `1px solid ${WL.greenBright}`, color: WL.green }}
                  >
                    + Add Coin
                  </button>
                  <button
                    type="button"
                    onClick={() => { if (window.confirm('Reset all coins to defaults?')) { resetCoins(); setEditingId(null) } }}
                    className="px-4 py-2.5 rounded-xl text-sm"
                    style={{ color: WL.textMuted, border: `1px solid ${WL.borderLight}` }}
                  >
                    ↺
                  </button>
                  <button
                    type="button"
                    onClick={exportConfig}
                    className="px-4 py-2.5 rounded-xl text-xs font-semibold"
                    style={{ color: WL.green, border: `1px solid ${WL.border}`, background: 'rgba(255,255,255,0.75)' }}
                  >
                    📤 Eksporter
                  </button>
                </div>
                <p className="text-xs" style={{ color: WL.textMuted }}>
                  Ændringer gemmes i databasen og vises for alle besøgende.
                </p>
              </>
            )}
            {editingId && editingCoin && (
              <>
                <button type="button" onClick={() => setEditingId(null)} className="text-xs" style={{ color: WL.textMuted }}>
                  ← Tilbage til liste
                </button>
                <CoinEditor coin={editingCoin} onSave={handleSave} onClose={() => setEditingId(null)} />
              </>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default function AdminPanel() {
  return null
}
