import React, { useEffect, useRef, useMemo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Sky, AdaptiveDpr, AdaptiveEvents } from '@react-three/drei'
import * as THREE from 'three'
import { gsap } from 'gsap'

import LifeTree from './LifeTree'
import OrbitingCoins from './OrbitingCoins'

import { orbitState } from '../../data/orbitState'

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

function SceneContents() {
  return (
    <>
      <Lighting />
      <Sky sunPosition={[100, 20, 60]} turbidity={4} rayleigh={0.2} mieCoefficient={0.02} mieDirectionalG={0.9} />
      <LifeTree />
      <OrbitingCoins />
      <GroundPlane />
      <Grass />
    </>
  )
}

export default function Scene() {
  useEffect(() => {
    const handleWheel = (e) => {
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
      touchStartX = e.touches[0].clientX
    }
    const handleTouchMove = (e) => {
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
      camera={{ position: [0, 4, 13], fov: 52, near: 0.1, far: 100 }}
      shadows
      style={{ position: 'absolute', inset: 0 }}
      gl={{
        antialias: true,
        powerPreference: 'high-performance',
        alpha: false,
      }}
      onCreated={({ gl, scene }) => {
        gl.setClearColor(new THREE.Color('#e8d5b0'))
        gl.toneMapping = THREE.ACESFilmicToneMapping
        gl.toneMappingExposure = 1.05
        scene.background = new THREE.Color('#e8d5b0')
      }}
    >
      <AdaptiveDpr pixelated={false} />
      <AdaptiveEvents />
      <SceneContents />
    </Canvas>
  )
}
