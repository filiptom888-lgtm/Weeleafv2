import React, { useState, useEffect, useRef } from 'react'
import useStore from '../../store/useStore'
import { AdminDashboard } from './AdminPanel'
import FullscreenShell from './FullscreenShell'
import {
  WL,
  accountInputCls,
  accountInputStyle,
  accountLabelCls,
  accountCardStyle,
  adminShellStyle,
} from '../../styles/modalTheme'
import AccountTabBar from './AccountTabBar'
import UserAvatar from './UserAvatar'
import { AVATAR_OPTIONS } from '../../data/avatarOptions'

function ProfileAvatarPicker({ currentUser }) {
  const updateUserProfile = useStore((s) => s.updateUserProfile)
  const [selected, setSelected] = useState(currentUser.avatarId ?? null)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')

  useEffect(() => {
    setSelected(currentUser.avatarId ?? null)
  }, [currentUser.avatarId])

  const save = async () => {
    setSaving(true)
    setMsg('')
    const res = await updateUserProfile({ avatarId: selected })
    setSaving(false)
    if (res.ok) setMsg('Avatar gemt!')
    else setMsg(res.error || 'Kunne ikke gemme.')
  }

  const changed = (selected ?? null) !== (currentUser.avatarId ?? null)

  return (
    <div className="rounded-2xl p-5 space-y-4" style={accountCardStyle}>
      <div>
        <div className={accountLabelCls} style={{ color: WL.textSoft }}>Dit avatar</div>
        <div className="flex items-center gap-4 mt-2">
          <UserAvatar name={currentUser.name} avatarId={selected} size={56} rounded="square" />
          <p className="text-sm leading-relaxed" style={{ color: WL.textMuted }}>
            Vælg et avatar-billede eller brug dine initialer.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
        <button
          type="button"
          onClick={() => setSelected(null)}
          className="aspect-square rounded-xl flex items-center justify-center text-[10px] font-semibold transition-all"
          style={{
            border: `2px solid ${selected === null ? WL.greenBright : WL.borderLight}`,
            background: selected === null ? WL.skyAccentSoft : 'rgba(255,255,255,0.6)',
            color: WL.textMuted,
          }}
        >
          {currentUser.name?.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase() || '?'}
        </button>
        {AVATAR_OPTIONS.map((opt) => (
          <button
            key={opt.id}
            type="button"
            onClick={() => setSelected(opt.id)}
            className="aspect-square rounded-xl overflow-hidden transition-all p-0.5"
            style={{
              border: `2px solid ${selected === opt.id ? WL.greenBright : WL.borderLight}`,
              background: selected === opt.id ? WL.skyAccentSoft : 'rgba(255,255,255,0.6)',
            }}
            title={opt.label}
          >
            <img src={opt.src} alt={opt.label} className="w-full h-full object-cover rounded-lg" />
          </button>
        ))}
      </div>

      {changed && (
        <button
          type="button"
          onClick={save}
          disabled={saving}
          className="w-full py-2.5 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-50"
          style={{ background: WL.greenBright }}
        >
          {saving ? 'Gemmer…' : 'Gem avatar'}
        </button>
      )}
      {msg && (
        <p className="text-xs text-center" style={{ color: msg.includes('gemt') ? WL.green : '#b91c1c' }}>
          {msg}
        </p>
      )}
    </div>
  )
}

function StatusBadge({ status }) {
  const styles = {
    pending: { bg: 'rgba(251,191,36,0.15)', color: '#b45309', border: 'rgba(251,191,36,0.35)', label: 'Afventer godkendelse' },
    approved: { bg: 'rgba(61,158,95,0.12)', color: WL.green, border: 'rgba(61,158,95,0.3)', label: 'Godkendt' },
    rejected: { bg: 'rgba(220,38,38,0.1)', color: '#b91c1c', border: 'rgba(220,38,38,0.25)', label: 'Afvist' },
  }
  const s = styles[status] || styles.pending
  return (
    <span
      className="text-[10px] px-2 py-0.5 rounded-full font-medium"
      style={{ background: s.bg, color: s.color, border: `1px solid ${s.border}` }}
    >
      {s.label}
    </span>
  )
}

function TabBar({ tabs, active, onChange }) {
  return <AccountTabBar tabs={tabs} active={active} onChange={onChange} />
}

