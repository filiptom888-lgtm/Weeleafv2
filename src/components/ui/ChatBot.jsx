import React, { useState, useRef, useEffect, useCallback } from 'react'
import { gsap } from 'gsap'
import useStore from '../../store/useStore'

const SYSTEM_PROMPT = `You are Leafy, the friendly AI guide for WeeLeaf (WL) — a sustainable community movement based in Denmark.
You help users understand WL's products, principles, and community. You know about:
- The 5 WL principles (Circularity, Sustainability, Innovation, Community, Economic Responsibility)
- The 20/10/30 economic model (20% R&D, 10% community reserve, 30% to members)
- Hemptation: Wholesome hemp skincare line and OEKO-TEX certified hemp bedding from Hemp CPH
- WL Hive: Carbon-negative modular housing with AI management, hempcrete construction, NBC safety features
- The Shop: Collective buying model with MOQ logic to prevent overproduction
- Social channels: Instagram/Facebook/X @weeleaf
- Donations: 1 DKK symbolic pledge to show community interest
- Community: looking for developers, designers, creators — contact wl@weeleaf.com
Keep responses warm, concise (2-4 sentences), and inspiring. Use occasional nature emoji.`

const INITIAL_MESSAGE = {
  role: 'assistant',
  content: "🌿 Hi! I'm Leafy, your WeeLeaf guide. Ask me anything about our sustainable community, hemp products, or how to get involved!",
}

export default function ChatBot() {
  const { isChatOpen, toggleChat } = useStore()
  const [messages, setMessages] = useState([INITIAL_MESSAGE])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [apiKey, setApiKey] = useState('')
  const [showKeyInput, setShowKeyInput] = useState(false)

  const containerRef = useRef()
  const bottomRef = useRef()
  const inputRef = useRef()

  useEffect(() => {
    if (isChatOpen && containerRef.current) {
      gsap.fromTo(
        containerRef.current,
        { opacity: 0, y: 28, scale: 0.94 },
        { opacity: 1, y: 0, scale: 1, duration: 0.38, ease: 'back.out(1.6)' }
      )
      setTimeout(() => inputRef.current?.focus(), 400)
    }
  }, [isChatOpen])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading])

  const sendMessage = useCallback(async () => {
    const text = input.trim()
    if (!text || isLoading) return

    const userMsg = { role: 'user', content: text }
    setMessages((prev) => [...prev, userMsg])
    setInput('')
    setIsLoading(true)

    if (!apiKey) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: '🔑 To enable AI responses, please add an OpenAI API key using the key icon above. Your key stays in memory only — never stored.',
        },
      ])
      setIsLoading(false)
      return
    }

    try {
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            ...messages.slice(-6),
            userMsg,
          ],
          max_tokens: 280,
          temperature: 0.72,
        }),
      })

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        throw new Error(errData?.error?.message || `HTTP ${res.status}`)
      }

      const data = await res.json()
      const reply = data.choices?.[0]?.message?.content ?? 'Sorry, I could not process that.'
      setMessages((prev) => [...prev, { role: 'assistant', content: reply }])
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: `🌿 Hmm, something went wrong: ${err.message}. Please check your API key and try again.`,
        },
      ])
    } finally {
      setIsLoading(false)
    }
  }, [input, isLoading, apiKey, messages])

  if (!isChatOpen) return null

  return (
    <div
      ref={containerRef}
      className="fixed bottom-24 right-5 z-50 w-80 rounded-2xl overflow-hidden shadow-2xl"
      style={{
        background: 'rgba(5,18,10,0.88)',
        backdropFilter: 'blur(28px)',
        WebkitBackdropFilter: 'blur(28px)',
        border: '1px solid rgba(74,222,128,0.22)',
        boxShadow: '0 0 50px rgba(74,222,128,0.12), 0 24px 60px rgba(0,0,0,0.6)',
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-green-500/20">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          <span className="text-white text-sm font-semibold">Leafy Assistant</span>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setShowKeyInput((v) => !v)}
            className="text-white/40 hover:text-white/80 transition-colors px-1 py-0.5 rounded text-xs"
            title="Set OpenAI API Key"
          >
            🔑
          </button>
          <button
            onClick={toggleChat}
            className="text-white/40 hover:text-white transition-colors text-xl leading-none w-7 h-7 flex items-center justify-center rounded hover:bg-white/10"
          >
            ×
          </button>
        </div>
      </div>

      {/* API key input (collapsible) */}
      {showKeyInput && (
        <div className="px-3 py-2.5 border-b border-green-500/15 space-y-1.5">
          <input
            type="password"
            placeholder="sk-... (OpenAI API key)"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && setShowKeyInput(false)}
            className="w-full text-xs rounded-lg px-3 py-2 text-white/80 placeholder-white/30 outline-none focus:border-green-500/40 border"
            style={{ background: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.1)' }}
          />
          <p className="text-white/30 text-[10px] leading-tight">
            Key is held in memory only — never sent anywhere except OpenAI.
          </p>
        </div>
      )}

      {/* Messages */}
      <div className="h-60 overflow-y-auto px-3 py-3 space-y-2.5">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[88%] rounded-2xl px-3 py-2 text-sm leading-relaxed ${
                msg.role === 'user'
                  ? 'rounded-br-sm'
                  : 'rounded-bl-sm'
              }`}
              style={
                msg.role === 'user'
                  ? { background: 'rgba(74,222,128,0.22)', border: '1px solid rgba(74,222,128,0.3)', color: 'white' }
                  : { background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.85)' }
              }
            >
              {msg.content}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div
              className="rounded-2xl rounded-bl-sm px-4 py-2"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
            >
              <span className="flex gap-1 items-center">
                {[0, 150, 300].map((delay) => (
                  <span
                    key={delay}
                    className="w-1.5 h-1.5 rounded-full bg-green-400 animate-bounce"
                    style={{ animationDelay: `${delay}ms` }}
                  />
                ))}
              </span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input row */}
      <div className="px-3 py-3 border-t border-green-500/15 flex gap-2">
        <input
          ref={inputRef}
          type="text"
          placeholder="Ask Leafy anything…"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
          className="flex-1 text-sm rounded-xl px-3 py-2 text-white placeholder-white/30 outline-none border focus:border-green-500/35"
          style={{ background: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.1)' }}
        />
        <button
          onClick={sendMessage}
          disabled={isLoading || !input.trim()}
          className="px-3 py-2 rounded-xl text-sm font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          style={{
            background: 'rgba(74,222,128,0.2)',
            border: '1px solid rgba(74,222,128,0.35)',
            color: '#86efac',
          }}
        >
          ↑
        </button>
      </div>
    </div>
  )
}
