import React from 'react'
import useStore from '../../store/useStore'

export default function HUD() {
  const { isModalOpen, activeCoin, setActiveCoin, coins, toggleAdmin } = useStore()

  return (
    <>
      {/* ── Top navigation bar ── */}
      <header
        className="fixed top-0 left-0 right-0 z-30 flex items-center justify-between px-5 py-4 pointer-events-none"
        style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.35) 0%, transparent 100%)' }}
      >
        {/* Logo */}
        <div className="flex items-center gap-2.5 pointer-events-auto">
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center"
            style={{ border: '2px solid rgba(74,222,128,0.65)', background: 'rgba(74,222,128,0.1)' }}
          >
            <span className="text-green-400 text-xs font-bold tracking-wider">WL</span>
          </div>
          <div>
            <div className="text-white font-semibold text-sm tracking-wide leading-none">WeeLeaf</div>
            <div className="text-green-400/60 text-[9px] tracking-widest uppercase leading-none mt-0.5">
              Sustainable Movement
            </div>
          </div>
        </div>

        {/* Tagline — desktop only */}
        <div className="hidden md:block text-center pointer-events-none">
          <p className="text-white/35 text-[10px] tracking-[0.3em] uppercase">
            Where nature meets technology
          </p>
        </div>

        {/* Contact link */}
        <a
          href="mailto:wl@weeleaf.com"
          className="pointer-events-auto text-[11px] tracking-wide transition-colors"
          style={{ color: 'rgba(134,239,172,0.7)' }}
          onMouseEnter={(e) => (e.target.style.color = '#86efac')}
          onMouseLeave={(e) => (e.target.style.color = 'rgba(134,239,172,0.7)')}
        >
          wl@weeleaf.com
        </a>
      </header>

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

      {/* ── Admin button ── */}
      <button
        onClick={toggleAdmin}
        className="fixed top-4 left-1/2 -translate-x-1/2 z-30 text-[10px] tracking-widest uppercase px-3 py-1.5 rounded-full border transition-all hover:opacity-100 opacity-30 hover:opacity-80"
        style={{
          color: 'rgba(134,239,172,0.9)',
          borderColor: 'rgba(74,222,128,0.3)',
          background: 'rgba(0,0,0,0.3)',
          backdropFilter: 'blur(8px)',
        }}
      >
        ⚙ Admin
      </button>

      {/* ── Bottom center — coin count ── */}
      {!isModalOpen && (
        <div
          className="fixed bottom-4 left-1/2 -translate-x-1/2 z-30 text-[10px] tracking-widest uppercase pointer-events-none"
          style={{ color: 'rgba(255,255,255,0.3)' }}
        >
          {coins.length} nodes orbiting
        </div>
      )}
    </>
  )
}
