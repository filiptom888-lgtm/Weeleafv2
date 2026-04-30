import React, { useState, useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import useStore from '../../store/useStore'

export default function ShopModal({ coin, onClose }) {
  const { shopCategories } = useStore()
  const [activeCatId, setActiveCatId] = useState(shopCategories[0]?.id || '')
  const [activeProductIdx, setActiveProductIdx] = useState(0)
  const overlayRef = useRef()
  const panelRef = useRef()

  const activeCategory = shopCategories.find((c) => c.id === activeCatId) ?? shopCategories[0]
  const products = activeCategory?.products ?? []
  const activeProduct = products[activeProductIdx] ?? null

  // Reset product index when switching category
  useEffect(() => { setActiveProductIdx(0) }, [activeCatId])

  useEffect(() => {
    if (overlayRef.current && panelRef.current) {
      gsap.fromTo(overlayRef.current, { opacity: 0 }, { opacity: 1, duration: 0.3, ease: 'power2.out' })
      gsap.fromTo(
        panelRef.current,
        { opacity: 0, y: 28 },
        { opacity: 1, y: 0, duration: 0.42, ease: 'back.out(1.5)' }
      )
    }
  }, [])

  const handleClose = () => {
    if (!overlayRef.current || !panelRef.current) { onClose(); return }
    gsap.to(panelRef.current, { opacity: 0, y: 18, duration: 0.22, ease: 'power2.in' })
    gsap.to(overlayRef.current, { opacity: 0, duration: 0.28, ease: 'power2.in', onComplete: onClose })
  }

  const prev = () => setActiveProductIdx((i) => (i - 1 + products.length) % products.length)
  const next = () => setActiveProductIdx((i) => (i + 1) % products.length)

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center p-0 md:p-6"
      style={{ background: 'rgba(0,0,0,0.65)' }}
      onClick={(e) => e.target === e.currentTarget && handleClose()}
    >
      <div
        ref={panelRef}
        className="relative flex flex-col w-full h-full md:w-[92vw] md:h-[88vh] md:rounded-2xl overflow-hidden"
        style={{
          background: 'rgba(3,18,10,0.97)',
          backdropFilter: 'blur(32px)',
          WebkitBackdropFilter: 'blur(32px)',
          border: `1px solid ${coin.color}28`,
          boxShadow: `0 0 100px ${coin.color}15, 0 32px 100px rgba(0,0,0,0.75)`,
        }}
      >
        {/* Accent bar */}
        <div
          className="h-[3px] flex-shrink-0"
          style={{ background: `linear-gradient(90deg, ${coin.color}, ${coin.emissiveColor}, transparent)` }}
        />

        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 z-20 w-9 h-9 rounded-full flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-all text-2xl leading-none"
          aria-label="Close"
        >×</button>

        {/* Header */}
        <div className="px-6 md:px-10 pt-6 pb-4 flex-shrink-0">
          <h2 className="text-xl font-bold text-white tracking-tight">{coin.content?.title}</h2>
          <p className="text-sm text-white/55 mt-1.5 max-w-2xl leading-relaxed">{coin.content?.tagline}</p>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto flex flex-col min-h-0">

          {/* ── Product carousel ── */}
          {products.length > 0 ? (
            <>
              <div className="relative flex items-center justify-center gap-3 px-14 py-5 flex-shrink-0 min-h-[200px]">
                {/* Prev */}
                {products.length > 1 && (
                  <button
                    onClick={prev}
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full flex items-center justify-center text-white/35 hover:text-white hover:bg-white/10 transition-all text-xl z-10"
                  >‹</button>
                )}

                {/* Thumbnails — show up to 5, centred around active */}
                {products.map((p, i) => {
                  const dist = Math.abs(i - activeProductIdx)
                  if (dist > 2) return null
                  const isActive = i === activeProductIdx
                  return (
                    <div
                      key={p.id}
                      onClick={() => setActiveProductIdx(i)}
                      className="cursor-pointer rounded-xl overflow-hidden border flex-shrink-0 transition-all duration-300"
                      style={{
                        width: isActive ? 210 : dist === 1 ? 130 : 90,
                        height: isActive ? 165 : dist === 1 ? 105 : 75,
                        borderColor: isActive ? `${coin.color}88` : 'rgba(255,255,255,0.08)',
                        boxShadow: isActive ? `0 0 24px ${coin.color}38` : 'none',
                        opacity: isActive ? 1 : dist === 1 ? 0.6 : 0.35,
                      }}
                    >
                      {p.imageUrl ? (
                        <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover" />
                      ) : (
                        <div
                          className="w-full h-full flex flex-col items-center justify-center gap-1.5"
                          style={{ background: `${coin.color}10` }}
                        >
                          <span className="text-3xl opacity-40">🛍️</span>
                          {isActive && (
                            <span className="text-[9px] text-white/25 text-center px-2 leading-tight line-clamp-2">
                              {p.name}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}

                {/* Next */}
                {products.length > 1 && (
                  <button
                    onClick={next}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full flex items-center justify-center text-white/35 hover:text-white hover:bg-white/10 transition-all text-xl z-10"
                  >›</button>
                )}
              </div>

              {/* Active product details */}
              {activeProduct && (
                <div
                  className="mx-6 md:mx-10 mb-5 p-5 rounded-xl flex-shrink-0"
                  style={{
                    background: `${coin.color}0c`,
                    border: `1px solid ${coin.color}30`,
                  }}
                >
                  <div className="flex items-start gap-4 flex-wrap">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base font-semibold text-white/95">{activeProduct.name}</h3>
                      <p className="text-sm text-white/60 mt-2 leading-relaxed">{activeProduct.desc}</p>
                    </div>
                    {activeProduct.price && (
                      <div className="text-sm font-bold flex-shrink-0 mt-0.5" style={{ color: coin.color }}>
                        {activeProduct.price}
                      </div>
                    )}
                  </div>
                  {activeProduct.link && (
                    <a
                      href={activeProduct.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 mt-4 px-5 py-2 rounded-full text-sm font-semibold transition-all"
                      style={{
                        background: `${coin.color}1e`,
                        border: `1px solid ${coin.color}55`,
                        color: coin.color,
                      }}
                    >
                      Køb nu ↗
                    </a>
                  )}
                </div>
              )}
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center py-16">
              <div className="text-center">
                <div className="text-5xl mb-4 opacity-20">🛍️</div>
                <p className="text-white/25 text-sm">Ingen produkter i denne kategori endnu.</p>
              </div>
            </div>
          )}

          {/* Benefits / extra sections from coin content */}
          {(coin.content?.sections ?? []).map((s, i) => (
            <div
              key={i}
              className="mx-6 md:mx-10 mb-4 p-4 rounded-xl flex-shrink-0"
              style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.07)',
              }}
            >
              {s.heading && (
                <h4 className="text-sm font-semibold mb-2" style={{ color: coin.color }}>
                  {s.heading}
                </h4>
              )}
              {s.text && <p className="text-sm text-white/50 leading-relaxed">{s.text}</p>}
            </div>
          ))}

          <div className="h-4 flex-shrink-0" />
        </div>

        {/* ── Category selector — sticky bottom ── */}
        <div
          className="flex-shrink-0 flex items-stretch gap-2 px-4 md:px-8 py-3 overflow-x-auto border-t"
          style={{ background: 'rgba(3,12,7,0.97)', borderColor: 'rgba(255,255,255,0.07)' }}
        >
          {shopCategories.map((cat) => {
            const isActive = cat.id === activeCatId
            const catColor = cat.color || coin.color
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCatId(cat.id)}
                className="flex flex-col items-center gap-1 flex-shrink-0 px-5 py-2.5 rounded-xl transition-all"
                style={{
                  background: isActive ? `${catColor}1e` : 'rgba(255,255,255,0.04)',
                  border: `1px solid ${isActive ? catColor + '55' : 'rgba(255,255,255,0.08)'}`,
                  boxShadow: isActive ? `0 0 16px ${catColor}28` : 'none',
                }}
              >
                <span className="text-2xl leading-none">{cat.icon}</span>
                <span
                  className="text-[11px] font-medium whitespace-nowrap"
                  style={{ color: isActive ? catColor : 'rgba(255,255,255,0.4)' }}
                >
                  {cat.label}
                </span>
                <span className="text-[9px]" style={{ color: 'rgba(255,255,255,0.18)' }}>
                  {cat.products?.length ?? 0} varer
                </span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
