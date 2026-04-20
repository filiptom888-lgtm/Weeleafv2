import React, { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

/* ─── Shared soft radial-gradient sprite texture ─────────────────────── */
function makeVaporTexture() {
  const size = 256
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')
  const half = size / 2
  const grad = ctx.createRadialGradient(half, half, 0, half, half, half)
  grad.addColorStop(0,    'rgba(255,255,255,0.98)')
  grad.addColorStop(0.25, 'rgba(225,242,255,0.76)')
  grad.addColorStop(0.50, 'rgba(200,230,255,0.40)')
  grad.addColorStop(0.75, 'rgba(180,220,255,0.14)')
  grad.addColorStop(1,    'rgba(160,210,255,0)')
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, size, size)
  return new THREE.CanvasTexture(canvas)
}

/* ─── Single vapor puff — many overlapping soft planes ───────────────── */
function VaporPuff({ position, scale = 1, opacity = 0.22, driftX = 0, driftZ = 0, phase = 0 }) {
  const groupRef = useRef()
  const texture = useMemo(() => makeVaporTexture(), [])

  const planes = useMemo(() => {
    // deterministic-ish from phase so SSR is stable
    const seed = phase
    const rng = (n, min, max) => min + (Math.sin(seed * 13.7 + n * 97.3) * 0.5 + 0.5) * (max - min)
    return Array.from({ length: 16 }, (_, i) => ({
      x: rng(i, -2.2, 2.2),
      y: rng(i + 1, -0.4, 0.7),
      z: rng(i + 2, -1.4, 1.4),
      s: rng(i + 3, 0.7, 2.0),
      rot: rng(i + 4, 0, Math.PI * 2),
      oMult: rng(i + 5, 0.45, 1.0),
    }))
  }, [phase])

  useFrame(({ clock }) => {
    if (!groupRef.current) return
    const t = clock.elapsedTime
    groupRef.current.position.x = position[0] + Math.sin(t * 0.05 + phase) * driftX
    groupRef.current.position.z = position[2] + Math.cos(t * 0.04 + phase) * driftZ
    groupRef.current.position.y = position[1] + Math.sin(t * 0.07 + phase) * 0.15
  })

  return (
    <group ref={groupRef} position={position} scale={[scale, scale * 0.42, scale]}>
      {planes.map((p, i) => (
        <mesh key={i} position={[p.x, p.y, p.z]} rotation={[0, 0, p.rot]}>
          <planeGeometry args={[p.s * 4.5, p.s * 4.5]} />
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

/* ─── Ground mist rising from around the tree base ───────────────────── */
function GroundMist() {
  const groupRef = useRef()
  const texture = useMemo(() => makeVaporTexture(), [])

  const misties = useMemo(() => {
    return Array.from({ length: 48 }, (_, i) => {
      const angle = (i / 48) * Math.PI * 2 + (Math.sin(i * 47.3) * 0.5 + 0.5) * 0.6
      const r = 0.9 + (Math.sin(i * 31.7) * 0.5 + 0.5) * 6.0
      return {
        x: Math.cos(angle) * r,
        z: Math.sin(angle) * r,
        y: -2.3 + (Math.sin(i * 17.1) * 0.5 + 0.5) * 2.4,
        s: 2.2 + (Math.sin(i * 23.9) * 0.5 + 0.5) * 4.0,
        rot: (Math.sin(i * 61.3) * 0.5 + 0.5) * Math.PI * 2,
        phase: (Math.sin(i * 11.7) * 0.5 + 0.5) * Math.PI * 2,
        speed: 0.015 + (Math.sin(i * 43.1) * 0.5 + 0.5) * 0.022,
        opacity: 0.06 + (Math.sin(i * 37.9) * 0.5 + 0.5) * 0.14,
      }
    })
  }, [])

  useFrame(({ clock }) => {
    if (!groupRef.current) return
    const t = clock.elapsedTime
    groupRef.current.children.forEach((child, i) => {
      const m = misties[i]
      child.position.y = m.y + Math.sin(t * m.speed + m.phase) * 0.4
      child.rotation.z = m.rot + t * m.speed * 0.35
      child.material.opacity = m.opacity * (0.7 + Math.sin(t * m.speed * 1.4 + m.phase) * 0.3)
    })
  })

  return (
    <group ref={groupRef}>
      {misties.map((m, i) => (
        <mesh key={i} position={[m.x, m.y, m.z]} rotation={[-Math.PI / 2 + 0.12, 0, m.rot]}>
          <planeGeometry args={[m.s * 5.5, m.s * 5.5]} />
          <meshBasicMaterial
            map={texture}
            transparent
            opacity={m.opacity}
            depthWrite={false}
            blending={THREE.NormalBlending}
            side={THREE.DoubleSide}
          />
        </mesh>
      ))}
    </group>
  )
}

/* ─── Sky vapor configs ───────────────────────────────────────────────── */
const SKY_PUFFS = [
  { position: [-18,  5,  -30], scale: 5.5,  opacity: 0.20, driftX: 2.5, driftZ: 0.5, phase: 0.0 },
  { position: [ 14,  7,  -36], scale: 6.8,  opacity: 0.16, driftX: 2.0, driftZ: 0.8, phase: 1.3 },
  { position: [ -5,  9,  -42], scale: 8.5,  opacity: 0.12, driftX: 3.0, driftZ: 0.3, phase: 2.7 },
  { position: [ 24,  6,  -26], scale: 4.8,  opacity: 0.19, driftX: 1.8, driftZ: 1.0, phase: 0.6 },
  { position: [ -2, 12,  -50], scale: 11.0, opacity: 0.09, driftX: 4.0, driftZ: 0.4, phase: 3.8 },
  { position: [-26,  8,  -32], scale: 7.2,  opacity: 0.15, driftX: 2.2, driftZ: 0.7, phase: 1.9 },
  { position: [  9,  5,  -22], scale: 4.2,  opacity: 0.21, driftX: 1.5, driftZ: 0.9, phase: 4.4 },
  { position: [-12, 11,  -44], scale: 9.2,  opacity: 0.11, driftX: 3.5, driftZ: 0.2, phase: 0.3 },
  { position: [ 30,  4,  -20], scale: 4.0,  opacity: 0.18, driftX: 1.6, driftZ: 1.1, phase: 5.1 },
  { position: [ -8,  3,  -18], scale: 3.6,  opacity: 0.22, driftX: 1.2, driftZ: 0.6, phase: 2.2 },
]

export default function CloudEnvironment() {
  return (
    <group>
      {SKY_PUFFS.map((cfg, i) => (
        <VaporPuff key={i} {...cfg} />
      ))}
      <GroundMist />
    </group>
  )
}
