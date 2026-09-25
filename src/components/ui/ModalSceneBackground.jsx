import useStore from '../../store/useStore'
import SoftClouds from './SoftClouds'

/** Shared warm-sky layer for popups. Same CSS clouds as the main page. */
export default function ModalSceneBackground() {
  const isModalOpen = useStore((s) => s.isModalOpen)

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
      <SoftClouds paused={!isModalOpen} className="absolute inset-0" />
      <div
        className="absolute inset-0 z-[2]"
        style={{
          background:
            'linear-gradient(180deg, rgba(255, 214, 170, 0.06) 0%, rgba(200, 140, 80, 0.08) 100%)',
        }}
      />
    </div>
  )
}
