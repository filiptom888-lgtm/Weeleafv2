import * as THREE from 'three'

const COIN_TEX_SIZE = 256
const cache = new Map()

function textureFromBitmap(bitmap) {
  const texture = new THREE.Texture(bitmap)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.minFilter = THREE.LinearFilter
  texture.magFilter = THREE.LinearFilter
  texture.generateMipmaps = false
  texture.needsUpdate = true
  return texture
}

function textureFromCanvas(img) {
  const max = COIN_TEX_SIZE
  const w = img.naturalWidth || img.width
  const h = img.naturalHeight || img.height
  const scale = Math.min(1, max / Math.max(w, h, 1))
  const cw = Math.max(1, Math.round(w * scale))
  const ch = Math.max(1, Math.round(h * scale))
  const canvas = document.createElement('canvas')
  canvas.width = cw
  canvas.height = ch
  const ctx = canvas.getContext('2d')
  ctx.drawImage(img, 0, 0, cw, ch)
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.minFilter = THREE.LinearFilter
  texture.magFilter = THREE.LinearFilter
  texture.generateMipmaps = false
  texture.needsUpdate = true
  return texture
}

async function decodeCoinImage(url) {
  const res = await fetch(url)
  const blob = await res.blob()

  if (typeof createImageBitmap === 'function') {
    try {
      const bitmap = await createImageBitmap(blob, {
        resizeWidth: COIN_TEX_SIZE,
        resizeHeight: COIN_TEX_SIZE,
        resizeQuality: 'high',
      })
      return textureFromBitmap(bitmap)
    } catch {
      /* fall through */
    }
  }

  const objectUrl = URL.createObjectURL(blob)
  try {
    const img = await new Promise((resolve, reject) => {
      const el = new Image()
      el.onload = () => resolve(el)
      el.onerror = reject
      el.src = objectUrl
    })
    return textureFromCanvas(img)
  } finally {
    URL.revokeObjectURL(objectUrl)
  }
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
  return Promise.all(urls.map(preloadTexture))
}

export function getCachedTexture(url) {
  return cache.get(url)?.texture ?? null
}

export function areCoinTexturesReady(coins = []) {
  const urls = coins.map((c) => c.imageUrl).filter(Boolean)
  if (!urls.length) return true
  return urls.every((url) => !!getCachedTexture(url))
}
