import React, { useEffect, useRef, useMemo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { AdaptiveDpr, AdaptiveEvents } from '@react-three/drei'
import * as THREE from 'three'
import { gsap } from 'gsap'

import LifeTree from './LifeTree'
import OrbitingCoins from './OrbitingCoins'

import { orbitState } from '../../data/orbitState'
import useStore from '../../store/useStore'

function Lighting() {
  return (
    <>
      <ambientLight intensity={0.7} />
      <directionalLight
        position={[8, 18, 6]}
        intensity={1.4}
        castShadow
        shadow-mapSize={[512, 512]}
        shadow-camera-far={50}
        shadow-camera-left={-15}
        shadow-camera-right={15}
        shadow-camera-top={15}
        shadow-camera-bottom={-15}
      />
      {/* Warm fill from front */}
      <directionalLight position={[-5, 5, 8]} intensity={0.4} color="#ffe0a0" />
      {/* Tree glow point light */}
      <pointLight position={[0, 3, 0]} intensity={1.8} color="#4ade80" distance={12} decay={2} />
    </>
  )
}

function GroundPlane() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2.2, 0]} receiveShadow>
      <planeGeometry args={[400, 400]} />
      <meshStandardMaterial color="#4a7c3f" roughness={0.95} metalness={0} />
    </mesh>
  )
}

/* ─── Shader-based grass (merged geometry, GLSL wind) ────────────────── */
const BLADE_COUNT = 300000
const FIELD_SIZE = 160
const BLADE_WIDTH = 0.06
const BLADE_HEIGHT = 0.35
const BLADE_HEIGHT_VARIATION = 0.2
const VERTS_PER_BLADE = 3 // triangle: BL, BR, TIP

const grassVertexShader = `
  varying vec2 vUv;
  varying vec3 vColor;
  uniform float uTime;

  void main() {
    vUv = uv;
    vColor = color;
    vec3 cpos = position;

    // Gentle wind sway
    float waveSeed = position.x * 0.2 + position.z * 0.2;
    if (color.x > 0.6) {
      cpos.x += sin(uTime * 0.6 + waveSeed) * 0.06;
      cpos.z += cos(uTime * 0.5 + waveSeed * 0.7) * 0.03;
    } else if (color.x > 0.0) {
      cpos.x += sin(uTime * 0.6 + waveSeed) * 0.02;
      cpos.z += cos(uTime * 0.5 + waveSeed * 0.7) * 0.01;
    }

    gl_Position = projectionMatrix * modelViewMatrix * vec4(cpos, 1.0);
  }
`

const grassFragmentShader = `
  varying vec2 vUv;
  varying vec3 vColor;

  void main() {
    // Color from dark green at base to brighter green at tip
    vec3 baseColor = vec3(0.15, 0.38, 0.12);
    vec3 tipColor = vec3(0.30, 0.65, 0.22);
    vec3 col = mix(baseColor, tipColor, vColor.x);

    // Subtle variation
    col *= 0.9 + vColor.x * 0.2;

    gl_FragColor = vec4(col, 1.0);
  }
`

function generateGrassGeometry() {
  const totalVerts = BLADE_COUNT * VERTS_PER_BLADE
  const totalTris = BLADE_COUNT

  // Pre-allocate typed arrays (much faster than pushing to JS arrays)
  const positions = new Float32Array(totalVerts * 3)
  const colors = new Float32Array(totalVerts * 3)
  const indices = new Uint32Array(totalTris * 3)

  const halfField = FIELD_SIZE / 2

  for (let i = 0; i < BLADE_COUNT; i++) {
    const x = (Math.random() - 0.5) * FIELD_SIZE
    const z = (Math.random() - 0.5) * FIELD_SIZE
    const height = BLADE_HEIGHT + Math.random() * BLADE_HEIGHT_VARIATION

    const yaw = Math.random() * Math.PI * 2
    const sinY = Math.sin(yaw)
    const cosY = Math.cos(yaw)
    const hw = BLADE_WIDTH * 0.5

    // Slight random tip lean
    const tipLean = (Math.random() - 0.5) * 0.06

    const vBase = i * VERTS_PER_BLADE
    const p = vBase * 3
    const c = vBase * 3

    // BL vertex (base left)
    positions[p]     = x + sinY * hw
    positions[p + 1] = 0
    positions[p + 2] = z - cosY * hw
    colors[c]     = 0; colors[c + 1] = 0; colors[c + 2] = 0  // black = base

    // BR vertex (base right)
    positions[p + 3] = x - sinY * hw
    positions[p + 4] = 0
    positions[p + 5] = z + cosY * hw
    colors[c + 3] = 0; colors[c + 4] = 0; colors[c + 5] = 0  // black = base

    // TIP vertex
    positions[p + 6] = x + tipLean
    positions[p + 7] = height
    positions[p + 8] = z + tipLean
    colors[c + 6] = 1; colors[c + 7] = 1; colors[c + 8] = 1  // white = tip

    // Single triangle index
    const iBase = i * 3
    indices[iBase]     = vBase
    indices[iBase + 1] = vBase + 1
    indices[iBase + 2] = vBase + 2
  }

  const geom = new THREE.BufferGeometry()
  geom.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  geom.setAttribute('color', new THREE.BufferAttribute(colors, 3))
  geom.setIndex(new THREE.BufferAttribute(indices, 1))
  // Set bounding sphere so Three.js doesn't recompute it
  geom.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 0, 0), FIELD_SIZE)
  return geom
}

