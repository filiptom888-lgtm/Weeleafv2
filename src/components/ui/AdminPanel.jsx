import React, { useState, useRef, useEffect, useCallback } from 'react'
import { gsap } from 'gsap'
import useStore from '../../store/useStore'

const LOCKED_COIN_IDS = ['shop', 'member'] // coins that can only have their image changed

function useAdminAuth() {
  const adminLogin = useStore((s) => s.adminLogin)
  const logoutUser = useStore((s) => s.logoutUser)
  const currentUser = useStore((s) => s.currentUser)
  const authed = currentUser?.role === 'admin'

  const login = async (pw) => {
    const res = await adminLogin(pw)
    return res.ok
  }

  const logout = () => {
    logoutUser()
  }

  return { authed, login, logout }
}

function AdminLoginGate({ onAuth }) {
  const [pw, setPw] = useState('')
  const [err, setErr] = useState(false)
  const [loading, setLoading] = useState(false)
  const inputRef = useRef()
  useEffect(() => { inputRef.current?.focus() }, [])
  const submit = async () => {
    setLoading(true)
    const ok = await onAuth(pw)
    setLoading(false)
    if (!ok) { setErr(true); setPw('') }
  }
  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[400px] gap-5 px-6">
      <div className="text-4xl">🔒</div>
      <div className="text-center">
        <div className="text-white font-bold text-lg tracking-tight">Admin adgang</div>
        <div className="text-white/35 text-xs mt-1">Indtast adgangskode for at fortsætte</div>
      </div>
      <div className="w-full space-y-3">
        <input
          ref={inputRef}
          type="password"
          value={pw}
          onChange={(e) => { setPw(e.target.value); setErr(false) }}
          onKeyDown={(e) => e.key === 'Enter' && submit()}
          placeholder="Adgangskode"
          className="w-full text-sm rounded-xl px-4 py-3 text-white/85 placeholder-white/25 outline-none border bg-white/5 text-center tracking-widest"
          style={{ borderColor: err ? 'rgba(248,113,113,0.5)' : 'rgba(255,255,255,0.12)' }}
        />
        {err && <p className="text-center text-xs text-red-400">Forkert adgangskode</p>}
        <button
          onClick={submit}
          disabled={loading}
          className="w-full py-2.5 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-50"
          style={{ background: 'rgba(74,222,128,0.22)', border: '1px solid rgba(74,222,128,0.4)', color: '#86efac' }}
        >Godkend →</button>
      </div>
    </div>
  )
}

