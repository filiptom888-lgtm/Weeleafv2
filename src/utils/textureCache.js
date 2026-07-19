import * as THREE from 'three'

const cache = new Map()
const loader = new THREE.TextureLoader()

function storeTexture(url, texture) {
  texture.colorSpace = THREE.SRGBColorSpace
  cache.set(url, { texture, promise: Promise.resolve(texture) })
  return texture
}

/** Preload a coin/texture URL once; safe to call repeatedly. */
export function preloadTexture(url) {
  if (!url) return Promise.resolve(null)
  const hit = cache.get(url)
  if (hit?.texture) return hit.promise
  if (hit?.promise) return hit.promise

  const promise = new Promise((resolve, reject) => {
    loader.load(
      url,
      (t) => resolve(storeTexture(url, t)),
      undefined,
      reject
    )
  })
  cache.set(url, { promise })
  return promise.catch((err) => {
    cache.delete(url)
    console.warn('[textureCache] failed', url?.slice?.(0, 48), err)
    return null
  })
}

export function preloadCoinImages(coins = []) {
  const urls = [...new Set(coins.map((c) => c.imageUrl).filter(Boolean))]
  return Promise.all(urls.map(preloadTexture))
}

export function getCachedTexture(url) {
  return cache.get(url)?.texture ?? null
}
