import React, { useState, useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import useStore from '../../store/useStore'

const POSTS_PER_PAGE = 5

function formatDate(iso) {
  try {
    return new Date(iso).toLocaleDateString('da-DK', {
      year: 'numeric', month: 'long', day: 'numeric',
    })
  } catch (_) { return iso }
}

/* ── Single post card ─────────────────────────────────────────────── */
function PostCard({ post, color }) {
  const [expanded, setExpanded] = useState(false)
  const paragraphs = (post.body || '').split('\n').filter(Boolean)
  const preview = paragraphs.slice(0, 2)
  const rest = paragraphs.slice(2)
  const hasMore = rest.length > 0

  return (
    <article
      className="rounded-2xl overflow-hidden transition-all duration-300"
      style={{
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.07)',
      }}
    >
      {/* Hero image */}
      {post.imageUrl && (
        <div className="w-full overflow-hidden" style={{ maxHeight: 220 }}>
          <img
            src={post.imageUrl}
            alt={post.title}
            className="w-full object-cover"
            style={{ maxHeight: 220 }}
            onError={(e) => (e.target.style.display = 'none')}
          />
        </div>
      )}

      {/* Meta */}
      <div className="px-6 pt-5 pb-3">
        <h3 className="text-base font-bold text-white/95 leading-snug mb-2">{post.title}</h3>
        <div className="flex items-center gap-3 flex-wrap mb-4">
          <span className="text-[11px] text-white/35">{post.author}</span>
          <span className="text-white/15 text-[10px]">·</span>
          <span className="text-[11px] text-white/30">{formatDate(post.date)}</span>
          {post.tags?.length > 0 && (
            <>
              <span className="text-white/15 text-[10px]">·</span>
              <div className="flex gap-1 flex-wrap">
                {post.tags.map((t) => (
                  <span
                    key={t}
                    className="text-[10px] px-2 py-0.5 rounded-full"
                    style={{ background: `${color}18`, color: color, border: `1px solid ${color}30` }}
                  >
                    {t}
                  </span>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Body */}
        <div className="space-y-3">
          {preview.map((p, i) => (
            <p key={i} className="text-sm text-white/60 leading-relaxed">{p}</p>
          ))}
          {expanded && rest.map((p, i) => (
            <p key={i} className="text-sm text-white/60 leading-relaxed">{p}</p>
          ))}
        </div>

        {hasMore && (
          <button
            onClick={() => setExpanded((e) => !e)}
            className="mt-3 text-xs font-medium transition-colors"
            style={{ color: color }}
          >
            {expanded ? '↑ Vis mindre' : '↓ Læs mere'}
          </button>
        )}
      </div>

      {/* Bottom accent */}
      <div
        className="h-[1px] mx-6 mb-5"
        style={{ background: `linear-gradient(90deg, ${color}30, transparent)` }}
      />
    </article>
  )
}

/* ── CommunityModal ───────────────────────────────────────────────── */
export default function CommunityModal({ coin, onClose }) {
  const { blogPosts } = useStore()
  const [visibleCount, setVisibleCount] = useState(POSTS_PER_PAGE)
  const overlayRef = useRef()
  const panelRef = useRef()
  const loaderRef = useRef()

  const sorted = [...blogPosts].sort((a, b) => new Date(b.date) - new Date(a.date))
  const visible = sorted.slice(0, visibleCount)
  const hasMore = visibleCount < sorted.length

  // Entrance animation
  useEffect(() => {
    if (overlayRef.current && panelRef.current) {
      gsap.fromTo(overlayRef.current, { opacity: 0 }, { opacity: 1, duration: 0.3, ease: 'power2.out' })
      gsap.fromTo(
        panelRef.current,
        { opacity: 0, y: 28 },
        { opacity: 1, y: 0, duration: 0.42, ease: 'back.out(1.5)' }
      )
    }
  }, [])

  // Infinite scroll via IntersectionObserver on a sentinel element
  useEffect(() => {
    if (!loaderRef.current || !hasMore) return
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) setVisibleCount((c) => c + POSTS_PER_PAGE)
      },
      { threshold: 0.1 }
    )
    observer.observe(loaderRef.current)
    return () => observer.disconnect()
  }, [hasMore, visibleCount])

  const handleClose = () => {
    if (!overlayRef.current || !panelRef.current) { onClose(); return }
    gsap.to(panelRef.current, { opacity: 0, y: 18, duration: 0.22, ease: 'power2.in' })
    gsap.to(overlayRef.current, { opacity: 0, duration: 0.28, ease: 'power2.in', onComplete: onClose })
  }

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center p-0 md:p-6"
      style={{ background: 'rgba(0,0,0,0.65)' }}
      onClick={(e) => e.target === e.currentTarget && handleClose()}
    >
      <div
        ref={panelRef}
        className="relative flex flex-col w-full h-full md:w-[88vw] md:max-w-2xl md:h-[88vh] md:rounded-2xl overflow-hidden"
        style={{
          background: 'rgba(3,15,10,0.97)',
          backdropFilter: 'blur(32px)',
          WebkitBackdropFilter: 'blur(32px)',
          border: `1px solid ${coin.color}25`,
          boxShadow: `0 0 100px ${coin.color}12, 0 32px 100px rgba(0,0,0,0.75)`,
        }}
      >
        {/* Accent bar */}
        <div
          className="h-[3px] flex-shrink-0"
          style={{ background: `linear-gradient(90deg, ${coin.color}, ${coin.emissiveColor}, transparent)` }}
        />

        {/* Close */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 z-20 w-9 h-9 rounded-full flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-all text-2xl leading-none"
          aria-label="Close"
        >×</button>

        {/* Header */}
        <div className="px-6 md:px-8 pt-6 pb-4 flex-shrink-0 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
          <div className="flex items-center gap-3 mb-1">
            <span className="text-2xl">🌿</span>
            <h2 className="text-xl font-bold text-white tracking-tight">WL Community</h2>
          </div>
          <p className="text-sm text-white/45 leading-relaxed max-w-lg">
            Et digitalt fællesskab for mennesker, der vil udvikle bæredygtige idéer. Del projekter, samarbejd og lær sammen.
          </p>
        </div>

        {/* Scrollable post feed */}
        <div className="flex-1 overflow-y-auto px-4 md:px-6 py-5 space-y-4">
          {sorted.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <span className="text-5xl opacity-20">📝</span>
              <p className="text-white/25 text-sm text-center">
                Ingen indlæg endnu.<br />
                Log ind via Member Login-noden for at skrive det første.
              </p>
            </div>
          ) : (
            <>
              {visible.map((post) => (
                <PostCard key={post.id} post={post} color={coin.color} />
              ))}

              {/* Infinite scroll sentinel */}
              {hasMore && (
                <div ref={loaderRef} className="flex justify-center py-6">
                  <div
                    className="w-5 h-5 rounded-full border-2 border-transparent animate-spin"
                    style={{ borderTopColor: coin.color }}
                  />
                </div>
              )}

              {!hasMore && sorted.length > POSTS_PER_PAGE && (
                <p className="text-center text-white/20 text-xs py-4">— Alle indlæg vist —</p>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
