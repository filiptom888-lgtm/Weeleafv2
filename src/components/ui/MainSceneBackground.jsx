import VantaBackground from './VantaBackground'

/**
 * Layered main-page backdrop: warm clouds + bird flock on top.
 */
export default function MainSceneBackground({ visible = true }) {
  return (
    <div className="fixed inset-0 z-0" aria-hidden>
      <VantaBackground effect="clouds" preset="clouds" className="absolute inset-0" visible={visible} />

      <VantaBackground
        effect="birds"
        preset="birds"
        className="absolute inset-0"
        style={{ zIndex: 2, pointerEvents: 'none' }}
        visible={visible}
      />

      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          zIndex: 3,
          background:
            'radial-gradient(ellipse 90% 75% at 50% 50%, transparent 45%, rgba(26, 16, 8, 0.1) 100%)',
        }}
      />
    </div>
  )
}
