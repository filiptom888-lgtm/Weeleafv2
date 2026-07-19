import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import useStore from '../../store/useStore'

/**
 * Brief crossfade veil during scene ↔ modal switches only.
 * Must stay below modals (z-40) and must not remain opaque while a modal is open.
 */
export default function SceneTransition() {
  const veilRef = useRef(null)
  const isModalOpen = useStore((s) => s.isModalOpen)
  const sceneRevealPhase = useStore((s) => s.sceneRevealPhase)
  const wasModalOpen = useRef(false)
  const tweenRef = useRef(null)

  useEffect(() => {
    const el = veilRef.current
    if (!el) return undefined

    tweenRef.current?.kill()

    if (isModalOpen && !wasModalOpen.current) {
      tweenRef.current = gsap
        .timeline()
        .to(el, { opacity: 0.75, duration: 0.2, ease: 'power2.in' })
        .to(el, { opacity: 0, duration: 0.28, ease: 'power2.out' })
    } else if (!isModalOpen && wasModalOpen.current && sceneRevealPhase === 'visible') {
      tweenRef.current = gsap
        .timeline()
        .to(el, { opacity: 0.55, duration: 0.18, ease: 'power2.in' })
        .to(el, { opacity: 0, duration: 0.42, ease: 'power2.out' })
    }

    wasModalOpen.current = isModalOpen

    return () => {
      tweenRef.current?.kill()
    }
  }, [isModalOpen, sceneRevealPhase])

  return (
    <div
      ref={veilRef}
      className="fixed inset-0 z-40 pointer-events-none"
      style={{
        opacity: 0,
        background:
          'radial-gradient(ellipse 100% 100% at 50% 40%, rgba(201,149,106,0.88) 0%, rgba(42,28,18,0.94) 100%)',
      }}
      aria-hidden
    />
  )
}
