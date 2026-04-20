import React, { useState, useEffect } from 'react'

export default function ScrollHint() {
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const hide = () => setVisible(false)
    window.addEventListener('wheel', hide, { once: true })
    window.addEventListener('touchmove', hide, { once: true })
    const t = setTimeout(hide, 6000)
    return () => {
      clearTimeout(t)
      window.removeEventListener('wheel', hide)
      window.removeEventListener('touchmove', hide)
    }
  }, [])

  if (!visible) return null

  return (
    <div
      className="fixed bottom-8 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center gap-2 pointer-events-none select-none"
      style={{ color: 'rgba(255,255,255,0.45)' }}
    >
      {/* Arrow hints */}
      <div className="flex items-center gap-4 text-sm tracking-widest font-light">
        <span style={{ animation: 'scrollPulse 1.4s ease-in-out infinite alternate' }}>‹</span>
        <span className="text-xs uppercase tracking-[0.25em]">scroll to orbit</span>
        <span style={{ animation: 'scrollPulse 1.4s ease-in-out infinite alternate-reverse' }}>›</span>
      </div>

      {/* Mouse icon */}
      <div
        className="w-7 h-11 rounded-full flex flex-col items-center pt-2 gap-1"
        style={{ border: '1.5px solid rgba(255,255,255,0.25)' }}
      >
        <div
          className="w-1 h-3 rounded-full"
          style={{
            background: 'rgba(255,255,255,0.5)',
            animation: 'scrollPulse 1.2s ease-in-out infinite',
          }}
        />
      </div>
    </div>
  )
}
