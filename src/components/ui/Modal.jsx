import React, { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import useStore from '../../store/useStore'
import ShopModal from './ShopModal'
import CommunityModal from './CommunityModal'
import MemberModal from './MemberModal'
import { WL } from '../../styles/modalTheme'

/* ─── Content renderer ─────────────────────────────────────────────── */
function ContentRenderer({ content, accent }) {
  return (
    <div className="space-y-8">
      {content.sections?.map((section, i) => (
        <section key={i} className="space-y-3">
          {section.heading && (
            <h2
              className="text-lg font-semibold pb-2 border-b"
              style={{ color: WL.green, borderColor: WL.borderLight }}
            >
              {section.heading}
            </h2>
          )}

          {section.text && (
            <p
              className="text-[15px] leading-7 whitespace-pre-line"
              style={{ color: WL.textMuted }}
            >
              {section.text}
            </p>
          )}

          {section.items && (
            <ul className="space-y-4">
              {section.items.map((item, j) => (
                <li
                  key={j}
                  className="pl-4 rounded-r-lg py-1"
                  style={{ borderLeft: `3px solid ${accent}` }}
                >
                  <div className="font-medium" style={{ color: WL.text }}>{item.name}</div>
                  <div className="text-sm mt-1 leading-relaxed" style={{ color: WL.textMuted }}>
                    {item.desc}
                  </div>
                  {item.link && (
                    <a
                      href={item.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block mt-2 text-sm font-medium underline"
                      style={{ color: WL.greenBright }}
                    >
                      {item.link}
                    </a>
                  )}
                </li>
              ))}
            </ul>
          )}

          {section.socials && (
            <ul
              className="rounded-xl overflow-hidden divide-y"
              style={{ border: `1px solid ${WL.borderLight}`, background: WL.panelBgSolid }}
            >
              {section.socials.map((s, j) => (
                <li key={j}>
                  <a
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 px-4 py-3 hover:bg-amber-50/80 transition-colors"
                  >
                    <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: s.color }} />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium" style={{ color: WL.text }}>{s.platform}</div>
                      <div className="text-sm" style={{ color: WL.textSoft }}>{s.handle}</div>
                    </div>
                    <span style={{ color: WL.gold }}>→</span>
                  </a>
                </li>
              ))}
            </ul>
          )}

          {section.link && (
            <a
              href={section.link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block text-sm font-semibold underline"
              style={{ color: WL.greenBright }}
            >
              {section.link.text} →
            </a>
          )}

          {section.cta && (
            <a
              href={`mailto:${section.cta.email}`}
              className="inline-block px-5 py-2.5 text-sm font-semibold rounded-full transition-opacity hover:opacity-90"
              style={{
                background: `linear-gradient(135deg, ${WL.greenBright}, #4ade80)`,
                color: '#fff',
                boxShadow: '0 4px 16px rgba(61, 158, 95, 0.3)',
              }}
            >
              {section.cta.text}
            </a>
          )}
        </section>
      ))}
    </div>
  )
}

/* ─── Modal ──────────────────────────────────────────────────────────── */
export default function Modal() {
  const { activeCoin, isModalOpen, closeModal, donationConfig } = useStore()
  const panelRef = useRef()

  useEffect(() => {
    if (isModalOpen && panelRef.current) {
      gsap.fromTo(panelRef.current, { opacity: 0 }, { opacity: 1, duration: 0.3, ease: 'power2.out' })
    }
  }, [isModalOpen])

  const handleClose = () => {
    if (!panelRef.current) { closeModal(); return }
    gsap.to(panelRef.current, { opacity: 0, duration: 0.22, ease: 'power2.in', onComplete: closeModal })
  }

  if (!isModalOpen || !activeCoin) return null

  if (activeCoin.id === 'shop') {
    return <ShopModal coin={activeCoin} onClose={closeModal} />
  }

  if (activeCoin.id === 'community') {
    return <CommunityModal coin={activeCoin} onClose={closeModal} />
  }

  if (activeCoin.id === 'member') {
    return <MemberModal coin={activeCoin} onClose={closeModal} />
  }

  const accent = activeCoin.color

  return (
    <div
      ref={panelRef}
      className="fixed inset-0 z-50 flex flex-col min-h-0"
      style={{ background: WL.pageBg }}
    >
      {/* Warm accent strip */}
      <div className="h-1 flex-shrink-0" style={{ background: WL.accentBar }} />

      {/* Header */}
      <header
        className="flex-shrink-0 flex items-start justify-between gap-4 px-5 md:px-10 py-4 border-b backdrop-blur-sm"
        style={{ background: WL.headerBg, borderColor: WL.borderLight }}
      >
        <div className="min-w-0 pr-4">
          <p
            className="text-[10px] uppercase tracking-[0.25em] font-medium mb-1"
            style={{ color: WL.gold }}
          >
            WeeLeaf
          </p>
          <h1 className="text-xl md:text-2xl font-bold leading-tight" style={{ color: WL.text }}>
            {activeCoin.content?.title || activeCoin.subtitle}
          </h1>
          {activeCoin.content?.tagline && (
            <p className="text-sm mt-1.5 italic" style={{ color: WL.textSoft }}>
              {activeCoin.content.tagline}
            </p>
          )}
        </div>
        <button
          onClick={handleClose}
          className="flex-shrink-0 w-10 h-10 flex items-center justify-center text-xl rounded-full transition-all hover:scale-105"
          style={{
            color: WL.textMuted,
            background: 'rgba(255,255,255,0.7)',
            border: `1px solid ${WL.border}`,
          }}
          aria-label="Close"
        >
          ×
        </button>
      </header>

      {/* Content */}
      <main className="flex-1 overflow-y-auto min-h-0">
        <div className="max-w-3xl mx-auto px-4 md:px-8 py-8 md:py-10">
          <div
            className="rounded-2xl px-6 md:px-10 py-8 md:py-10"
            style={{
              background: WL.panelBg,
              border: `1px solid ${WL.borderLight}`,
              boxShadow: WL.shadow,
            }}
          >
            <ContentRenderer content={activeCoin.content} accent={accent} />

            {activeCoin.id === 'donations' && (donationConfig.mobilepay || donationConfig.link || donationConfig.qrImageUrl) && (
              <section className="mt-10 pt-8 space-y-5" style={{ borderTop: `1px solid ${WL.borderLight}` }}>
                <h2 className="text-lg font-semibold pb-2 border-b" style={{ color: WL.green, borderColor: WL.borderLight }}>
                  Betal nu
                </h2>

                {donationConfig.qrImageUrl && (
                  <div className="flex flex-col items-start gap-2">
                    <img
                      src={donationConfig.qrImageUrl}
                      alt="MobilePay QR"
                      className="w-48 h-48 object-contain rounded-xl bg-white p-2"
                      style={{ border: `1px solid ${WL.border}` }}
                    />
                    <p className="text-sm" style={{ color: WL.textSoft }}>Scan QR-koden med MobilePay</p>
                  </div>
                )}

                {donationConfig.mobilepay && (
                  <p className="text-[15px]" style={{ color: WL.textMuted }}>
                    MobilePay: <strong style={{ color: WL.text }}>{donationConfig.mobilepay}</strong>
                  </p>
                )}

                {donationConfig.link && (
                  <a
                    href={donationConfig.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block text-sm font-semibold underline"
                    style={{ color: WL.greenBright }}
                  >
                    Betal via MobilePay →
                  </a>
                )}
              </section>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
