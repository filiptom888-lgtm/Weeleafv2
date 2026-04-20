import React, { useState, useRef, useEffect, useCallback } from 'react'
import { gsap } from 'gsap'
import useStore from '../../store/useStore'

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

      <button
        className="text-white/25 hover:text-red-400 transition-colors text-base leading-none px-1"
        onClick={(e) => { e.stopPropagation(); onDelete() }}
        title="Delete coin"
      >
        ×
      </button>
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

/* ─── Admin Panel ────────────────────────────────────────────────────── */
export default function AdminPanel() {
  const { isAdminOpen, toggleAdmin, coins, addCoin, updateCoin, deleteCoin, resetCoins } = useStore()
  const [editingId, setEditingId] = useState(null)
  const panelRef = useRef()

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
    if (window.confirm('Delete this coin from the orbit?')) deleteCoin(id)
  }, [deleteCoin])

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
            <div className="text-white font-bold text-base tracking-tight">⚙ Coin Admin</div>
            <div className="text-white/35 text-[10px] tracking-widest uppercase mt-0.5">{coins.length} nodes in orbit</div>
          </div>
          <button onClick={toggleAdmin} className="w-8 h-8 rounded-full flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-all text-xl leading-none">×</button>
        </div>

        <div className="px-4 py-4 space-y-5">
          {/* Coin list */}
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

          {/* Coin editor */}
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
        </div>
      </div>
    </>
  )
}
