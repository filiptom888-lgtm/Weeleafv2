import React, { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

/* ─── Blue-white cloud sprite texture (NOT pure white — avoids wash) ─── */
function makeCloudTexture() {
  const size = 256
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')
  const half = size / 2
  const grad = ctx.createRadialGradient(half, half, 0, half, half, half)
  grad.addColorStop(0,    'rgba(230,240,255,0.88)')
  grad.addColorStop(0.30, 'rgba(210,228,252,0.55)')
  grad.addColorStop(0.60, 'rgba(190,215,248,0.22)')
  grad.addColorStop(0.85, 'rgba(175,208,245,0.07)')
  grad.addColorStop(1,    'rgba(165,200,242,0)')
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, size, size)
  return new THREE.CanvasTexture(canvas)
}

/*
 * Single cloud puff — 8 HORIZONTAL planes with random tilt.
 * Horizontal orientation means they form a cloud floor rather than a white wall.
 * Coins orbit at world y=0.8; puffs are positioned at y=-1.5 to -3.0
 * so their tops (y + 0.3*scale) max out around y=-0.5.
 */
function CloudPuff({ position, scale = 1, opacity = 0.15, driftX = 0, driftZ = 0, phase = 0 }) {
  const groupRef = useRef()
  const texture = useMemo(() => makeCloudTexture(), [])

  const planes = useMemo(() => {
    const seed = phase
    const rng = (n, min, max) => min + (Math.sin(seed * 13.7 + n * 97.3) * 0.5 + 0.5) * (max - min)
    return Array.from({ length: 8 }, (_, i) => ({
      x: rng(i,     -1.8, 1.8),
      y: rng(i + 1, -0.2, 0.3),   // very little vertical spread
      z: rng(i + 2, -1.8, 1.8),
      s: rng(i + 3,  0.8, 1.6),
      yaw: rng(i + 4, 0, Math.PI * 2),
      tilt: rng(i + 5, -0.18, 0.18), // slight tilt off horizontal
      oMult: rng(i + 6, 0.55, 1.0),
    }))
  }, [phase])

  useFrame(({ clock }) => {
    if (!groupRef.current) return
    const t = clock.elapsedTime
    groupRef.current.position.x = position[0] + Math.sin(t * 0.04 + phase) * driftX
    groupRef.current.position.z = position[2] + Math.cos(t * 0.035 + phase) * driftZ
    groupRef.current.position.y = position[1] + Math.sin(t * 0.06 + phase) * 0.08
  })

  return (
    <group ref={groupRef} position={position} scale={[scale, scale * 0.28, scale]}>
      {planes.map((p, i) => (
        <mesh
          key={i}
          position={[p.x, p.y, p.z]}
          rotation={[-Math.PI / 2 + p.tilt, 0, p.yaw]}
        >
          <planeGeometry args={[p.s * 5.5, p.s * 5.5]} />
          <meshBasicMaterial
            map={texture}
            transparent
            opacity={opacity * p.oMult}
            depthWrite={false}
            blending={THREE.NormalBlending}
            side={THREE.DoubleSide}
          />
        </mesh>
      ))}
    </group>
  )
}

/*
 * Cloud floor layout.
 * Coins at y=0.8. Cloud top = position.y + 0.3 * scale (approx, with Y scale 0.28).
 * All puffs kept below y=-1.0 so tops stay well under y=-0.2.
 * Many small puffs (scale 1.2-2.8) spread across a wide XZ field.
 */
