import React, { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

const PARTICLE_COUNT = 90

export default function Particles() {
  const posAttrRef = useRef()

  const { initialPos, speeds, phases } = useMemo(() => {
    const initialPos = new Float32Array(PARTICLE_COUNT * 3)
    const speeds = new Float32Array(PARTICLE_COUNT)
    const phases = new Float32Array(PARTICLE_COUNT)

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const angle = Math.random() * Math.PI * 2
      const radius = 0.4 + Math.random() * 3.0
      initialPos[i * 3 + 0] = Math.cos(angle) * radius
      initialPos[i * 3 + 1] = -2.5 + Math.random() * 11
      initialPos[i * 3 + 2] = Math.sin(angle) * radius
      speeds[i] = 0.25 + Math.random() * 0.55
      phases[i] = Math.random() * Math.PI * 2
    }
    return { initialPos, speeds, phases }
  }, [])

  // Working copy that gets mutated every frame
  const workPos = useMemo(() => initialPos.slice(), [initialPos])

  useFrame(({ clock }) => {
    if (!posAttrRef.current) return
    const t = clock.elapsedTime
    const arr = posAttrRef.current.array

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const rise = ((t * speeds[i] * 0.25) % 13) - 1
      arr[i * 3 + 0] = initialPos[i * 3 + 0] + Math.sin(t * 0.25 + phases[i]) * 0.22
      arr[i * 3 + 1] = initialPos[i * 3 + 1] + rise + Math.sin(t * speeds[i] + phases[i]) * 0.25
      arr[i * 3 + 2] = initialPos[i * 3 + 2] + Math.cos(t * 0.18 + phases[i]) * 0.18
    }
    posAttrRef.current.needsUpdate = true
  })

  return (
    <points>
      <bufferGeometry>
        <bufferAttribute
          ref={posAttrRef}
          attach="attributes-position"
          count={PARTICLE_COUNT}
          array={workPos}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.055}
        color="#86efac"
        transparent
        opacity={0.75}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  )
}