function Grass() {
  const materialRef = useRef()
  const geometry = useMemo(() => generateGrassGeometry(), [])

  useFrame(({ clock }) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = clock.elapsedTime
    }
  })

  return (
    <mesh geometry={geometry} position={[0, -2.2, 0]}>
      <shaderMaterial
        ref={materialRef}
        vertexShader={grassVertexShader}
        fragmentShader={grassFragmentShader}
        uniforms={{ uTime: { value: 0 } }}
        vertexColors
        side={THREE.FrontSide}
      />
    </mesh>
  )
}

/* ─── Gradient sky background ───────────────────────────────────────── */
const skyVert = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`
const skyFrag = `
  varying vec2 vUv;
  void main() {
    // Sundown palette — earthy brown/amber tones
    vec3 bottom = vec3(0.78, 0.58, 0.32);  // warm caramel/brown at ground
    vec3 horiz  = vec3(0.72, 0.48, 0.28);  // toasted amber at horizon
    vec3 mid    = vec3(0.52, 0.32, 0.22);  // deep mocha mid-sky
    vec3 top    = vec3(0.22, 0.16, 0.20);  // dark warm charcoal at top

    // Sun-side warm burst (upper right)
    float sunWarmX = smoothstep(0.10, 0.85, vUv.x);
    float sunWarmY = smoothstep(0.20, 0.85, vUv.y);
    float sunWarm  = sunWarmX * sunWarmY * 0.60;

    // Orange-gold horizon haze lower-right
    float hazeX = smoothstep(0.0, 1.0, vUv.x);
    float hazeY = smoothstep(0.55, 0.0, vUv.y);
    float haze  = hazeX * hazeY;

    // Vertical gradient — warm horizon pushed to lower third
    vec3 color;
    float y = vUv.y;
    if (y < 0.12) {
      color = mix(bottom, horiz, y / 0.12);
    } else if (y < 0.35) {
      color = mix(horiz, mid, (y - 0.12) / 0.23);
    } else {
      color = mix(mid, top, (y - 0.35) / 0.65);
    }

    // Sun-side warm burst (upper right)
    color = mix(color, vec3(0.95, 0.72, 0.32), sunWarm * 0.40);
    // Horizon haze
    color = mix(color, vec3(0.88, 0.55, 0.22), haze * 0.28);

    gl_FragColor = vec4(color, 1.0);
  }
`
function SceneBackground() {
  return (
    <mesh position={[0, 0, -50]} renderOrder={-20}>
      <planeGeometry args={[200, 110]} />
      <shaderMaterial
        vertexShader={skyVert}
        fragmentShader={skyFrag}
        depthWrite={false}
      />
    </mesh>
  )
}

/* ─── Sunburst — warm golden rays behind the scene ──────────────────── */
const sunburstVert = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`
const sunburstFrag = `
  varying vec2 vUv;
  uniform float uTime;

  void main() {
    vec2 sunUV = vec2(0.72, 0.42);
    vec2 d = vUv - sunUV;
    float dist = length(d);

    // Wide atmospheric wash — very large, very soft
    float atmosphere = smoothstep(0.90, 0.0, dist);
    // Middle corona
    float corona     = smoothstep(0.35, 0.0, dist);
    // Inner halo ring
    float halo       = smoothstep(0.14, 0.0, dist);
    // Bright core
    float core       = smoothstep(0.04, 0.0, dist);

    vec3 atmosCol = vec3(1.0, 0.88, 0.55);
    vec3 coronaCol= vec3(1.0, 0.78, 0.32);
    vec3 haloCol  = vec3(1.0, 0.92, 0.60);
    vec3 coreCol  = vec3(1.0, 0.98, 0.88);

    vec3 color = atmosCol;
    color = mix(color, coronaCol, clamp(corona, 0.0, 1.0));
    color = mix(color, haloCol,   clamp(halo,   0.0, 1.0));
    color = mix(color, coreCol,   clamp(core,   0.0, 1.0));

    float alpha = clamp(
      atmosphere * 0.18 +
      corona     * 0.22 +
      halo       * 0.28 +
      core       * 0.45,
      0.0, 0.55
    );

    gl_FragColor = vec4(color, alpha);
  }
`
function SunBurst() {
  const matRef = useRef()
  useFrame(({ clock }) => {
    if (matRef.current) matRef.current.uniforms.uTime.value = clock.elapsedTime
  })
  return (
    <mesh position={[0, 0, -48]} renderOrder={-10}>
      <planeGeometry args={[160, 90]} />
      <shaderMaterial
        ref={matRef}
        vertexShader={sunburstVert}
        fragmentShader={sunburstFrag}
        uniforms={{ uTime: { value: 0 } }}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  )
}

