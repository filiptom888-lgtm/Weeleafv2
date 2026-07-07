import React, { useState, useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import useStore from '../../store/useStore'
import { WL } from '../../styles/modalTheme'

export default function ShopModal({ coin, onClose }) {
  const { shopCategories } = useStore()
  const [activeCatId, setActiveCatId] = useState(shopCategories[0]?.id || '')
  const [activeProductIdx, setActiveProductIdx] = useState(0)
  const panelRef = useRef()

  const activeCategory = shopCategories.find((c) => c.id === activeCatId) ?? shopCategories[0]
  const products = activeCategory?.products ?? []
  const activeProduct = products[activeProductIdx] ?? null
  const catColor = activeCategory?.color || coin.color

  useEffect(() => { setActiveProductIdx(0) }, [activeCatId])

  useEffect(() => {
    if (panelRef.current) {
      gsap.fromTo(panelRef.current, { opacity: 0 }, { opacity: 1, duration: 0.3, ease: 'power2.out' })
    }
  }, [])

  const handleClose = () => {
    if (!panelRef.current) { onClose(); return }
    gsap.to(panelRef.current, { opacity: 0, duration: 0.22, ease: 'power2.in', onComplete: onClose })
  }

  const prev = () => setActiveProductIdx((i) => (i - 1 + products.length) % products.length)
  const next = () => setActiveProductIdx((i) => (i + 1) % products.length)

  return (
    <div
      ref={panelRef}
      className="fixed inset-0 z-50 flex flex-col min-h-0"
      style={{ background: WL.pageBg }}
    >
      <div className="h-1 flex-shrink-0" style={{ background: WL.accentBar }} />

      {/* Header */}
      <header
        className="flex-shrink-0 flex items-start justify-between gap-4 px-5 md:px-10 py-4 border-b backdrop-blur-sm"
        style={{ background: WL.headerBg, borderColor: WL.borderLight }}
      >
        <div className="min-w-0 pr-12">
          <p
            className="text-[10px] uppercase tracking-[0.25em] font-medium mb-1"
            style={{ color: WL.gold }}
          >
            WeeLeaf Shop
          </p>
          <h1 className="text-xl md:text-2xl font-bold leading-tight" style={{ color: WL.text }}>
            {coin.content?.title || 'WL Shop'}
          </h1>
          {coin.content?.tagline && (
            <p className="text-sm mt-1.5 max-w-2xl leading-relaxed" style={{ color: WL.textMuted }}>
              {coin.content.tagline}
            </p>
          )}
        </div>
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 md:top-5 md:right-8 w-10 h-10 flex items-center justify-center text-xl rounded-full transition-all hover:scale-105"
          style={{
            color: WL.textMuted,
            background: 'rgba(255,255,255,0.85)',
            border: `1px solid ${WL.border}`,
          }}
          aria-label="Close"
        >
          ×
        </button>
      </header>

      {/* Main scroll area */}
      <main className="flex-1 overflow-y-auto min-h-0">
        <div className="max-w-4xl mx-auto px-4 md:px-8 py-6 md:py-8 space-y-5">

          {products.length > 0 ? (
            <>
              {/* Product gallery card */}
              <div
                className="rounded-2xl overflow-hidden"
                style={{
                  background: WL.feedBg,
                  border: `1px solid ${WL.border}`,
                  boxShadow: WL.shadow,
                }}
              >
                <div className="relative flex items-center justify-center gap-3 px-12 py-6 min-h-[220px]">
                  {products.length > 1 && (
                    <button
                      onClick={prev}
                      className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full flex items-center justify-center text-lg z-10 transition-all hover:scale-105"
                      style={{
                        color: WL.textMuted,
                        background: 'rgba(255,255,255,0.9)',
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
                          background: '#fff',
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
                      onClick={next}
                      className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full flex items-center justify-center text-lg z-10 transition-all hover:scale-105"
                      style={{
                        color: WL.textMuted,
                        background: 'rgba(255,255,255,0.9)',
                        border: `1px solid ${WL.border}`,
                        boxShadow: '0 2px 8px rgba(120,80,40,0.1)',
                      }}
                      aria-label="Næste produkt"
                    >
                      ›
                    </button>
                  )}
                </div>

                {/* Dots indicator */}
                {products.length > 1 && (
                  <div className="flex justify-center gap-1.5 pb-4">
                    {products.map((p, i) => (
                      <button
                        key={p.id}
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

              {/* Product details */}
              {activeProduct && (
                <div
                  className="rounded-2xl p-5 md:p-6"
                  style={{
                    background: WL.panelBg,
                    border: `1px solid ${WL.borderLight}`,
                    boxShadow: WL.shadow,
                  }}
                >
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
                          border: `1px solid rgba(74, 222, 128, 0.25)`,
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
            <div
              className="rounded-2xl py-16 text-center"
              style={{ background: WL.feedBg, border: `1px solid ${WL.borderLight}` }}
            >
              <span className="text-5xl block mb-3 opacity-60">🛍️</span>
              <p className="font-medium" style={{ color: WL.textMuted }}>
                Ingen produkter i denne kategori endnu
              </p>
              <p className="text-sm mt-2" style={{ color: WL.textSoft }}>
                Tjek en anden kategori nedenfor
              </p>
            </div>
          )}

          {/* Benefits sections */}
          {(coin.content?.sections ?? []).map((s, i) => (
            <div
              key={i}
              className="rounded-2xl p-5"
              style={{
                background: 'linear-gradient(135deg, rgba(74,222,128,0.08), rgba(200,144,74,0.06))',
                border: `1px solid ${WL.borderLight}`,
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
      </main>

      {/* Category tabs — sticky bottom */}
      <footer
        className="flex-shrink-0 border-t backdrop-blur-sm"
        style={{ background: WL.headerBg, borderColor: WL.borderLight }}
      >
        <div className="flex items-stretch gap-2 px-4 md:px-8 py-3 overflow-x-auto">
          {shopCategories.map((cat) => {
            const isActive = cat.id === activeCatId
            const color = cat.color || coin.color
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCatId(cat.id)}
                className="flex flex-col items-center gap-1 flex-shrink-0 px-5 py-3 rounded-xl transition-all min-w-[88px]"
                style={{
                  background: isActive ? '#fff' : 'rgba(255,255,255,0.5)',
                  border: `2px solid ${isActive ? color : WL.borderLight}`,
                  boxShadow: isActive ? `0 4px 12px ${color}22` : 'none',
                }}
              >
                <span className="text-2xl leading-none">{cat.icon}</span>
                <span
                  className="text-[11px] font-semibold whitespace-nowrap"
                  style={{ color: isActive ? WL.text : WL.textSoft }}
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
      </footer>
    </div>
  )
}
