import * as THREE from 'three'

const COIN_TEX_SIZE = 256
const cache = new Map()
const loader = new THREE.TextureLoader()

function configureCoinTexture(texture) {
  texture.colorSpace = THREE.SRGBColorSpace
  texture.flipY = true
  texture.minFilter = THREE.LinearFilter
  texture.magFilter = THREE.LinearFilter
  texture.generateMipmaps = false
  return texture
}

function storeTexture(url, texture) {
  configureCoinTexture(texture)
  cache.set(url, { texture, promise: Promise.resolve(texture) })
  return texture
}

function isRemoteUrl(url) {
  return url.startsWith('http://') || url.startsWith('https://') || url.startsWith('/')
}

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
  return configureCoinTexture(texture)
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

async function decodeDataUrl(url) {
  const source = await loadImageSource(url)
  const texture = textureFromImageSource(source)
  if (source.close) source.close()
  return texture
}

function loadHttpTexture(url) {
  const absolute = url.startsWith('/') ? `${window.location.origin}${url}` : url
  return new Promise((resolve, reject) => {
    loader.load(
      absolute,
      (t) => resolve(storeTexture(url, t)),
      undefined,
      reject
    )
  })
}

/** Preload a coin image once. HTTP URLs use browser cache + TextureLoader (fast). */
export function preloadTexture(url) {
  if (!url) return Promise.resolve(null)
  const hit = cache.get(url)
  if (hit?.texture) return hit.promise
  if (hit?.promise) return hit.promise

  const promise = (isRemoteUrl(url)
    ? loadHttpTexture(url)
    : decodeDataUrl(url).then((t) => storeTexture(url, t))
  ).catch((err) => {
    cache.delete(url)
    console.warn('[textureCache] failed', url?.slice?.(0, 64), err)
    return null
  })

  cache.set(url, { promise })
  return promise
}

export function preloadCoinImages(coins = []) {
  const urls = [...new Set(coins.map((c) => c.imageUrl).filter(Boolean))]
  urls.forEach((url) => {
    if (isRemoteUrl(url)) {
      const img = new Image()
      img.decoding = 'async'
      img.src = url.startsWith('/') ? `${window.location.origin}${url}` : url
    }
    preloadTexture(url)
  })
  return Promise.resolve([])
}

export function getCachedTexture(url) {
  return cache.get(url)?.texture ?? null
}

export function clearTextureCache() {
  cache.forEach((entry) => entry.texture?.dispose?.())
  cache.clear()
}
