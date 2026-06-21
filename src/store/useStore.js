import { create } from 'zustand'
import { COINS as DEFAULT_COINS } from '../data/coinData'
import { DEFAULT_SHOP_CATEGORIES } from '../data/shopData'
import { DEFAULT_BLOG_POSTS } from '../data/blogData'
import {
  loadUsers,
  saveUsers,
  loadUserSession,
  saveUserSession,
  clearUserSession,
  sanitizeUser,
  ensureTestUser,
} from '../data/userAuth'

// Persist admin coin edits to localStorage so they survive refresh
const STORAGE_KEY = 'wl_admin_coins'
const SHOP_KEY = 'wl_admin_shop'
const BLOG_KEY = 'wl_admin_blog'
const DONATION_KEY = 'wl_admin_donation'
const STATS_KEY = 'wl_admin_stats'
const PENDING_SHOP_KEY = 'wl_pending_shop'

const DEFAULT_STATS = [
  { id: 'members',   label: 'Medlemmer',     value: 0,   suffix: '' },
  { id: 'co2',       label: 'Kg CO₂ sparet', value: 0,   suffix: 'kg' },
  { id: 'donations', label: 'Donationer',    value: 0,   suffix: 'kr' },
]
function loadStats() {
  try {
    const raw = localStorage.getItem(STATS_KEY)
    if (raw) return JSON.parse(raw)
  } catch (_) {}
  return DEFAULT_STATS
}
function saveStats(stats) {
  try { localStorage.setItem(STATS_KEY, JSON.stringify(stats)) } catch (_) {}
}

const DEFAULT_DONATION_CONFIG = { mobilepay: '', link: '', qrImageUrl: '' }
function loadDonation() {
  try {
    const raw = localStorage.getItem(DONATION_KEY)
    if (raw) return { ...DEFAULT_DONATION_CONFIG, ...JSON.parse(raw) }
  } catch (_) {}
  return DEFAULT_DONATION_CONFIG
}
function saveDonation(cfg) {
  try { localStorage.setItem(DONATION_KEY, JSON.stringify(cfg)) } catch (_) {}
}

function loadShop() {
  try {
    const raw = localStorage.getItem(SHOP_KEY)
    if (raw) return JSON.parse(raw)
  } catch (_) {}
  return DEFAULT_SHOP_CATEGORIES
}
function saveShop(cats) {
  try { localStorage.setItem(SHOP_KEY, JSON.stringify(cats)) } catch (_) {}
}

function loadBlog() {
  try {
    const raw = localStorage.getItem(BLOG_KEY)
    if (raw) return JSON.parse(raw)
  } catch (_) {}
  return DEFAULT_BLOG_POSTS
}
function saveBlog(posts) {
  try { localStorage.setItem(BLOG_KEY, JSON.stringify(posts)) } catch (_) {}
}
function loadPendingShop() {
  try {
    const raw = localStorage.getItem(PENDING_SHOP_KEY)
    if (raw) return JSON.parse(raw)
  } catch (_) {}
  return []
}
function savePendingShop(submissions) {
  try { localStorage.setItem(PENDING_SHOP_KEY, JSON.stringify(submissions)) } catch (_) {}
}
function loadCoins() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch (_) {}
  return DEFAULT_COINS
}
function saveCoins(coins) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(coins)) } catch (_) {}
}

// System coins that must always exist — auto-added like Admin "+ Add Coin"
export const SYSTEM_COIN_IDS = ['shop', 'member']

// Redistribute angles evenly: angle[i] = (i / total) * 360
function redistributeAngles(coins) {
  const total = coins.length
  return coins.map((c, i) => ({ ...c, angle: Math.round((i / total) * 360) }))
}

function memberCoinFromDefaults(coins) {
  const def = DEFAULT_COINS.find((c) => c.id === 'member')
  if (!def) return null
  const hiveImage = coins.find((c) => c.id === 'wl-hive')?.imageUrl
  return hiveImage ? { ...def, imageUrl: hiveImage } : { ...def }
}

