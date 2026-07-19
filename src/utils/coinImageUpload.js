import { api } from '../api/wlApi'

/** Compress image file to small WebP for coin nodes (max 256px). */
export function compressCoinImage(file, maxSize = 256) {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      URL.revokeObjectURL(objectUrl)
      const scale = Math.min(1, maxSize / Math.max(img.width, img.height, 1))
      const w = Math.max(1, Math.round(img.width * scale))
      const h = Math.max(1, Math.round(img.height * scale))
      const canvas = document.createElement('canvas')
      canvas.width = w
      canvas.height = h
      const ctx = canvas.getContext('2d')
      ctx.drawImage(img, 0, 0, w, h)
      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob)
          else reject(new Error('Could not compress image'))
        },
        'image/webp',
        0.86
      )
    }
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl)
      reject(new Error('Could not read image'))
    }
    img.src = objectUrl
  })
}

export async function uploadCoinImageFile(coinId, file) {
  const blob = await compressCoinImage(file)
  const res = await api.uploadCoinImage(coinId, blob)
  if (!res.ok) throw new Error(res.error || 'Upload failed')
  return res.imageUrl
}
