import { useEffect, useRef } from 'react'
import * as THREE from 'three'

const LOADERS = {
  clouds: () => import('vanta/dist/vanta.clouds.min'),
}

const INIT_DELAY_MS = { clouds: 0, cloudsLight: 120 }

/** WeeLeaf-tuned palettes — see https://www.vantajs.com */
export const VANTA_PRESETS = {
  /** Main page — warm sunset clouds */
  clouds: {
    mouseControls: true,
    touchControls: true,
    gyroControls: false,
    mouseEase: true,
    minHeight: 200,
    minWidth: 200,
    speed: 0.65,
    scale: 3.2,
    scaleMobile: 10,
    skyColor: 0xc9956a,
    cloudColor: 0xf8ead8,
    cloudShadowColor: 0x4a3020,
    sunColor: 0xffb84d,
    sunGlareColor: 0xff8f3f,
    sunlightColor: 0xffd080,
  },
  /**
   * Modal popups — same warm palette as main page, but lighter and softer.
   * No mouse parallax; higher scale = fewer pixels (performance).
   */
  cloudsLight: {
    mouseControls: false,
    touchControls: false,
    gyroControls: false,
    mouseEase: false,
    minHeight: 200,
    minWidth: 200,
    speed: 0.38,
    scale: 6,
    scaleMobile: 16,
    skyColor: 0xedd4b0,
    cloudColor: 0xfffbf5,
    cloudShadowColor: 0xc9a080,
    sunColor: 0xffd99a,
    sunGlareColor: 0xffc878,
    sunlightColor: 0xfff0c8,
  },
}

function cleanupEl(el) {
  if (!el) return
  while (el.firstChild) {
    el.removeChild(el.firstChild)
  }
}

/** Pause WebGL loop while a scrollable modal body is moving */
function usePauseOnScroll(scrollTarget, vantaRef) {
  useEffect(() => {
    const el = scrollTarget?.current ?? scrollTarget
    if (!el) return undefined

    let resumeTimer
    const pause = () => {
      const v = vantaRef.current
      if (v?.req) {
        cancelAnimationFrame(v.req)
        v.req = null
      }
    }
    const resume = () => {
      clearTimeout(resumeTimer)
      resumeTimer = window.setTimeout(() => {
        const v = vantaRef.current
        if (v && !v.req) v.animationLoop()
      }, 120)
    }

    const onScroll = () => {
      pause()
      resume()
    }

    el.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      clearTimeout(resumeTimer)
      el.removeEventListener('scroll', onScroll)
    }
  }, [scrollTarget, vantaRef])
}

/** Pause / resume Vanta render loop without destroying WebGL context */
function useVantaPaused(vantaRef, paused) {
  useEffect(() => {
    const v = vantaRef.current
    if (!v) return undefined
    if (paused) {
      if (v.req) {
        cancelAnimationFrame(v.req)
        v.req = null
      }
    } else if (!v.req) {
      v.animationLoop()
    }
    return undefined
  }, [paused, vantaRef])
}

export default function VantaBackground({
  effect = 'clouds',
  preset,
  className = '',
  style = {},
  options = {},
  enabled = true,
  visible = true,
  persistent = false,
  paused = false,
  pauseOnScrollRef = null,
  pauseOnScrollEl = null,
}) {
  const elRef = useRef(null)
  const vantaRef = useRef(null)
  const presetKey = preset || effect

  usePauseOnScroll(pauseOnScrollEl ?? pauseOnScrollRef, vantaRef)
  useVantaPaused(vantaRef, paused)

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
      if (!persistent && vantaRef.current) {
        try {
          vantaRef.current.destroy()
        } catch (_) {}
        vantaRef.current = null
        cleanupEl(elRef.current)
      }
    }
  }, [effect, presetKey, enabled, persistent])

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
        contain: 'strict',
        ...style,
      }}
      aria-hidden
    />
  )
}
