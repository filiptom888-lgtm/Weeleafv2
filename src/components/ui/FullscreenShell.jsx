import React, { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import useStore from '../../store/useStore'
import { WL } from '../../styles/modalTheme'

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

  const maxW =
    contentClassName === 'max-w-7xl'
      ? 'max-w-7xl'
      : contentClassName === 'max-w-5xl'
        ? 'max-w-5xl'
        : contentClassName === 'max-w-3xl'
          ? 'max-w-3xl'
          : contentClassName === 'max-w-lg'
            ? 'max-w-lg'
            : 'max-w-5xl'

  return (
    <div className="fixed inset-0 z-50 flex flex-col min-h-0 overflow-hidden pointer-events-none">
      <div ref={uiRef} className="relative flex flex-col h-full min-h-0 pointer-events-auto">
        <button
          type="button"
          onClick={handleClose}
          className="fixed top-4 right-4 z-[60] w-10 h-10 flex items-center justify-center text-lg rounded-full transition-all hover:scale-105 hover:bg-white"
          style={{
            color: '#1a2e3a',
            background: 'rgba(255,255,255,0.88)',
            border: '1px solid rgba(255,255,255,0.55)',
            boxShadow: '0 4px 20px rgba(30,90,140,0.18)',
          }}
          aria-label="Close"
        >
          ×
        </button>

        {headerLayout === 'pill' && title && (
          <div className={`flex-shrink-0 px-3 sm:px-4 md:px-5 pt-5 pb-1 mx-auto w-full ${maxW}`}>
            <div
              className="inline-flex flex-col gap-0.5 max-w-[calc(100%-3rem)] rounded-2xl px-4 py-3 backdrop-blur-xl"
              style={{
                background: 'rgba(255, 255, 255, 0.82)',
                border: '1px solid rgba(255, 255, 255, 0.55)',
                boxShadow: '0 8px 32px rgba(30,90,140,0.1)',
              }}
            >
              {eyebrow && (
                <span className="text-[10px] uppercase tracking-[0.22em] font-semibold" style={{ color: WL.skyAccent }}>
                  {eyebrow}
                </span>
              )}
              <h1 className="text-lg md:text-xl font-bold leading-tight tracking-tight text-[#1a2e3a]">
                {title}
              </h1>
              {tagline && (
                <p className="text-xs md:text-sm leading-snug text-[rgba(26,46,58,0.75)]">{tagline}</p>
              )}
            </div>
            {headerExtra}
          </div>
        )}

        <main ref={scrollRef} className="flex-1 overflow-y-auto min-h-0">
          <div
            className={`mx-auto w-full px-3 sm:px-4 md:px-5 ${
              headerLayout === 'pill' ? 'py-4 md:py-5' : 'py-5 md:py-6'
            } ${contentClassName}`}
          >
            {children}
          </div>
        </main>

        {footer && (
          <footer
            className="flex-shrink-0 border-t backdrop-blur-xl"
            style={{
              background: 'rgba(255, 255, 255, 0.82)',
              borderColor: 'rgba(255, 255, 255, 0.55)',
            }}
          >
            {footer}
          </footer>
        )}
      </div>
    </div>
  )
}