/* ─── Low-poly 3D mountains (matches tree's flatShading + wireframe) ─── */
function buildMountainGeo(seed, cols, rows, width, maxPeak, jitterScale, zDepth) {
  // Seeded deterministic noise
  function noise(x) {
    const i = Math.floor(x)
    const f = x - i
    const u = f * f * (3 - 2 * f)
    const va = Math.abs(Math.sin((i      + seed) * 127.1 + 311.7) * 43758.5453) % 1
    const vb = Math.abs(Math.sin((i + 1  + seed) * 127.1 + 311.7) * 43758.5453) % 1
    return va + (vb - va) * u
  }

  // Jagged ridge profile: 0..1 for x in 0..1
  function profile(x) {
    let h = 0
    h += 0.42 * (1 - Math.abs(2 * noise(x * 2.1) - 1))
    h += 0.26 * (1 - Math.abs(2 * noise(x * 4.5) - 1))
    h += 0.16 * (1 - Math.abs(2 * noise(x * 9.3) - 1))
    h += 0.10 * noise(x * 18.7)
    h += 0.06 * noise(x * 36.1)
    return Math.min(Math.max(h, 0), 1)
  }

  function rng(n) { return Math.abs(Math.sin(n * 73.1 + seed * 31.7) * 43758.5453) % 1 }

  // Build grid vertices
  const gx = [], gy = [], gz = []
  for (let row = 0; row <= rows; row++) {
    for (let col = 0; col <= cols; col++) {
      const t   = col / cols
      const x   = (t - 0.5) * width
      const frac = row / rows
      const peakH = profile(t) * maxPeak
      const y   = frac * peakH

      const jAmt = jitterScale * Math.sin(frac * Math.PI)
      const idx  = col * 1000 + row
      const jx = (rng(idx * 1.0) - 0.5) * jAmt * 5
      const jy = (rng(idx * 2.3) - 0.5) * jAmt * 1.4
      const jz = (rng(idx * 3.7) - 0.5) * jAmt * zDepth

      gx.push(x  + (row > 0 ? jx : 0))
      gy.push(y  + (row > 0 ? jy : 0))
      gz.push(row > 0 ? jz : 0)
    }
  }

  // Build non-indexed triangles for flat shading
  const positions = [], colors = []
  const stride = cols + 1

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const i00 = row * stride + col
      const i10 = i00 + 1
      const i01 = (row + 1) * stride + col
      const i11 = i01 + 1

      for (const [a, b, c] of [[i00, i10, i01], [i10, i11, i01]]) {
        const avgY = (gy[a] + gy[b] + gy[c]) / 3
        const relH = avgY / maxPeak  // 0..1

        let r, g, bl
        if (relH > 0.82) {
          // Snow — pure white
          const t = (relH - 0.82) / 0.18
          r = 0.72 + t * 0.28; g = 0.74 + t * 0.26; bl = 0.76 + t * 0.24
        } else if (relH > 0.60) {
          // Light grey upper slope
          const t = (relH - 0.60) / 0.22
          r = 0.50 + t * 0.22; g = 0.52 + t * 0.22; bl = 0.54 + t * 0.22
        } else if (relH > 0.35) {
          // Mid grey
          const t = (relH - 0.35) / 0.25
          r = 0.34 + t * 0.16; g = 0.34 + t * 0.18; bl = 0.36 + t * 0.18
        } else {
          // Dark grey / charcoal base
          const t = relH / 0.35
          r = 0.14 + t * 0.20; g = 0.14 + t * 0.20; bl = 0.15 + t * 0.21
        }

        for (const vi of [a, b, c]) {
          positions.push(gx[vi], gy[vi], gz[vi])
          colors.push(r, g, bl)
        }
      }
    }
  }

  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
  geo.setAttribute('color',    new THREE.Float32BufferAttribute(colors, 3))
  geo.computeVertexNormals()
  return geo
}

