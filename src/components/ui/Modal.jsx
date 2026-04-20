import React, { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import useStore from '../../store/useStore'

/* ─── Content renderer ───────────────────────────────────────────────── */
function ContentRenderer({ content }) {
  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="pb-4 border-b border-white/15">
        <h2 className="text-2xl font-bold text-white tracking-tight">{content.title}</h2>
        <p className="mt-1 text-sm font-medium italic" style={{ color: '#86efac' }}>
          {content.tagline}
        </p>
      </div>

      {/* Sections */}
      {content.sections.map((section, i) => (
        <div key={i} className="space-y-3">
          <h3 className="text-base font-semibold text-white/90">{section.heading}</h3>

          {section.text && (
            <p className="text-sm leading-relaxed text-white/70">{section.text}</p>
          )}

          {section.items && (
            <div className="grid gap-2">
              {section.items.map((item, j) => (
                <div
                  key={j}
                  className="flex gap-3 p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/8 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-white/90">{item.name}</div>
                    <div className="text-xs text-white/55 mt-0.5 leading-snug">{item.desc}</div>
                    {item.link && (
                      <a
                        href={item.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-block mt-1 text-xs underline transition-colors"
                        style={{ color: '#86efac' }}
                      >
                        Visit ↗
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {section.socials && (
            <div className="grid gap-2">
              {section.socials.map((s, j) => (
                <a
                  key={j}
                  href={s.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/12 transition-colors group"
                >
                  <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: s.color }} />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-white/90">{s.platform}</div>
                    <div className="text-xs text-white/50">{s.handle}</div>
                  </div>
                  <span className="text-white/30 group-hover:text-white/70 transition-colors text-sm">↗</span>
                </a>
              ))}
            </div>
          )}

          {section.link && (
            <a
              href={section.link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium border transition-all hover:opacity-90"
              style={{
                background: 'rgba(74,222,128,0.15)',
                borderColor: 'rgba(74,222,128,0.35)',
                color: '#86efac',
              }}
            >
              {section.link.text} ↗
            </a>
          )}

          {section.cta && (
            <a
              href={`mailto:${section.cta.email}`}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold text-white border transition-all hover:opacity-90"
              style={{
                background: 'linear-gradient(135deg, rgba(74,222,128,0.25), rgba(16,185,129,0.2))',
                borderColor: 'rgba(74,222,128,0.4)',
              }}
            >
              {section.cta.text}
            </a>
          )}
        </div>
      ))}
    </div>
  )
}

/* ─── Modal ──────────────────────────────────────────────────────────── */
export default function Modal() {
  const { activeCoin, isModalOpen, closeModal } = useStore()
  const overlayRef = useRef()
  const panelRef = useRef()

  useEffect(() => {
    if (isModalOpen && overlayRef.current && panelRef.current) {
      gsap.fromTo(overlayRef.current, { opacity: 0 }, { opacity: 1, duration: 0.3, ease: 'power2.out' })
      gsap.fromTo(
        panelRef.current,
        { opacity: 0, scale: 0.88, y: 24 },
        { opacity: 1, scale: 1, y: 0, duration: 0.45, ease: 'back.out(1.6)' }
      )
    }
  }, [isModalOpen])

  const handleClose = () => {
    if (!overlayRef.current || !panelRef.current) { closeModal(); return }
    gsap.to(panelRef.current, { opacity: 0, scale: 0.9, y: 16, duration: 0.22, ease: 'power2.in' })
    gsap.to(overlayRef.current, { opacity: 0, duration: 0.28, ease: 'power2.in', onComplete: closeModal })
  }

  if (!isModalOpen || !activeCoin) return null

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8"
      style={{ background: 'rgba(0,0,0,0.55)' }}
      onClick={(e) => e.target === e.currentTarget && handleClose()}
    >
      <div
        ref={panelRef}
        className="relative w-full max-w-lg rounded-2xl overflow-hidden"
        style={{
          maxHeight: '82vh',
          background: 'rgba(6,22,14,0.80)',
          backdropFilter: 'blur(28px)',
          WebkitBackdropFilter: 'blur(28px)',
          border: `1px solid ${activeCoin.color}35`,
          boxShadow: `0 0 80px ${activeCoin.color}18, 0 24px 80px rgba(0,0,0,0.6)`,
        }}
      >
        {/* Colour accent bar */}
        <div
          className="h-[3px] w-full"
          style={{ background: `linear-gradient(90deg, ${activeCoin.color}, ${activeCoin.emissiveColor}, transparent)` }}
        />

        {/* Close */}
        <button
          onClick={handleClose}
          className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition-all text-xl leading-none"
          aria-label="Close"
        >
          ×
        </button>

        {/* Scrollable body */}
        <div
          className="overflow-y-auto px-6 py-6"
          style={{ maxHeight: 'calc(82vh - 3px)' }}
        >
          <ContentRenderer content={activeCoin.content} />
        </div>
      </div>
    </div>
  )
}
