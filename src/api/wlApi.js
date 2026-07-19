const API_BASE = import.meta.env.VITE_API_BASE || '/api'
const TOKEN_KEY = 'wl_auth_token'
const USER_KEY = 'wl_user_session'

export function getToken() {
  try {
    return sessionStorage.getItem(TOKEN_KEY) || ''
  } catch {
    return ''
  }
}

export function setToken(token) {
  try {
    if (token) sessionStorage.setItem(TOKEN_KEY, token)
    else sessionStorage.removeItem(TOKEN_KEY)
  } catch (_) {}
}

export function loadCachedUser() {
  try {
    const raw = sessionStorage.getItem(USER_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function saveCachedUser(user) {
  try {
    if (user) sessionStorage.setItem(USER_KEY, JSON.stringify(user))
    else sessionStorage.removeItem(USER_KEY)
  } catch (_) {}
}

async function request(path, { method = 'GET', body, auth = false, admin = false } = {}) {
  const headers = { Accept: 'application/json' }
  if (body !== undefined) headers['Content-Type'] = 'application/json'

  const token = getToken()
  if ((auth || admin) && token) headers.Authorization = `Bearer ${token}`

  let res
  try {
    res = await fetch(`${API_BASE}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    })
  } catch {
    return { ok: false, error: 'Kunne ikke forbinde til serveren.' }
  }

  let data = {}
  try {
    data = await res.json()
  } catch {
    data = {}
  }

  if (!res.ok || data.ok === false) {
    return { ok: false, error: data.error || `Serverfejl (${res.status})` }
  }

  return { ok: true, ...data }
}

export const api = {
  health: () => request('/health'),

  fetchConfig: () => request('/config'),

  login: (email, password) =>
    request('/auth/login', { method: 'POST', body: { email, password } }),

  register: (name, email, password) =>
    request('/auth/register', { method: 'POST', body: { name, email, password } }),

  adminLogin: (password) =>
    request('/auth/admin', { method: 'POST', body: { password } }),

  me: () => request('/auth/me', { auth: true }),

  logout: () => request('/auth/logout', { method: 'POST', auth: true }),

  saveCoins: (coins) =>
    request('/config/coins', { method: 'PUT', body: { coins }, auth: true }),

  saveStats: (stats) =>
    request('/config/stats', { method: 'PUT', body: { stats }, auth: true }),

  saveDonation: (donationConfig) =>
    request('/config/donation', { method: 'PUT', body: { donationConfig }, auth: true }),

  saveGithub: (github) =>
    request('/config/github', { method: 'PUT', body: { github }, auth: true }),

  saveShop: (shopCategories) =>
    request('/shop', { method: 'PUT', body: { shopCategories }, auth: true }),

  createPost: (post) =>
    request('/posts', { method: 'POST', body: post, auth: true }),

  updatePost: (id, patch) =>
    request(`/posts/${id}`, { method: 'PUT', body: patch, auth: true }),

  deletePost: (id) =>
    request(`/posts/${id}`, { method: 'DELETE', auth: true }),

  submitProduct: (payload) =>
    request('/submissions', { method: 'POST', body: payload, auth: true }),

  approveSubmission: (id) =>
    request(`/submissions/${id}/approve`, { method: 'POST', auth: true }),

  rejectSubmission: (id) =>
    request(`/submissions/${id}/reject`, { method: 'POST', auth: true }),

  deleteSubmission: (id) =>
    request(`/submissions/${id}`, { method: 'DELETE', auth: true }),

  fetchSubmissions: () =>
    request('/submissions', { auth: true }),
}
