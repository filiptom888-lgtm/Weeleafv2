import React, { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

/* ─── Trunk segments: each is a tapered cylinder section ─────────────── */
const TRUNK_SECTIONS = [
  { br: 0.65, tr: 0.52, h: 1.6, y: 0.0,  rz: 0, rx: 0 },
  { br: 0.52, tr: 0.42, h: 1.5, y: 1.55, rz: 0, rx: 0 },
  { br: 0.42, tr: 0.34, h: 1.4, y: 3.00, rz: 0, rx: 0 },
  { br: 0.34, tr: 0.26, h: 1.3, y: 4.35, rz: 0, rx: 0 },
  { br: 0.26, tr: 0.18, h: 1.2, y: 5.58, rz: 0, rx: 0 },
]

/* ─── Major branches: raised high so canopy sits well above coins ────── */
const BRANCHES = [
  // Lower main branches — spread wide
  { az: 0.0,          ay: 6.2, len: 2.8, thick: 0.13, droop: 0.35 },
  { az: Math.PI*0.50, ay: 6.5, len: 2.5, thick: 0.11, droop: 0.30 },
  { az: Math.PI*1.00, ay: 6.0, len: 3.0, thick: 0.12, droop: 0.40 },
  { az: Math.PI*1.50, ay: 6.4, len: 2.6, thick: 0.11, droop: 0.32 },
  { az: Math.PI*0.25, ay: 6.8, len: 2.2, thick: 0.10, droop: 0.25 },
  { az: Math.PI*1.25, ay: 6.7, len: 2.4, thick: 0.10, droop: 0.28 },
  // Upper branches — shorter, reaching upward
  { az: Math.PI*0.75, ay: 7.4, len: 1.8, thick: 0.08, droop: 0.12 },
  { az: Math.PI*1.75, ay: 7.6, len: 1.6, thick: 0.08, droop: 0.10 },
  { az: Math.PI*0.00, ay: 7.8, len: 1.4, thick: 0.07, droop: 0.08 },
]

/* ─── Branch mesh: a tapered cylinder pointing outward + drooping ────── */
function Branch({ az, ay, len, thick, droop }) {
  const geo = useMemo(
    () => new THREE.CylinderGeometry(thick * 0.35, thick, len, 6, 1),
    [thick, len]
  )
  // Cylinder default axis is Y. We rotate to point outward (X) then droop.
  const rot = useMemo(() => {
    const q = new THREE.Quaternion()
    // 1) tilt 90° toward +X (outward)
    q.setFromEuler(new THREE.Euler(0, 0, -Math.PI / 2))
    // 2) droop angle
    const drQ = new THREE.Quaternion().setFromEuler(new THREE.Euler(droop * 0.5, 0, 0))
    q.premultiply(drQ)
    return q
  }, [droop])

  const euler = useMemo(() => new THREE.Euler().setFromQuaternion(rot), [rot])

  // End position (tip) for sub-branch foliage cluster
  const tipX = Math.cos(az) * (len * 0.72)
  const tipZ = Math.sin(az) * (len * 0.72)
  const tipY = ay - droop * len * 0.28

  return (
    <group position={[0, ay, 0]} rotation={[0, -az, 0]}>
      {/* Branch cylinder */}
      <mesh rotation={euler} position={[len * 0.5, 0, 0]} castShadow>
        <primitive object={geo} />
        <meshStandardMaterial color="#5c3317" roughness={0.9} metalness={0} />
      </mesh>
      {/* Branch wireframe */}
      <mesh rotation={euler} position={[len * 0.5, 0, 0]}>
        <primitive object={geo} />
        <meshBasicMaterial color="#3a1f09" wireframe transparent opacity={0.25} />
      </mesh>
    </group>
  )
}

/* ─── Foliage: a cluster of overlapping rounded shapes ──────────────── */
function FoliageCluster({ position, radius, density = 6, color, wireColor }) {
  const blobs = useMemo(() => {
    const items = []
    // Central blob
    items.push({ x: 0, y: 0, z: 0, r: radius, geo: new THREE.IcosahedronGeometry(radius, 1) })
    // Surrounding blobs
    for (let i = 0; i < density; i++) {
      const a = (i / density) * Math.PI * 2
      const spread = radius * 0.75
      const r = radius * (0.55 + (Math.sin(i * 31.7) * 0.5 + 0.5) * 0.45)
      items.push({
        x: Math.cos(a) * spread,
        y: (Math.sin(i * 17.3) * 0.5 + 0.5) * radius * 0.5 - radius * 0.15,
        z: Math.sin(a) * spread,
        r,
        geo: new THREE.IcosahedronGeometry(r, 1),
      })
    }
    return items
  }, [radius, density, color])

  return (
    <group position={position}>
      {blobs.map((b, i) => (
        <group key={i} position={[b.x, b.y, b.z]}>
          <mesh castShadow>
            <primitive object={b.geo} />
            <meshStandardMaterial color={color} roughness={0.85} metalness={0.02} flatShading />
          </mesh>
          <mesh>
            <primitive object={b.geo} />
            <meshBasicMaterial color={wireColor} wireframe transparent opacity={0.12} />
          </mesh>
        </group>
      ))}
    </group>
  )
}


const FOLIAGE_CLUSTERS = [
  // ── Bottom ring of canopy — wide umbrella at branch tips ──
  { pos: [ 2.6, 6.2,  0.0], r: 0.95, d: 5, c: '#2d7a4f', wc: '#52b788' },
  { pos: [ 1.3, 6.3,  2.3], r: 0.90, d: 5, c: '#338855', wc: '#5ac48a' },
  { pos: [-1.2, 6.1,  2.5], r: 0.95, d: 5, c: '#2a7548', wc: '#4fb87e' },
  { pos: [-2.5, 6.0,  0.2], r: 1.00, d: 5, c: '#2e7d50', wc: '#54ba85' },
  { pos: [-1.4, 6.2, -2.2], r: 0.90, d: 5, c: '#327a4c', wc: '#56b882' },
  { pos: [ 1.0, 6.4, -2.4], r: 0.95, d: 5, c: '#2b7a4a', wc: '#50b680' },
  // ── Mid ring — filling gaps, slightly higher ──
  { pos: [ 2.0, 6.9,  1.4], r: 0.85, d: 4, c: '#358c5a', wc: '#62c892' },
  { pos: [-0.2, 6.8,  2.2], r: 0.80, d: 4, c: '#3a9060', wc: '#68cc98' },
  { pos: [-2.0, 6.7, -1.2], r: 0.85, d: 4, c: '#348858', wc: '#60c690' },
  { pos: [ 0.8, 7.0, -1.8], r: 0.80, d: 4, c: '#389060', wc: '#66ca96' },
  { pos: [ 1.8, 6.8, -0.8], r: 0.80, d: 4, c: '#368d5c', wc: '#64c894' },
  { pos: [-1.6, 7.0,  1.0], r: 0.80, d: 4, c: '#378e5e', wc: '#64ca96' },
  // ── Upper dome — tighter, rounder ──
  { pos: [ 1.0, 7.6,  0.6], r: 0.90, d: 5, c: '#40966a', wc: '#72d4a0' },
  { pos: [-0.8, 7.5, -0.6], r: 0.90, d: 5, c: '#3e9468', wc: '#70d29e' },
  { pos: [ 0.2, 7.4,  1.2], r: 0.85, d: 4, c: '#3c9266', wc: '#6ed09c' },
  { pos: [-0.4, 7.7, -1.0], r: 0.85, d: 4, c: '#3a9064', wc: '#6cce9a' },
  // ── Crown — top of dome ──
  { pos: [ 0.0, 8.3,  0.0], r: 1.10, d: 6, c: '#48a074', wc: '#80deb0' },
  { pos: [ 0.4, 8.8,  0.2], r: 0.75, d: 4, c: '#4ca878', wc: '#86e2b4' },
  { pos: [-0.3, 8.6, -0.2], r: 0.80, d: 4, c: '#4aa676', wc: '#84e0b2' },
]



export default function LifeTree() {
  const rootRef = useRef()
  const glowRingRef = useRef()
  const crownRef = useRef()

  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    if (rootRef.current) {
      rootRef.current.rotation.z = Math.sin(t * 0.28) * 0.008
      rootRef.current.rotation.x = Math.sin(t * 0.19) * 0.005
    }
    if (glowRingRef.current) {
      glowRingRef.current.material.opacity = 0.06 + Math.sin(t * 0.7) * 0.03
    }
    if (crownRef.current) {
      crownRef.current.rotation.y += 0.004
      crownRef.current.scale.setScalar(1 + Math.sin(t * 1.2) * 0.03)
    }
  })

  return (
    <group ref={rootRef} position={[0, -2.1, 0]}>
      {/* Ground glow */}
      <mesh ref={glowRingRef} position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[5.5, 64]} />
        <meshBasicMaterial color="#4ade80" transparent opacity={0.06} depthWrite={false} />
      </mesh>

      {/* Multi-section trunk */}
      {TRUNK_SECTIONS.map((s, i) => (
        <group key={i} position={[0, s.y, 0]} rotation={[s.rx, 0, s.rz]}>
          <mesh position={[0, s.h / 2, 0]} castShadow>
            <cylinderGeometry args={[s.tr, s.br, s.h, 10, 2]} />
            <meshStandardMaterial color="#5c3317" roughness={0.92} metalness={0} />
          </mesh>
          <mesh position={[0, s.h / 2, 0]}>
            <cylinderGeometry args={[s.tr + 0.01, s.br + 0.01, s.h, 10, 2]} />
            <meshBasicMaterial color="#3a1f09" wireframe transparent opacity={0.18} />
          </mesh>
        </group>
      ))}

      {/* Major branches */}
      {BRANCHES.map((b, i) => (
        <Branch key={i} {...b} />
      ))}

      {/* Foliage clusters */}
      {FOLIAGE_CLUSTERS.map((f, i) => (
        <FoliageCluster key={i} position={f.pos} radius={f.r} density={f.d} color={f.c} wireColor={f.wc} />
      ))}

      {/* Crown gem — energy node at top */}
      <group ref={crownRef} position={[0, 10.0, 0]}>
        <mesh>
          <octahedronGeometry args={[0.32, 0]} />
          <meshStandardMaterial color="#a3e635" emissive="#4ade80" emissiveIntensity={1.4} roughness={0.1} metalness={0.5} />
        </mesh>
        <mesh scale={[1.5, 1.5, 1.5]}>
          <octahedronGeometry args={[0.32, 0]} />
          <meshBasicMaterial color="#86efac" wireframe transparent opacity={0.4} />
        </mesh>
        <pointLight intensity={1.8} color="#86efac" distance={4} decay={2} />
      </group>
    </group>
  )
}

