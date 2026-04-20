import React from 'react'
import useStore from '../../store/useStore'
import Coin3D from './Coin3D'

export default function OrbitingCoins() {
  const coins = useStore((s) => s.coins)
  return (
    <group>
      {coins.map((coin) => (
        <Coin3D key={coin.id} coin={coin} />
      ))}
    </group>
  )
}
