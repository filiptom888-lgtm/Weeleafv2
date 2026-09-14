import VantaBackground from './VantaBackground'
import { useGraphicsTier } from '../../hooks/useLiteGraphics'

/** Main-page backdrop — warm sunset clouds, CSS fallback on weak GPUs. */
export default function MainSceneBackground({ visible = true, paused = false }) {
  const tier = useGraphicsTier()
  const useVanta = tier === 'full'
  const vantaPaused = paused || !visible

  return (
    <div className="fixed inset-0 z-0" aria-hidden>
      <div className="absolute inset-0 sky-lite" />

      {useVanta && (
        <VantaBackground
          effect="clouds"
          preset="clouds"
          className="absolute inset-0"
          visible={visible}
          paused={vantaPaused}
        />
      )}

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
