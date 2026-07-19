import { useEffect, useRef } from 'react'
import * as THREE from 'three'

const LOADERS = {
  clouds: () => import('vanta/dist/vanta.clouds.min'),
  birds: () => import('vanta/dist/vanta.birds.min'),
}

/** Delay init so prior WebGL contexts (R3F) can release first */
const INIT_DELAY_MS = { clouds: 0, birds: 350, cloudsBlue: 160 }

/** WeeLeaf-tuned palettes — see https://www.vantajs.com */
export const VANTA_PRESETS = {
  /** Main page — warm sunset clouds */
  clouds: {
    mouseControls: true,
    touchControls: true,
    gyroControls: false,
    minHeight: 200,
    minWidth: 200,
    skyColor: 0xc9956a,
    cloudColor: 0xf8ead8,
    cloudShadowColor: 0x4a3020,
    sunColor: 0xffb84d,
    sunGlareColor: 0xff8f3f,
    sunlightColor: 0xffd080,
    speed: 0.7,
  },
  /** Fullscreen modals — classic blue sky */
  cloudsBlue: {
    mouseControls: true,
    touchControls: true,
    gyroControls: false,
    minHeight: 200,
    minWidth: 200,
    skyColor: 0x68b8eb,
    cloudColor: 0xffffff,
    cloudShadowColor: 0x2a7ab8,
    sunColor: 0xffe9a8,
    sunGlareColor: 0xffd060,
    sunlightColor: 0xfff8e0,
    speed: 0.85,
  },
  birds: {
    mouseControls: true,
    touchControls: true,
    gyroControls: false,
    minHeight: 200,
    minWidth: 200,
    scale: 1.0,
    scaleMobile: 1.0,
    backgroundColor: 0xc9956a,
    backgroundAlpha: 0,
    color1: 0x1a1208,
    color2: 0xfff5e8,
    colorMode: 'variance',
    birdSize: 1.35,
    wingSpan: 32,
    speedLimit: 4,
    separation: 20,
    alignment: 20,
    cohesion: 20,
    quantity: 5,
  },
}

function cleanupEl(el) {
  if (!el) return
  while (el.firstChild) {
    el.removeChild(el.firstChild)
  }
}

export default function VantaBackground({
  effect = 'clouds',
  preset,
  className = '',
  style = {},
  options = {},
  enabled = true,
  visible = true,
}) {
  const elRef = useRef(null)
  const vantaRef = useRef(null)
  const presetKey = preset || effect

  useEffect(() => {
    if (!enabled) return undefined

    let cancelled = false
    const loader = LOADERS[effect]
    if (!loader) return undefined

    const delay = INIT_DELAY_MS[presetKey] ?? INIT_DELAY_MS[effect] ?? 0
    const timer = window.setTimeout(() => {
      ;(async () => {
        try {
          const mod = await loader()
          const VantaEffect = mod.default || mod
          if (cancelled || !elRef.current) return
          vantaRef.current = VantaEffect({
            el: elRef.current,
            THREE,
            ...(VANTA_PRESETS[presetKey] || VANTA_PRESETS[effect] || {}),
            ...options,
          })
        } catch (err) {
          console.warn('[VantaBackground]', effect, err)
        }
      })()
    }, delay)

    return () => {
      cancelled = true
      window.clearTimeout(timer)
      if (vantaRef.current) {
        try {
          vantaRef.current.destroy()
        } catch (_) {}
        vantaRef.current = null
      }
      cleanupEl(elRef.current)
    }
  }, [effect, presetKey, enabled])

  if (!enabled) return null

  return (
    <div
      ref={elRef}
      className={className}
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 1,
        opacity: visible ? 1 : 0,
        visibility: visible ? 'visible' : 'hidden',
        transition: 'opacity 0.45s ease-out, visibility 0.45s ease-out',
        ...style,
      }}
      aria-hidden
    />
  )
}