function MountainRange({ posY, posZ, seed, cols, rows, width, maxPeak, jitter, zDepth, wireOpacity }) {
  const geo = useMemo(
    () => buildMountainGeo(seed, cols, rows, width, maxPeak, jitter, zDepth),
    [seed, cols, rows, width, maxPeak, jitter, zDepth]
  )
  return (
    <group position={[0, posY, posZ]}>
      {/* Solid faceted mountain */}
      <mesh geometry={geo}>
        <meshStandardMaterial
          vertexColors
          flatShading
          roughness={0.88}
          metalness={0.04}
        />
      </mesh>
      {/* Wireframe overlay — same style as tree */}
      <mesh geometry={geo}>
        <meshBasicMaterial color="#1a1a2a" wireframe transparent opacity={wireOpacity} />
      </mesh>
    </group>
  )
}

function Mountains() {
  return (
    <>
      {/* Base-fill skirt — dark plane in front of mountains that hides the gap
          where the mountain base meets the background sky */}
      <mesh position={[0, -55, -33]}>
        <planeGeometry args={[500, 40]} />
        <meshStandardMaterial color="#1a1a1e" roughness={1} metalness={0} />
      </mesh>

      {/* Far misty range — softer, rolled peaks, lighter */}
      <MountainRange
        posY={-50} posZ={-50}
        seed={5.0} cols={44} rows={12} width={240}
        maxPeak={62} jitter={1.2} zDepth={3}
        wireOpacity={0.06}
      />
      {/* Main dramatic range — sits right at the horizon split */}
      <MountainRange
        posY={-50} posZ={-44}
        seed={1.0} cols={52} rows={14} width={220}
        maxPeak={70} jitter={1.6} zDepth={5}
        wireOpacity={0.10}
      />
      {/* Near foothills — dark, fills bottom edge */}
      <MountainRange
        posY={-50} posZ={-38}
        seed={9.0} cols={36} rows={8}  width={200}
        maxPeak={44} jitter={1.0} zDepth={4}
        wireOpacity={0.08}
      />
    </>
  )
}

function SceneContents() {
  return (
    <>
      <Lighting />
      <LifeTree />
      <OrbitingCoins />
    </>
  )
}

export default function Scene() {
  const isModalOpen = useStore((s) => s.isModalOpen)

  useEffect(() => {
    const isModalOpen = () => useStore.getState().isModalOpen

    const handleWheel = (e) => {
      // Let the modal (or any scrollable overlay) handle its own scroll
      if (isModalOpen()) return
      e.preventDefault()
      const delta = e.deltaX !== 0 ? e.deltaX : e.deltaY
      gsap.to(orbitState, {
        angle: orbitState.angle + delta * 0.09,
        duration: 0.9,
        ease: 'power2.out',
        overwrite: 'auto',
      })
    }

    let touchStartX = 0
    const handleTouchStart = (e) => {
      if (isModalOpen()) return
      touchStartX = e.touches[0].clientX
    }
    const handleTouchMove = (e) => {
      if (isModalOpen()) return
      const dx = touchStartX - e.touches[0].clientX
      touchStartX = e.touches[0].clientX
      gsap.to(orbitState, {
        angle: orbitState.angle + dx * 0.35,
        duration: 0.6,
        ease: 'power2.out',
        overwrite: 'auto',
      })
    }

    window.addEventListener('wheel', handleWheel, { passive: false })
    window.addEventListener('touchstart', handleTouchStart, { passive: true })
    window.addEventListener('touchmove', handleTouchMove, { passive: true })

    return () => {
      window.removeEventListener('wheel', handleWheel)
      window.removeEventListener('touchstart', handleTouchStart)
      window.removeEventListener('touchmove', handleTouchMove)
    }
  }, [])

  return (
    <Canvas
      frameloop={isModalOpen ? 'never' : 'always'}
      camera={{ position: [0, 1.5, 15], fov: 50, near: 0.1, far: 100 }}
      shadows
      style={{ position: 'absolute', inset: 0 }}
      gl={{
        antialias: true,
        powerPreference: 'high-performance',
        alpha: true,
      }}
      onCreated={({ gl, scene }) => {
        gl.setClearColor(0x000000, 0)
        gl.toneMapping = THREE.ACESFilmicToneMapping
        gl.toneMappingExposure = 1.05
        scene.background = null
      }}
    >
      <AdaptiveDpr pixelated={false} />
      <AdaptiveEvents />
      <SceneContents />
    </Canvas>
  )
}
