import React from 'react'
import useStore from '../../store/useStore'
import ShopModal from './ShopModal'
import CommunityModal from './CommunityModal'
import MemberModal from './MemberModal'
import FullscreenShell from './FullscreenShell'
import { WL, airGlassStyle, modalPad, airTileStyle, primaryBtnStyle } from '../../styles/modalTheme'
import { stripLeadingEmoji } from '../../utils/text'

function ContentRenderer({ content, accent }) {
  return (
    <div className="space-y-10">
      {content.sections?.map((section, i) => (
        <section
          key={i}
          className={i > 0 ? 'pt-8 border-t' : ''}
          style={i > 0 ? { borderColor: WL.borderLight } : undefined}
        >
          {section.heading && (
            <h2
              className="wl-display text-xl md:text-[1.45rem] mb-3 leading-snug"
              style={{ color: WL.textOnModal }}
            >
              {stripLeadingEmoji(section.heading)}
            </h2>
          )}

          {section.text && (
            <p
              className="text-[15px] md:text-base leading-7 whitespace-pre-line max-w-prose"
              style={{ color: WL.textMutedOnModal }}
            >
              {section.text}
            </p>
          )}

          {section.items && (
            <ul
              className={`grid grid-cols-1 md:grid-cols-2 gap-3 ${section.text ? 'mt-5' : 'mt-2'}`}
            >
              {section.items.map((item, j) => (
                <li key={j} className="rounded-2xl px-4 py-3.5" style={airTileStyle}>
                  <div className="wl-display text-[1.05rem]" style={{ color: WL.textOnModal }}>
                    {item.name}
                  </div>
                  <div className="text-sm mt-1.5 leading-relaxed" style={{ color: WL.textMutedOnModal }}>
                    {item.desc}
                  </div>
                  {item.link && (
                    <a
                      href={item.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block mt-2 text-sm font-medium"
                      style={{ color: WL.green }}
                    >
                      {item.link}
                    </a>
                  )}
                </li>
              ))}
            </ul>
          )}

          {section.socials && (
            <ul className="flex flex-wrap gap-2.5 mt-3">
              {section.socials.map((s, j) => (
                <li key={j}>
                  <a
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2.5 rounded-full px-4 py-2.5 transition-opacity hover:opacity-90"
                    style={airTileStyle}
                  >
                    <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: s.color }} />
                    <span className="text-sm font-semibold" style={{ color: WL.textOnModal }}>
                      {s.platform}
                    </span>
                    <span className="text-sm" style={{ color: WL.textSoftOnModal }}>
                      {s.handle}
                    </span>
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
              className="inline-block text-sm font-semibold mt-3"
              style={{ color: WL.green }}
            >
              {section.link.text}
            </a>
          )}

          {section.cta && (
            <a
              href={`mailto:${section.cta.email}`}
              className="inline-block mt-4 px-6 py-2.5 text-sm font-semibold rounded-full transition-opacity hover:opacity-90"
              style={{
                ...primaryBtnStyle,
                background: accent || primaryBtnStyle.background,
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
    <FullscreenShell onClose={closeModal} contentClassName="max-w-5xl" headerLayout="none">
      <div className="w-full rounded-[1.85rem] overflow-hidden wl-paper" style={airGlassStyle}>
        <div
          className={`${modalPad} pt-7 pb-6 md:pt-8 md:pb-7`}
          style={{
            background: 'rgba(255, 248, 238, 0.16)',
            borderBottom: `1px solid ${WL.borderLight}`,
          }}
        >
          <div
            className="h-1 w-16 rounded-full mb-4"
            style={{ background: `linear-gradient(90deg, ${accent}, ${WL.gold})` }}
          />
          <p className="wl-eyebrow mb-3">WeeLeaf</p>
          <h1
            className="wl-display text-[2rem] md:text-[2.75rem] leading-[1.12] max-w-3xl"
            style={{ color: WL.textOnModal }}
          >
            {stripLeadingEmoji(title)}
          </h1>
          {tagline && (
            <p
              className="wl-tagline text-base md:text-xl mt-3 leading-relaxed max-w-2xl"
              style={{ color: WL.textMutedOnModal }}
            >
              {tagline}
            </p>
          )}
        </div>

        <div className={`${modalPad} py-7 md:py-9`}>
          <ContentRenderer content={activeCoin.content} accent={accent} />

          {activeCoin.id === 'donations' && (donationConfig.mobilepay || donationConfig.link || donationConfig.qrImageUrl) && (
            <section
              className="mt-10 pt-8 space-y-5 border-t"
              style={{ borderColor: WL.borderLight }}
            >
              <h2 className="text-lg font-semibold" style={{ color: WL.textOnModal }}>
                Betal nu
              </h2>

              {donationConfig.qrImageUrl && (
                <div className="inline-flex flex-col items-start gap-2 rounded-2xl p-4" style={airTileStyle}>
                  <img
                    src={donationConfig.qrImageUrl}
                    alt="MobilePay QR"
                    className="w-48 h-48 object-contain rounded-xl bg-white p-2"
                  />
                  <p className="text-sm" style={{ color: WL.textSoftOnModal }}>
                    Scan QR-koden med MobilePay
                  </p>
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
                  style={{ color: WL.green }}
                >
                  Betal via MobilePay
                </a>
              )}
            </section>
          )}
        </div>
      </div>
    </FullscreenShell>
  )
}
