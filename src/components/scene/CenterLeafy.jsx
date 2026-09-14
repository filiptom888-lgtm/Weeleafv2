import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Billboard } from '@react-three/drei'
import * as THREE from 'three'

const GIF_ASPECT = 360 / 640

/**
 * Decorative Leafy in the orbit centre — same slot as the old leaf.
 * Not clickable; the corner Leafy stays the interactive one.
 */
export default function CenterLeafy() {
  const { size } = useThree()
  const mobile = size.width < 768
  const [aspect, setAspect] = useState(GIF_ASPECT)

  const imgRef = useRef(null)
  const canvasRef = useRef(null)

  const texture = useMemo(() => {
    const canvas = document.createElement('canvas')
    canvas.width = 360
    canvas.height = 640
    canvasRef.current = canvas
    const tex = new THREE.CanvasTexture(canvas)
    tex.colorSpace = THREE.SRGBColorSpace
    tex.minFilter = THREE.LinearFilter
    tex.magFilter = THREE.LinearFilter
    tex.generateMipmaps = false
    tex.anisotropy = 8
    return tex
  }, [])

  useEffect(() => {
    const img = new Image()
    img.src = '/leafy.gif'
    img.alt = ''
    img.decoding = 'async'
    img.setAttribute('aria-hidden', 'true')
    img.style.cssText = 'position:fixed;left:-9999px;top:0;width:auto;height:auto;opacity:0;pointer-events:none'
    const onReady = () => {
      if (!img.naturalWidth) return
      const canvas = canvasRef.current
      if (canvas) {
        canvas.width = img.naturalWidth
        canvas.height = img.naturalHeight
      }
      setAspect(img.naturalWidth / img.naturalHeight)
    }
    img.addEventListener('load', onReady)
    document.body.appendChild(img)
    imgRef.current = img
    return () => {
      img.removeEventListener('load', onReady)
      img.remove()
      texture.dispose()
    }
  }, [texture])

  useFrame(() => {
    const img = imgRef.current
    const canvas = canvasRef.current
    if (!img?.naturalWidth || !canvas) return
    const ctx = canvas.getContext('2d', { alpha: true })
    if (!ctx) return
    if (canvas.width !== img.naturalWidth || canvas.height !== img.naturalHeight) {
      canvas.width = img.naturalWidth
      canvas.height = img.naturalHeight
    }
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
    texture.needsUpdate = true
  })

  const height = mobile ? 3.25 : 3.7
  const width = height * aspect

  return (
    <Billboard follow position={[0, 0.15, 0]} scale={1}>
      <mesh raycast={() => null}>
        <planeGeometry args={[width, height]} />
        <meshBasicMaterial
          map={texture}
          transparent
          alphaTest={0.08}
          depthWrite
          toneMapped={false}
          side={THREE.FrontSide}
        />
      </mesh>
      <mesh raycast={() => null} rotation={[0, Math.PI, 0]}>
        <planeGeometry args={[width, height]} />
        <meshBasicMaterial
          map={texture}
          transparent
          alphaTest={0.08}
          depthWrite
          toneMapped={false}
          side={THREE.FrontSide}
        />
      </mesh>
    </Billboard>
  )
}
