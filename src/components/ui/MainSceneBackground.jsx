import SoftClouds from './SoftClouds'

/** Main-page backdrop — CSS sunset sky and soft drifting clouds. */
export default function MainSceneBackground({ paused = false }) {
  return (
    <div className="fixed inset-0 z-0" aria-hidden>
      <SoftClouds paused={paused} className="absolute inset-0" />
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          zIndex: 3,
          background:
            'radial-gradient(ellipse 90% 75% at 50% 50%, transparent 42%, rgba(180, 110, 60, 0.08) 100%)',
        }}
      />
    </div>
  )
}