/* ─── Product editor (used inside ShopAdmin) ─────────────────────────── */
function ProductEditor({ product, catColor, onSave, onCancel }) {
  const [draft, setDraft] = useState({ ...product })
  const set = (patch) => setDraft((d) => ({ ...d, ...patch }))
  const inputCls = 'w-full text-sm rounded-lg px-3 py-2 text-white/85 placeholder-white/25 outline-none border bg-white/5 border-white/10 focus:border-blue-400/40 transition-colors'

  return (
    <div className="rounded-xl p-3 space-y-2" style={{ background: 'rgba(255,255,255,0.05)', border: `1px solid ${catColor}28` }}>
      <input className={inputCls} value={draft.name} onChange={(e) => set({ name: e.target.value })} placeholder="Produktnavn" />
      <textarea className={`${inputCls} resize-none`} rows={3} value={draft.desc || ''} onChange={(e) => set({ desc: e.target.value })} placeholder="Produktbeskrivelse…" />
      <div className="grid grid-cols-2 gap-2">
        <input className={inputCls} value={draft.price || ''} onChange={(e) => set({ price: e.target.value })} placeholder="Pris (valgfri)" />
        <input className={inputCls} value={draft.link || ''} onChange={(e) => set({ link: e.target.value })} placeholder="Link URL" />
      </div>
      <input className={inputCls} value={(!draft.imageUrl || draft.imageUrl.startsWith('data:')) ? '' : draft.imageUrl} onChange={(e) => set({ imageUrl: e.target.value })} placeholder="Billede URL" />
      <label className="flex items-center gap-2 cursor-pointer px-3 py-2 rounded-lg border border-dashed border-white/15 hover:border-white/30 transition-colors">
        <span>📁</span>
        <span className="text-xs text-white/40">Upload billede</span>
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
        <button onClick={onCancel} className="px-3 py-2 rounded-xl text-xs text-white/40 border border-white/10 transition-colors">Annuller</button>
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
  const inputCls = 'w-full text-sm rounded-lg px-3 py-2 text-white/85 placeholder-white/25 outline-none border bg-white/5 border-white/10 focus:border-blue-400/40 transition-colors'
  const CAT_COLORS = ['#60a5fa', '#86efac', '#fbbf24', '#c084fc', '#f472b6', '#34d399']

  return (
    <div className="space-y-3">
      {shopCategories.map((cat) => (
        <div key={cat.id} className="rounded-xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
          {/* Category header */}
          <div
            className="flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors"
            style={{ background: expandedCatId === cat.id ? `${cat.color}12` : 'rgba(255,255,255,0.03)' }}
            onClick={() => setExpandedCatId(expandedCatId === cat.id ? null : cat.id)}
          >
            <span className="text-xl">{cat.icon}</span>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-white/85">{cat.label}</div>
              <div className="text-[10px] text-white/30">{cat.products?.length ?? 0} produkter</div>
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); if (window.confirm(`Slet "${cat.label}"?`)) deleteShopCategory(cat.id) }}
              className="text-white/20 hover:text-red-400 transition-colors text-base leading-none px-1"
            >×</button>
            <span className="text-white/25 text-xs">{expandedCatId === cat.id ? '▴' : '▾'}</span>
          </div>

          {/* Products */}
          {expandedCatId === cat.id && (
            <div className="px-3 pb-3 pt-1 space-y-2 border-t" style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
              {(cat.products ?? []).length === 0 && (
                <p className="text-[11px] text-white/20 px-1 py-1">Ingen produkter endnu.</p>
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
                    <div className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{ background: 'rgba(255,255,255,0.04)' }}>
                      {p.imageUrl && (
                        <img src={p.imageUrl} alt="" className="w-8 h-8 object-cover rounded-lg flex-shrink-0" onError={(e) => (e.target.style.display = 'none')} />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="text-sm text-white/75 truncate">{p.name || '(navnløs)'}</div>
                        {p.price && <div className="text-[10px]" style={{ color: cat.color }}>{p.price}</div>}
                      </div>
                      <button onClick={() => setEditingKey(p.id)} className="text-white/25 hover:text-white/60 transition-colors text-sm px-1">✏</button>
                      <button onClick={() => deleteShopProduct(cat.id, p.id)} className="text-white/20 hover:text-red-400 transition-colors text-base leading-none">×</button>
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
                  className="w-full text-xs py-2 rounded-lg border border-dashed border-white/12 text-white/30 hover:text-white/55 hover:border-white/25 transition-colors mt-1"
                >+ Tilføj produkt</button>
              )}
            </div>
          )}
        </div>
      ))}

      {/* Add category */}
      {addingCat ? (
        <div className="rounded-xl p-4 space-y-3" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.10)' }}>
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
            <button onClick={() => setAddingCat(false)} className="px-4 py-2 rounded-xl text-sm text-white/40 border border-white/10 transition-colors">Annuller</button>
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
        className="w-full py-2 rounded-xl text-xs text-white/22 hover:text-white/45 border border-white/8 transition-colors"
      >↺ Nulstil shop</button>
    </div>
  )
}

