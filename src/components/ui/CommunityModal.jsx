import React, { useState, useEffect, useRef, useMemo } from 'react'
import useStore from '../../store/useStore'
import FullscreenShell from './FullscreenShell'
import UserAvatar from './UserAvatar'
import { WL, glassStyle } from '../../styles/modalTheme'

const POSTS_PER_PAGE = 8

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

function SideCard({ title, children, className = '' }) {
  return (
    <div className={`rounded-2xl p-4 ${className}`} style={glassStyle}>
      {title && (
        <h3 className="text-[11px] font-semibold uppercase tracking-wider mb-3" style={{ color: WL.skyAccent }}>
          {title}
        </h3>
      )}
      {children}
    </div>
  )
}

function FeedPost({ post }) {
  const paragraphs = (post.body || '').split('\n').filter(Boolean)
  const bodyText = paragraphs.join('\n\n')

  return (
    <article
      className="px-4 sm:px-5 py-5 border-b transition-colors hover:bg-amber-50/50"
      style={{ borderColor: WL.borderLight }}
    >
      <div className="flex items-center gap-2.5 mb-3">
        <UserAvatar
          name={post.author}
          avatarId={post.authorAvatarId}
          avatarUrl={post.authorAvatarUrl}
          size={40}
        />
        <div className="flex items-center gap-1.5 flex-wrap leading-none min-w-0">
          <span className="font-bold text-[15px]" style={{ color: WL.text }}>
            {post.author || 'Anonym'}
          </span>
          <span style={{ color: WL.textSoft }}>·</span>
          <time className="text-[14px]" style={{ color: WL.textSoft }}>
            {formatFeedDate(post.date)}
          </time>
        </div>
      </div>

      <div className="min-w-0">
        {post.title && (
          <h3 className="text-[17px] font-semibold leading-snug mb-2" style={{ color: WL.text }}>
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
    </article>
  )
}

function CommunitySidebar({ blogPosts, stats }) {
  const tagCounts = useMemo(() => {
    const counts = {}
    for (const post of blogPosts) {
      for (const tag of post.tags || []) {
        counts[tag] = (counts[tag] || 0) + 1
      }
    }
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
  }, [blogPosts])

  const authors = useMemo(() => {
    const seen = new Set()
    const list = []
    for (const post of blogPosts) {
      const key = post.authorId || post.author || 'Anonym'
      if (!seen.has(key)) {
        seen.add(key)
        list.push({
          name: post.author || 'Anonym',
          avatarId: post.authorAvatarId ?? null,
          avatarUrl: post.authorAvatarUrl ?? null,
        })
      }
    }
    return list.slice(0, 6)
  }, [blogPosts])

  return (
    <div className="space-y-4">
      <SideCard title="Om fællesskabet">
        <p className="text-sm leading-relaxed" style={{ color: WL.textMuted }}>
          Et åbent rum for idéer, projekter og samarbejde om bæredygtig fremtid. Del tanker, lær af andre og voks sammen med WL.
        </p>
        <div className="grid grid-cols-2 gap-2 mt-4">
          <div
            className="rounded-xl px-3 py-2 text-center"
            style={{ background: WL.skyAccentSoft, border: `1px solid ${WL.borderLight}` }}
          >
            <div className="text-xl font-bold" style={{ color: WL.skyAccent }}>{stats.postCount}</div>
            <div className="text-[10px] uppercase tracking-wide" style={{ color: WL.textSoftOnModal }}>Indlæg</div>
          </div>
          <div
            className="rounded-xl px-3 py-2 text-center"
            style={{ background: WL.skyAccentSoft, border: `1px solid ${WL.borderLight}` }}
          >
            <div className="text-xl font-bold" style={{ color: WL.skyAccent }}>{stats.authorCount}</div>
            <div className="text-[10px] uppercase tracking-wide" style={{ color: WL.textSoftOnModal }}>Forfattere</div>
          </div>
        </div>
      </SideCard>

      {tagCounts.length > 0 && (
        <SideCard title="Populære emner">
          <div className="flex flex-wrap gap-2">
            {tagCounts.map(([tag, count]) => (
              <span
                key={tag}
                className="text-xs px-2.5 py-1 rounded-full font-medium"
                style={{
                  color: WL.skyAccent,
                  background: WL.skyAccentSoft,
                  border: `1px solid ${WL.border}`,
                }}
              >
                #{tag} <span style={{ color: WL.textSoft }}>({count})</span>
              </span>
            ))}
          </div>
        </SideCard>
      )}

      {authors.length > 0 && (
        <SideCard title="Aktive forfattere">
          <ul className="space-y-2">
            {authors.map((author) => (
              <li key={author.name} className="flex items-center gap-2">
                <UserAvatar
                  name={author.name}
                  avatarId={author.avatarId}
                  avatarUrl={author.avatarUrl}
                  size={28}
                />
                <span className="text-sm truncate" style={{ color: WL.textMuted }}>{author.name}</span>
              </li>
            ))}
          </ul>
        </SideCard>
      )}
    </div>
  )
}

function CommunityRightPanel({ blogPosts, stats, siteStats, currentUser }) {
  const recentPosts = useMemo(
    () => [...blogPosts].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5),
    [blogPosts]
  )

  const impactStats = useMemo(() => {
    const pick = (id) => siteStats.find((s) => s.id === id)
    return [
      pick('members'),
      pick('co2'),
      pick('donations'),
    ].filter(Boolean)
  }, [siteStats])

  return (
    <div className="space-y-4">
      <SideCard title="Seneste indlæg">
        {recentPosts.length === 0 ? (
          <p className="text-sm" style={{ color: WL.textSoft }}>Ingen indlæg endnu</p>
        ) : (
          <ul className="space-y-3">
            {recentPosts.map((post) => (
              <li key={post.id} className="flex gap-2">
                <span className="text-base flex-shrink-0 mt-0.5">📄</span>
                <div className="min-w-0">
                  <p className="text-sm font-medium leading-snug line-clamp-2" style={{ color: WL.text }}>
                    {post.title}
                  </p>
                  <p className="text-[11px] mt-0.5" style={{ color: WL.textSoft }}>
                    {post.author} · {formatFeedDate(post.date)}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </SideCard>

      <SideCard title="Sådan deltager du">
        <ol className="space-y-3 text-sm leading-relaxed" style={{ color: WL.textMuted }}>
          <li className="flex gap-2.5">
            <span
              className="w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold flex-shrink-0"
              style={{ background: WL.skyAccentSoft, color: WL.skyAccent }}
            >
              1
            </span>
            <span>Læs indlæg fra fællesskabet og find inspiration.</span>
          </li>
          <li className="flex gap-2.5">
            <span
              className="w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold flex-shrink-0"
              style={{ background: WL.skyAccentSoft, color: WL.skyAccent }}
            >
              2
            </span>
            <span>Log ind via <strong style={{ color: WL.text }}>Login</strong>-noden på forsiden.</span>
          </li>
          <li className="flex gap-2.5">
            <span
              className="w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold flex-shrink-0"
              style={{ background: WL.skyAccentSoft, color: WL.skyAccent }}
            >
              3
            </span>
            <span>Del idéer, projekter og spørgsmål med resten af WL.</span>
          </li>
        </ol>
      </SideCard>

      {impactStats.length > 0 && (
        <SideCard title="WL i tal">
          <ul className="space-y-3">
            {impactStats.map((stat) => (
              <li key={stat.id} className="flex items-baseline justify-between gap-3">
                <span className="text-sm" style={{ color: WL.textMuted }}>{stat.label}</span>
                <span className="text-lg font-bold tabular-nums" style={{ color: WL.gold }}>
                  {Number(stat.value || 0).toLocaleString('da-DK')}
                  {stat.suffix ? ` ${stat.suffix}` : ''}
                </span>
              </li>
            ))}
          </ul>
        </SideCard>
      )}

      {currentUser ? (
        <SideCard title="Din konto">
          <div className="flex items-center gap-3">
            <UserAvatar
              name={currentUser.name}
              avatarId={currentUser.avatarId}
              avatarUrl={currentUser.avatarUrl}
              size={40}
            />
            <div className="min-w-0">
              <p className="text-sm font-semibold" style={{ color: WL.text }}>
                {currentUser.name}
              </p>
              <p className="text-xs mt-0.5 break-all" style={{ color: WL.textSoft }}>
                {currentUser.email}
              </p>
            </div>
          </div>
          <p className="text-xs mt-3 leading-relaxed" style={{ color: WL.textMuted }}>
            Du er logget ind og kan bidrage til fællesskabet.
          </p>
        </SideCard>
      ) : stats.members > 0 ? (
        <SideCard title="Fællesskab">
          <p className="text-2xl font-bold" style={{ color: WL.gold }}>
            {stats.members.toLocaleString('da-DK')}
          </p>
          <p className="text-xs mt-1" style={{ color: WL.textSoft }}>medlemmer i WL</p>
        </SideCard>
      ) : null}
    </div>
  )
}

export default function CommunityModal({ coin, onClose }) {
  const { blogPosts, stats, currentUser } = useStore()
  const [visibleCount, setVisibleCount] = useState(POSTS_PER_PAGE)
  const loaderRef = useRef()

  const sorted = [...blogPosts].sort((a, b) => new Date(b.date) - new Date(a.date))
  const visible = sorted.slice(0, visibleCount)
  const hasMore = visibleCount < sorted.length

  const feedStats = useMemo(() => {
    const authors = new Set(blogPosts.map((p) => p.author).filter(Boolean))
    const membersStat = stats.find((s) => s.id === 'members')
    return {
      postCount: blogPosts.length,
      authorCount: authors.size,
      members: membersStat?.value || 0,
    }
  }, [blogPosts, stats])

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

  return (
    <FullscreenShell
      eyebrow="Community"
      title="WL Community"
      tagline={`${feedStats.postCount} indlæg · ${feedStats.authorCount} forfattere`}
      onClose={onClose}
      contentClassName="max-w-7xl"
    >
      <div className="grid grid-cols-1 xl:grid-cols-[240px_minmax(0,1fr)_240px] gap-4 xl:gap-5 items-start w-full">

            {/* Left sidebar — desktop */}
            <aside className="hidden xl:block space-y-4 sticky top-[4.5rem]">
              <CommunitySidebar blogPosts={blogPosts} stats={feedStats} />
            </aside>

            {/* Center feed */}
            <div className="min-w-0 rounded-2xl overflow-hidden" style={glassStyle}>
              <div
                className="px-4 sm:px-5 py-3 border-b text-sm flex items-center gap-2"
                style={{
                  borderColor: 'rgba(59,130,180,0.12)',
                  background: 'rgba(255,255,255,0.5)',
                  color: WL.textMutedOnModal,
                }}
              >
                <span className="text-base">✍️</span>
                <span>
                  Vil du dele noget? Log ind via{' '}
                  <span className="font-semibold" style={{ color: WL.skyAccent }}>Login</span>-noden.
                </span>
              </div>

              {sorted.length === 0 ? (
                <div className="px-5 py-16 text-center">
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

            {/* Right sidebar — desktop */}
            <aside className="hidden xl:block space-y-4 sticky top-[4.5rem]">
              <CommunityRightPanel
                blogPosts={blogPosts}
                stats={feedStats}
                siteStats={stats}
                currentUser={currentUser}
              />
            </aside>

            {/* Mobile: show side content below feed */}
            <div className="xl:hidden grid grid-cols-1 sm:grid-cols-2 gap-4 col-span-1">
              <CommunitySidebar blogPosts={blogPosts} stats={feedStats} />
              <CommunityRightPanel
                blogPosts={blogPosts}
                stats={feedStats}
                siteStats={stats}
                currentUser={currentUser}
              />
            </div>
      </div>
    </FullscreenShell>
  )
}
