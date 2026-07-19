import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import useStore from '../../store/useStore'

/**
 * Soft crossfade veil between main scene and fullscreen modals.
 * Scene stays mounted underneath — this hides the pop-in while WebGL/Vanta settle.
 */
export default function SceneTransition() {
  const veilRef = useRef(null)
  const isModalOpen = useStore((s) => s.isModalOpen)
  const sceneRevealPhase = useStore((s) => s.sceneRevealPhase)
  const wasModalOpen = useRef(false)

  useEffect(() => {
    const el = veilRef.current
    if (!el) return

    if (isModalOpen && !wasModalOpen.current) {
      gsap.to(el, { opacity: 1, duration: 0.32, ease: 'power2.inOut' })
    }

    if (!isModalOpen && wasModalOpen.current && sceneRevealPhase === 'visible') {
      gsap.to(el, { opacity: 0, duration: 0.55, ease: 'power2.out', delay: 0.05 })
    }

    wasModalOpen.current = isModalOpen
  }, [isModalOpen, sceneRevealPhase])

  return (
    <div
      ref={veilRef}
      className="fixed inset-0 z-[45] pointer-events-none"
      style={{
        opacity: 0,
        background:
          'radial-gradient(ellipse 100% 100% at 50% 40%, rgba(201,149,106,0.92) 0%, rgba(42,28,18,0.96) 100%)',
      }}
      aria-hidden
    />
  )
}
