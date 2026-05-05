import React, { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

/* ─── Trunk segments: each is a tapered cylinder section ─────────────── */
const TRUNK_SECTIONS = [
  // Root — hidden below, very wide for anchor feel
  { br: 2.20, tr: 1.70, h: 2.2, y: -4.2, rz: 0, rx: 0 },
  { br: 1.70, tr: 1.30, h: 2.2, y: -2.0, rz: 0, rx: 0 },
  // Visible trunk — wide and tapering naturally
  { br: 1.30, tr: 1.00, h: 1.8, y:  0.0, rz: 0, rx: 0 },
  { br: 1.00, tr: 0.78, h: 1.6, y:  1.8, rz: 0, rx: 0 },
  { br: 0.78, tr: 0.58, h: 1.5, y:  3.4, rz: 0, rx: 0 },
  { br: 0.58, tr: 0.40, h: 1.4, y:  4.9, rz: 0, rx: 0 },
  { br: 0.40, tr: 0.24, h: 1.2, y:  6.3, rz: 0, rx: 0 },
]

/* ─── Foliage: a cluster of overlapping low-poly blobs ──────────────── */
function FoliageCluster({ position, radius, density = 6, color, wireColor }) {
  const blobs = useMemo(() => {
    const items = []
    items.push({ x: 0, y: 0, z: 0, r: radius, geo: new THREE.IcosahedronGeometry(radius, 1) })
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
  }, [radius, density])

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

/* ─── Near-canopy branches (just below main foliage) ────────────────── */
const BRANCHES = [
  { az: 0.0,           ay: 5.9, len: 2.4, thick: 0.11, droop: 0, lr: 0.50, lc: '#266842', lwc: '#4caa74' },
  { az: Math.PI*0.50,  ay: 6.1, len: 2.2, thick: 0.10, droop: 0, lr: 0.46, lc: '#286c46', lwc: '#4eae78' },
  { az: Math.PI*1.00,  ay: 5.8, len: 2.5, thick: 0.11, droop: 0, lr: 0.50, lc: '#256540', lwc: '#4aaa72' },
  { az: Math.PI*1.50,  ay: 6.0, len: 2.3, thick: 0.10, droop: 0, lr: 0.47, lc: '#276a44', lwc: '#4cac76' },
]

/*
 * Mid-trunk branches — 4 tiers spread across the FULL visible trunk.
 * Tree group is at world y=-4, so local ay → world y = ay - 4.
 *
 * Tier A  ay≈1.2–1.6  → world y≈-2.8 to -2.4  (very bottom, heavy droop)
 * Tier B  ay≈2.6–3.0  → world y≈-1.4 to -1.0  (lower quarter)
 * Tier C  ay≈3.8–4.2  → world y≈-0.2 to +0.2  (mid trunk, at coin orbit)
 * Tier D  ay≈4.9–5.3  → world y≈+0.9 to +1.3  (upper quarter, lighter)
 *
 * Each tier is rotated ~67° in azimuth from the tier above/below
 * so they never visually stack.
 */
/*
 * Mid-trunk branches — 4 tiers covering local y=2 to y=5.4
 * (base branches + fork already cover y=0–1.5)
 * Each tier offset ~60° in azimuth from adjacent tiers.
 */
const MID_BRANCHES = [
  // ── Tier B: local y≈2.0 ─────────────────────────────────────────
  { az: Math.PI*0.25,  ay: 2.0, len: 2.8, thick: 0.14, droop: 0, lr: 0.56, lc: '#1e5232', lwc: '#3c8e62' },
  { az: Math.PI*1.25,  ay: 2.1, len: 2.6, thick: 0.13, droop: 0, lr: 0.53, lc: '#205434', lwc: '#3e9064' },

  // ── Tier C: local y≈3.2 ─────────────────────────────────────────
  { az: Math.PI*0.75,  ay: 3.2, len: 2.4, thick: 0.12, droop: 0, lr: 0.51, lc: '#225a38', lwc: '#42986a' },
  { az: Math.PI*1.75,  ay: 3.1, len: 2.5, thick: 0.12, droop: 0, lr: 0.50, lc: '#235838', lwc: '#439668' },

  // ── Tier D: local y≈4.3 ─────────────────────────────────────────
  { az: Math.PI*0.40,  ay: 4.3, len: 2.1, thick: 0.11, droop: 0, lr: 0.47, lc: '#266040', lwc: '#469e6e' },
  { az: Math.PI*1.40,  ay: 4.2, len: 2.2, thick: 0.11, droop: 0, lr: 0.46, lc: '#275e3e', lwc: '#479c6c' },

  // ── Tier E: local y≈5.3 ─────────────────────────────────────────
  { az: Math.PI*0.10,  ay: 5.3, len: 1.9, thick: 0.10, droop: 0, lr: 0.43, lc: '#2b6642', lwc: '#4ba470' },
  { az: Math.PI*1.10,  ay: 5.2, len: 2.0, thick: 0.10, droop: 0, lr: 0.44, lc: '#2a6642', lwc: '#4aa470' },
]

/* ─── Branch mesh ────────────────────────────────────────────────────── */
function Branch({ az, ay, len, thick, droop, lr = 0, lc = '#2d7a4f', lwc = '#52b788' }) {
  const geo = useMemo(
    () => new THREE.CylinderGeometry(thick * 0.35, thick, len, 7, 1),
    [thick, len]
  )
  const rot = useMemo(() => {
    const q = new THREE.Quaternion()
    q.setFromEuler(new THREE.Euler(0, 0, -Math.PI / 2))
    const drQ = new THREE.Quaternion().setFromEuler(new THREE.Euler(droop * 0.5, 0, 0))
    q.premultiply(drQ)
    return q
  }, [droop])
  const euler = useMemo(() => new THREE.Euler().setFromQuaternion(rot), [rot])

  return (
    <group position={[0, ay, 0]} rotation={[0, -az, 0]}>
      <mesh rotation={euler} position={[len * 0.5, 0, 0]} castShadow>
        <primitive object={geo} />
        <meshStandardMaterial color="#5c3317" roughness={0.9} metalness={0} flatShading />
      </mesh>
      <mesh rotation={euler} position={[len * 0.5, 0, 0]}>
        <primitive object={geo} />
        <meshBasicMaterial color="#3a1f09" wireframe transparent opacity={0.20} />
      </mesh>
      {lr > 0 && (
        <FoliageCluster
          position={[len, 0, 0]}
          radius={lr}
          density={4}
          color={lc}
          wireColor={lwc}
        />
      )}
    </group>
  )
}

/* ─── Base branches: 4 big low sprawlers, graduated sizes ─────────── */
const BASE_BRANCHES = [
  { az: Math.PI*0.00, ay: 0.4, len: 4.6, thick: 0.24, droop: 0, lr: 0.78, lc: '#163d22', lwc: '#30724c' },
  { az: Math.PI*0.50, ay: 0.6, len: 4.2, thick: 0.22, droop: 0, lr: 0.72, lc: '#173f24', lwc: '#32764e' },
  { az: Math.PI*1.00, ay: 0.5, len: 4.4, thick: 0.23, droop: 0, lr: 0.75, lc: '#153b20', lwc: '#2e704a' },
  { az: Math.PI*1.50, ay: 0.7, len: 4.0, thick: 0.21, droop: 0, lr: 0.70, lc: '#163e22', lwc: '#30744c' },
]

/* ─── Bottom fork: trunk dramatically splits near visible base ────────── */
function BottomFork() {
  const leftGeo  = useMemo(() => new THREE.CylinderGeometry(0.32, 0.80, 4.2, 8, 2), [])
  const rightGeo = useMemo(() => new THREE.CylinderGeometry(0.28, 0.75, 4.0, 8, 2), [])
  const backGeo  = useMemo(() => new THREE.CylinderGeometry(0.25, 0.65, 3.6, 8, 2), [])

  return (
    <group position={[0, 0.4, 0]}>
      {/* Main left split — wide lean */}
      <group rotation={[0.14, 0, 0.72]}>
        <mesh position={[0, 2.1, 0]} castShadow>
          <primitive object={leftGeo} />
          <meshStandardMaterial color="#5c3317" roughness={0.90} metalness={0} flatShading />
        </mesh>
        <mesh position={[0, 2.1, 0]}>
          <primitive object={leftGeo} />
          <meshBasicMaterial color="#3a1f09" wireframe transparent opacity={0.18} />
        </mesh>
        <FoliageCluster position={[0, 2.6, 0]}  radius={0.58} density={4} color="#183e24" wireColor="#347a4e" />
        <FoliageCluster position={[0, 4.2, 0]} radius={0.62} density={5} color="#163c22" wireColor="#30764a" />
      </group>

      {/* Main right split */}
      <group rotation={[-0.14, Math.PI * 0.35, -0.68]}>
        <mesh position={[0, 2.0, 0]} castShadow>
          <primitive object={rightGeo} />
          <meshStandardMaterial color="#5c3317" roughness={0.90} metalness={0} flatShading />
        </mesh>
        <mesh position={[0, 2.0, 0]}>
          <primitive object={rightGeo} />
          <meshBasicMaterial color="#3a1f09" wireframe transparent opacity={0.18} />
        </mesh>
        <FoliageCluster position={[0, 2.4, 0]}  radius={0.55} density={4} color="#173e24" wireColor="#32784c" />
        <FoliageCluster position={[0, 4.0, 0]} radius={0.60} density={5} color="#153a20" wireColor="#307248" />
      </group>

      {/* Back third fork */}
      <group rotation={[0.65, Math.PI * 0.88, 0.10]}>
        <mesh position={[0, 1.8, 0]} castShadow>
          <primitive object={backGeo} />
          <meshStandardMaterial color="#5c3317" roughness={0.90} metalness={0} flatShading />
        </mesh>
        <mesh position={[0, 1.8, 0]}>
          <primitive object={backGeo} />
          <meshBasicMaterial color="#3a1f09" wireframe transparent opacity={0.18} />
        </mesh>
        <FoliageCluster position={[0, 3.6, 0]} radius={0.60} density={4} color="#163c22" wireColor="#307449" />
      </group>
    </group>
  )
}

/* ─── Main canopy foliage clusters ───────────────────────────────────── */
const FOLIAGE_CLUSTERS = [
  // ── Bottom ring of canopy ──
  { pos: [ 2.6, 6.2,  0.0], r: 0.95, d: 5, c: '#2d7a4f', wc: '#52b788' },
  { pos: [ 1.3, 6.3,  2.3], r: 0.90, d: 5, c: '#338855', wc: '#5ac48a' },
  { pos: [-1.2, 6.1,  2.5], r: 0.95, d: 5, c: '#2a7548', wc: '#4fb87e' },
  { pos: [-2.5, 6.0,  0.2], r: 1.00, d: 5, c: '#2e7d50', wc: '#54ba85' },
  { pos: [-1.4, 6.2, -2.2], r: 0.90, d: 5, c: '#327a4c', wc: '#56b882' },
  { pos: [ 1.0, 6.4, -2.4], r: 0.95, d: 5, c: '#2b7a4a', wc: '#50b680' },
  // ── Mid ring ──
  { pos: [ 2.0, 6.9,  1.4], r: 0.85, d: 4, c: '#358c5a', wc: '#62c892' },
  { pos: [-0.2, 6.8,  2.2], r: 0.80, d: 4, c: '#3a9060', wc: '#68cc98' },
  { pos: [-2.0, 6.7, -1.2], r: 0.85, d: 4, c: '#348858', wc: '#60c690' },
  { pos: [ 0.8, 7.0, -1.8], r: 0.80, d: 4, c: '#389060', wc: '#66ca96' },
  { pos: [ 1.8, 6.8, -0.8], r: 0.80, d: 4, c: '#368d5c', wc: '#64c894' },
  { pos: [-1.6, 7.0,  1.0], r: 0.80, d: 4, c: '#378e5e', wc: '#64ca96' },
  // ── Upper dome ──
  { pos: [ 1.0, 7.6,  0.6], r: 0.90, d: 5, c: '#40966a', wc: '#72d4a0' },
  { pos: [-0.8, 7.5, -0.6], r: 0.90, d: 5, c: '#3e9468', wc: '#70d29e' },
  { pos: [ 0.2, 7.4,  1.2], r: 0.85, d: 4, c: '#3c9266', wc: '#6ed09c' },
  { pos: [-0.4, 7.7, -1.0], r: 0.85, d: 4, c: '#3a9064', wc: '#6cce9a' },
  // ── Crown ──
  { pos: [ 0.0, 8.3,  0.0], r: 1.10, d: 6, c: '#48a074', wc: '#80deb0' },
  { pos: [ 0.4, 8.8,  0.2], r: 0.75, d: 4, c: '#4ca878', wc: '#86e2b4' },
  { pos: [-0.3, 8.6, -0.2], r: 0.80, d: 4, c: '#4aa676', wc: '#84e0b2' },
]

export default function LifeTree() {
  const rootRef = useRef()

  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    if (rootRef.current) {
      rootRef.current.rotation.z = Math.sin(t * 0.28) * 0.008
      rootRef.current.rotation.x = Math.sin(t * 0.19) * 0.005
    }
  })

  return (
    <group ref={rootRef} position={[0, -4.0, 0]}>

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

      {/* Bottom fork — dramatic 3-way split at trunk base */}
      <BottomFork />

      {/* Huge base branches — fill the wide lower trunk area */}
      {BASE_BRANCHES.map((b, i) => (
        <Branch key={`base-${i}`} {...b} />
      ))}

      {/* Mid-trunk branches */}
      {MID_BRANCHES.map((b, i) => (
        <Branch key={`mid-${i}`} {...b} />
      ))}

      {/* Near-canopy branches */}
      {BRANCHES.map((b, i) => (
        <Branch key={`top-${i}`} {...b} />
      ))}

      {/* Main canopy foliage */}
      {FOLIAGE_CLUSTERS.map((f, i) => (
        <FoliageCluster key={i} position={f.pos} radius={f.r} density={f.d} color={f.c} wireColor={f.wc} />
      ))}

    </group>
  )
}

