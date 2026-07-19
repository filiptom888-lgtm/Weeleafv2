import React from 'react'
import useStore from '../../store/useStore'
import ShopModal from './ShopModal'
import CommunityModal from './CommunityModal'
import MemberModal from './MemberModal'
import FullscreenShell from './FullscreenShell'
import { WL, glassStyle } from '../../styles/modalTheme'

function ContentRenderer({ content, accent }) {
  return (
    <div className="space-y-6">
      {content.sections?.map((section, i) => (
        <section
          key={i}
          className="rounded-xl p-5 md:p-6"
          style={{
            background: 'rgba(255,255,255,0.55)',
            border: '1px solid rgba(255,255,255,0.65)',
          }}
        >
          {section.heading && (
            <h2
              className="text-base font-semibold mb-3 flex items-center gap-2"
              style={{ color: WL.textOnModal }}
            >
              <span
                className="w-1 h-5 rounded-full flex-shrink-0"
                style={{ background: accent }}
              />
              {section.heading}
            </h2>
          )}

          {section.text && (
            <p
              className="text-[15px] leading-7 whitespace-pre-line"
              style={{ color: WL.textMutedOnModal }}
            >
              {section.text}
            </p>
          )}

          {section.items && (
            <ul className="space-y-3 mt-1">
              {section.items.map((item, j) => (
                <li
                  key={j}
                  className="rounded-lg px-4 py-3"
                  style={{
                    background: 'rgba(255,255,255,0.7)',
                    borderLeft: `3px solid ${accent}`,
                  }}
                >
                  <div className="font-medium text-[15px]" style={{ color: WL.textOnModal }}>
                    {item.name}
                  </div>
                  <div className="text-sm mt-1 leading-relaxed" style={{ color: WL.textMutedOnModal }}>
                    {item.desc}
                  </div>
                  {item.link && (
                    <a
                      href={item.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block mt-2 text-sm font-medium"
                      style={{ color: WL.skyAccent }}
                    >
                      {item.link} ↗
                    </a>
                  )}
                </li>
              ))}
            </ul>
          )}

          {section.socials && (
            <ul className="rounded-xl overflow-hidden divide-y mt-1" style={{ border: `1px solid rgba(59,130,180,0.15)` }}>
              {section.socials.map((s, j) => (
                <li key={j}>
                  <a
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 px-4 py-3 hover:bg-white/60 transition-colors"
                  >
                    <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: s.color }} />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium" style={{ color: WL.textOnModal }}>{s.platform}</div>
                      <div className="text-sm" style={{ color: WL.textSoftOnModal }}>{s.handle}</div>
                    </div>
                    <span style={{ color: WL.skyAccent }}>→</span>
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
              className="inline-block text-sm font-semibold mt-2"
              style={{ color: WL.skyAccent }}
            >
              {section.link.text} →
            </a>
          )}

          {section.cta && (
            <a
              href={`mailto:${section.cta.email}`}
              className="inline-block mt-3 px-5 py-2.5 text-sm font-semibold rounded-full transition-opacity hover:opacity-90"
              style={{
                background: WL.skyAccent,
                color: '#fff',
                boxShadow: '0 4px 16px rgba(43,108,176,0.3)',
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

export default function Modal() {
  const { activeCoin, isModalOpen, closeModal, donationConfig } = useStore()

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
  const title = activeCoin.content?.title || activeCoin.subtitle
  const tagline = activeCoin.content?.tagline

  return (
    <FullscreenShell onClose={closeModal} contentClassName="max-w-3xl" headerLayout="none">
      <div className="rounded-2xl overflow-hidden" style={glassStyle}>
        <div
          className="px-6 md:px-10 pt-8 pb-6"
          style={{
            background: `linear-gradient(135deg, ${accent}18, rgba(255,255,255,0.5))`,
            borderBottom: '1px solid rgba(255,255,255,0.6)',
          }}
        >
          <p className="text-[10px] uppercase tracking-[0.22em] font-semibold mb-2" style={{ color: WL.skyAccent }}>
            WeeLeaf
          </p>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight" style={{ color: WL.textOnModal }}>
            {title}
          </h1>
          {tagline && (
            <p className="text-sm md:text-base mt-2 leading-relaxed" style={{ color: WL.textMutedOnModal }}>
              {tagline}
            </p>
          )}
        </div>

        <div className="px-6 md:px-10 py-7 md:py-8">
          <ContentRenderer content={activeCoin.content} accent={accent} />

          {activeCoin.id === 'donations' && (donationConfig.mobilepay || donationConfig.link || donationConfig.qrImageUrl) && (
            <section
              className="mt-8 pt-6 space-y-5 rounded-xl p-5"
              style={{ background: 'rgba(255,255,255,0.55)', border: '1px solid rgba(255,255,255,0.65)' }}
            >
              <h2 className="text-base font-semibold" style={{ color: WL.textOnModal }}>
                Betal nu
              </h2>

              {donationConfig.qrImageUrl && (
                <div className="flex flex-col items-start gap-2">
                  <img
                    src={donationConfig.qrImageUrl}
                    alt="MobilePay QR"
                    className="w-48 h-48 object-contain rounded-xl bg-white p-2"
                    style={{ border: `1px solid rgba(59,130,180,0.2)` }}
                  />
                  <p className="text-sm" style={{ color: WL.textSoftOnModal }}>Scan QR-koden med MobilePay</p>
                </div>
              )}

              {donationConfig.mobilepay && (
                <p className="text-[15px]" style={{ color: WL.textMutedOnModal }}>
                  MobilePay: <strong style={{ color: WL.textOnModal }}>{donationConfig.mobilepay}</strong>
                </p>
              )}

              {donationConfig.link && (
                <a
                  href={donationConfig.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block text-sm font-semibold"
                  style={{ color: WL.skyAccent }}
                >
                  Betal via MobilePay →
                </a>
              )}
            </section>
          )}
        </div>
      </div>
    </FullscreenShell>
  )
}
