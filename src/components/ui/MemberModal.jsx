import React, { useState, useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import useStore from '../../store/useStore'
import { TEST_USER } from '../../data/userAuth'

const inputCls =
  'w-full text-sm rounded-xl px-4 py-3 text-white/90 placeholder-white/30 outline-none border bg-white/[0.06] border-white/10 focus:border-sky-400/50 focus:bg-white/[0.08] transition-all'

function StatusBadge({ status }) {
  const styles = {
    pending: { bg: 'rgba(251,191,36,0.12)', color: '#fbbf24', border: 'rgba(251,191,36,0.35)', label: 'Afventer godkendelse' },
    approved: { bg: 'rgba(74,222,128,0.12)', color: '#86efac', border: 'rgba(74,222,128,0.35)', label: 'Godkendt' },
    rejected: { bg: 'rgba(248,113,113,0.12)', color: '#fca5a5', border: 'rgba(248,113,113,0.35)', label: 'Afvist' },
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

function TabBar({ tabs, active, onChange, accent }) {
  return (
    <div className="flex gap-1.5 p-1 rounded-2xl overflow-x-auto" style={{ background: 'rgba(0,0,0,0.25)' }}>
      {tabs.map(({ key, label, icon }) => (
        <button
          key={key}
          onClick={() => onChange(key)}
          className="flex-1 min-w-0 py-2.5 px-2 rounded-xl text-[11px] font-semibold transition-all whitespace-nowrap"
          style={{
            background: active === key ? `${accent}28` : 'transparent',
            border: `1px solid ${active === key ? accent + '55' : 'transparent'}`,
            color: active === key ? accent : 'rgba(255,255,255,0.42)',
            boxShadow: active === key ? `0 0 20px ${accent}15` : 'none',
          }}
        >
          {icon} {label}
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
    <div className="flex flex-col h-full min-h-0">
      {/* Hero */}
      <div
        className="relative px-8 pt-10 pb-8 text-center flex-shrink-0 overflow-hidden"
        style={{ background: `linear-gradient(165deg, ${coin.color}22 0%, rgba(6,20,14,0) 70%)` }}
      >
        <div
          className="absolute inset-0 opacity-30 pointer-events-none"
          style={{ background: 'radial-gradient(circle at 50% 0%, rgba(74,222,128,0.25), transparent 55%)' }}
        />
        <div
          className="relative w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center text-3xl"
          style={{
            background: `linear-gradient(135deg, ${coin.color}33, rgba(255,255,255,0.05))`,
            border: `1px solid ${coin.color}44`,
            boxShadow: `0 8px 32px ${coin.color}22`,
          }}
        >
          🔑
        </div>
        <h2 className="relative text-2xl font-bold text-white tracking-tight">Velkommen til WL</h2>
        <p className="relative text-sm text-white/45 mt-2 max-w-xs mx-auto leading-relaxed">
          Log ind for at skrive i Community og foreslå produkter til Shop.
        </p>
      </div>

      <div className="flex-1 overflow-y-auto px-6 pb-8">
        <div
          className="rounded-2xl p-1 mb-5"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
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
                  background: mode === key ? `${coin.color}30` : 'transparent',
                  color: mode === key ? '#fff' : 'rgba(255,255,255,0.4)',
                }}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={submit} className="space-y-3">
          {mode === 'register' && (
            <div>
              <label className="text-[10px] text-white/40 uppercase tracking-widest mb-1.5 block">Navn</label>
              <input
                className={inputCls}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Dit fulde navn"
                autoComplete="name"
              />
            </div>
          )}
          <div>
            <label className="text-[10px] text-white/40 uppercase tracking-widest mb-1.5 block">E-mail</label>
            <input
              ref={emailRef}
              className={inputCls}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="din@email.dk"
              autoComplete="email"
            />
          </div>
          <div>
            <label className="text-[10px] text-white/40 uppercase tracking-widest mb-1.5 block">Adgangskode</label>
            <input
              className={inputCls}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            />
          </div>

          {error && (
            <div className="text-center text-xs text-red-300 px-3 py-2 rounded-xl" style={{ background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.25)' }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-xl text-sm font-bold text-white transition-all hover:opacity-95 active:scale-[0.99] disabled:opacity-50"
            style={{
              background: `linear-gradient(135deg, ${coin.color}, ${coin.emissiveColor})`,
              boxShadow: `0 8px 28px ${coin.color}44`,
            }}
          >
            {mode === 'login' ? 'Log ind →' : 'Opret konto →'}
          </button>
        </form>

        <div
          className="mt-6 px-4 py-3 rounded-xl text-center"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px dashed rgba(255,255,255,0.1)' }}
        >
          <div className="text-[10px] text-white/30 uppercase tracking-widest mb-1">Demo-konto</div>
          <div className="text-xs text-white/50 font-mono">{TEST_USER.email}</div>
          <div className="text-xs text-white/50 font-mono">{TEST_USER.password}</div>
        </div>
      </div>
    </div>
  )
}

function UserBlogAdmin({ coin, currentUser }) {
  const { blogPosts, addBlogPost, updateBlogPost, deleteBlogPost } = useStore()
  const [editingId, setEditingId] = useState(null)
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
      date: new Date().toISOString(),
      body: '',
      tags: '',
    })
    setIsNew(true)
    setEditingId(null)
  }

  const openEdit = (post) => {
    setDraft({ ...post, tags: (post.tags || []).join(', ') })
    setIsNew(false)
    setEditingId(post.id)
  }

  const closeEditor = () => {
    setDraft(null)
    setEditingId(null)
    setIsNew(false)
  }

  const handleSave = async () => {
    if (!draft?.title?.trim()) return
    const post = {
      ...draft,
      author: currentUser.name,
      authorId: currentUser.id,
      tags: draft.tags ? draft.tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
    }
    if (isNew) await addBlogPost(post)
    else await updateBlogPost(post.id, post)
    closeEditor()
  }

  if (draft) {
    return (
      <div className="space-y-4">
        <button onClick={closeEditor} className="flex items-center gap-1.5 text-xs text-white/45 hover:text-white/75 transition-colors">
          ← Tilbage
        </button>
        <h3 className="text-base font-semibold text-white/90">{isNew ? 'Nyt indlæg' : 'Rediger indlæg'}</h3>
        <input className={inputCls} value={draft.title} onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))} placeholder="Titel" />
        <textarea className={`${inputCls} resize-none`} rows={8} value={draft.body} onChange={(e) => setDraft((d) => ({ ...d, body: e.target.value }))} placeholder="Skriv dit indlæg…" />
        <input className={inputCls} value={draft.tags} onChange={(e) => setDraft((d) => ({ ...d, tags: e.target.value }))} placeholder="Tags: hamp, bæredygtighed" />
        <label className="flex items-center gap-3 cursor-pointer px-4 py-3 rounded-xl border border-dashed border-white/15 hover:border-white/30 transition-colors">
          <span className="text-xl">📁</span>
          <span className="text-xs text-white/45">Upload billede</span>
          <input type="file" accept="image/*" className="hidden" onChange={(e) => {
            const file = e.target.files?.[0]
            if (!file) return
            const reader = new FileReader()
            reader.onload = (ev) => setDraft((d) => ({ ...d, imageUrl: ev.target.result }))
            reader.readAsDataURL(file)
            e.target.value = ''
          }} />
        </label>
        {draft.imageUrl && (
          <img src={draft.imageUrl} alt="" className="w-full h-32 object-cover rounded-xl" style={{ border: `1px solid ${coin.color}33` }} />
        )}
        <button
          onClick={handleSave}
          disabled={!draft.title?.trim()}
          className="w-full py-3 rounded-xl text-sm font-semibold text-white disabled:opacity-40"
          style={{ background: `linear-gradient(135deg, ${coin.color}88, ${coin.emissiveColor}66)`, border: `1px solid ${coin.color}55` }}
        >
          Udgiv til Community
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <p className="text-white/40 text-xs leading-relaxed">
        Dine indlæg vises i Community-noden med det samme.
      </p>

      {myPosts.length === 0 && (
        <div className="text-center py-10 rounded-2xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <span className="text-3xl opacity-25 block mb-2">📝</span>
          <p className="text-white/30 text-xs">Ingen indlæg endnu</p>
        </div>
      )}

      {myPosts.map((post) => (
        <div
          key={post.id}
          className="flex items-start gap-3 p-4 rounded-2xl transition-colors hover:bg-white/[0.02]"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
        >
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-white/90 truncate">{post.title}</div>
            <div className="text-[10px] text-white/35 mt-1">
              {post.date ? new Date(post.date).toLocaleDateString('da-DK') : ''}
            </div>
          </div>
          <button onClick={() => openEdit(post)} className="text-white/30 hover:text-white/70 text-sm px-1">✏</button>
          <button onClick={() => { if (window.confirm('Slet indlæg?')) deleteBlogPost(post.id) }} className="text-white/25 hover:text-red-400 text-base">×</button>
        </div>
      ))}

      <button
        onClick={openNew}
        className="w-full py-3 rounded-xl text-sm font-semibold transition-all"
        style={{ background: `${coin.color}18`, border: `1px solid ${coin.color}40`, color: coin.color }}
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

  const openNew = () => {
    setDraft({
      categoryId: shopCategories[0]?.id || '',
      name: '',
      desc: '',
      price: '',
      link: '',
      imageUrl: '',
    })
    setError('')
    setSuccess('')
  }

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

  const activeCat = shopCategories.find((c) => c.id === draft?.categoryId)

  if (draft) {
    return (
      <div className="space-y-4">
        <button onClick={() => setDraft(null)} className="flex items-center gap-1.5 text-xs text-white/45 hover:text-white/75 transition-colors">
          ← Tilbage
        </button>
        <h3 className="text-base font-semibold text-white/90">Foreslå produkt</h3>
        <p className="text-xs text-white/40">Produktet vises først i Shop efter admin har godkendt det.</p>

        <div>
          <label className="text-[10px] text-white/40 uppercase tracking-widest mb-1.5 block">Kategori</label>
          <select
            className={inputCls}
            value={draft.categoryId}
            onChange={(e) => setDraft((d) => ({ ...d, categoryId: e.target.value }))}
          >
            {shopCategories.map((cat) => (
              <option key={cat.id} value={cat.id} style={{ background: '#0a1a12' }}>
                {cat.icon} {cat.label}
              </option>
            ))}
          </select>
        </div>

        <input className={inputCls} value={draft.name} onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))} placeholder="Produktnavn *" />
        <textarea className={`${inputCls} resize-none`} rows={4} value={draft.desc} onChange={(e) => setDraft((d) => ({ ...d, desc: e.target.value }))} placeholder="Beskrivelse" />
        <div className="grid grid-cols-2 gap-2">
          <input className={inputCls} value={draft.price} onChange={(e) => setDraft((d) => ({ ...d, price: e.target.value }))} placeholder="Pris (valgfri)" />
          <input className={inputCls} value={draft.link} onChange={(e) => setDraft((d) => ({ ...d, link: e.target.value }))} placeholder="Link URL" />
        </div>

        <label className="flex items-center gap-3 cursor-pointer px-4 py-3 rounded-xl border border-dashed border-white/15 hover:border-white/30 transition-colors">
          <span className="text-xl">📁</span>
          <span className="text-xs text-white/45">Upload produktbillede</span>
          <input type="file" accept="image/*" className="hidden" onChange={(e) => {
            const file = e.target.files?.[0]
            if (!file) return
            const reader = new FileReader()
            reader.onload = (ev) => setDraft((d) => ({ ...d, imageUrl: ev.target.result }))
            reader.readAsDataURL(file)
            e.target.value = ''
          }} />
        </label>
        {draft.imageUrl && (
          <img src={draft.imageUrl} alt="" className="w-full h-32 object-cover rounded-xl" style={{ border: `1px solid ${activeCat?.color || coin.color}44` }} />
        )}

        {error && <p className="text-xs text-red-300 text-center">{error}</p>}

        <button
          onClick={handleSubmit}
          disabled={!draft.name?.trim() || !draft.categoryId}
          className="w-full py-3 rounded-xl text-sm font-semibold text-white disabled:opacity-40"
          style={{
            background: `linear-gradient(135deg, ${activeCat?.color || coin.color}88, ${coin.emissiveColor}66)`,
            border: `1px solid ${activeCat?.color || coin.color}55`,
          }}
        >
          Send til godkendelse →
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {success && (
        <div className="px-4 py-3 rounded-xl text-xs text-center" style={{ background: 'rgba(74,222,128,0.12)', border: '1px solid rgba(74,222,128,0.3)', color: '#86efac' }}>
          {success}
        </div>
      )}

      <p className="text-white/40 text-xs leading-relaxed">
        Foreslå produkter til WL Shop. Admin gennemgår og godkender inden de vises offentligt.
      </p>

      {mySubs.length === 0 && (
        <div className="text-center py-10 rounded-2xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <span className="text-3xl opacity-25 block mb-2">🛍️</span>
          <p className="text-white/30 text-xs">Ingen produktforslag endnu</p>
        </div>
      )}

      {mySubs.map((sub) => (
        <div
          key={sub.id}
          className="p-4 rounded-2xl space-y-2"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
        >
          <div className="flex items-start gap-3">
            {sub.product.imageUrl ? (
              <img src={sub.product.imageUrl} alt="" className="w-12 h-12 rounded-lg object-cover flex-shrink-0" />
            ) : (
              <div className="w-12 h-12 rounded-lg flex items-center justify-center text-xl flex-shrink-0" style={{ background: `${sub.categoryColor}18` }}>
                {sub.categoryIcon || '🛍️'}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-white/90 truncate">{sub.product.name}</div>
              <div className="text-[10px] text-white/35 mt-0.5">{sub.categoryLabel}</div>
            </div>
            <StatusBadge status={sub.status} />
          </div>
          {sub.status === 'pending' && (
            <button
              onClick={() => { if (window.confirm('Annuller forespørgsel?')) deleteShopSubmission(sub.id) }}
              className="text-[10px] text-white/30 hover:text-red-400 transition-colors"
            >
              Annuller forespørgsel
            </button>
          )}
        </div>
      ))}

      <button
        onClick={openNew}
        className="w-full py-3 rounded-xl text-sm font-semibold transition-all"
        style={{ background: 'rgba(96,165,250,0.15)', border: '1px solid rgba(96,165,250,0.35)', color: '#93c5fd' }}
      >
        + Foreslå produkt
      </button>
    </div>
  )
}

function UserDashboard({ coin }) {
  const { currentUser, logoutUser, blogPosts, pendingShopSubmissions } = useStore()
  const [activeTab, setActiveTab] = useState('blog')

  const myPostCount = blogPosts.filter((p) => p.authorId === currentUser.id).length
  const myPendingShop = pendingShopSubmissions.filter((s) => s.userId === currentUser.id && s.status === 'pending').length
  const initials = (currentUser.name || '?')
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  const tabs = [
    { key: 'blog', label: 'Indlæg', icon: '📝' },
    { key: 'shop', label: 'Shop', icon: '🛍️' },
    { key: 'profile', label: 'Profil', icon: '👤' },
  ]

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Header banner */}
      <div
        className="relative px-6 pt-8 pb-5 flex-shrink-0 overflow-hidden"
        style={{ background: `linear-gradient(135deg, ${coin.color}28 0%, rgba(4,14,8,0) 100%)` }}
      >
        <div className="absolute inset-0 pointer-events-none opacity-40" style={{ background: 'radial-gradient(circle at 80% 0%, rgba(74,222,128,0.2), transparent 50%)' }} />
        <div className="relative flex items-start justify-between gap-4 pr-8">
          <div className="flex items-center gap-4">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center text-lg font-bold text-white flex-shrink-0"
              style={{
                background: `linear-gradient(135deg, ${coin.color}, ${coin.emissiveColor})`,
                boxShadow: `0 8px 24px ${coin.color}44`,
              }}
            >
              {initials}
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">Mit WL</h2>
              <p className="text-sm text-white/70">{currentUser.name}</p>
              <p className="text-[11px] text-white/35">{currentUser.email}</p>
            </div>
          </div>
          <button
            onClick={logoutUser}
            className="text-[10px] text-white/40 hover:text-white/70 px-3 py-1.5 rounded-lg border border-white/10 hover:border-white/20 transition-all flex-shrink-0 mt-1"
          >
            Log ud
          </button>
        </div>

        <div className="relative flex gap-2 mt-5">
          <div className="flex-1 px-3 py-2 rounded-xl text-center" style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="text-lg font-bold text-white">{myPostCount}</div>
            <div className="text-[9px] text-white/35 uppercase tracking-wider">Indlæg</div>
          </div>
          <div className="flex-1 px-3 py-2 rounded-xl text-center" style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="text-lg font-bold" style={{ color: myPendingShop ? '#fbbf24' : '#fff' }}>{myPendingShop}</div>
            <div className="text-[9px] text-white/35 uppercase tracking-wider">Afventer</div>
          </div>
        </div>
      </div>

      <div className="px-4 pt-4 pb-2 flex-shrink-0">
        <TabBar tabs={tabs} active={activeTab} onChange={setActiveTab} accent={coin.color} />
      </div>

      <div className="flex-1 overflow-y-auto px-4 md:px-5 py-3 min-h-0 pb-6">
        {activeTab === 'blog' && <UserBlogAdmin coin={coin} currentUser={currentUser} />}
        {activeTab === 'shop' && <UserShopAdmin coin={coin} currentUser={currentUser} />}
        {activeTab === 'profile' && (
          <div className="space-y-4">
            <div
              className="rounded-2xl p-5 space-y-4"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
            >
              {[
                ['Navn', currentUser.name],
                ['E-mail', currentUser.email],
                ['Medlem siden', currentUser.createdAt ? new Date(currentUser.createdAt).toLocaleDateString('da-DK') : '—'],
              ].map(([label, value]) => (
                <div key={label}>
                  <div className="text-[10px] text-white/35 uppercase tracking-widest mb-1">{label}</div>
                  <div className="text-sm text-white/85">{value}</div>
                </div>
              ))}
            </div>
            <p className="text-white/25 text-[10px] leading-relaxed px-1">
              Din konto gemmes lokalt i browseren. Community-indlæg udgives med det samme. Shop-produkter kræver admin-godkendelse.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default function MemberModal({ coin, onClose }) {
  const currentUser = useStore((s) => s.currentUser)
  const [authedView, setAuthedView] = useState(!!currentUser)
  const overlayRef = useRef()
  const panelRef = useRef()

  useEffect(() => {
    setAuthedView(!!currentUser)
  }, [currentUser])

  useEffect(() => {
    if (overlayRef.current && panelRef.current) {
      gsap.fromTo(overlayRef.current, { opacity: 0 }, { opacity: 1, duration: 0.35, ease: 'power2.out' })
      gsap.fromTo(
        panelRef.current,
        { opacity: 0, scale: 0.94, y: 20 },
        { opacity: 1, scale: 1, y: 0, duration: 0.5, ease: 'back.out(1.4)' }
      )
    }
  }, [])

  const handleClose = () => {
    if (!overlayRef.current || !panelRef.current) { onClose(); return }
    gsap.to(panelRef.current, { opacity: 0, scale: 0.96, y: 12, duration: 0.22, ease: 'power2.in' })
    gsap.to(overlayRef.current, { opacity: 0, duration: 0.28, ease: 'power2.in', onComplete: onClose })
  }

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8"
      style={{ background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(4px)' }}
      onClick={(e) => e.target === e.currentTarget && handleClose()}
    >
      <div
        ref={panelRef}
        className="relative flex flex-col w-full max-w-md overflow-hidden"
        style={{
          height: 'min(88vh, 720px)',
          borderRadius: '1.25rem',
          background: 'linear-gradient(180deg, rgba(8,18,28,0.98) 0%, rgba(4,12,10,0.99) 100%)',
          backdropFilter: 'blur(40px)',
          WebkitBackdropFilter: 'blur(40px)',
          border: `1px solid ${coin.color}30`,
          boxShadow: `0 0 0 1px rgba(255,255,255,0.04), 0 0 80px ${coin.color}18, 0 40px 100px rgba(0,0,0,0.8)`,
        }}
      >
        <div
          className="h-1 flex-shrink-0"
          style={{ background: `linear-gradient(90deg, ${coin.emissiveColor}, ${coin.color}, rgba(74,222,128,0.6), transparent)` }}
        />

        <button
          onClick={handleClose}
          className="absolute top-4 right-4 z-20 w-9 h-9 rounded-full flex items-center justify-center text-white/35 hover:text-white transition-all text-xl leading-none"
          style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}
          aria-label="Close"
        >
          ×
        </button>

        {authedView && currentUser ? (
          <UserDashboard coin={coin} />
        ) : (
          <AuthGate coin={coin} onSuccess={() => setAuthedView(true)} />
        )}
      </div>
    </div>
  )
}
