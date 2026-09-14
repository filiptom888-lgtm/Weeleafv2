import React, { useState, useEffect } from 'react'
import useStore from '../../store/useStore'
import FullscreenShell from './FullscreenShell'
import AccountTabBar from './AccountTabBar'
import { WL, airGlassStyle, airTileStyle, primaryBtnStyle, modalPad } from '../../styles/modalTheme'
import { stripLeadingEmoji } from '../../utils/text'

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
    <FullscreenShell onClose={onClose} contentClassName="max-w-5xl" headerLayout="none">
      <div className="w-full rounded-[1.85rem] overflow-hidden wl-paper" style={airGlassStyle}>
        {shopCategories.length > 0 && (
          <div
            className={`${modalPad} pt-7 pb-5 md:pt-8 md:pb-6`}
            style={{
              background: 'rgba(255, 248, 238, 0.16)',
              borderBottom: `1px solid ${WL.borderLight}`,
            }}
          >
            <div
              className="h-1 w-16 rounded-full mb-4"
              style={{ background: `linear-gradient(90deg, ${WL.green}, ${WL.gold})` }}
            />
            <p className="wl-eyebrow mb-3">WeeLeaf</p>
            <h1
              className="wl-display text-[2rem] md:text-[2.75rem] leading-[1.12]"
              style={{ color: WL.textOnModal }}
            >
              {coin.content?.title || 'WL Shop'}
            </h1>
            {coin.content?.tagline && (
              <p
                className="wl-tagline text-base md:text-xl mt-3 leading-relaxed max-w-2xl"
                style={{ color: WL.textMutedOnModal }}
              >
                {coin.content.tagline}
              </p>
            )}
            <div className="mt-5">
              <AccountTabBar
                tabs={categoryTabs}
                active={activeCatId}
                onChange={setActiveCatId}
              />
            </div>
            <p className="text-xs mt-3" style={{ color: WL.textSoftOnModal }}>
              {products.length} {products.length === 1 ? 'vare' : 'varer'} i {activeCategory?.label}
            </p>
          </div>
        )}

        <div className={`${modalPad} py-6 md:py-8 space-y-5`}>
          {products.length > 0 && activeProduct ? (
            <div className="grid md:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)] gap-5 md:gap-7 items-start">
              <div
                className="relative rounded-3xl overflow-hidden"
                style={airTileStyle}
              >
                <div className="relative flex items-center justify-center min-h-[260px] md:min-h-[380px] p-5 md:p-7">
                  {products.length > 1 && (
                    <>
                      <button
                        type="button"
                        onClick={prev}
                        className="absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full flex items-center justify-center text-lg z-10 transition-all hover:scale-105"
                        style={{
                          color: WL.text,
                          background: 'rgba(255, 251, 244, 0.95)',
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
                          color: WL.text,
                          background: 'rgba(255, 251, 244, 0.95)',
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
                      className="max-h-[280px] md:max-h-[420px] w-auto max-w-full object-contain rounded-xl"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center gap-2 py-16">
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
                            border: `2px solid ${isActive ? WL.gold : WL.borderLight}`,
                            opacity: isActive ? 1 : 0.7,
                            boxShadow: isActive ? '0 2px 12px rgba(200,144,74,0.28)' : 'none',
                          }}
                        >
                          {p.imageUrl ? (
                            <img src={p.imageUrl} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div
                              className="w-full h-full flex items-center justify-center text-[10px]"
                              style={{ background: WL.skyAccentSoft, color: WL.textSoft }}
                            >
                              —
                            </div>
                          )}
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>

              <div className="space-y-4 md:pt-2">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <h3 className="wl-display text-xl leading-snug" style={{ color: WL.text }}>
                    {activeProduct.name}
                  </h3>
                  {activeProduct.price && (
                    <span
                      className="text-sm font-bold px-3 py-1 rounded-full flex-shrink-0"
                      style={{
                        color: WL.green,
                        background: 'rgba(200, 144, 74, 0.12)',
                        border: `1px solid ${WL.border}`,
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
                    className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-semibold text-white transition-all hover:opacity-90"
                    style={primaryBtnStyle}
                  >
                    Køb nu
                  </a>
                )}
              </div>
            </div>
          ) : (
            <div className="py-16 text-center">
              <p className="wl-display text-xl" style={{ color: WL.textOnModal }}>
                Ingen produkter i denne kategori endnu
              </p>
              <p className="text-sm mt-2" style={{ color: WL.textSoftOnModal }}>
                Vælg en anden kategori ovenfor
              </p>
            </div>
          )}

          {(coin.content?.sections ?? []).map((s, i) => (
            <div
              key={i}
              className="rounded-2xl p-4 mt-2"
              style={airTileStyle}
            >
              {s.heading && (
                <h4 className="wl-display text-base md:text-lg mb-1.5" style={{ color: WL.textOnModal }}>
                  {stripLeadingEmoji(s.heading)}
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
