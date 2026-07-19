import React, { Suspense, useEffect, useRef, useState } from 'react'
import useStore from './store/useStore'
import Scene from './components/scene/Scene'
import Modal from './components/ui/Modal'
import MainSceneBackground from './components/ui/MainSceneBackground'
import LeafyAssistant from './components/ui/LeafyAssistant'
import ChatBot from './components/ui/ChatBot'
import ScrollHint from './components/ui/ScrollHint'
import HUD from './components/ui/HUD'

function LoadingScreen() {
  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center"
      style={{ background: 'linear-gradient(135deg, #050f08 0%, #0a1f10 50%, #061209 100%)' }}
    >
      <div className="text-center space-y-5">
        {/* Spinning ring */}
        <div className="relative w-20 h-20 mx-auto">
          <div
            className="absolute inset-0 rounded-full border-2 animate-spin"
            style={{ borderColor: 'rgba(74,222,128,0.15)', borderTopColor: '#4ade80' }}
          />
          <div
            className="absolute inset-3 rounded-full border animate-spin"
            style={{
              borderColor: 'rgba(74,222,128,0.08)',
              borderRightColor: '#22c55e',
              animationDirection: 'reverse',
              animationDuration: '0.8s',
            }}
          />
          {/* WL centre */}
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-green-400 font-bold text-xs tracking-widest">WL</span>
          </div>
        </div>

        <div>
          <div className="text-white font-bold text-2xl tracking-[0.3em]">WEELEAF</div>
          <div className="text-green-500/50 text-xs tracking-[0.4em] uppercase mt-2">
            Growing the future…
          </div>
        </div>
      </div>
    </div>
  )
}

export default function App() {
  const isModalOpen = useStore((s) => s.isModalOpen)
  const [sceneBgKey, setSceneBgKey] = useState(0)
  const wasModalOpen = useRef(false)

  useEffect(() => {
    useStore.getState().syncSystemCoins()
    useStore.getState().loadFromApi().then((res) => {
      if (!res?.ok) {
        fetch('/wl-config.json?v=' + Date.now())
          .then((r) => (r.ok ? r.json() : null))
          .then((data) => {
            if (data && Object.keys(data).length > 0) useStore.getState().applyRemoteConfig(data)
            else useStore.getState().syncSystemCoins()
          })
          .catch(() => {})
      }
    })
  }, [])

  // Remount main Vanta after modal closes; hide 3D scene while modal clouds use WebGL
  useEffect(() => {
    if (wasModalOpen.current && !isModalOpen) {
      setSceneBgKey((k) => k + 1)
    }
    wasModalOpen.current = isModalOpen
  }, [isModalOpen])

  return (
    <div className="relative w-screen h-screen overflow-hidden select-none">
      {!isModalOpen && <MainSceneBackground key={`scene-bg-${sceneBgKey}`} />}

      <div className="relative z-10 w-full h-full">
        {!isModalOpen && (
          <Suspense fallback={<LoadingScreen />}>
            <Scene />
          </Suspense>
        )}

        <HUD />
        <Modal />
        <LeafyAssistant />
        <ChatBot />
        <ScrollHint />
      </div>
    </div>
  )
}
