import React, { useState, useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import useStore from '../../store/useStore'
import { WL } from '../../styles/modalTheme'

const POSTS_PER_PAGE = 8

function authorInitials(name) {
  if (!name) return '?'
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

function formatFeedDate(iso) {
  try {
    const d = new Date(iso)
    const now = new Date()
    const diffMs = now - d
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'nu'
    if (diffMins < 60) return `${diffMins}m`
    if (diffHours < 24) return `${diffHours}t`
    if (diffDays < 7) return `${diffDays}d`
    return d.toLocaleDateString('da-DK', { day: 'numeric', month: 'short' })
  } catch (_) {
    return iso
  }
}

function FeedPost({ post }) {
  const paragraphs = (post.body || '').split('\n').filter(Boolean)
  const bodyText = paragraphs.join('\n\n')

  return (
    <article
      className="px-4 py-4 border-b transition-colors hover:bg-amber-50/50"
      style={{ borderColor: WL.borderLight }}
    >
      <div className="flex gap-3">
        <div
          className="w-11 h-11 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
          style={{
            background: `linear-gradient(135deg, ${WL.greenBright}, #4ade80)`,
            boxShadow: `0 0 0 2px #fff, 0 0 0 3px ${WL.goldLight}`,
          }}
        >
          {authorInitials(post.author)}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap leading-none mb-1.5">
            <span className="font-bold text-[15px]" style={{ color: WL.text }}>
              {post.author || 'Anonym'}
            </span>
            <span style={{ color: WL.textSoft }}>·</span>
            <time className="text-[14px]" style={{ color: WL.textSoft }}>
              {formatFeedDate(post.date)}
            </time>
          </div>

          {post.title && (
            <h3 className="text-[16px] font-semibold leading-snug mb-2" style={{ color: WL.text }}>
              {post.title}
            </h3>
          )}

          {bodyText && (
            <p
              className="text-[15px] leading-relaxed whitespace-pre-line mb-3"
              style={{ color: WL.textMuted }}
            >
              {bodyText}
            </p>
          )}

          {post.imageUrl && (
            <div
              className="mt-2 mb-3 rounded-xl overflow-hidden"
              style={{ border: `1px solid ${WL.borderLight}` }}
            >
              <img
                src={post.imageUrl}
                alt=""
                className="w-full max-h-[420px] object-cover"
                onError={(e) => (e.target.style.display = 'none')}
              />
            </div>
          )}

          {post.tags?.length > 0 && (
            <div className="flex flex-wrap gap-x-3 gap-y-1">
              {post.tags.map((t) => (
                <span key={t} className="text-sm font-medium" style={{ color: WL.greenBright }}>
                  #{t}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </article>
  )
}

export default function CommunityModal({ coin, onClose }) {
  const { blogPosts } = useStore()
  const [visibleCount, setVisibleCount] = useState(POSTS_PER_PAGE)
  const panelRef = useRef()
  const loaderRef = useRef()

  const sorted = [...blogPosts].sort((a, b) => new Date(b.date) - new Date(a.date))
  const visible = sorted.slice(0, visibleCount)
  const hasMore = visibleCount < sorted.length

  useEffect(() => {
    if (panelRef.current) {
      gsap.fromTo(panelRef.current, { opacity: 0 }, { opacity: 1, duration: 0.3, ease: 'power2.out' })
    }
  }, [])

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
    if (!panelRef.current) { onClose(); return }
    gsap.to(panelRef.current, { opacity: 0, duration: 0.22, ease: 'power2.in', onComplete: onClose })
  }

  return (
    <div
      ref={panelRef}
      className="fixed inset-0 z-50 flex flex-col min-h-0"
      style={{ background: WL.pageBg }}
    >
      <div className="h-1 flex-shrink-0" style={{ background: WL.accentBar }} />

      <header
        className="flex-shrink-0 sticky top-0 z-10 border-b backdrop-blur-sm"
        style={{ background: WL.headerBg, borderColor: WL.borderLight }}
      >
        <div className="max-w-[600px] mx-auto flex items-center justify-between px-4 h-14">
          <div className="flex items-center gap-2">
            <span className="text-lg">🌿</span>
            <h1 className="text-lg font-bold" style={{ color: WL.text }}>Community</h1>
          </div>
          <button
            onClick={handleClose}
            className="w-9 h-9 flex items-center justify-center text-xl rounded-full transition-all hover:scale-105"
            style={{
              color: WL.textMuted,
              background: 'rgba(255,255,255,0.7)',
              border: `1px solid ${WL.border}`,
            }}
            aria-label="Close"
          >
            ×
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto min-h-0 py-4 md:py-6">
        <div
          className="max-w-[600px] mx-auto min-h-full rounded-2xl overflow-hidden"
          style={{
            background: WL.feedBg,
            border: `1px solid ${WL.border}`,
            boxShadow: WL.shadow,
          }}
        >
          <div
            className="px-4 py-3 border-b text-sm"
            style={{
              borderColor: WL.borderLight,
              background: 'linear-gradient(90deg, rgba(74,222,128,0.08), rgba(200,144,74,0.06))',
              color: WL.textMuted,
            }}
          >
            Vil du dele noget? Log ind via{' '}
            <span className="font-semibold" style={{ color: WL.green }}>Login</span>-noden.
          </div>

          {sorted.length === 0 ? (
            <div className="px-4 py-16 text-center">
              <span className="text-4xl block mb-3 opacity-60">🌱</span>
              <p className="text-[15px] font-medium" style={{ color: WL.textMuted }}>
                Ingen indlæg endnu
              </p>
              <p className="text-sm mt-2" style={{ color: WL.textSoft }}>
                Vær den første til at poste i fællesskabet
              </p>
            </div>
          ) : (
            <>
              {visible.map((post) => (
                <FeedPost key={post.id} post={post} />
              ))}

              {hasMore && (
                <div ref={loaderRef} className="py-8 text-center text-sm" style={{ color: WL.textSoft }}>
                  Indlæser flere…
                </div>
              )}

              {!hasMore && sorted.length > POSTS_PER_PAGE && (
                <p className="py-6 text-center text-sm" style={{ color: WL.textSoft }}>
                  Du er helt med 🌿
                </p>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  )
}
