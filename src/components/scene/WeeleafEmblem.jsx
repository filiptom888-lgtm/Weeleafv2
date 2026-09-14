import React from 'react'
import { useThree } from '@react-three/fiber'
import { Billboard, useTexture } from '@react-three/drei'
import * as THREE from 'three'

/** Flip to true to restore the old center tree without deleting LifeTree.jsx */
const USE_TREE = false
export { USE_TREE }

const LEAF_ASPECT = 238 / 500

/** Static illustrated leaf at the scene center. */
export default function WeeleafEmblem() {
  const { size } = useThree()
  const mobile = size.width < 768
  const scale = mobile ? 2.9 : 3.7

  const map = useTexture('/weeleaf-leaf.png?v=3')
  map.colorSpace = THREE.SRGBColorSpace
  map.anisotropy = 8

  const height = 2
  const width = height * LEAF_ASPECT

  return (
    <Billboard follow position={[0, 0.35, 0]} scale={scale}>
      <mesh>
        <planeGeometry args={[width, height]} />
        <meshBasicMaterial map={map} transparent alphaTest={0.12} side={THREE.FrontSide} depthWrite />
      </mesh>
      <mesh rotation={[0, Math.PI, 0]}>
        <planeGeometry args={[width, height]} />
        <meshBasicMaterial map={map} transparent alphaTest={0.12} side={THREE.FrontSide} depthWrite />
      </mesh>
    </Billboard>
  )
}