const CLOUD_PUFFS = [
  // ── Near ring: r≈3-7, small tight puffs closest to tree ──
  { position: [ 4.5, -1.4, -1.8], scale: 1.8, opacity: 0.16, driftX: 0.3, driftZ: 0.3, phase: 0.0 },
  { position: [-4.0, -1.3,  2.2], scale: 2.0, opacity: 0.15, driftX: 0.4, driftZ: 0.3, phase: 0.9 },
  { position: [ 1.5, -1.5, -5.0], scale: 1.6, opacity: 0.16, driftX: 0.3, driftZ: 0.4, phase: 1.8 },
  { position: [-2.5, -1.4,  4.5], scale: 1.7, opacity: 0.15, driftX: 0.4, driftZ: 0.2, phase: 2.7 },
  { position: [ 5.5, -1.3,  3.0], scale: 1.9, opacity: 0.16, driftX: 0.3, driftZ: 0.4, phase: 3.6 },
  { position: [-5.0, -1.5, -2.8], scale: 1.8, opacity: 0.15, driftX: 0.4, driftZ: 0.3, phase: 4.5 },
  { position: [ 0.5, -1.4, -6.5], scale: 1.6, opacity: 0.14, driftX: 0.3, driftZ: 0.3, phase: 5.4 },
  { position: [-6.5, -1.3,  0.5], scale: 2.0, opacity: 0.16, driftX: 0.4, driftZ: 0.2, phase: 0.4 },
  { position: [ 3.5, -1.5, -4.0], scale: 1.5, opacity: 0.14, driftX: 0.3, driftZ: 0.3, phase: 1.3 },
  { position: [-3.0, -1.4, -5.2], scale: 1.7, opacity: 0.15, driftX: 0.4, driftZ: 0.3, phase: 2.2 },
  { position: [ 6.8, -1.3, -0.5], scale: 1.9, opacity: 0.16, driftX: 0.3, driftZ: 0.4, phase: 3.1 },
  { position: [-1.5, -1.5,  6.2], scale: 1.6, opacity: 0.14, driftX: 0.4, driftZ: 0.2, phase: 4.0 },
  // ── Mid ring: r≈8-13 ──
  { position: [ 9.5, -1.7, -2.5], scale: 2.2, opacity: 0.14, driftX: 0.6, driftZ: 0.4, phase: 0.5 },
  { position: [-9.0, -1.6,  4.5], scale: 2.4, opacity: 0.13, driftX: 0.7, driftZ: 0.4, phase: 1.4 },
  { position: [ 3.5, -1.8,-10.0], scale: 2.5, opacity: 0.13, driftX: 0.5, driftZ: 0.5, phase: 2.3 },
  { position: [-4.5, -1.7,  8.5], scale: 2.2, opacity: 0.14, driftX: 0.7, driftZ: 0.3, phase: 3.2 },
  { position: [ 8.5, -1.6,  6.0], scale: 2.3, opacity: 0.13, driftX: 0.6, driftZ: 0.5, phase: 4.1 },
  { position: [-8.0, -1.8, -5.5], scale: 2.4, opacity: 0.13, driftX: 0.5, driftZ: 0.4, phase: 5.0 },
  { position: [ 12.0,-1.7,  1.5], scale: 2.2, opacity: 0.12, driftX: 0.7, driftZ: 0.4, phase: 0.7 },
  { position: [-11.5,-1.6, -2.5], scale: 2.3, opacity: 0.13, driftX: 0.6, driftZ: 0.3, phase: 1.6 },
  { position: [ 5.5, -1.9,-11.5], scale: 2.1, opacity: 0.12, driftX: 0.5, driftZ: 0.5, phase: 2.5 },
  { position: [-6.5, -1.7, 10.5], scale: 2.4, opacity: 0.13, driftX: 0.7, driftZ: 0.4, phase: 3.4 },
  { position: [10.5, -1.8, -8.0], scale: 2.2, opacity: 0.12, driftX: 0.6, driftZ: 0.4, phase: 4.3 },
  { position: [-1.5, -1.9,-12.0], scale: 2.5, opacity: 0.12, driftX: 0.5, driftZ: 0.3, phase: 5.2 },
  // ── Outer ring: r≈14-22 ──
  { position: [ 15.0,-2.0, -4.5], scale: 2.6, opacity: 0.11, driftX: 0.9, driftZ: 0.6, phase: 1.1 },
  { position: [-14.0,-1.9,  7.5], scale: 2.8, opacity: 0.11, driftX: 1.0, driftZ: 0.5, phase: 2.0 },
  { position: [  6.0,-2.1,-15.0], scale: 2.7, opacity: 0.10, driftX: 0.8, driftZ: 0.7, phase: 2.9 },
  { position: [ -7.0,-2.0, 14.0], scale: 2.6, opacity: 0.11, driftX: 1.1, driftZ: 0.4, phase: 3.8 },
  { position: [ 18.0,-2.0,  5.0], scale: 2.5, opacity: 0.10, driftX: 0.9, driftZ: 0.6, phase: 4.7 },
  { position: [-17.0,-2.1, -4.0], scale: 2.7, opacity: 0.10, driftX: 1.0, driftZ: 0.5, phase: 5.6 },
  { position: [ 11.0,-2.0, 14.0], scale: 2.4, opacity: 0.10, driftX: 0.8, driftZ: 0.6, phase: 1.5 },
  { position: [-12.0,-2.1,-13.0], scale: 2.6, opacity: 0.10, driftX: 1.0, driftZ: 0.4, phase: 2.4 },
  { position: [ 20.5,-2.0, -8.0], scale: 2.5, opacity: 0.09, driftX: 1.1, driftZ: 0.5, phase: 3.3 },
  { position: [-19.5,-2.0,  9.0], scale: 2.7, opacity: 0.09, driftX: 0.9, driftZ: 0.6, phase: 4.2 },
  // ── Horizon ring: r≈23-35, larger, fully faded ──
  { position: [ 25.0,-2.4,-12.0], scale: 2.8, opacity: 0.08, driftX: 1.3, driftZ: 0.8, phase: 1.8 },
  { position: [-24.0,-2.3, 16.0], scale: 3.0, opacity: 0.08, driftX: 1.4, driftZ: 0.6, phase: 3.0 },
  { position: [ 10.0,-2.5,-28.0], scale: 2.8, opacity: 0.07, driftX: 1.2, driftZ: 0.9, phase: 4.2 },
  { position: [-11.0,-2.4, 26.0], scale: 3.0, opacity: 0.07, driftX: 1.5, driftZ: 0.5, phase: 0.9 },
  { position: [ 28.0,-2.3, 10.0], scale: 2.7, opacity: 0.08, driftX: 1.3, driftZ: 0.7, phase: 2.1 },
  { position: [-27.0,-2.5,-10.0], scale: 2.9, opacity: 0.07, driftX: 1.4, driftZ: 0.6, phase: 5.3 },
]

export default function CloudEnvironment() {
  return (
    <group>
      {CLOUD_PUFFS.map((cfg, i) => (
        <CloudPuff key={i} {...cfg} />
      ))}
    </group>
  )
}

  const size = 256
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')
  const half = size / 2

