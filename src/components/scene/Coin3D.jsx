import React, { useRef, useState, useCallback, useMemo, useEffect } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Billboard, Text } from '@react-three/drei'
import * as THREE from 'three'

import useStore from '../../store/useStore'
import { getCachedTexture, preloadTexture, applyCoinAnisotropy } from '../../utils/textureCache'
import { orbitState } from '../../data/orbitState'
import { ORBIT_RADIUS, ORBIT_HEIGHT } from '../../data/coinData'

const COIN_RADIUS = 0.98

export default function Coin3D({ coin }) {
  const wrapperRef = useRef()
  const meshRef = useRef()
  const scaleRef = useRef(1)
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

    wrapperRef.current.position.set(
      Math.cos(totalRad) * ORBIT_RADIUS,
      ORBIT_HEIGHT,
      Math.sin(totalRad) * ORBIT_RADIUS
    )

    const focused = orbitState.focusedId === coin.id
    const targetScale = isActive ? 1.34 : focused || hoveredRef.current ? 1.22 : 1.0
    scaleRef.current += (targetScale - scaleRef.current) * 0.14
    wrapperRef.current.scale.setScalar(scaleRef.current)

    if (meshRef.current && !coin.imageUrl) {
      const baseEmi = isActive ? 0.7 : hoveredRef.current || focused ? 0.45 : 0.14
      meshRef.current.material.emissiveIntensity =
        baseEmi + Math.sin(t * (isActive ? 4 : 1.2) + coinAngleRad) * 0.1
    }
  })

  const handleClick = useCallback(() => {
    if (isActive && useStore.getState().isModalOpen) {
      useStore.getState().closeModal()
    } else {
      setActiveCoin(coin)
    }
  }, [coin, isActive, setActiveCoin])

  const handlePointerOver = useCallback(() => {
    hoveredRef.current = true
    document.body.style.cursor = 'pointer'
  }, [])

  const handlePointerOut = useCallback(() => {
    hoveredRef.current = false
    document.body.style.cursor = 'default'
  }, [])

  return (
    <group ref={wrapperRef}>
      <Billboard>

        {/* Coin disc — hidden when image is present */}
        {!coin.imageUrl && (
          <mesh
            ref={meshRef}
            onClick={handleClick}
            onPointerOver={handlePointerOver}
            onPointerOut={handlePointerOut}
          >
            <circleGeometry args={[COIN_RADIUS, 96]} />
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
            <ringGeometry args={[COIN_RADIUS * 0.88, COIN_RADIUS, 96]} />
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
            <circleGeometry args={[COIN_RADIUS, 96]} />
            <meshBasicMaterial color="#000000" transparent opacity={0} side={THREE.DoubleSide} />
          </mesh>
        )}
        {coin.imageUrl && <CoinImage url={coin.imageUrl} radius={COIN_RADIUS} fallbackColor={coin.color} />}

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
      </Billboard>
    </group>
  )
}

/* ─── Optional image overlay on coin face ───────────────────────────── */
function CoinImage({ url, radius, fallbackColor = '#4ade80' }) {
  const { gl } = useThree()
  const [texture, setTexture] = useState(() => getCachedTexture(url))

  useEffect(() => {
    const cached = getCachedTexture(url)
    if (cached) {
      applyCoinAnisotropy(cached, gl)
      setTexture(cached)
      return undefined
    }
    let cancelled = false
    preloadTexture(url).then((t) => {
      if (!cancelled && t) {
        applyCoinAnisotropy(t, gl)
        setTexture(t)
      }
    })
    return () => {
      cancelled = true
    }
  }, [url, gl])

  return (
    <mesh position={[0, 0, 0.005]}>
      <circleGeometry args={[radius * 0.88, 96]} />
      <meshBasicMaterial
        map={texture || undefined}
        color={texture ? '#ffffff' : fallbackColor}
        transparent
        opacity={texture ? 1 : 0.85}
        side={THREE.DoubleSide}
      />
    </mesh>
  )
}