/* ─── Pending shop approvals ─────────────────────────────────────────── */
function PendingShopAdmin() {
  const { pendingShopSubmissions, approveShopSubmission, rejectShopSubmission } = useStore()
  const pending = pendingShopSubmissions.filter((s) => s.status === 'pending')
  const reviewed = pendingShopSubmissions.filter((s) => s.status !== 'pending')

  return (
    <div className="space-y-4">
      <p className="text-white/35 text-xs leading-relaxed">
        Medlemmer kan foreslå produkter fra Login-noden. Godkendte produkter vises i Shop.
      </p>

      {pending.length === 0 && (
        <div className="flex flex-col items-center py-10 gap-2 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <span className="text-3xl opacity-30">✅</span>
          <p className="text-white/25 text-xs">Ingen afventende produkter</p>
        </div>
      )}

      {pending.map((sub) => (
        <div
          key={sub.id}
          className="rounded-xl overflow-hidden"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(251,191,36,0.25)' }}
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
              <div className="text-sm font-semibold text-white/90">{sub.product.name}</div>
              <div className="text-[10px] text-white/35 mt-0.5">
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
            <p className="px-4 py-3 text-xs text-white/55 leading-relaxed line-clamp-4">{sub.product.desc}</p>
          )}
          <div className="px-4 pb-4 flex gap-2">
            <button
              onClick={() => approveShopSubmission(sub.id)}
              className="flex-1 py-2 rounded-xl text-xs font-semibold text-white transition-all"
              style={{ background: 'rgba(74,222,128,0.22)', border: '1px solid rgba(74,222,128,0.4)', color: '#86efac' }}
            >
              ✓ Godkend
            </button>
            <button
              onClick={() => rejectShopSubmission(sub.id)}
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
          <div className="text-[10px] text-white/25 uppercase tracking-widest">Seneste beslutninger</div>
          {reviewed.slice(0, 8).map((sub) => (
            <div key={sub.id} className="flex items-center gap-2 px-3 py-2 rounded-lg text-[11px]" style={{ background: 'rgba(255,255,255,0.03)' }}>
              <span>{sub.status === 'approved' ? '✓' : '✕'}</span>
              <span className="text-white/50 truncate flex-1">{sub.product.name}</span>
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
  { color: '#86efac', emissiveColor: '#4ade80', label: 'Mint' },
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
        <div className="text-sm font-medium text-white/90 truncate">{coin.subtitle}</div>
        <div className="text-[10px] text-white/40">{coin.label} · {coin.angle}°</div>
      </div>

      {LOCKED_COIN_IDS.includes(coin.id) ? (
        <span className="text-white/20 text-xs px-1" title="Låst — kan ikke slettes">🔒</span>
      ) : (
        <button
          className="text-white/25 hover:text-red-400 transition-colors text-base leading-none px-1"
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

  const inputClass =
    'w-full text-sm rounded-lg px-3 py-2 text-white/85 placeholder-white/25 outline-none border bg-white/5 border-white/10 focus:border-green-500/40 transition-colors'

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
          <label className="text-[10px] text-white/40 uppercase tracking-widest">Coin Image</label>
          <label className="flex items-center gap-3 cursor-pointer px-3 py-2.5 rounded-xl border border-dashed transition-colors hover:border-green-500/40 hover:bg-green-500/5" style={{ borderColor: 'rgba(255,255,255,0.15)' }}>
            <span className="text-xl">📁</span>
            <div>
              <div className="text-sm text-white/70">Upload billede</div>
              <div className="text-[10px] text-white/30">PNG, JPG, GIF, WebP</div>
            </div>
            <input type="file" accept="image/*" className="hidden" onChange={(e) => {
              const file = e.target.files?.[0]; if (!file) return
              const reader = new FileReader()
              reader.onload = (ev) => set({ imageUrl: ev.target.result })
              reader.readAsDataURL(file); e.target.value = ''
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
          <button onClick={onClose} className="px-4 py-2.5 rounded-xl text-sm text-white/50 hover:text-white/80 border border-white/10 transition-colors">Annuller</button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Identity */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-[10px] text-white/40 uppercase tracking-widest">Label</label>
          <input className={inputClass} value={draft.label} onChange={(e) => set({ label: e.target.value })} placeholder="WL" />
        </div>
        <div>
          <label className="text-[10px] text-white/40 uppercase tracking-widest">Subtitle</label>
          <input className={inputClass} value={draft.subtitle} onChange={(e) => set({ subtitle: e.target.value })} placeholder="The Core" />
        </div>
      </div>

      {/* Orbit angle */}
      <div>
        <label className="text-[10px] text-white/40 uppercase tracking-widest">
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
        <label className="text-[10px] text-white/40 uppercase tracking-widest">Coin Image</label>

        {/* Upload button */}
        <label
          className="flex items-center gap-3 cursor-pointer px-3 py-2.5 rounded-xl border border-dashed transition-colors hover:border-green-500/40 hover:bg-green-500/5"
          style={{ borderColor: 'rgba(255,255,255,0.15)' }}
        >
          <span className="text-xl">📁</span>
          <div>
            <div className="text-sm text-white/70">Upload image</div>
            <div className="text-[10px] text-white/30">PNG, JPG, GIF, WebP — stored as data URL</div>
          </div>
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (!file) return
              const reader = new FileReader()
              reader.onload = (ev) => set({ imageUrl: ev.target.result })
              reader.readAsDataURL(file)
              // Reset so same file can be re-selected
              e.target.value = ''
            }}
          />
        </label>

        {/* ─── OR paste URL ─── */}
        <div className="flex items-center gap-2">
          <div className="flex-1 h-px bg-white/10" />
          <span className="text-[10px] text-white/25">or paste URL</span>
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
              <div className="text-xs text-white/50 truncate">
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
        <label className="text-[10px] text-white/40 uppercase tracking-widest">Colour</label>
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
      <div className="border-t border-white/10 pt-4 space-y-3">
        <label className="text-[10px] text-white/40 uppercase tracking-widest">Modal Content</label>
        <input className={inputClass} value={draft.content?.title || ''} onChange={(e) => setDraft((d) => ({ ...d, content: { ...d.content, title: e.target.value } }))} placeholder="Modal title" />
        <input className={inputClass} value={draft.content?.tagline || ''} onChange={(e) => setDraft((d) => ({ ...d, content: { ...d.content, tagline: e.target.value } }))} placeholder="Tagline / subtitle" />

        {/* Sections */}
        <div className="space-y-3">
          {(draft.content?.sections || []).map((sec, i) => (
            <div key={i} className="rounded-xl p-3 space-y-2" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div className="flex items-center gap-2">
                <input
                  className={`${inputClass} flex-1`}
                  value={sec.heading}
                  onChange={(e) => setSec(i, { heading: e.target.value })}
                  placeholder="Section heading"
                />
                <button onClick={() => removeSection(i)} className="text-white/25 hover:text-red-400 transition-colors text-lg leading-none flex-shrink-0">×</button>
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
            className="w-full text-xs py-2 rounded-lg border border-dashed border-white/15 text-white/40 hover:text-white/70 hover:border-white/30 transition-colors"
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
          className="px-4 py-2.5 rounded-xl text-sm text-white/50 hover:text-white/80 border border-white/10 transition-colors"
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
  const inputCls = 'w-full text-sm rounded-lg px-3 py-2 text-white/85 placeholder-white/25 outline-none border bg-white/5 border-white/10 focus:border-teal-400/40 transition-colors'

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
        <button onClick={closeEditor} className="flex items-center gap-1.5 text-xs text-white/40 hover:text-white/70 transition-colors">← Tilbage til liste</button>
        <h3 className="text-sm font-semibold text-white/70">{isNew ? 'Nyt indlæg' : 'Rediger indlæg'}</h3>
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
          <label className="text-[10px] text-white/40 uppercase tracking-widest">Billede (valgfrit)</label>
          <label
            className="flex items-center gap-3 cursor-pointer px-3 py-2.5 rounded-xl border border-dashed transition-colors hover:border-teal-500/40 hover:bg-teal-500/5"
            style={{ borderColor: 'rgba(255,255,255,0.15)' }}
          >
            <span className="text-xl">📁</span>
            <div>
              <div className="text-sm text-white/70">Upload billede</div>
              <div className="text-[10px] text-white/30">PNG, JPG, WebP</div>
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
            <span className="text-[10px] text-white/25">eller indsæt URL</span>
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
          <button onClick={closeEditor} className="px-4 py-2.5 rounded-xl text-sm text-white/40 border border-white/10 transition-colors">Annuller</button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <p className="text-white/35 text-xs leading-relaxed">
        Medlemmer skriver indlæg via Login-noden. Her kan admin moderere alle opslag.
      </p>
      {sorted.length === 0 && (
        <p className="text-white/22 text-xs px-1">Ingen indlæg endnu.</p>
      )}
      {sorted.map((post) => (
        <div
          key={post.id}
          className="flex items-start gap-3 px-3 py-3 rounded-xl"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
        >
          <div className="flex-1 min-w-0">
            <div className="text-sm text-white/80 font-medium leading-snug truncate">{post.title}</div>
            <div className="text-[10px] text-white/30 mt-0.5">{post.author} · {post.date ? new Date(post.date).toLocaleDateString('da-DK') : ''}</div>
          </div>
          <button onClick={() => openEdit(post)} className="text-white/25 hover:text-white/60 transition-colors text-sm px-1 flex-shrink-0">✏</button>
          <button onClick={() => { if (window.confirm('Slet indlæg?')) deleteBlogPost(post.id) }} className="text-white/20 hover:text-red-400 transition-colors text-base leading-none flex-shrink-0">×</button>
        </div>
      ))}

      <button
        onClick={openNew}
        className="w-full py-2.5 rounded-xl text-sm font-semibold transition-all"
        style={{ background: 'rgba(52,211,153,0.12)', border: '1px solid rgba(52,211,153,0.25)', color: '#6ee7b7' }}
      >+ Nyt indlæg</button>

      <button
        onClick={() => { if (window.confirm('Nulstil blog til standard?')) resetBlog() }}
        className="w-full py-2 rounded-xl text-xs text-white/22 hover:text-white/45 border border-white/8 transition-colors"
      >↺ Nulstil blog</button>
    </div>
  )
}
/* ─── Stats admin ───────────────────────────────────────────────────── */
function StatsAdmin() {
  const { stats, updateStats, resetStats } = useStore()
  const [local, setLocal] = useState(stats)

  const inputCls = 'w-full text-sm rounded-lg px-3 py-2 text-white/85 placeholder-white/25 outline-none border bg-white/5 border-white/10 focus:border-yellow-400/40 transition-colors'
  const labelCls = 'block text-xs text-white/40 mb-1'

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
      <p className="text-xs text-white/30">Vises som en tæller-bar i bunden af skærmen (synlig for alle besøgende).</p>
      <div className="space-y-3">
        {local.map((stat) => (
          <div key={stat.id} className="rounded-xl p-3 space-y-2" style={{ background: 'rgba(255,200,80,0.06)', border: '1px solid rgba(255,200,80,0.12)' }}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-semibold" style={{ color: '#f0c070' }}>{stat.label || 'Tæller'}</span>
              <button onClick={() => removeStat(stat.id)} className="text-white/20 hover:text-red-400 text-sm transition-colors">×</button>
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
      <button onClick={reset} className="w-full py-2 rounded-xl text-xs text-white/30 hover:text-white/60 transition-colors">↺ Nulstil tæller</button>
    </div>
  )
}

/* ─── Donation admin ────────────────────────────────────────────────── */
function DonationAdmin() {
  const { donationConfig, setDonationConfig, resetDonationConfig } = useStore()
  const [local, setLocal] = useState(donationConfig)
  const inputCls = 'w-full text-sm rounded-lg px-3 py-2 text-white/85 placeholder-white/25 outline-none border bg-white/5 border-white/10 focus:border-pink-400/40 transition-colors'

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
      <div className="text-white/50 text-[11px] uppercase tracking-widest font-semibold">💳 Betalingsinfo</div>

      {/* MobilePay number */}
      <div>
        <label className="block text-white/50 text-xs mb-1">MobilePay nummer</label>
        <input
          className={inputCls}
          placeholder="f.eks. 12345"
          value={local.mobilepay}
          onChange={(e) => set('mobilepay', e.target.value)}
        />
      </div>

      {/* Donation link */}
      <div>
        <label className="block text-white/50 text-xs mb-1">Betalingslink (MobilePay / Swish / andet)</label>
        <input
          className={inputCls}
          placeholder="https://mobilepay.dk/..."
          value={local.link}
          onChange={(e) => set('link', e.target.value)}
        />
      </div>

      {/* QR code */}
      <div>
        <label className="block text-white/50 text-xs mb-1">QR-kode URL</label>
        <input
          className={inputCls}
          placeholder="https://... eller upload herunder"
          value={local.qrImageUrl}
          onChange={(e) => set('qrImageUrl', e.target.value)}
        />
      </div>
      <div>
        <label className="block text-white/50 text-xs mb-1">Upload QR-billede</label>
        <input type="file" accept="image/*" onChange={handleQrUpload}
          className="w-full text-xs text-white/50 file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-medium file:bg-white/10 file:text-white/70 hover:file:bg-white/20 cursor-pointer" />
      </div>

      {/* Preview */}
      {local.qrImageUrl && (
        <div className="flex flex-col items-center gap-2 py-3">
          <div className="text-white/40 text-xs">Forhåndsvisning</div>
          <img src={local.qrImageUrl} alt="QR preview" className="w-36 h-36 object-contain rounded-xl border border-white/10" />
        </div>
      )}

      {/* Save / Reset */}
      <div className="flex gap-2 pt-1">
        <button onClick={handleSave}
          className="flex-1 py-2 rounded-xl text-xs font-bold transition-all"
          style={{ background: 'rgba(236,72,153,0.25)', border: '1px solid rgba(236,72,153,0.4)', color: '#f9a8d4' }}
        >💾 Gem</button>
        <button onClick={() => { if (window.confirm('Nulstil betalingsinfo?')) { resetDonationConfig(); setLocal({ mobilepay: '', link: '', qrImageUrl: '' }) } }}
          className="px-3 py-2 rounded-xl text-xs font-semibold text-white/30 hover:text-white/60 transition-colors"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
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
  const inputCls = 'w-full text-sm rounded-lg px-3 py-2 text-white/85 placeholder-white/25 outline-none border bg-white/5 border-white/10 focus:border-green-400/40 transition-colors'

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
      <div className="text-white/50 text-[11px] uppercase tracking-widest font-semibold">🚀 Publicér Live</div>

      {/* Info box */}
      <div className="rounded-xl p-3 text-xs text-white/50 space-y-1" style={{ background: 'rgba(74,222,128,0.06)', border: '1px solid rgba(74,222,128,0.15)' }}>
        <p>Gem dine ændringer direkte til GitHub. Siden genbygges automatisk (~1 min), og alle brugere ser de nye indstillinger.</p>
      </div>

      {/* Token */}
      <div>
        <label className="block text-white/50 text-xs mb-1">
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
          <button onClick={() => setShowToken(s => !s)} className="px-2 text-white/30 hover:text-white/60 text-xs">{showToken ? '🙈' : '👁'}</button>
        </div>
        <p className="text-[10px] text-white/25 mt-1">Gemmes i databasen. Vælg scope: <code className="text-white/40">repo</code> (eller <code className="text-white/40">contents:write</code> for fine-grained).</p>
      </div>

      {/* Repo settings */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-white/50 text-xs mb-1">GitHub bruger / org</label>
          <input className={inputCls} value={githubSettings.owner} onChange={(e) => save({ owner: e.target.value })} placeholder="filiptom888-lgtm" />
        </div>
        <div>
          <label className="block text-white/50 text-xs mb-1">Repository navn</label>
          <input className={inputCls} value={githubSettings.repo} onChange={(e) => save({ repo: e.target.value })} placeholder="Weeleafv2" />
        </div>
      </div>
      <div>
        <label className="block text-white/50 text-xs mb-1">Branch</label>
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

/* ─── Admin Panel ────────────────────────────────────────────────────── */
export default function AdminPanel() {
  const { isAdminOpen, toggleAdmin, coins, addCoin, updateCoin, deleteCoin, resetCoins, pendingShopSubmissions } = useStore()
  const [editingId, setEditingId] = useState(null)
  const [activeTab, setActiveTab] = useState('coins')
  const panelRef = useRef()
  const { authed, login, logout } = useAdminAuth()

  useEffect(() => {
    if (isAdminOpen && panelRef.current) {
      gsap.fromTo(
        panelRef.current,
        { opacity: 0, x: 40, scale: 0.96 },
        { opacity: 1, x: 0, scale: 1, duration: 0.38, ease: 'back.out(1.5)' }
      )
    }
  }, [isAdminOpen])

  const handleSave = useCallback((draft) => {
    updateCoin(draft.id, draft)
    setEditingId(null)
  }, [updateCoin])

  const handleAdd = useCallback(() => {
    const coin = blankCoin(coins.length)
    const redistributed = addCoin(coin)
    // addCoin returns the redistributed version; use its id (same) to open editor
    setEditingId(coin.id)
  }, [coins.length, addCoin])

  const handleDelete = useCallback((id) => {
    if (LOCKED_COIN_IDS.includes(id)) return
    if (window.confirm('Delete this coin from the orbit?')) deleteCoin(id)
  }, [deleteCoin])

  const pendingCount = pendingShopSubmissions.filter((s) => s.status === 'pending').length

  if (!isAdminOpen) return null

  const editingCoin = editingId ? coins.find((c) => c.id === editingId) : null

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-[60]" onClick={toggleAdmin} />

      {/* Panel */}
      <div
        ref={panelRef}
        className="fixed top-0 right-0 bottom-0 z-[70] w-full max-w-sm overflow-y-auto"
        style={{
          background: 'rgba(4,14,8,0.92)',
          backdropFilter: 'blur(32px)',
          WebkitBackdropFilter: 'blur(32px)',
          borderLeft: '1px solid rgba(74,222,128,0.18)',
          boxShadow: '-24px 0 80px rgba(0,0,0,0.6)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 sticky top-0 z-10" style={{ background: 'rgba(4,14,8,0.95)' }}>
          <div>
            <div className="text-white font-bold text-base tracking-tight">⚙ Admin</div>
            <div className="text-white/35 text-[10px] tracking-widest uppercase mt-0.5">{coins.length} nodes · shop</div>
          </div>
          <div className="flex items-center gap-1">
            {authed && (
              <>
                <button
                  onClick={() => {
                    const { coins, shopCategories, blogPosts, donationConfig } = useStore.getState()
                    const config = { coins, shopCategories, blogPosts, donationConfig }
                    const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' })
                    const a = document.createElement('a')
                    a.href = URL.createObjectURL(blob)
                    a.download = 'wl-config.json'
                    a.click()
                    URL.revokeObjectURL(a.href)
                  }}
                  className="text-white/20 hover:text-green-400 text-xs px-2 py-1 rounded-lg transition-colors"
                  title="Eksporter config (erstat public/wl-config.json og push)"
                >📤</button>
                <button onClick={logout} className="text-white/20 hover:text-white/50 text-xs px-2 py-1 rounded-lg transition-colors" title="Log ud">🔒</button>
              </>
            )}
            <button onClick={toggleAdmin} className="w-8 h-8 rounded-full flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-all text-xl leading-none">×</button>
          </div>
        </div>

        {/* Auth gate */}
        {!authed && <AdminLoginGate onAuth={login} />}

        {/* Tab switcher */}
        {authed && <div className="flex gap-1 px-4 pt-3 pb-1">
          {[{ key: 'coins', label: '🌿 Nodes' }, { key: 'shop', label: '🛍️ Shop' }, { key: 'approvals', label: pendingCount ? `✅ Godkend (${pendingCount})` : '✅ Godkend' }, { key: 'blog', label: '📝 Blog' }, { key: 'donation', label: '💳 Give' }, { key: 'stats', label: '📊 Tæller' }, { key: 'publish', label: '🚀 Publicér' }].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => { setActiveTab(key); setEditingId(null) }}
              className="flex-1 py-2 rounded-xl text-xs font-semibold transition-all"
              style={{
                background: activeTab === key ? 'rgba(74,222,128,0.18)' : 'rgba(255,255,255,0.04)',
                border: `1px solid ${activeTab === key ? 'rgba(74,222,128,0.4)' : 'rgba(255,255,255,0.08)'}`,
                color: activeTab === key ? '#86efac' : 'rgba(255,255,255,0.4)',
              }}
            >{label}</button>
          ))}
        </div>}

        {authed && <div className="px-4 py-4 space-y-5">
          {/* Shop tab */}
          {activeTab === 'shop' && <ShopAdmin />}

          {/* Shop approvals tab */}
          {activeTab === 'approvals' && <PendingShopAdmin />}

          {/* Blog tab */}
          {activeTab === 'blog' && <BlogAdmin />}

          {/* Stats tab */}
          {activeTab === 'stats' && <StatsAdmin />}

          {/* Donation tab */}
          {activeTab === 'donation' && <DonationAdmin />}

          {/* Publish tab */}
          {activeTab === 'publish' && <PublishAdmin />}

          {/* Coins tab */}
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

                  {/* Add & Reset */}
                  <div className="flex gap-2">
                    <button
                      onClick={handleAdd}
                      className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white transition-all"
                      style={{ background: 'rgba(74,222,128,0.18)', border: '1px solid rgba(74,222,128,0.35)', color: '#86efac' }}
                    >
                      + Add Coin
                    </button>
                    <button
                      onClick={() => { if (window.confirm('Reset all coins to defaults?')) { resetCoins(); setEditingId(null) } }}
                      className="px-4 py-2.5 rounded-xl text-sm text-white/35 hover:text-white/60 border border-white/10 transition-colors"
                      title="Reset to defaults"
                    >
                      ↺
                    </button>
                  </div>

                  <div className="text-white/20 text-[10px] leading-relaxed">
                    Changes are saved to localStorage and persist across refreshes. Click a coin row to edit it.
                  </div>
                </>
              )}

              {editingId && editingCoin && (
                <>
                  <button
                    onClick={() => setEditingId(null)}
                    className="flex items-center gap-1.5 text-xs text-white/40 hover:text-white/70 transition-colors"
                  >
                    ← Back to list
                  </button>
                  <CoinEditor
                    coin={editingCoin}
                    onSave={handleSave}
                    onClose={() => setEditingId(null)}
                  />
                </>
              )}
            </>
          )}
        </div>}
      </div>
    </>
  )
}
