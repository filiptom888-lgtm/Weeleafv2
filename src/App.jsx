import React, { Suspense, useEffect } from 'react'
import useStore from './store/useStore'
import Scene from './components/scene/Scene'
import Modal from './components/ui/Modal'
import MainSceneBackground from './components/ui/MainSceneBackground'
import SceneTransition from './components/ui/SceneTransition'
import LeafyAssistant from './components/ui/LeafyAssistant'
import ChatBot from './components/ui/ChatBot'
import ScrollHint from './components/ui/ScrollHint'
import HUD from './components/ui/HUD'
import { preloadCoinImages } from './utils/textureCache'

function LoadingScreen() {
  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center"
      style={{ background: 'linear-gradient(135deg, #050f08 0%, #0a1f10 50%, #061209 100%)' }}
    >
      <div className="text-center space-y-5">
        <div className="relative w-20 h-20 mx-auto">
          <div
            className="absolute inset-0 rounded-full border-2 animate-spin"
            style={{ borderColor: 'rgba(74,222,128,0.15)', borderTopColor: '#4ade80' }}
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-green-400 font-bold text-xs tracking-widest">WL</span>
          </div>
        </div>
        <div className="text-white font-bold text-2xl tracking-[0.3em]">WEELEAF</div>
      </div>
    </div>
  )
}

export default function App() {
  const isModalOpen = useStore((s) => s.isModalOpen)
  const sceneRevealPhase = useStore((s) => s.sceneRevealPhase)
  const sceneVisible = sceneRevealPhase === 'visible'

  useEffect(() => {
    const store = useStore.getState()
    store.syncSystemCoins()
    preloadCoinImages(store.coins)

    store.loadFromApi().then((res) => {
      preloadCoinImages(useStore.getState().coins)
      if (!res?.ok) {
        fetch('/wl-config.json?v=' + Date.now())
          .then((r) => (r.ok ? r.json() : null))
          .then((data) => {
            if (data && Object.keys(data).length > 0) {
              useStore.getState().applyRemoteConfig(data)
              preloadCoinImages(useStore.getState().coins)
            } else {
              useStore.getState().syncSystemCoins()
            }
          })
          .catch(() => {})
      }
    })
  }, [])

  return (
    <div className="relative w-screen h-screen overflow-hidden select-none">
      <MainSceneBackground visible={sceneVisible} />

      <div
        className="absolute inset-0 z-10"
        style={{
          opacity: sceneVisible ? 1 : 0,
          pointerEvents: isModalOpen ? 'none' : 'auto',
          transition: 'opacity 0.4s ease-out',
        }}
      >
        <Suspense fallback={<LoadingScreen />}>
          <Scene />
        </Suspense>
        <HUD />
        <ScrollHint />
      </div>

      <SceneTransition />
      <Modal />
      <LeafyAssistant />
      <ChatBot />
    </div>
  )
}
