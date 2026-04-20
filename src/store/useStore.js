import { create } from 'zustand'
import { COINS as DEFAULT_COINS } from '../data/coinData'

// Persist admin coin edits to localStorage so they survive refresh
const STORAGE_KEY = 'wl_admin_coins'
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
}))

export default useStore
