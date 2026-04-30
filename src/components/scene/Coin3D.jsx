import React, { useRef, useState, useCallback, useMemo, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import { Billboard, Text } from '@react-three/drei'
import * as THREE from 'three'
import { gsap } from 'gsap'

import useStore from '../../store/useStore'
import { orbitState } from '../../data/orbitState'
import { ORBIT_RADIUS, ORBIT_HEIGHT } from '../../data/coinData'

const COIN_RADIUS = 0.68

// Active coin floats in front of camera at this world position
const ACTIVE_POS = new THREE.Vector3(0, 1.2, 6.5)

export default function Coin3D({ coin }) {
  const wrapperRef = useRef()
  const meshRef = useRef()

  // Smooth lerp targets (mutable refs — no react state, no re-renders)
  const posRef = useRef(new THREE.Vector3())
  const scaleRef = useRef(1)

  const [hovered, setHovered] = useState(false)
  const hoveredRef = useRef(false)

  const setActiveCoin = useStore((s) => s.setActiveCoin)
  const activeCoin = useStore((s) => s.activeCoin)

  const isActive = activeCoin?.id === coin.id

  const coinAngleRad = useMemo(() => (coin.angle * Math.PI) / 180, [coin.angle])
  const coinColor = useMemo(() => new THREE.Color(coin.color), [coin.color])
  const emissiveColor = useMemo(() => new THREE.Color(coin.emissiveColor), [coin.emissiveColor])

  useFrame(({ clock }) => {
    if (!wrapperRef.current) return
    const t = clock.elapsedTime
    const totalRad = coinAngleRad + (orbitState.angle * Math.PI) / 180

    // Orbit position
    const orbitX = Math.cos(totalRad) * ORBIT_RADIUS
    const orbitZ = Math.sin(totalRad) * ORBIT_RADIUS
    const orbitY = ORBIT_HEIGHT

    // Target: center-stage if active, otherwise orbit
    const targetX = isActive ? ACTIVE_POS.x : orbitX
    const targetY = isActive ? ACTIVE_POS.y : orbitY
    const targetZ = isActive ? ACTIVE_POS.z : orbitZ

    // Smooth lerp (active coin snaps faster)
    const lerpAlpha = isActive ? 0.08 : 0.14
    posRef.current.x += (targetX - posRef.current.x) * lerpAlpha
    posRef.current.y += (targetY - posRef.current.y) * lerpAlpha
    posRef.current.z += (targetZ - posRef.current.z) * lerpAlpha
    wrapperRef.current.position.copy(posRef.current)

    // Scale — active coin is bigger, hovered coin is bigger
    const targetScale = isActive ? 1.55 : hoveredRef.current ? 1.22 : 1.0
    scaleRef.current += (targetScale - scaleRef.current) * 0.1
    wrapperRef.current.scale.setScalar(scaleRef.current)

    // Emissive intensity — only applies when disc is visible (no image)
    if (meshRef.current && !coin.imageUrl) {
      const baseEmi = isActive ? 0.7 : hoveredRef.current ? 0.45 : 0.14
      meshRef.current.material.emissiveIntensity =
        baseEmi + Math.sin(t * (isActive ? 4 : 1.2) + coinAngleRad) * 0.1
    }
  })

  const handleClick = useCallback(() => {
    if (isActive) {
      // Second click on active coin — deselect
      useStore.getState().closeModal()
    } else {
      setActiveCoin(coin)
    }
  }, [coin, isActive, setActiveCoin])

  const handlePointerOver = useCallback(() => {
    hoveredRef.current = true
    setHovered(true)
    document.body.style.cursor = 'pointer'
  }, [])

  const handlePointerOut = useCallback(() => {
    hoveredRef.current = false
    setHovered(false)
    document.body.style.cursor = 'default'
  }, [])

  return (
    <group ref={wrapperRef}>
      <Billboard>

        {/* Active ring pulse */}
        {isActive && (
          <mesh>
            <ringGeometry args={[COIN_RADIUS * 1.1, COIN_RADIUS * 1.45, 48]} />
            <meshBasicMaterial
              color={coin.color}
              transparent
              opacity={0.25}
              depthWrite={false}
              side={THREE.DoubleSide}
            />
          </mesh>
        )}

        {/* Coin disc — hidden when image is present */}
        {!coin.imageUrl && (
          <mesh
            ref={meshRef}
            onClick={handleClick}
            onPointerOver={handlePointerOver}
            onPointerOut={handlePointerOut}
          >
            <circleGeometry args={[COIN_RADIUS, 48]} />
            <meshStandardMaterial
              color={coinColor}
              metalness={0.88}
              roughness={0.14}
              emissive={emissiveColor}
              emissiveIntensity={0.14}
              side={THREE.DoubleSide}
            />
          </mesh>
        )}

        {/* Coin border ring — hidden when image is present */}
        {!coin.imageUrl && (
          <mesh>
            <ringGeometry args={[COIN_RADIUS * 0.88, COIN_RADIUS, 48]} />
            <meshBasicMaterial
              color={coin.color}
              transparent
              opacity={0.35}
              side={THREE.DoubleSide}
            />
          </mesh>
        )}

        {/* Image — covers full coin face with invisible click target */}
        {coin.imageUrl && (
          <mesh
            onClick={handleClick}
            onPointerOver={handlePointerOver}
            onPointerOut={handlePointerOut}
          >
            <circleGeometry args={[COIN_RADIUS, 48]} />
            <meshBasicMaterial color="#000000" transparent opacity={0} side={THREE.DoubleSide} />
          </mesh>
        )}
        {coin.imageUrl && <CoinImage url={coin.imageUrl} radius={COIN_RADIUS} />}

        {/* Main label — only shown when no image */}
        {!coin.imageUrl && (
          <Text
            position={[0, 0.08, 0.01]}
            fontSize={0.24}
            color="white"
            anchorX="center"
            anchorY="middle"
            outlineWidth={0.012}
            outlineColor="#000000"
            outlineOpacity={0.5}
          >
            {coin.label}
          </Text>
        )}

        {/* Subtitle below coin */}
        <Text
          position={[0, -COIN_RADIUS - 0.26, 0]}
          fontSize={0.118}
          color={isActive ? coin.color : '#ffffff'}
          fillOpacity={isActive ? 1 : 0.65}
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.008}
          outlineColor="#000000"
          outlineOpacity={0.45}
        >
          {coin.subtitle}
        </Text>

        {/* Active hint — click again to close */}
        {isActive && (
          <Text
            position={[0, -COIN_RADIUS - 0.46, 0]}
            fontSize={0.085}
            color="#ffffff55"
            anchorX="center"
            anchorY="middle"
          >
            click again to dismiss
          </Text>
        )}
      </Billboard>
    </group>
  )
}

/* ─── Optional image overlay on coin face ───────────────────────────── */
function CoinImage({ url, radius }) {
  const meshRef = useRef()
  const [texture, setTexture] = useState(null)

  useEffect(() => {
    const loader = new THREE.TextureLoader()
    loader.load(url, (t) => {
      t.colorSpace = THREE.SRGBColorSpace
      setTexture(t)
    })
  }, [url])

  if (!texture) return null

  return (
    <mesh position={[0, 0, 0.005]}>
      <circleGeometry args={[radius * 0.88, 48]} />
      <meshBasicMaterial map={texture} transparent side={THREE.DoubleSide} />
    </mesh>
  )
}
