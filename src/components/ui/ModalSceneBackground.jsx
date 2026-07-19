import { useEffect, useState } from 'react'
import useStore from '../../store/useStore'
import VantaBackground from './VantaBackground'
import { WL } from '../../styles/modalTheme'

function useLiteModalSky() {
  const [liteSky, setLiteSky] = useState(false)

  useEffect(() => {
    const pickLite = () => {
      const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      const narrow = window.innerWidth < 768
      const lowCpu = (navigator.hardwareConcurrency || 8) <= 4
      setLiteSky(reduced || narrow || lowCpu)
    }
    pickLite()
    window.addEventListener('resize', pickLite)
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    mq.addEventListener('change', pickLite)
    return () => {
      window.removeEventListener('resize', pickLite)
      mq.removeEventListener('change', pickLite)
    }
  }, [])

  return liteSky
}

/**
 * Single shared blue-sky layer for ALL popups — Vanta loads once, stays mounted.
 * Shown/hidden with opacity when any modal opens; no reload per popup.
 */
export default function ModalSceneBackground() {
  const isModalOpen = useStore((s) => s.isModalOpen)
  const modalScrollRoot = useStore((s) => s.modalScrollRoot)
  const liteSky = useLiteModalSky()
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (liteSky) return undefined
    const t = window.setTimeout(() => setReady(true), 1200)
    return () => window.clearTimeout(t)
  }, [liteSky])

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
        className={`absolute inset-0 ${liteSky ? 'modal-sky-lite' : ''}`}
        style={{ background: WL.modalBackdrop }}
      />
      {!liteSky && (
        <VantaBackground
          effect="clouds"
          preset="cloudsBlue"
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
            'linear-gradient(180deg, rgba(255,255,255,0.1) 0%, rgba(30,90,140,0.04) 100%)',
        }}
      />
    </div>
  )
}
