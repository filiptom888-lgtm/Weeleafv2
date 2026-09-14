import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import useStore from '../../store/useStore'
import { api } from '../../api/wlApi'
import FullscreenShell from './FullscreenShell'
import UserAvatar from './UserAvatar'
import AccountTabBar from './AccountTabBar'
import { WL, airGlassStyle, airTileStyle, accountInputCls, accountInputStyle, paperTileStyle, primaryBtnStyle, modalPad, glassStyle } from '../../styles/modalTheme'

const POSTS_PER_PAGE = 12
const POLL_MS = 4000

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

function openLoginNode() {
  const member = useStore.getState().coins.find((c) => c.id === 'member')
  if (member) useStore.getState().setActiveCoin(member)
}

function LoginCta({ compact = false }) {
  return (
    <div
      className={`rounded-2xl ${compact ? 'px-5 py-4' : 'px-6 py-10 text-center'}`}
      style={airTileStyle}
    >
      <p className={`leading-relaxed ${compact ? 'text-[15px]' : 'text-base'}`} style={{ color: WL.textMutedOnModal }}>
        {compact
          ? 'Log ind for at skrive og sende beskeder.'
          : 'Log ind for at dele i fællesskabet og sende beskeder.'}
      </p>
      <button
        type="button"
        onClick={openLoginNode}
        className="mt-4 px-5 py-2.5 rounded-full text-sm font-semibold"
        style={primaryBtnStyle}
      >
        Gå til login
      </button>
    </div>
  )
}

function FeedComposer({ currentUser }) {
  const addBlogPost = useStore((s) => s.addBlogPost)
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const fileRef = useRef(null)

  const canPost = body.trim().length > 0 && !busy

  const onPickImage = (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    if (file.size > 5 * 1024 * 1024) {
      setError('Billedet er for stort (max 5 MB).')
      return
    }
    const reader = new FileReader()
    reader.onload = (ev) => setImageUrl(ev.target.result)
    reader.readAsDataURL(file)
  }

  const submit = async (e) => {
    e.preventDefault()
    if (!canPost) return
    setBusy(true)
    setError('')
    const trimmedBody = body.trim()
    const trimmedTitle = title.trim() || trimmedBody.split('\n')[0].slice(0, 72)
    const res = await addBlogPost({
      title: trimmedTitle,
      body: trimmedBody,
      imageUrl,
      author: currentUser.name,
      authorId: currentUser.id,
    })
    setBusy(false)
    if (!res?.ok && res?.error) {
      setError(res.error)
      return
    }
    setTitle('')
    setBody('')
    setImageUrl('')
  }

  return (
    <form onSubmit={submit} className={`${modalPad} py-5 border-b`} style={{ borderColor: WL.borderLight }}>
      <div className="flex gap-3">
        <UserAvatar
          name={currentUser.name}
          avatarId={currentUser.avatarId}
          avatarUrl={currentUser.avatarUrl}
          size={36}
        />
        <div className="flex-1 min-w-0 space-y-2">
          <input
            className={accountInputCls}
            style={accountInputStyle}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Titel (valgfri)"
            maxLength={120}
          />
          <textarea
            className={`${accountInputCls} resize-none`}
            style={accountInputStyle}
            rows={3}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Hvad vil du dele med WL?"
          />
          {imageUrl && (
            <div className="relative inline-block">
              <img src={imageUrl} alt="" className="h-20 rounded-lg object-cover" />
              <button
                type="button"
                onClick={() => setImageUrl('')}
                className="absolute -top-1 -right-1 w-5 h-5 rounded-full text-xs bg-white"
                style={{ color: WL.textMuted, border: `1px solid ${WL.border}` }}
              >
                ×
              </button>
            </div>
          )}
          {error && <p className="text-xs text-red-500">{error}</p>}
          <div className="flex items-center justify-between gap-2">
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onPickImage} />
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="text-xs font-medium px-2 py-1 rounded-lg"
              style={{ color: WL.textMuted }}
            >
              Billede
            </button>
            <button
              type="submit"
              disabled={!canPost}
              className="px-4 py-1.5 rounded-full text-sm font-semibold disabled:opacity-40"
              style={primaryBtnStyle}
            >
              {busy ? 'Sender…' : 'Del'}
            </button>
          </div>
        </div>
      </div>
    </form>
  )
}

