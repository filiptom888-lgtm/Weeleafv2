import React, { useEffect } from 'react'
import { useThree } from '@react-three/fiber'
import { Billboard, useTexture } from '@react-three/drei'
import * as THREE from 'three'

const LEAFY_ASPECT = 553 / 705

/**
 * Decorative Leafy in the orbit centre — same slot as the old leaf.
 * Not clickable; the corner Leafy stays the interactive one.
 */
export default function CenterLeafy() {
  const { size, gl } = useThree()
  const mobile = size.width < 768
  const texture = useTexture('/leafy-center.png')

  useEffect(() => {
    texture.colorSpace = THREE.SRGBColorSpace
    texture.anisotropy = Math.min(16, gl.capabilities.getMaxAnisotropy())
    texture.generateMipmaps = true
    texture.minFilter = THREE.LinearMipmapLinearFilter
    texture.magFilter = THREE.LinearFilter
    texture.needsUpdate = true
  }, [texture, gl])

  const height = mobile ? 6.5 : 7.4
  const width = height * LEAFY_ASPECT

  return (
    <Billboard follow position={[0, 0.15, 0]} scale={1}>
      <mesh raycast={() => null}>
        <planeGeometry args={[width, height]} />
        <meshBasicMaterial
          map={texture}
          transparent
          alphaTest={0.08}
          depthWrite
          toneMapped={false}
          side={THREE.FrontSide}
        />
      </mesh>
      <mesh raycast={() => null} rotation={[0, Math.PI, 0]}>
        <planeGeometry args={[width, height]} />
        <meshBasicMaterial
          map={texture}
          transparent
          alphaTest={0.08}
          depthWrite
          toneMapped={false}
          side={THREE.FrontSide}
        />
      </mesh>
    </Billboard>
  )
}