const useStore = create((set, get) => ({
  activeCoin: null,
  isModalOpen: false,
  isChatOpen: false,
  isAdminOpen: false,
  leafyPos: { x: 0, y: 0 },

  // Runtime-editable coin list
  coins: loadCoins(),

  // Shop categories & products
  shopCategories: loadShop(),

  // Member-submitted shop products awaiting admin approval
  pendingShopSubmissions: loadPendingShop(),

  // Blog posts (newest first)
  blogPosts: loadBlog(),

  // Donation config
  donationConfig: loadDonation(),

  // Stats counters
  stats: loadStats(),

  // Member auth (client-side demo — no real backend)
  currentUser: loadUserSession(),

  setActiveCoin: (coin) =>
    set({ activeCoin: coin, isModalOpen: coin !== null }),

  closeModal: () =>
    set({ activeCoin: null, isModalOpen: false }),

  toggleChat: () => set((s) => ({ isChatOpen: !s.isChatOpen })),
  toggleAdmin: () => set((s) => ({ isAdminOpen: !s.isAdminOpen })),

  setLeafyPos: (pos) => set({ leafyPos: pos }),

  registerUser: ({ name, email, password }) => {
    const trimmedName = name?.trim()
    const trimmedEmail = email?.trim().toLowerCase()
    const trimmedPassword = password?.trim()
    if (!trimmedName || !trimmedEmail || !trimmedPassword) {
      return { ok: false, error: 'Udfyld alle felter.' }
    }
    if (trimmedPassword.length < 4) {
      return { ok: false, error: 'Adgangskode skal være mindst 4 tegn.' }
    }
    const users = loadUsers()
    if (users.some((u) => u.email === trimmedEmail)) {
      return { ok: false, error: 'Den e-mail er allerede registreret.' }
    }
    const user = {
      id: `user-${Date.now()}`,
      name: trimmedName,
      email: trimmedEmail,
      password: trimmedPassword,
      createdAt: new Date().toISOString(),
    }
    const updated = [...users, user]
    saveUsers(updated)
    const session = sanitizeUser(user)
    saveUserSession(session)
    set({ currentUser: session })
    return { ok: true }
  },

  loginUser: ({ email, password }) => {
    const trimmedEmail = email?.trim().toLowerCase()
    const trimmedPassword = password?.trim()
    if (!trimmedEmail || !trimmedPassword) {
      return { ok: false, error: 'Udfyld e-mail og adgangskode.' }
    }
    const user = loadUsers().find(
      (u) => u.email === trimmedEmail && u.password === trimmedPassword
    )
    if (!user) {
      return { ok: false, error: 'Forkert e-mail eller adgangskode.' }
    }
    const session = sanitizeUser(user)
    saveUserSession(session)
    set({ currentUser: session })
    return { ok: true }
  },

  logoutUser: () => {
    clearUserSession()
    set({ currentUser: null })
  },

  // Admin actions
  addCoin: (coin) => {
    const updated = redistributeAngles([...get().coins, coin])
    saveCoins(updated)
    set({ coins: updated })
    // Return the redistributed version of the new coin so the caller can edit it
    return updated[updated.length - 1]
  },

  /** Same as Admin "+ Add Coin" — ensures shop + member login nodes exist on the orbit */
  syncSystemCoins: () => {
    const { coins, addCoin, updateCoin } = get()
    const hiveImage = coins.find((c) => c.id === 'wl-hive')?.imageUrl

    // Retire old events node id → member login
    const eventsCoin = coins.find((c) => c.id === 'wl-events')
    if (eventsCoin && !coins.some((c) => c.id === 'member')) {
      const memberDef = memberCoinFromDefaults(coins)
      if (memberDef) {
        updateCoin('wl-events', {
          ...memberDef,
          id: 'member',
          imageUrl: hiveImage || eventsCoin.imageUrl || memberDef.imageUrl || '',
        })
      }
    }

    for (const id of SYSTEM_COIN_IDS) {
      if (!get().coins.some((c) => c.id === id)) {
        const def = id === 'member' ? memberCoinFromDefaults(get().coins) : DEFAULT_COINS.find((c) => c.id === id)
        if (def) addCoin({ ...def })
      }
    }

    // Keep member coin image in sync with WL Hive
    const member = get().coins.find((c) => c.id === 'member')
    const hive = get().coins.find((c) => c.id === 'wl-hive')
    if (member && hive?.imageUrl && member.imageUrl !== hive.imageUrl) {
      updateCoin('member', { imageUrl: hive.imageUrl })
    }
  },

  updateCoin: (id, patch) => {
    const updated = get().coins.map((c) => (c.id === id ? { ...c, ...patch } : c))
    saveCoins(updated)
    set({ coins: updated })
    // Sync activeCoin if it was the one edited
    if (get().activeCoin?.id === id) {
      set({ activeCoin: updated.find((c) => c.id === id) })
    }
  },
  deleteCoin: (id) => {
    const updated = redistributeAngles(get().coins.filter((c) => c.id !== id))
    saveCoins(updated)
    set({ coins: updated, activeCoin: null, isModalOpen: false })
  },
  resetCoins: () => {
    saveCoins(DEFAULT_COINS)
    set({ coins: DEFAULT_COINS, activeCoin: null, isModalOpen: false })
  },

  // Shop actions
  addShopCategory: (cat) => {
    const updated = [...get().shopCategories, cat]
    saveShop(updated)
    set({ shopCategories: updated })
  },
  updateShopCategory: (id, patch) => {
    const updated = get().shopCategories.map((c) => c.id === id ? { ...c, ...patch } : c)
    saveShop(updated)
    set({ shopCategories: updated })
  },
  deleteShopCategory: (id) => {
    const updated = get().shopCategories.filter((c) => c.id !== id)
    saveShop(updated)
    set({ shopCategories: updated })
  },
  addShopProduct: (categoryId, product) => {
    const updated = get().shopCategories.map((c) =>
      c.id === categoryId ? { ...c, products: [...(c.products ?? []), product] } : c
    )
    saveShop(updated)
    set({ shopCategories: updated })
  },
  updateShopProduct: (categoryId, productId, patch) => {
    const updated = get().shopCategories.map((c) =>
      c.id === categoryId
        ? { ...c, products: (c.products ?? []).map((p) => p.id === productId ? { ...p, ...patch } : p) }
        : c
    )
    saveShop(updated)
    set({ shopCategories: updated })
  },
  deleteShopProduct: (categoryId, productId) => {
    const updated = get().shopCategories.map((c) =>
      c.id === categoryId
        ? { ...c, products: (c.products ?? []).filter((p) => p.id !== productId) }
        : c
    )
    saveShop(updated)
    set({ shopCategories: updated })
  },
  resetShop: () => {
    saveShop(DEFAULT_SHOP_CATEGORIES)
    set({ shopCategories: DEFAULT_SHOP_CATEGORIES })
  },

  submitShopProduct: ({ userId, userName, userEmail, categoryId, product }) => {
    const category = get().shopCategories.find((c) => c.id === categoryId)
    if (!category) return { ok: false, error: 'Vælg en gyldig kategori.' }
    if (!product?.name?.trim()) return { ok: false, error: 'Produktnavn er påkrævet.' }
    const submission = {
      id: `sub-${Date.now()}`,
      status: 'pending',
      submittedAt: new Date().toISOString(),
      userId,
      userName,
      userEmail,
      categoryId,
      categoryLabel: category.label,
      categoryIcon: category.icon,
      categoryColor: category.color,
      product: {
        id: `p-${Date.now()}`,
        name: product.name.trim(),
        desc: product.desc?.trim() || '',
        price: product.price?.trim() || '',
        imageUrl: product.imageUrl || '',
        link: product.link?.trim() || '',
      },
    }
    const updated = [submission, ...get().pendingShopSubmissions]
    savePendingShop(updated)
    set({ pendingShopSubmissions: updated })
    return { ok: true, submission }
  },

  approveShopSubmission: (submissionId) => {
    const sub = get().pendingShopSubmissions.find((s) => s.id === submissionId)
    if (!sub || sub.status !== 'pending') return
    get().addShopProduct(sub.categoryId, { ...sub.product })
    const updated = get().pendingShopSubmissions.map((s) =>
      s.id === submissionId
        ? { ...s, status: 'approved', reviewedAt: new Date().toISOString() }
        : s
    )
    savePendingShop(updated)
    set({ pendingShopSubmissions: updated })
  },

  rejectShopSubmission: (submissionId) => {
    const updated = get().pendingShopSubmissions.map((s) =>
      s.id === submissionId
        ? { ...s, status: 'rejected', reviewedAt: new Date().toISOString() }
        : s
    )
    savePendingShop(updated)
    set({ pendingShopSubmissions: updated })
  },

  deleteShopSubmission: (submissionId) => {
    const updated = get().pendingShopSubmissions.filter((s) => s.id !== submissionId)
    savePendingShop(updated)
    set({ pendingShopSubmissions: updated })
  },

  // Blog actions
  addBlogPost: (post) => {
    const updated = [post, ...get().blogPosts]
    saveBlog(updated)
    set({ blogPosts: updated })
  },
  updateBlogPost: (id, patch) => {
    const updated = get().blogPosts.map((p) => p.id === id ? { ...p, ...patch } : p)
    saveBlog(updated)
    set({ blogPosts: updated })
  },
  deleteBlogPost: (id) => {
    const updated = get().blogPosts.filter((p) => p.id !== id)
    saveBlog(updated)
    set({ blogPosts: updated })
  },
  resetBlog: () => {
    saveBlog(DEFAULT_BLOG_POSTS)
    set({ blogPosts: DEFAULT_BLOG_POSTS })
  },

  // Donation actions
  setDonationConfig: (patch) => {
    const updated = { ...get().donationConfig, ...patch }
    saveDonation(updated)
    set({ donationConfig: updated })
  },
  resetDonationConfig: () => {
    saveDonation(DEFAULT_DONATION_CONFIG)
    set({ donationConfig: DEFAULT_DONATION_CONFIG })
  },

  // Stats actions
  updateStats: (patch) => {
    // patch can be array (full replace) or object {id, ...fields}
    if (Array.isArray(patch)) {
      saveStats(patch)
      set({ stats: patch })
    } else {
      const updated = get().stats.map((s) => s.id === patch.id ? { ...s, ...patch } : s)
      saveStats(updated)
      set({ stats: updated })
    }
  },
  resetStats: () => {
    saveStats(DEFAULT_STATS)
    set({ stats: DEFAULT_STATS })
  },

  // Apply a full config snapshot fetched from /wl-config.json
  // This is the "source of truth" for all users — overrides localStorage
  applyRemoteConfig: (data) => {
    if (data.coins && Array.isArray(data.coins) && data.coins.length > 0) {
      saveCoins(data.coins)
      set({ coins: data.coins })
    }
    if (data.shopCategories && Array.isArray(data.shopCategories)) {
      saveShop(data.shopCategories)
      set({ shopCategories: data.shopCategories })
    }
    if (data.blogPosts && Array.isArray(data.blogPosts)) {
      saveBlog(data.blogPosts)
      set({ blogPosts: data.blogPosts })
    }
    if (data.donationConfig && typeof data.donationConfig === 'object') {
      saveDonation(data.donationConfig)
      set({ donationConfig: data.donationConfig })
    }
    if (data.stats && Array.isArray(data.stats) && data.stats.length > 0) {
      saveStats(data.stats)
      set({ stats: data.stats })
    }
    get().syncSystemCoins()
  },
}))

useStore.getState().syncSystemCoins()
ensureTestUser()

export default useStore
