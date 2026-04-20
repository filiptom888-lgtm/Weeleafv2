import React, { Suspense } from 'react'
import Scene from './components/scene/Scene'
import Modal from './components/ui/Modal'
import LeafyAssistant from './components/ui/LeafyAssistant'
import ChatBot from './components/ui/ChatBot'
import ScrollHint from './components/ui/ScrollHint'
import HUD from './components/ui/HUD'
import AdminPanel from './components/ui/AdminPanel'

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
  return (
    <div className="relative w-screen h-screen overflow-hidden select-none">
      {/* 3-D Scene */}
      <Suspense fallback={<LoadingScreen />}>
        <Scene />
      </Suspense>

      {/* UI overlays — always rendered above the canvas */}
      <HUD />
      <Modal />
      <AdminPanel />
      <LeafyAssistant />
      <ChatBot />
      <ScrollHint />
    </div>
  )
}
