import React, { useState, useEffect } from 'react'
import useStore from '../../store/useStore'
import FullscreenShell from './FullscreenShell'
import AccountTabBar from './AccountTabBar'
import { WL, accountCardStyle } from '../../styles/modalTheme'

export default function ShopModal({ coin, onClose }) {
  const { shopCategories } = useStore()
  const [activeCatId, setActiveCatId] = useState(shopCategories[0]?.id || '')
  const [activeProductIdx, setActiveProductIdx] = useState(0)

  const activeCategory = shopCategories.find((c) => c.id === activeCatId) ?? shopCategories[0]
  const products = activeCategory?.products ?? []
  const activeProduct = products[activeProductIdx] ?? null

  useEffect(() => { setActiveProductIdx(0) }, [activeCatId])

  const prev = () => setActiveProductIdx((i) => (i - 1 + products.length) % products.length)
  const next = () => setActiveProductIdx((i) => (i + 1) % products.length)

  const categoryTabs = shopCategories.map((cat) => ({
    key: cat.id,
    label: cat.label,
    icon: cat.icon,
  }))

  return (
    <FullscreenShell
      onClose={onClose}
      contentClassName="max-w-3xl"
    >
      <div className="rounded-2xl overflow-hidden" style={accountCardStyle}>
        {shopCategories.length > 0 && (
          <div className="p-4 pb-0 border-b" style={{ borderColor: WL.borderLight }}>
            <h2 className="text-lg md:text-xl font-bold mb-3" style={{ color: WL.text }}>
              {coin.content?.title || 'WL Shop'}
            </h2>
            <AccountTabBar
              tabs={categoryTabs}
              active={activeCatId}
              onChange={setActiveCatId}
            />
            <p className="text-[10px] mt-2 mb-1 px-1" style={{ color: WL.textSoft }}>
              {products.length} {products.length === 1 ? 'vare' : 'varer'} i {activeCategory?.label}
            </p>
          </div>
        )}

        <div className="p-4 md:p-5 space-y-4">
          {products.length > 0 && activeProduct ? (
            <>
              <div
                className="relative rounded-2xl overflow-hidden"
                style={{ background: 'rgba(255,255,255,0.55)', border: `1px solid ${WL.borderLight}` }}
              >
                <div className="relative flex items-center justify-center min-h-[200px] md:min-h-[260px] p-4">
                  {products.length > 1 && (
                    <>
                      <button
                        type="button"
                        onClick={prev}
                        className="absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full flex items-center justify-center text-lg z-10 transition-all hover:scale-105"
                        style={{
                          color: WL.textMuted,
                          background: 'rgba(255,255,255,0.92)',
                          border: `1px solid ${WL.border}`,
                        }}
                        aria-label="Forrige produkt"
                      >
                        ‹
                      </button>
                      <button
                        type="button"
                        onClick={next}
                        className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full flex items-center justify-center text-lg z-10 transition-all hover:scale-105"
                        style={{
                          color: WL.textMuted,
                          background: 'rgba(255,255,255,0.92)',
                          border: `1px solid ${WL.border}`,
                        }}
                        aria-label="Næste produkt"
                      >
                        ›
                      </button>
                    </>
                  )}

                  {activeProduct.imageUrl ? (
                    <img
                      src={activeProduct.imageUrl}
                      alt={activeProduct.name}
                      className="max-h-[220px] md:max-h-[280px] w-auto max-w-full object-contain rounded-xl"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center gap-2 py-12">
                      <span className="text-5xl opacity-40">🛍️</span>
                      <span className="text-sm" style={{ color: WL.textSoft }}>Intet billede</span>
                    </div>
                  )}
                </div>

                {products.length > 1 && (
                  <div
                    className="flex gap-2 px-4 pb-4 overflow-x-auto"
                    style={{ scrollbarWidth: 'thin' }}
                  >
                    {products.map((p, i) => {
                      const isActive = i === activeProductIdx
                      return (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => setActiveProductIdx(i)}
                          className="flex-shrink-0 rounded-xl overflow-hidden transition-all"
                          style={{
                            width: 64,
                            height: 64,
                            border: `2px solid ${isActive ? WL.greenBright : WL.borderLight}`,
                            opacity: isActive ? 1 : 0.7,
                            boxShadow: isActive ? '0 2px 12px rgba(61,158,95,0.2)' : 'none',
                          }}
                        >
                          {p.imageUrl ? (
                            <img src={p.imageUrl} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div
                              className="w-full h-full flex items-center justify-center text-xl"
                              style={{ background: WL.skyAccentSoft }}
                            >
                              🛍️
                            </div>
                          )}
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <h3 className="text-lg font-bold leading-snug" style={{ color: WL.text }}>
                    {activeProduct.name}
                  </h3>
                  {activeProduct.price && (
                    <span
                      className="text-sm font-bold px-3 py-1 rounded-full flex-shrink-0"
                      style={{
                        color: WL.green,
                        background: WL.skyAccentSoft,
                        border: `1px solid ${WL.borderLight}`,
                      }}
                    >
                      {activeProduct.price}
                    </span>
                  )}
                </div>

                {activeProduct.desc && (
                  <p className="text-[15px] leading-relaxed" style={{ color: WL.textMuted }}>
                    {activeProduct.desc}
                  </p>
                )}

                {activeProduct.link && (
                  <a
                    href={activeProduct.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90"
                    style={{
                      background: `linear-gradient(135deg, ${WL.greenBright}, #4ade80)`,
                      boxShadow: '0 4px 16px rgba(61,158,95,0.25)',
                    }}
                  >
                    Køb nu ↗
                  </a>
                )}
              </div>
            </>
          ) : (
            <div className="py-14 text-center">
              <span className="text-5xl block mb-3 opacity-50">🛍️</span>
              <p className="font-medium" style={{ color: WL.textMuted }}>
                Ingen produkter i denne kategori endnu
              </p>
              <p className="text-sm mt-2" style={{ color: WL.textSoft }}>
                Vælg en anden kategori ovenfor
              </p>
            </div>
          )}

          {(coin.content?.sections ?? []).map((s, i) => (
            <div
              key={i}
              className="rounded-xl p-4 mt-2"
              style={{
                background: WL.skyAccentSoft,
                border: `1px solid ${WL.borderLight}`,
              }}
            >
              {s.heading && (
                <h4 className="text-sm font-bold mb-1.5" style={{ color: WL.green }}>
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
      </div>
    </FullscreenShell>
  )
}
