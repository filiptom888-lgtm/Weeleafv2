import React, { useEffect, useRef, useState } from 'react'
import { gsap } from 'gsap'
import VantaBackground from './VantaBackground'
import { WL } from '../../styles/modalTheme'

/**
 * Fullscreen overlay — Vanta blue-sky clouds + modern floating chrome.
 * headerLayout: 'pill' (default) | 'none' (title lives in children)
 */
export default function FullscreenShell({
  eyebrow = 'WeeLeaf',
  title,
  tagline,
  onClose,
  children,
  footer,
  headerExtra,
  contentClassName = 'max-w-4xl',
  headerLayout = 'pill',
}) {
  const uiRef = useRef()
  const [vantaReady, setVantaReady] = useState(false)

  useEffect(() => {
    const t = window.setTimeout(() => setVantaReady(true), 80)
    return () => {
      window.clearTimeout(t)
      setVantaReady(false)
    }
  }, [])

  useEffect(() => {
    if (uiRef.current) {
      gsap.fromTo(
        uiRef.current,
        { opacity: 0, y: 12 },
        { opacity: 1, y: 0, duration: 0.32, ease: 'power2.out', delay: 0.08 }
      )
    }
  }, [])

  const handleClose = () => {
    if (!uiRef.current) {
      onClose()
      return
    }
    gsap.to(uiRef.current, {
      opacity: 0,
      y: 6,
      duration: 0.16,
      ease: 'power2.in',
      onComplete: onClose,
    })
  }

  const maxW = contentClassName === 'max-w-7xl' ? 'max-w-7xl' : contentClassName === 'max-w-5xl' ? 'max-w-5xl' : 'max-w-5xl'

  return (
    <div className="fixed inset-0 z-50 flex flex-col min-h-0 overflow-hidden">
      <div className="absolute inset-0 z-0" style={{ background: WL.modalBackdrop }} />
      <VantaBackground effect="clouds" preset="cloudsBlue" enabled={vantaReady} />
      <div
        className="absolute inset-0 z-[2] pointer-events-none"
        style={{
          background:
            'linear-gradient(180deg, rgba(255,255,255,0.1) 0%, rgba(30,90,140,0.04) 100%)',
        }}
      />

      <div ref={uiRef} className="relative z-10 flex flex-col h-full min-h-0">
        {/* Floating close */}
        <button
          type="button"
          onClick={handleClose}
          className="fixed top-4 right-4 z-[60] w-10 h-10 flex items-center justify-center text-lg rounded-full transition-all hover:scale-105 hover:bg-white"
          style={{
            color: WL.textOnModal,
            background: 'rgba(255,255,255,0.88)',
            border: `1px solid ${WL.modalHeaderBorder}`,
            boxShadow: '0 4px 20px rgba(30,90,140,0.18)',
          }}
          aria-label="Close"
        >
          ×
        </button>

        {headerLayout === 'pill' && title && (
          <div className={`flex-shrink-0 px-4 md:px-8 pt-5 pb-1 mx-auto w-full ${maxW}`}>
            <div
              className="inline-flex flex-col gap-0.5 max-w-[calc(100%-3rem)] rounded-2xl px-4 py-3 backdrop-blur-xl"
              style={{
                background: WL.modalHeaderGlass,
                border: `1px solid ${WL.modalHeaderBorder}`,
                boxShadow: '0 8px 32px rgba(30,90,140,0.1)',
              }}
            >
              {eyebrow && (
                <span
                  className="text-[10px] uppercase tracking-[0.22em] font-semibold"
                  style={{ color: WL.skyAccent }}
                >
                  {eyebrow}
                </span>
              )}
              <h1
                className="text-lg md:text-xl font-bold leading-tight tracking-tight"
                style={{ color: WL.textOnModal }}
              >
                {title}
              </h1>
              {tagline && (
                <p className="text-xs md:text-sm leading-snug" style={{ color: WL.textMutedOnModal }}>
                  {tagline}
                </p>
              )}
            </div>
            {headerExtra}
          </div>
        )}

        <main className="flex-1 overflow-y-auto min-h-0">
          <div
            className={`mx-auto px-4 md:px-8 ${
              headerLayout === 'pill' ? 'py-4 md:py-5' : 'py-6 md:py-8'
            } ${contentClassName}`}
          >
            {children}
          </div>
        </main>

        {footer && (
          <footer
            className="flex-shrink-0 border-t backdrop-blur-xl"
            style={{
              background: WL.modalHeaderGlass,
              borderColor: WL.modalHeaderBorder,
            }}
          >
            {footer}
          </footer>
        )}
      </div>
    </div>
  )
}