function RootTabBar({ active, onChange, isAdmin }) {
  if (!isAdmin) return null
  return (
    <div className="flex gap-2 mb-4 flex-shrink-0">
      {[
        { key: 'member', label: 'Mit WL' },
        { key: 'admin', label: 'Admin' },
      ].map(({ key, label }) => (
        <button
          key={key}
          type="button"
          onClick={() => onChange(key)}
          className="flex-1 py-2.5 rounded-xl text-xs font-bold tracking-wide transition-all"
          style={{
            background: active === key ? WL.greenBright : 'rgba(255,255,255,0.65)',
            color: active === key ? '#fff' : WL.textMuted,
            border: `1px solid ${active === key ? WL.greenBright : WL.borderLight}`,
            boxShadow: active === key ? '0 4px 14px rgba(61,158,95,0.25)' : 'none',
          }}
        >
          {label}
        </button>
      ))}
    </div>
  )
}

function AuthGate({ coin, onSuccess }) {
  const registerUser = useStore((s) => s.registerUser)
  const loginUser = useStore((s) => s.loginUser)
  const [mode, setMode] = useState('login')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const emailRef = useRef()

  useEffect(() => {
    emailRef.current?.focus()
  }, [mode])

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    const result =
      mode === 'login'
        ? await loginUser({ email, password })
        : await registerUser({ name, email, password })
    setLoading(false)
    if (result.ok) onSuccess()
    else setError(result.error)
  }

  return (
    <div className="max-w-md mx-auto w-full">
      <div className="text-center mb-8">
        <div
          className="w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center text-3xl"
          style={{
            background: `linear-gradient(135deg, ${coin.color}33, rgba(255,255,255,0.9))`,
            border: `1px solid ${WL.border}`,
            boxShadow: WL.shadow,
          }}
        >
          🔑
        </div>
        <h2 className="text-2xl font-bold tracking-tight" style={{ color: WL.text }}>
          Velkommen til WL
        </h2>
        <p className="text-sm mt-2 leading-relaxed" style={{ color: WL.textMuted }}>
          Log ind for at skrive i Community og foreslå produkter til Shop.
        </p>
      </div>

      <div
        className="rounded-2xl p-1 mb-5"
        style={{ background: 'rgba(255,255,255,0.5)', border: `1px solid ${WL.borderLight}` }}
      >
        <div className="flex gap-1">
          {[
            { key: 'login', label: 'Log ind' },
            { key: 'register', label: 'Opret konto' },
          ].map(({ key, label }) => (
            <button
              key={key}
              type="button"
              onClick={() => { setMode(key); setError('') }}
              className="flex-1 py-2.5 rounded-xl text-xs font-semibold transition-all"
              style={{
                background: mode === key ? WL.greenBright : 'transparent',
                color: mode === key ? '#fff' : WL.textMuted,
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <form onSubmit={submit} className="space-y-4">
        {mode === 'register' && (
          <div>
            <label className={accountLabelCls} style={{ color: WL.textSoft }}>Navn</label>
            <input
              className={accountInputCls}
              style={accountInputStyle}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Dit fulde navn"
              autoComplete="name"
            />
          </div>
        )}
        <div>
          <label className={accountLabelCls} style={{ color: WL.textSoft }}>E-mail</label>
          <input
            ref={emailRef}
            className={accountInputCls}
            style={accountInputStyle}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="din@email.dk"
            autoComplete="email"
          />
        </div>
        <div>
          <label className={accountLabelCls} style={{ color: WL.textSoft }}>Adgangskode</label>
          <input
            className={accountInputCls}
            style={accountInputStyle}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
          />
        </div>

        {error && (
          <div
            className="text-center text-xs px-3 py-2 rounded-xl"
            style={{ background: 'rgba(220,38,38,0.08)', border: '1px solid rgba(220,38,38,0.2)', color: '#b91c1c' }}
          >
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3.5 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-50"
          style={{
            background: `linear-gradient(135deg, ${WL.greenBright}, #4ade80)`,
            boxShadow: '0 6px 20px rgba(61,158,95,0.3)',
          }}
        >
          {loading ? 'Vent…' : mode === 'login' ? 'Log ind →' : 'Opret konto →'}
        </button>
      </form>
    </div>
  )
}

function UserBlogAdmin({ coin, currentUser }) {
  const { blogPosts, addBlogPost, updateBlogPost, deleteBlogPost } = useStore()
  const [isNew, setIsNew] = useState(false)
  const [draft, setDraft] = useState(null)

  const myPosts = blogPosts
    .filter((p) => p.authorId === currentUser.id)
    .sort((a, b) => new Date(b.date) - new Date(a.date))

  const openNew = () => {
    setDraft({
      id: `post-${Date.now()}`,
      title: '',
      author: currentUser.name,
      authorId: currentUser.id,
      authorAvatarId: currentUser.avatarId ?? null,
      date: new Date().toISOString(),
      body: '',
      tags: '',
    })
    setIsNew(true)
  }

  const openEdit = (post) => {
    setDraft({ ...post, tags: (post.tags || []).join(', ') })
    setIsNew(false)
  }

  const handleSave = async () => {
    if (!draft?.title?.trim()) return
    const post = {
      ...draft,
      author: currentUser.name,
      authorId: currentUser.id,
      authorAvatarId: currentUser.avatarId ?? null,
      tags: draft.tags ? draft.tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
    }
    if (isNew) await addBlogPost(post)
    else await updateBlogPost(draft.id, post)
    setDraft(null)
    setIsNew(false)
  }

  if (draft) {
    return (
      <div className="space-y-4">
        <button type="button" onClick={() => setDraft(null)} className="text-xs" style={{ color: WL.textMuted }}>
          ← Tilbage
        </button>
        <h3 className="text-base font-semibold" style={{ color: WL.text }}>{isNew ? 'Nyt indlæg' : 'Rediger indlæg'}</h3>
        <input className={accountInputCls} style={accountInputStyle} value={draft.title} onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))} placeholder="Titel" />
        <textarea className={`${accountInputCls} resize-none`} style={accountInputStyle} rows={8} value={draft.body} onChange={(e) => setDraft((d) => ({ ...d, body: e.target.value }))} placeholder="Skriv dit indlæg…" />
        <input className={accountInputCls} style={accountInputStyle} value={draft.tags} onChange={(e) => setDraft((d) => ({ ...d, tags: e.target.value }))} placeholder="Tags: hamp, bæredygtighed" />
        <button
          type="button"
          onClick={handleSave}
          disabled={!draft.title?.trim()}
          className="w-full py-3 rounded-xl text-sm font-semibold text-white disabled:opacity-40"
          style={{ background: WL.greenBright }}
        >
          Udgiv til Community
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <p className="text-xs leading-relaxed" style={{ color: WL.textMuted }}>
        Dine indlæg vises i Community-noden med det samme.
      </p>
      {myPosts.length === 0 && (
        <div className="text-center py-10 rounded-2xl" style={accountCardStyle}>
          <span className="text-3xl opacity-40 block mb-2">📝</span>
          <p className="text-xs" style={{ color: WL.textSoft }}>Ingen indlæg endnu</p>
        </div>
      )}
      {myPosts.map((post) => (
        <div key={post.id} className="flex items-start gap-3 p-4 rounded-2xl" style={accountCardStyle}>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium truncate" style={{ color: WL.text }}>{post.title}</div>
            <div className="text-[10px] mt-1" style={{ color: WL.textSoft }}>
              {post.date ? new Date(post.date).toLocaleDateString('da-DK') : ''}
            </div>
          </div>
          <button type="button" onClick={() => openEdit(post)} style={{ color: WL.textMuted }}>✏</button>
          <button type="button" onClick={() => { if (window.confirm('Slet indlæg?')) deleteBlogPost(post.id) }} style={{ color: WL.textSoft }}>×</button>
        </div>
      ))}
      <button
        type="button"
        onClick={openNew}
        className="w-full py-3 rounded-xl text-sm font-semibold"
        style={{ background: 'rgba(61,158,95,0.1)', border: `1px solid ${WL.greenBright}`, color: WL.green }}
      >
        + Nyt indlæg
      </button>
    </div>
  )
}

function UserShopAdmin({ coin, currentUser }) {
  const { shopCategories, pendingShopSubmissions, submitShopProduct, deleteShopSubmission } = useStore()
  const [draft, setDraft] = useState(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const mySubs = pendingShopSubmissions
    .filter((s) => s.userId === currentUser.id)
    .sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt))

  const handleSubmit = async () => {
    setError('')
    setSuccess('')
    const result = await submitShopProduct({
      userId: currentUser.id,
      userName: currentUser.name,
      userEmail: currentUser.email,
      categoryId: draft.categoryId,
      product: draft,
    })
    if (result.ok) {
      setDraft(null)
      setSuccess('Produktet er sendt til godkendelse!')
    } else {
      setError(result.error)
    }
  }

  if (draft) {
    return (
      <div className="space-y-4">
        <button type="button" onClick={() => setDraft(null)} className="text-xs" style={{ color: WL.textMuted }}>← Tilbage</button>
        <h3 className="text-base font-semibold" style={{ color: WL.text }}>Foreslå produkt</h3>
        <select className={accountInputCls} style={accountInputStyle} value={draft.categoryId} onChange={(e) => setDraft((d) => ({ ...d, categoryId: e.target.value }))}>
          {shopCategories.map((cat) => (
            <option key={cat.id} value={cat.id}>{cat.icon} {cat.label}</option>
          ))}
        </select>
        <input className={accountInputCls} style={accountInputStyle} value={draft.name} onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))} placeholder="Produktnavn *" />
        <textarea className={`${accountInputCls} resize-none`} style={accountInputStyle} rows={4} value={draft.desc} onChange={(e) => setDraft((d) => ({ ...d, desc: e.target.value }))} placeholder="Beskrivelse" />
        <div className="grid grid-cols-2 gap-2">
          <input className={accountInputCls} style={accountInputStyle} value={draft.price} onChange={(e) => setDraft((d) => ({ ...d, price: e.target.value }))} placeholder="Pris" />
          <input className={accountInputCls} style={accountInputStyle} value={draft.link} onChange={(e) => setDraft((d) => ({ ...d, link: e.target.value }))} placeholder="Link URL" />
        </div>
        {error && <p className="text-xs text-center" style={{ color: '#b91c1c' }}>{error}</p>}
        <button type="button" onClick={handleSubmit} disabled={!draft.name?.trim()} className="w-full py-3 rounded-xl text-sm font-semibold text-white disabled:opacity-40" style={{ background: WL.greenBright }}>
          Send til godkendelse →
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {success && (
        <div className="px-4 py-3 rounded-xl text-xs text-center" style={{ background: 'rgba(61,158,95,0.1)', border: `1px solid ${WL.greenBright}`, color: WL.green }}>
          {success}
        </div>
      )}
      {mySubs.map((sub) => (
        <div key={sub.id} className="p-4 rounded-2xl space-y-2" style={accountCardStyle}>
          <div className="flex items-start gap-3">
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium truncate" style={{ color: WL.text }}>{sub.product.name}</div>
              <div className="text-[10px] mt-0.5" style={{ color: WL.textSoft }}>{sub.categoryLabel}</div>
            </div>
            <StatusBadge status={sub.status} />
          </div>
          {sub.status === 'pending' && (
            <button type="button" onClick={() => { if (window.confirm('Annuller?')) deleteShopSubmission(sub.id) }} className="text-[10px]" style={{ color: WL.textSoft }}>
              Annuller forespørgsel
            </button>
          )}
        </div>
      ))}
      <button
        type="button"
        onClick={() => setDraft({ categoryId: shopCategories[0]?.id || '', name: '', desc: '', price: '', link: '', imageUrl: '' })}
        className="w-full py-3 rounded-xl text-sm font-semibold"
        style={{ background: 'rgba(96,165,250,0.12)', border: '1px solid rgba(96,165,250,0.35)', color: '#2563eb' }}
      >
        + Foreslå produkt
      </button>
    </div>
  )
}

function UserDashboard({ coin, currentUser }) {
  const { logoutUser, blogPosts, pendingShopSubmissions } = useStore()
  const [activeTab, setActiveTab] = useState('blog')

  const myPostCount = blogPosts.filter((p) => p.authorId === currentUser.id).length
  const myPendingShop = pendingShopSubmissions.filter((s) => s.userId === currentUser.id && s.status === 'pending').length

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="rounded-2xl p-5 mb-4 flex-shrink-0" style={accountCardStyle}>
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <UserAvatar name={currentUser.name} avatarId={currentUser.avatarId} size={56} rounded="square" />
            <div>
              <h2 className="text-lg font-bold" style={{ color: WL.text }}>{currentUser.name}</h2>
              <p className="text-xs" style={{ color: WL.textMuted }}>{currentUser.email}</p>
              {currentUser.role === 'admin' && (
                <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: WL.gold }}>Admin</span>
              )}
            </div>
          </div>
          <button type="button" onClick={logoutUser} className="text-xs px-3 py-1.5 rounded-lg" style={{ color: WL.textMuted, border: `1px solid ${WL.border}` }}>
            Log ud
          </button>
        </div>
        <div className="flex gap-2 mt-4">
          <div className="flex-1 py-2 rounded-xl text-center" style={{ background: 'rgba(255,255,255,0.6)' }}>
            <div className="text-lg font-bold" style={{ color: WL.text }}>{myPostCount}</div>
            <div className="text-[9px] uppercase tracking-wider" style={{ color: WL.textSoft }}>Indlæg</div>
          </div>
          <div className="flex-1 py-2 rounded-xl text-center" style={{ background: 'rgba(255,255,255,0.6)' }}>
            <div className="text-lg font-bold" style={{ color: myPendingShop ? WL.gold : WL.text }}>{myPendingShop}</div>
            <div className="text-[9px] uppercase tracking-wider" style={{ color: WL.textSoft }}>Afventer</div>
          </div>
        </div>
      </div>

      <div className="pb-3 flex-shrink-0">
        <TabBar
          tabs={[
            { key: 'blog', label: 'Indlæg', icon: '📝' },
            { key: 'shop', label: 'Shop', icon: '🛍️' },
            { key: 'profile', label: 'Profil', icon: '👤' },
          ]}
          active={activeTab}
          onChange={setActiveTab}
        />
      </div>

      <div className="flex-1 overflow-y-auto min-h-0 pb-4">
        {activeTab === 'blog' && <UserBlogAdmin coin={coin} currentUser={currentUser} />}
        {activeTab === 'shop' && <UserShopAdmin coin={coin} currentUser={currentUser} />}
        {activeTab === 'profile' && (
          <div className="space-y-4">
            <ProfileAvatarPicker currentUser={currentUser} />
            <div className="rounded-2xl p-5 space-y-4" style={accountCardStyle}>
              {[
                ['Navn', currentUser.name],
                ['E-mail', currentUser.email],
                ['Medlem siden', currentUser.createdAt ? new Date(currentUser.createdAt).toLocaleDateString('da-DK') : '—'],
              ].map(([label, value]) => (
                <div key={label}>
                  <div className={accountLabelCls} style={{ color: WL.textSoft }}>{label}</div>
                  <div className="text-sm" style={{ color: WL.text }}>{value}</div>
                </div>
              ))}
            </div>
            <p className="text-[10px] leading-relaxed px-1" style={{ color: WL.textSoft }}>
              Din konto er gemt sikkert på serveren. Community-indlæg udgives med det samme. Shop-produkter kræver admin-godkendelse.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default function MemberModal({ coin, onClose }) {
  const currentUser = useStore((s) => s.currentUser)
  const accountOpenTab = useStore((s) => s.accountOpenTab)
  const setAccountOpenTab = useStore((s) => s.setAccountOpenTab)
  const isAdmin = currentUser?.role === 'admin'
  const wantAdminRef = useRef(accountOpenTab === 'admin')
  const [rootPanel, setRootPanel] = useState(wantAdminRef.current && isAdmin ? 'admin' : 'member')

  useEffect(() => {
    if (accountOpenTab === 'admin') {
      wantAdminRef.current = true
      setAccountOpenTab('member')
    }
  }, [accountOpenTab, setAccountOpenTab])

  useEffect(() => {
    if (currentUser?.role === 'admin' && wantAdminRef.current) {
      setRootPanel('admin')
    }
  }, [currentUser])

  const onLoginSuccess = () => {
    const user = useStore.getState().currentUser
    if (user?.role === 'admin' && wantAdminRef.current) {
      setRootPanel('admin')
    }
  }

  const isAdminPanel = isAdmin && currentUser && rootPanel === 'admin'

  return (
    <FullscreenShell
      eyebrow="WeeLeaf Konto"
      title={currentUser ? `Hej, ${currentUser.name.split(' ')[0]}` : 'Log ind'}
      tagline={coin.subtitle || 'Member Login'}
      onClose={onClose}
      contentClassName={isAdminPanel ? 'max-w-6xl' : 'max-w-lg'}
    >
      <div
        className="rounded-2xl px-5 md:px-8 py-6 md:py-8 min-h-[min(70vh,640px)] flex flex-col"
        style={{
          ...(isAdminPanel ? adminShellStyle : accountCardStyle),
          height: isAdminPanel ? 'min(78vh, 800px)' : undefined,
        }}
      >
        {!currentUser ? (
          <AuthGate coin={coin} onSuccess={onLoginSuccess} />
        ) : (
          <>
                <RootTabBar active={rootPanel} onChange={setRootPanel} isAdmin={isAdmin} />
            <div className="flex-1 min-h-0 overflow-hidden">
              {rootPanel === 'admin' && isAdmin ? (
                <AdminDashboard />
              ) : (
                <UserDashboard coin={coin} currentUser={currentUser} />
              )}
            </div>
          </>
        )}
      </div>
    </FullscreenShell>
  )
}
