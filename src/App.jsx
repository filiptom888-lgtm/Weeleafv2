import React, { Suspense, useEffect, useState } from 'react'
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
          <div
            className="absolute inset-3 rounded-full border animate-spin"
            style={{
              borderColor: 'rgba(74,222,128,0.08)',
              borderRightColor: '#22c55e',
              animationDirection: 'reverse',
              animationDuration: '0.8s',
            }}
          />
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

async function bootApp() {
  const store = useStore.getState()
  store.syncSystemCoins()
  await preloadCoinImages(store.coins)

  const res = await store.loadFromApi()
  await preloadCoinImages(useStore.getState().coins)

  if (!res?.ok) {
    try {
      const r = await fetch('/wl-config.json?v=' + Date.now())
      if (r.ok) {
        const data = await r.json()
        if (data && Object.keys(data).length > 0) {
          useStore.getState().applyRemoteConfig(data)
          await preloadCoinImages(useStore.getState().coins)
        } else {
          useStore.getState().syncSystemCoins()
        }
      }
    } catch {
      /* offline fallback */
    }
  }
}

export default function App() {
  const isModalOpen = useStore((s) => s.isModalOpen)
  const sceneRevealPhase = useStore((s) => s.sceneRevealPhase)
  const sceneVisible = sceneRevealPhase === 'visible'
  const [appReady, setAppReady] = useState(false)

  useEffect(() => {
    let cancelled = false
    bootApp().finally(() => {
      if (!cancelled) setAppReady(true)
    })
    return () => {
      cancelled = true
    }
  }, [])

  if (!appReady) return <LoadingScreen />

  return (
    <div className="relative w-screen h-screen overflow-hidden select-none">
      <MainSceneBackground visible={sceneVisible} />

      {/* 3D scene + HUD — fades while modals are open */}
      <div
        className="absolute inset-0 z-10"
        style={{
          opacity: sceneVisible ? 1 : 0,
          pointerEvents: isModalOpen ? 'none' : 'auto',
          transition: 'opacity 0.4s ease-out',
        }}
      >
        <Suspense fallback={null}>
          <Scene />
        </Suspense>
        <HUD />
        <ScrollHint />
      </div>

      <SceneTransition />

      {/* Modals always full opacity — never inside the fading scene layer */}
      <Modal />

      <LeafyAssistant />
      <ChatBot />
    </div>
  )
}
