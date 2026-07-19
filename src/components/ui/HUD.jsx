import React, { useEffect, useRef, useState } from 'react'
import useStore from '../../store/useStore'

/* Animated number that counts up when it enters view */
function AnimatedNumber({ target, suffix }) {
  const [display, setDisplay] = useState(0)
  const rafRef = useRef(null)

  useEffect(() => {
    const start = Date.now()
    const duration = 1400
    const from = 0
    const to = Number(target) || 0

    function tick() {
      const elapsed = Date.now() - start
      const t = Math.min(elapsed / duration, 1)
      // ease-out cubic
      const eased = 1 - Math.pow(1 - t, 3)
      setDisplay(Math.round(from + (to - from) * eased))
      if (t < 1) rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafRef.current)
  }, [target])

  return (
    <span>
      {display.toLocaleString('da-DK')}
      {suffix && <span className="ml-0.5 opacity-70 text-[0.75em]">{suffix}</span>}
    </span>
  )
}

function StatsBar({ visible }) {
  const stats = useStore((s) => s.stats)
  const activeStats = stats.filter((s) => s.value > 0 || s.alwaysShow)

  if (!visible || activeStats.length === 0) return null

  return (
    <div
      className="fixed bottom-10 left-1/2 -translate-x-1/2 z-30 flex items-center gap-0 pointer-events-none"
      style={{
        background: 'rgba(20,10,6,0.55)',
        border: '1px solid rgba(200,140,80,0.22)',
        backdropFilter: 'blur(10px)',
        borderRadius: '999px',
        padding: '6px 20px',
      }}
    >
      {activeStats.map((stat, i) => (
        <React.Fragment key={stat.id}>
          {i > 0 && (
            <span
              className="mx-4 opacity-25 select-none"
              style={{ color: '#c8904a', fontSize: '0.8em' }}
            >
              |
            </span>
          )}
          <div className="flex flex-col items-center">
            <span
              className="text-sm font-bold tabular-nums leading-none"
              style={{ color: '#f0c070' }}
            >
              <AnimatedNumber target={stat.value} suffix={stat.suffix} />
            </span>
            <span
              className="text-[9px] tracking-widest uppercase mt-0.5 leading-none opacity-60"
              style={{ color: '#e8b060' }}
            >
              {stat.label}
            </span>
          </div>
        </React.Fragment>
      ))}
    </div>
  )
}

export default function HUD() {
  const { isModalOpen, activeCoin, setActiveCoin, coins } = useStore()

  return (
    <>
      {/* ── Coin nav dots (left side, desktop) ── */}
      {!isModalOpen && (
        <nav className="fixed left-4 top-1/2 -translate-y-1/2 z-30 hidden md:flex flex-col gap-2.5">
          {coins.map((coin) => (
            <button
              key={coin.id}
              onClick={() => setActiveCoin(coin)}
              title={coin.subtitle}
              className="group relative flex items-center"
            >
              <span
                className="w-2 h-2 rounded-full transition-all duration-200 block"
                style={{
                  background: coin.color,
                  opacity: activeCoin?.id === coin.id ? 1 : 0.35,
                  transform: activeCoin?.id === coin.id ? 'scale(1.5)' : 'scale(1)',
                  boxShadow: `0 0 8px ${coin.color}`,
                }}
              />
              <span
                className="absolute left-5 whitespace-nowrap text-[10px] font-medium rounded px-1.5 py-0.5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
                style={{
                  background: 'rgba(0,0,0,0.65)',
                  color: coin.color,
                  backdropFilter: 'blur(6px)',
                }}
              >
                {coin.subtitle}
              </span>
            </button>
          ))}
        </nav>
      )}

      {/* ── Stats counter bar ── */}
      <StatsBar visible={!isModalOpen} />
    </>
  )
}
