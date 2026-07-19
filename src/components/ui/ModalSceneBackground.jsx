import { useEffect, useState } from 'react'
import useStore from '../../store/useStore'
import VantaBackground from './VantaBackground'
import { WL } from '../../styles/modalTheme'
import { useGraphicsTier } from '../../hooks/useLiteGraphics'

/**
 * Shared warm-sky layer for all popups — Vanta loads once, stays mounted.
 * Falls back to CSS gradient on low-GPU / older PCs.
 */
export default function ModalSceneBackground() {
  const isModalOpen = useStore((s) => s.isModalOpen)
  const modalScrollRoot = useStore((s) => s.modalScrollRoot)
  const tier = useGraphicsTier()
  const useVanta = tier === 'full'
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (!useVanta) return undefined
    const t = window.setTimeout(() => setReady(true), 1200)
    return () => window.clearTimeout(t)
  }, [useVanta])

  return (
    <div
      className="fixed inset-0 z-[48] pointer-events-none"
      style={{
        opacity: isModalOpen ? 1 : 0,
        visibility: isModalOpen ? 'visible' : 'hidden',
        transition: 'opacity 0.22s ease-out, visibility 0.22s ease-out',
      }}
      aria-hidden={!isModalOpen}
    >
      <div
        className={`absolute inset-0 ${!useVanta ? 'sky-lite modal-sky-lite' : ''}`}
        style={{ background: WL.modalBackdrop }}
      />
      {useVanta && (
        <VantaBackground
          effect="clouds"
          preset="cloudsLight"
          enabled={ready}
          persistent
          paused={!isModalOpen}
          pauseOnScrollEl={modalScrollRoot}
        />
      )}
      <div
        className="absolute inset-0 z-[2]"
        style={{
          background:
            'linear-gradient(180deg, rgba(255,255,255,0.12) 0%, rgba(200, 144, 74, 0.06) 100%)',
        }}
      />
    </div>
  )
}
