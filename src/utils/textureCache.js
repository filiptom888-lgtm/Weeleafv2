import * as THREE from 'three'

const COIN_TEX_SIZE = 256
const cache = new Map()

/**
 * Rasterize to canvas so orientation matches THREE.TextureLoader (flipY true).
 * Direct ImageBitmap → Texture often renders upside-down on coin faces.
 */
function textureFromImageSource(img) {
  const w = img.width || img.naturalWidth
  const h = img.height || img.naturalHeight
  const scale = Math.min(1, COIN_TEX_SIZE / Math.max(w, h, 1))
  const cw = Math.max(1, Math.round(w * scale))
  const ch = Math.max(1, Math.round(h * scale))

  const canvas = document.createElement('canvas')
  canvas.width = cw
  canvas.height = ch
  const ctx = canvas.getContext('2d')
  ctx.drawImage(img, 0, 0, cw, ch)

  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.flipY = true
  texture.minFilter = THREE.LinearFilter
  texture.magFilter = THREE.LinearFilter
  texture.generateMipmaps = false
  texture.needsUpdate = true
  return texture
}

async function loadImageSource(url) {
  const res = await fetch(url)
  const blob = await res.blob()

  if (typeof createImageBitmap === 'function') {
    try {
      return await createImageBitmap(blob, {
        resizeWidth: COIN_TEX_SIZE,
        resizeHeight: COIN_TEX_SIZE,
        resizeQuality: 'high',
      })
    } catch {
      /* fall through */
    }
  }

  const objectUrl = URL.createObjectURL(blob)
  try {
    return await new Promise((resolve, reject) => {
      const el = new Image()
      el.onload = () => resolve(el)
      el.onerror = reject
      el.src = objectUrl
    })
  } finally {
    URL.revokeObjectURL(objectUrl)
  }
}

async function decodeCoinImage(url) {
  const source = await loadImageSource(url)
  const texture = textureFromImageSource(source)
  if (source.close) source.close()
  return texture
}

function storeTexture(url, texture) {
  cache.set(url, { texture, promise: Promise.resolve(texture) })
  return texture
}

/** Preload a coin image once; downscales to 256px for fast GPU upload. */
export function preloadTexture(url) {
  if (!url) return Promise.resolve(null)
  const hit = cache.get(url)
  if (hit?.texture) return hit.promise
  if (hit?.promise) return hit.promise

  const promise = decodeCoinImage(url)
    .then((t) => storeTexture(url, t))
    .catch((err) => {
      cache.delete(url)
      console.warn('[textureCache] failed', url?.slice?.(0, 48), err)
      return null
    })

  cache.set(url, { promise })
  return promise
}

export function preloadCoinImages(coins = []) {
  const urls = [...new Set(coins.map((c) => c.imageUrl).filter(Boolean))]
  if (!urls.length) return Promise.resolve([])

  // Stagger decodes so huge base64 uploads don't freeze the main thread
  urls.forEach((url, i) => {
    window.setTimeout(() => preloadTexture(url), i * 40)
  })
  return Promise.resolve([])
}

export function getCachedTexture(url) {
  return cache.get(url)?.texture ?? null
}

export function areCoinTexturesReady(coins = []) {
  const urls = coins.map((c) => c.imageUrl).filter(Boolean)
  if (!urls.length) return true
  return urls.every((url) => !!getCachedTexture(url))
}

/** Bust in-memory cache (e.g. after orientation fix in dev). */
export function clearTextureCache() {
  cache.forEach((entry) => entry.texture?.dispose?.())
  cache.clear()
}
