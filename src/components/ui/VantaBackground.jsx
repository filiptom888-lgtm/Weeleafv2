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
    speed: 0.7,
    scale: 1.35,
    scaleMobile: 2.6,
    skyColor: 0xe8a878,
    cloudColor: 0xfff7ee,
    cloudShadowColor: 0xc48a62,
    sunColor: 0xffd6a0,
    sunGlareColor: 0xf0b070,
    sunlightColor: 0xffefd4,
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
    speed: 0.42,
    scale: 2.1,
    scaleMobile: 4.2,
    skyColor: 0xebb588,
    cloudColor: 0xfffbf6,
    cloudShadowColor: 0xd0a078,
    sunColor: 0xffe0b0,
    sunGlareColor: 0xf2c08a,
    sunlightColor: 0xfff4e0,
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
    const presetOpts = VANTA_PRESETS[presetKey] || VANTA_PRESETS[effect] || {}
    const timer = window.setTimeout(() => {
      ;(async () => {
        try {
          const mod = await loader()
          const VantaEffect = mod.default || mod
          if (cancelled || !elRef.current) return
          if (vantaRef.current) {
            try { vantaRef.current.destroy() } catch (_) {}
            vantaRef.current = null
            cleanupEl(elRef.current)
          }
          vantaRef.current = VantaEffect({
            el: elRef.current,
            THREE,
            ...presetOpts,
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
        cleanupEl(elRef.current)
      }
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
        contain: 'strict',
        ...style,
      }}
      aria-hidden
    />
  )
}