function FeedPost({ post, onOpenProfile }) {
  const paragraphs = (post.body || '').split('\n').filter(Boolean)
  const bodyText = paragraphs.join('\n\n')
  const canOpen = Boolean(post.authorId)

  return (
    <article className={`${modalPad} py-6 border-b`} style={{ borderColor: WL.borderLight }}>
      <div className="flex items-start gap-3.5">
        <button
          type="button"
          className="flex-shrink-0"
          onClick={() => canOpen && onOpenProfile(post.authorId)}
          disabled={!canOpen}
        >
          <UserAvatar
            name={post.author}
            avatarId={post.authorAvatarId}
            avatarUrl={post.authorAvatarUrl}
            size={44}
          />
        </button>
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline gap-2 flex-wrap leading-none">
            <button
              type="button"
              className="font-semibold text-[15px] hover:underline disabled:no-underline"
              style={{ color: WL.textOnModal }}
              onClick={() => canOpen && onOpenProfile(post.authorId)}
              disabled={!canOpen}
            >
              {post.author || 'Anonym'}
            </button>
            <span className="text-sm" style={{ color: WL.textSoftOnModal }}>
              · {formatFeedDate(post.date)}
            </span>
          </div>
          {post.title && (
            <h3 className="wl-display text-lg md:text-xl leading-snug mt-2" style={{ color: WL.textOnModal }}>
              {post.title}
            </h3>
          )}
          {bodyText && (
            <p className="text-[15px] md:text-base leading-7 whitespace-pre-line mt-2 max-w-prose" style={{ color: WL.textMutedOnModal }}>
              {bodyText}
            </p>
          )}
          {post.imageUrl && (
            <div className="mt-4 rounded-2xl overflow-hidden" style={{ border: `1px solid ${WL.borderLight}` }}>
              <img
                src={post.imageUrl}
                alt=""
                className="w-full max-h-[360px] object-cover"
                onError={(e) => (e.target.style.display = 'none')}
              />
            </div>
          )}
          {post.tags?.length > 0 && (
            <div className="flex flex-wrap gap-x-2.5 gap-y-1 mt-3">
              {post.tags.map((t) => (
                <span key={t} className="text-sm font-medium" style={{ color: WL.green }}>
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

function ProfileSheet({ userId, onClose, onMessage }) {
  const currentUser = useStore((s) => s.currentUser)
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let live = true
    setLoading(true)
    api.fetchUser(userId).then((res) => {
      if (!live) return
      setLoading(false)
      if (!res.ok) {
        setError(res.error || 'Kunne ikke hente profil.')
        return
      }
      setData(res)
    })
    return () => { live = false }
  }, [userId])

  const user = data?.user
  const posts = data?.posts || []
  const isSelf = currentUser?.id === userId

  return (
    <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center p-0 sm:p-6">
      <button type="button" className="absolute inset-0 bg-black/35" aria-label="Luk" onClick={onClose} />
      <div
        className="relative w-full sm:max-w-md max-h-[88vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl p-5"
        style={glassStyle}
      >
        <button
          type="button"
          onClick={onClose}
          className="wl-close absolute top-3 right-3 !w-9 !h-9"
          aria-label="Luk"
        >
          ×
        </button>
        {loading && <p className="text-sm py-8 text-center" style={{ color: WL.textSoft }}>Henter profil…</p>}
        {error && <p className="text-sm py-8 text-center text-red-500">{error}</p>}
        {user && (
          <>
            <div className="flex items-center gap-3 pr-8">
              <UserAvatar name={user.name} avatarId={user.avatarId} avatarUrl={user.avatarUrl} size={56} />
              <div className="min-w-0">
                <h2 className="text-lg font-bold" style={{ color: WL.text }}>{user.name}</h2>
                <p className="text-xs" style={{ color: WL.textSoft }}>{posts.length} indlæg</p>
              </div>
            </div>
            {!isSelf && (
              <button
                type="button"
                onClick={() => onMessage(user)}
                className="w-full mt-4 py-2.5 rounded-full text-sm font-semibold"
                style={primaryBtnStyle}
              >
                {currentUser ? 'Send besked' : 'Log ind for at sende besked'}
              </button>
            )}
            <div className="mt-5 space-y-3">
              {posts.length === 0 ? (
                <p className="text-sm" style={{ color: WL.textSoft }}>Ingen indlæg endnu.</p>
              ) : (
                posts.map((post) => (
                  <div key={post.id} className="rounded-2xl px-3 py-2.5" style={paperTileStyle}>
                    <p className="text-sm font-medium" style={{ color: WL.text }}>{post.title}</p>
                    <p className="text-xs mt-0.5 line-clamp-2" style={{ color: WL.textMuted }}>{post.body}</p>
                    <p className="text-[11px] mt-1" style={{ color: WL.textSoft }}>{formatFeedDate(post.date)}</p>
                  </div>
                ))
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function ConversationList({ conversations, activeId, onSelect }) {
  if (conversations.length === 0) {
    return (
      <p className="px-4 py-8 text-sm text-center" style={{ color: WL.textSoft }}>
        Ingen samtaler endnu. Åbn en profil og tryk Send besked.
      </p>
    )
  }
  return (
    <ul>
      {conversations.map((c) => {
        const unread = c.unreadCount > 0
        const active = c.id === activeId
        return (
          <li key={c.id}>
            <button
              type="button"
              onClick={() => onSelect(c)}
              className="w-full flex items-center gap-3 px-5 py-3.5 text-left border-b"
              style={{
                borderColor: WL.borderLight,
                background: active ? 'rgba(200, 144, 74, 0.14)' : 'transparent',
              }}
            >
              <UserAvatar
                name={c.otherUser?.name}
                avatarId={c.otherUser?.avatarId}
                avatarUrl={c.otherUser?.avatarUrl}
                size={36}
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-semibold truncate" style={{ color: WL.text }}>
                    {c.otherUser?.name || 'Medlem'}
                  </span>
                  {unread && (
                    <span
                      className="min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold text-white flex items-center justify-center"
                      style={{ background: WL.greenBright }}
                    >
                      {c.unreadCount > 9 ? '9+' : c.unreadCount}
                    </span>
                  )}
                </div>
                <p className="text-xs truncate" style={{ color: unread ? WL.text : WL.textSoft }}>
                  {c.lastMessage?.body || 'Ingen beskeder endnu'}
                </p>
              </div>
            </button>
          </li>
        )
      })}
    </ul>
  )
}

function MessageThread({ conversation, currentUser, onBack }) {
  const [messages, setMessages] = useState([])
  const [draft, setDraft] = useState('')
  const [error, setError] = useState('')
  const [sending, setSending] = useState(false)
  const bottomRef = useRef()
  const lastStampRef = useRef('')
  const focusedRef = useRef(true)

  const loadInitial = useCallback(async () => {
    const res = await api.fetchMessages(conversation.id)
    if (!res.ok) {
      setError(res.error || 'Kunne ikke hente beskeder.')
      return
    }
    setMessages(res.messages || [])
    const last = (res.messages || []).at(-1)
    lastStampRef.current = last?.createdAt || ''
    api.markConversationRead(conversation.id)
  }, [conversation.id])

  useEffect(() => {
    focusedRef.current = true
    loadInitial()
    const tick = setInterval(async () => {
      if (!focusedRef.current || document.hidden) return
      const after = lastStampRef.current
      const res = await api.fetchMessages(conversation.id, after || undefined)
      if (!res.ok) return
      const incoming = res.messages || []
      if (incoming.length) {
        setMessages((prev) => {
          const seen = new Set(prev.map((m) => m.id))
          const merged = [...prev]
          for (const msg of incoming) {
            if (!seen.has(msg.id)) merged.push(msg)
          }
          return merged
        })
        lastStampRef.current = incoming.at(-1).createdAt
        api.markConversationRead(conversation.id)
      }
    }, POLL_MS)
    return () => {
      focusedRef.current = false
      clearInterval(tick)
    }
  }, [conversation.id, loadInitial])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: 'end' })
  }, [messages.length])

  const send = async (e) => {
    e.preventDefault()
    const body = draft.trim()
    if (!body || sending) return
    setSending(true)
    setError('')
    const res = await api.sendMessage(conversation.id, body)
    setSending(false)
    if (!res.ok) {
      setError(res.error || 'Kunne ikke sende.')
      return
    }
    setDraft('')
    if (res.message) {
      setMessages((prev) => (prev.some((m) => m.id === res.message.id) ? prev : [...prev, res.message]))
      lastStampRef.current = res.message.createdAt
    }
  }

  return (
    <div className="flex flex-col h-full min-h-[520px]">
      <div className="flex items-center gap-3 px-5 py-3.5 border-b flex-shrink-0" style={{ borderColor: WL.borderLight }}>
        <button type="button" onClick={onBack} className="md:hidden text-sm px-1" style={{ color: WL.textMuted }}>
          Tilbage
        </button>
        <UserAvatar
          name={conversation.otherUser?.name}
          avatarId={conversation.otherUser?.avatarId}
          avatarUrl={conversation.otherUser?.avatarUrl}
          size={32}
        />
        <span className="text-sm font-semibold truncate" style={{ color: WL.text }}>
          {conversation.otherUser?.name || 'Samtale'}
        </span>
      </div>
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-2.5 min-h-0">
        {messages.map((msg) => {
          const mine = msg.senderId === currentUser.id
          return (
            <div key={msg.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
              <div
                className="max-w-[80%] rounded-2xl px-3 py-2 text-sm whitespace-pre-wrap"
                style={{
                  background: mine ? WL.green : 'rgba(255, 251, 244, 0.94)',
                  color: mine ? '#fff' : WL.text,
                  border: mine ? 'none' : `1px solid ${WL.borderLight}`,
                }}
              >
                {msg.body}
                <div className={`text-[10px] mt-1 ${mine ? 'text-white/70' : ''}`} style={mine ? undefined : { color: WL.textSoft }}>
                  {formatFeedDate(msg.createdAt)}
                </div>
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>
      <form onSubmit={send} className="flex-shrink-0 p-5 border-t flex gap-2" style={{ borderColor: WL.borderLight }}>
        <input
          className={accountInputCls}
          style={accountInputStyle}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Skriv en besked…"
          maxLength={2000}
        />
        <button
          type="submit"
          disabled={!draft.trim() || sending}
          className="px-4 rounded-full text-sm font-semibold disabled:opacity-40"
          style={primaryBtnStyle}
        >
          Send
        </button>
      </form>
      {error && <p className="px-3 pb-2 text-xs text-red-500">{error}</p>}
    </div>
  )
}

function MessagesPane({ currentUser, conversations, setConversations, active, setActive }) {
  const refreshList = useCallback(async () => {
    const res = await api.fetchConversations()
    if (res.ok) setConversations(res.conversations || [])
  }, [setConversations])

  useEffect(() => {
    refreshList()
    const tick = setInterval(() => {
      if (document.hidden) return
      refreshList()
    }, POLL_MS)
    return () => clearInterval(tick)
  }, [refreshList])

  const activeFull = conversations.find((c) => c.id === active?.id) || active

  return (
    <div className="overflow-hidden min-h-[520px] md:grid md:grid-cols-[minmax(220px,0.32fr)_minmax(0,1fr)]">
      <div className={`${active ? 'hidden md:block' : 'block'} border-r`} style={{ borderColor: WL.borderLight }}>
        <ConversationList conversations={conversations} activeId={active?.id} onSelect={setActive} />
      </div>
      <div className={`${active ? 'block' : 'hidden md:block'}`}>
        {activeFull ? (
          <MessageThread
            conversation={activeFull}
            currentUser={currentUser}
            onBack={() => setActive(null)}
          />
        ) : (
          <p className="hidden md:block px-6 py-16 text-sm text-center" style={{ color: WL.textSoft }}>
            Vælg en samtale
          </p>
        )}
      </div>
    </div>
  )
}

export default function CommunityModal({ coin, onClose }) {
  const { blogPosts, currentUser } = useStore()
  const [tab, setTab] = useState('feed')
  const [visibleCount, setVisibleCount] = useState(POSTS_PER_PAGE)
  const [profileUserId, setProfileUserId] = useState(null)
  const [conversations, setConversations] = useState([])
  const [activeConversation, setActiveConversation] = useState(null)
  const loaderRef = useRef()

  const sorted = useMemo(
    () => [...blogPosts].sort((a, b) => new Date(b.date) - new Date(a.date)),
    [blogPosts]
  )
  const visible = sorted.slice(0, visibleCount)
  const hasMore = visibleCount < sorted.length
  const unreadTotal = conversations.reduce((n, c) => n + (c.unreadCount || 0), 0)

  useEffect(() => {
    if (!currentUser) {
      setConversations([])
      return undefined
    }
    let live = true
    api.fetchConversations().then((res) => {
      if (live && res.ok) setConversations(res.conversations || [])
    })
    return () => { live = false }
  }, [currentUser])

  useEffect(() => {
    if (!loaderRef.current || !hasMore || tab !== 'feed') return undefined
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) setVisibleCount((c) => c + POSTS_PER_PAGE)
      },
      { threshold: 0.1 }
    )
    observer.observe(loaderRef.current)
    return () => observer.disconnect()
  }, [hasMore, visibleCount, tab])

  const openProfile = (userId) => {
    if (userId) setProfileUserId(userId)
  }

  const startMessage = async (user) => {
    if (!currentUser) {
      openLoginNode()
      return
    }
    if (!user?.id || user.id === currentUser.id) return
    const res = await api.openConversation(user.id)
    if (!res.ok) return
    const conv = res.conversation
    setConversations((prev) => {
      const rest = prev.filter((c) => c.id !== conv.id)
      return [conv, ...rest]
    })
    setActiveConversation(conv)
    setProfileUserId(null)
    setTab('messages')
  }

  const messagesLabel = unreadTotal > 0 ? `Beskeder (${unreadTotal > 9 ? '9+' : unreadTotal})` : 'Beskeder'

  return (
    <FullscreenShell onClose={onClose} contentClassName="max-w-5xl" headerLayout="none">
      <div className="w-full rounded-[1.85rem] overflow-hidden wl-paper" style={airGlassStyle}>
        <div
          className={`${modalPad} pt-7 pb-5 md:pt-8 md:pb-6`}
          style={{
            background: 'rgba(255, 248, 238, 0.16)',
            borderBottom: `1px solid ${WL.borderLight}`,
          }}
        >
          <div
            className="h-1 w-16 rounded-full mb-4"
            style={{ background: `linear-gradient(90deg, ${coin.color}, ${WL.gold})` }}
          />
          <p className="wl-eyebrow mb-3">WeeLeaf</p>
          <h1
            className="wl-display text-[2rem] md:text-[2.75rem] leading-[1.12]"
            style={{ color: WL.textOnModal }}
          >
            {coin.content?.title || 'WL Community'}
          </h1>
          <p
            className="wl-tagline text-base md:text-xl mt-3 leading-relaxed max-w-2xl"
            style={{ color: WL.textMutedOnModal }}
          >
            {tab === 'feed'
              ? (coin.content?.tagline || `${sorted.length} indlæg`)
              : 'Dine samtaler'}
          </p>
          <div className="mt-5 max-w-md">
            <AccountTabBar
              tabs={[
                { key: 'feed', label: 'Feed' },
                { key: 'messages', label: messagesLabel },
              ]}
              active={tab}
              onChange={setTab}
            />
          </div>
          {tab === 'feed' && (
            <p className="text-xs mt-3" style={{ color: WL.textSoftOnModal }}>
              {sorted.length} {sorted.length === 1 ? 'indlæg' : 'indlæg'}
            </p>
          )}
        </div>

        {tab === 'feed' && (
          <div>
            {currentUser ? (
              <FeedComposer currentUser={currentUser} />
            ) : (
              <div className={`${modalPad} py-5 border-b`} style={{ borderColor: WL.borderLight }}>
                <LoginCta compact />
              </div>
            )}

            {sorted.length === 0 ? (
              <div className={`${modalPad} py-16 text-center`}>
                <p className="wl-display text-xl" style={{ color: WL.textOnModal }}>Ingen indlæg endnu</p>
                <p className="text-[15px] mt-2" style={{ color: WL.textSoftOnModal }}>
                  Vær den første til at dele noget i WL
                </p>
              </div>
            ) : (
              <>
                {visible.map((post) => (
                  <FeedPost key={post.id} post={post} onOpenProfile={openProfile} />
                ))}
                {hasMore && (
                  <div ref={loaderRef} className="py-8 text-center text-sm" style={{ color: WL.textSoftOnModal }}>
                    Indlæser flere…
                  </div>
                )}
                {!hasMore && sorted.length > POSTS_PER_PAGE && (
                  <p className="py-7 text-center text-sm" style={{ color: WL.textSoftOnModal }}>
                    Du er helt med
                  </p>
                )}
              </>
            )}
          </div>
        )}

        {tab === 'messages' && (
          currentUser ? (
            <MessagesPane
              currentUser={currentUser}
              conversations={conversations}
              setConversations={setConversations}
              active={activeConversation}
              setActive={setActiveConversation}
            />
          ) : (
            <div className={`${modalPad} py-10`}>
              <LoginCta />
            </div>
          )
        )}
      </div>

      {profileUserId && (
        <ProfileSheet
          userId={profileUserId}
          onClose={() => setProfileUserId(null)}
          onMessage={startMessage}
        />
      )}
    </FullscreenShell>
  )
}
