import * as THREE from 'three'

const COIN_TEX_SIZE = 1024
const cache = new Map()
const loader = new THREE.TextureLoader()

function configureCoinTexture(texture) {
  texture.colorSpace = THREE.SRGBColorSpace
  texture.flipY = true
  texture.generateMipmaps = true
  texture.minFilter = THREE.LinearMipmapLinearFilter
  texture.magFilter = THREE.LinearFilter
  texture.anisotropy = 16
  texture.needsUpdate = true
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

function nextPowerOfTwo(n) {
  const v = Math.max(1, n)
  return 2 ** Math.ceil(Math.log2(v))
}

function textureFromImageSource(img) {
  const w = img.width || img.naturalWidth || COIN_TEX_SIZE
  const h = img.height || img.naturalHeight || COIN_TEX_SIZE
  const longest = Math.max(w, h, 1)
  const scale = longest > COIN_TEX_SIZE ? COIN_TEX_SIZE / longest : 1
  const cw = nextPowerOfTwo(Math.max(1, Math.round(w * scale)))
  const ch = nextPowerOfTwo(Math.max(1, Math.round(h * scale)))

  const canvas = document.createElement('canvas')
  canvas.width = cw
  canvas.height = ch
  const ctx = canvas.getContext('2d', { alpha: true })
  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(img, 0, 0, cw, ch)

  const texture = new THREE.CanvasTexture(canvas)
  return configureCoinTexture(texture)
}

async function loadImageSource(url) {
  const res = await fetch(url)
  const blob = await res.blob()

  if (typeof createImageBitmap === 'function') {
    try {
      return await createImageBitmap(blob, { resizeQuality: 'high' })
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

function fallbackUrls(url) {
  if (!url || url.startsWith('data:')) return []
  const out = []
  if (/\.webp($|\?)/i.test(url)) out.push(url.replace(/\.webp(?=$|\?)/i, '.png'))
  if (/\.png($|\?)/i.test(url)) out.push(url.replace(/\.png(?=$|\?)/i, '.webp'))
  return out.filter((u) => u !== url)
}

async function loadHttpTextureWithFallback(url) {
  try {
    return await loadHttpTexture(url)
  } catch (err) {
    for (const alt of fallbackUrls(url)) {
      try {
        const tex = await loadHttpTexture(alt)
        cache.set(url, { texture: tex, promise: Promise.resolve(tex) })
        return tex
      } catch (_) {}
    }
    throw err
  }
}

/** Preload a coin image once. HTTP URLs use browser cache + TextureLoader (fast). */
export function preloadTexture(url) {
  if (!url) return Promise.resolve(null)
  const hit = cache.get(url)
  if (hit?.texture) return hit.promise
  if (hit?.promise) return hit.promise

  const promise = (isRemoteUrl(url)
    ? loadHttpTextureWithFallback(url)
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

export function applyCoinAnisotropy(texture, gl) {
  if (!texture || !gl) return
  const max = gl.capabilities?.getMaxAnisotropy?.() || 16
  const next = Math.min(16, max)
  if (texture.anisotropy !== next) {
    texture.anisotropy = next
    texture.needsUpdate = true
  }
}

export function clearTextureCache() {
  cache.forEach((entry) => entry.texture?.dispose?.())
  cache.clear()
}
