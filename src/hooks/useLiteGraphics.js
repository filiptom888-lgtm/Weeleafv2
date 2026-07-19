import { useEffect, useState } from 'react'

function probeWebGL() {
  try {
    const canvas = document.createElement('canvas')
    const gl = canvas.getContext('webgl', { failIfMajorPerformanceCaveat: true })
      || canvas.getContext('webgl')
      || canvas.getContext('experimental-webgl')
    if (!gl) return { ok: false, software: true, renderer: '' }

    const dbg = gl.getExtension('WEBGL_debug_renderer_info')
    const renderer = dbg
      ? (gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL) || '')
      : ''
    const software = /swiftshader|llvmpipe|software|microsoft basic|mesa offscreen/i.test(renderer)
    const ext = gl.getExtension('WEBGL_lose_context')
    ext?.loseContext()

    return { ok: true, software, renderer }
  } catch {
    return { ok: false, software: true, renderer: '' }
  }
}

/** full = Vanta + full 3D | lite = CSS sky + reduced 3D | minimal = CSS only, no Vanta */
export function detectGraphicsTier() {
  if (typeof window === 'undefined') return 'full'

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const narrow = window.innerWidth < 768
  const lowCpu = (navigator.hardwareConcurrency || 8) <= 4
  const lowMem = navigator.deviceMemory != null && navigator.deviceMemory <= 4
  const saveData = navigator.connection?.saveData === true
  const webgl = probeWebGL()

  if (!webgl.ok || webgl.software || reduced) return 'minimal'
  if (narrow || lowCpu || lowMem || saveData) return 'lite'
  return 'full'
}

/** Skip Vanta WebGL on weak devices — use CSS sky gradients instead. */
export function useLiteGraphics() {
  const [tier, setTier] = useState(() => detectGraphicsTier())

  useEffect(() => {
    const update = () => setTier(detectGraphicsTier())
    update()
    window.addEventListener('resize', update)
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    mq.addEventListener('change', update)
    return () => {
      window.removeEventListener('resize', update)
      mq.removeEventListener('change', update)
    }
  }, [])

  return tier !== 'full'
}

export function useGraphicsTier() {
  const [tier, setTier] = useState(() => detectGraphicsTier())

  useEffect(() => {
    const update = () => setTier(detectGraphicsTier())
    update()
    window.addEventListener('resize', update)
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    mq.addEventListener('change', update)
    return () => {
      window.removeEventListener('resize', update)
      mq.removeEventListener('change', update)
    }
  }, [])

  return tier
}

export function deferNonCritical(fn) {
  if (typeof requestIdleCallback === 'function') {
    requestIdleCallback(() => fn(), { timeout: 2500 })
  } else {
    window.setTimeout(fn, 800)
  }
}
