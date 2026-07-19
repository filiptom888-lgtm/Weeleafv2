import React, { useState, useEffect } from 'react'
import useStore from '../../store/useStore'
import FullscreenShell from './FullscreenShell'
import { WL, glassStyle } from '../../styles/modalTheme'

export default function ShopModal({ coin, onClose }) {
  const { shopCategories } = useStore()
  const [activeCatId, setActiveCatId] = useState(shopCategories[0]?.id || '')
  const [activeProductIdx, setActiveProductIdx] = useState(0)

  const activeCategory = shopCategories.find((c) => c.id === activeCatId) ?? shopCategories[0]
  const products = activeCategory?.products ?? []
  const activeProduct = products[activeProductIdx] ?? null
  const catColor = activeCategory?.color || coin.color

  useEffect(() => { setActiveProductIdx(0) }, [activeCatId])

  const prev = () => setActiveProductIdx((i) => (i - 1 + products.length) % products.length)
  const next = () => setActiveProductIdx((i) => (i + 1) % products.length)

  const categoryFooter = (
    <div className="flex items-stretch gap-2 px-4 md:px-8 py-3 overflow-x-auto">
      {shopCategories.map((cat) => {
        const isActive = cat.id === activeCatId
        const color = cat.color || coin.color
        return (
          <button
            key={cat.id}
            type="button"
            onClick={() => setActiveCatId(cat.id)}
            className="flex flex-col items-center gap-1 flex-shrink-0 px-5 py-3 rounded-xl transition-all min-w-[88px] backdrop-blur-sm"
            style={{
              background: isActive ? 'rgba(255,252,246,0.95)' : 'rgba(255,255,255,0.55)',
              border: `2px solid ${isActive ? color : WL.borderLight}`,
              boxShadow: isActive ? `0 4px 20px ${color}44` : 'none',
            }}
          >
            <span className="text-2xl leading-none">{cat.icon}</span>
            <span
              className="text-[11px] font-semibold whitespace-nowrap"
              style={{ color: isActive ? WL.text : WL.textMuted }}
            >
              {cat.label}
            </span>
            <span className="text-[10px]" style={{ color: WL.textSoft }}>
              {cat.products?.length ?? 0} {cat.products?.length === 1 ? 'vare' : 'varer'}
            </span>
          </button>
        )
      })}
    </div>
  )

  return (
    <FullscreenShell
      eyebrow="WeeLeaf Shop"
      title={coin.content?.title || 'WL Shop'}
      tagline={coin.content?.tagline}
      onClose={onClose}
      footer={categoryFooter}
    >
      <div className="space-y-5">
        {products.length > 0 ? (
          <>
            <div className="rounded-2xl overflow-hidden" style={glassStyle}>
              <div className="relative flex items-center justify-center gap-3 px-12 py-6 min-h-[220px]">
                {products.length > 1 && (
                  <button
                    type="button"
                    onClick={prev}
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full flex items-center justify-center text-lg z-10 transition-all hover:scale-105 backdrop-blur-sm"
                    style={{
                      color: WL.textMuted,
                      background: WL.glassCard,
                      border: `1px solid ${WL.border}`,
                      boxShadow: '0 2px 8px rgba(120,80,40,0.1)',
                    }}
                    aria-label="Forrige produkt"
                  >
                    ‹
                  </button>
                )}

                {products.map((p, i) => {
                  const dist = Math.abs(i - activeProductIdx)
                  if (dist > 2) return null
                  const isActive = i === activeProductIdx
                  return (
                    <div
                      key={p.id}
                      onClick={() => setActiveProductIdx(i)}
                      className="cursor-pointer rounded-xl overflow-hidden flex-shrink-0 transition-all duration-300"
                      style={{
                        width: isActive ? 220 : dist === 1 ? 140 : 96,
                        height: isActive ? 170 : dist === 1 ? 110 : 76,
                        border: `2px solid ${isActive ? catColor : WL.borderLight}`,
                        boxShadow: isActive ? `0 8px 24px ${catColor}33` : 'none',
                        opacity: isActive ? 1 : dist === 1 ? 0.75 : 0.45,
                        background: 'rgba(255,255,255,0.92)',
                      }}
                    >
                      {p.imageUrl ? (
                        <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover" />
                      ) : (
                        <div
                          className="w-full h-full flex flex-col items-center justify-center gap-1"
                          style={{ background: `${catColor}12` }}
                        >
                          <span className="text-3xl opacity-50">🛍️</span>
                        </div>
                      )}
                    </div>
                  )
                })}

                {products.length > 1 && (
                  <button
                    type="button"
                    onClick={next}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full flex items-center justify-center text-lg z-10 transition-all hover:scale-105 backdrop-blur-sm"
                    style={{
                      color: WL.textMuted,
                      background: WL.glassCard,
                      border: `1px solid ${WL.border}`,
                      boxShadow: '0 2px 8px rgba(120,80,40,0.1)',
                    }}
                    aria-label="Næste produkt"
                  >
                    ›
                  </button>
                )}
              </div>

              {products.length > 1 && (
                <div className="flex justify-center gap-1.5 pb-4">
                  {products.map((p, i) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setActiveProductIdx(i)}
                      className="rounded-full transition-all"
                      style={{
                        width: i === activeProductIdx ? 20 : 8,
                        height: 8,
                        background: i === activeProductIdx ? catColor : WL.border,
                      }}
                      aria-label={`Produkt ${i + 1}`}
                    />
                  ))}
                </div>
              )}
            </div>

            {activeProduct && (
              <div className="rounded-2xl p-5 md:p-6" style={glassStyle}>
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <h3 className="text-lg font-bold leading-snug" style={{ color: WL.text }}>
                    {activeProduct.name}
                  </h3>
                  {activeProduct.price && (
                    <span
                      className="text-base font-bold px-3 py-1 rounded-full flex-shrink-0"
                      style={{
                        color: WL.green,
                        background: 'rgba(74, 222, 128, 0.12)',
                        border: '1px solid rgba(74, 222, 128, 0.25)',
                      }}
                    >
                      {activeProduct.price}
                    </span>
                  )}
                </div>

                {activeProduct.desc && (
                  <p className="text-[15px] mt-3 leading-relaxed" style={{ color: WL.textMuted }}>
                    {activeProduct.desc}
                  </p>
                )}

                {activeProduct.link && (
                  <a
                    href={activeProduct.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 mt-5 px-6 py-2.5 rounded-full text-sm font-semibold text-white transition-all hover:opacity-90"
                    style={{
                      background: `linear-gradient(135deg, ${catColor}, ${coin.emissiveColor || catColor})`,
                      boxShadow: `0 4px 16px ${catColor}44`,
                    }}
                  >
                    Køb nu ↗
                  </a>
                )}
              </div>
            )}
          </>
        ) : (
          <div className="rounded-2xl py-16 text-center" style={glassStyle}>
            <span className="text-5xl block mb-3 opacity-60">🛍️</span>
            <p className="font-medium" style={{ color: WL.textMuted }}>
              Ingen produkter i denne kategori endnu
            </p>
            <p className="text-sm mt-2" style={{ color: WL.textSoft }}>
              Tjek en anden kategori nedenfor
            </p>
          </div>
        )}

        {(coin.content?.sections ?? []).map((s, i) => (
          <div
            key={i}
            className="rounded-2xl p-5 backdrop-blur-sm"
            style={{
              background: 'linear-gradient(135deg, rgba(74,222,128,0.12), rgba(200,144,74,0.08))',
              border: `1px solid ${WL.borderLight}`,
              boxShadow: WL.shadow,
            }}
          >
            {s.heading && (
              <h4 className="text-sm font-bold mb-2" style={{ color: WL.green }}>
                {s.heading}
              </h4>
            )}
            {s.text && (
              <p className="text-sm leading-relaxed" style={{ color: WL.textMuted }}>
                {s.text}
              </p>
            )}
          </div>
        ))}
      </div>
    </FullscreenShell>
  )
}
