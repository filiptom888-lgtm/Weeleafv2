import { create } from 'zustand'
import { COINS as DEFAULT_COINS } from '../data/coinData'
import { DEFAULT_SHOP_CATEGORIES } from '../data/shopData'
import { DEFAULT_BLOG_POSTS } from '../data/blogData'

// Persist admin coin edits to localStorage so they survive refresh
const STORAGE_KEY = 'wl_admin_coins'
const SHOP_KEY = 'wl_admin_shop'
const BLOG_KEY = 'wl_admin_blog'
const DONATION_KEY = 'wl_admin_donation'

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

// Redistribute angles evenly: angle[i] = (i / total) * 360
function redistributeAngles(coins) {
  const total = coins.length
  return coins.map((c, i) => ({ ...c, angle: Math.round((i / total) * 360) }))
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

  // Blog posts (newest first)
  blogPosts: loadBlog(),

  // Donation config
  donationConfig: loadDonation(),

  setActiveCoin: (coin) =>
    set({ activeCoin: coin, isModalOpen: coin !== null }),

  closeModal: () =>
    set({ activeCoin: null, isModalOpen: false }),

  toggleChat: () => set((s) => ({ isChatOpen: !s.isChatOpen })),
  toggleAdmin: () => set((s) => ({ isAdminOpen: !s.isAdminOpen })),

  setLeafyPos: (pos) => set({ leafyPos: pos }),

  // Admin actions
  addCoin: (coin) => {
    const updated = redistributeAngles([...get().coins, coin])
    saveCoins(updated)
    set({ coins: updated })
    // Return the redistributed version of the new coin so the caller can edit it
    return updated[updated.length - 1]
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
}))

export default useStore
