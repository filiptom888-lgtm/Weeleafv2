import React, { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import useStore from '../../store/useStore'
import { WL, pillHeaderStyle } from '../../styles/modalTheme'

const WIDTHS = {
  'max-w-7xl': 'max-w-7xl',
  'max-w-6xl': 'max-w-6xl',
  'max-w-5xl': 'max-w-5xl',
  'max-w-4xl': 'max-w-4xl',
  'max-w-3xl': 'max-w-3xl',
  'max-w-2xl': 'max-w-2xl',
  'max-w-lg': 'max-w-lg',
}

function CloseMark() {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" aria-hidden>
      <path
        d="M3.1 3.3c2.8 2.1 5.2 4.7 7.8 7.4"
        stroke="currentColor"
        strokeWidth="1.55"
        strokeLinecap="round"
      />
      <path
        d="M11 3.3c-2.8 2.1-5.3 4.7-7.9 7.4"
        stroke="currentColor"
        strokeWidth="1.55"
        strokeLinecap="round"
      />
    </svg>
  )
}

/**
 * Fullscreen overlay chrome — background is shared ModalSceneBackground in App.jsx.
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
  contentAlign = 'start',
}) {
  const uiRef = useRef()
  const scrollRef = useRef(null)
  const revealScene = useStore((s) => s.revealScene)
  const setModalScrollRoot = useStore((s) => s.setModalScrollRoot)

  useEffect(() => {
    setModalScrollRoot(scrollRef.current)
    return () => setModalScrollRoot(null)
  }, [setModalScrollRoot])

  useEffect(() => {
    if (uiRef.current) {
      gsap.fromTo(
        uiRef.current,
        { opacity: 0, y: 10 },
        { opacity: 1, y: 0, duration: 0.24, ease: 'power2.out', delay: 0.04 }
      )
    }
  }, [])

  const handleClose = () => {
    revealScene()
    if (!uiRef.current) {
      onClose()
      return
    }
    gsap.to(uiRef.current, {
      opacity: 0,
      y: 6,
      duration: 0.18,
      ease: 'power2.in',
      onComplete: onClose,
    })
  }

  const maxW = WIDTHS[contentClassName] || 'max-w-5xl'

  return (
    <div className="fixed inset-0 z-50 flex flex-col min-h-0 overflow-hidden pointer-events-none">
      <div ref={uiRef} className="relative flex flex-col h-full min-h-0 pointer-events-auto">
        <button
          type="button"
          onClick={handleClose}
          className="wl-close fixed top-4 right-4 z-[60]"
          aria-label="Luk"
        >
          <CloseMark />
        </button>

        {headerLayout === 'pill' && title && (
          <div className={`flex-shrink-0 px-3 sm:px-4 md:px-5 pt-5 pb-1 mx-auto w-full ${maxW}`}>
            <div
              className="inline-flex flex-col gap-0.5 max-w-[calc(100%-3rem)] rounded-3xl px-4 py-3 backdrop-blur-xl"
              style={pillHeaderStyle}
            >
              {eyebrow && <span className="wl-eyebrow">{eyebrow}</span>}
              <h1 className="wl-display text-xl md:text-2xl leading-tight" style={{ color: WL.text }}>
                {title}
              </h1>
              {tagline && (
                <p className="wl-tagline text-sm md:text-base leading-snug mt-0.5" style={{ color: WL.textMuted }}>
                  {tagline}
                </p>
              )}
            </div>
            {headerExtra}
          </div>
        )}

        <main ref={scrollRef} className="flex-1 overflow-y-auto min-h-0">
          <div
            className={`mx-auto w-full px-3 sm:px-4 md:px-5 ${
              headerLayout === 'pill' ? 'py-4 md:py-5' : 'py-5 md:py-6'
            } ${contentClassName} ${
              contentAlign === 'center' ? 'min-h-full flex flex-col justify-center' : ''
            }`}
          >
            {children}
          </div>
        </main>

        {footer && (
          <footer
            className="flex-shrink-0 border-t backdrop-blur-xl"
            style={{
              background: 'rgba(255, 251, 244, 0.88)',
              borderColor: WL.borderLight,
            }}
          >
            {footer}
          </footer>
        )}
      </div>
    </div>
  )
}
