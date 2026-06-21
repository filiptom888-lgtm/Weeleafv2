const USERS_KEY = 'wl_users'
const USER_SESSION_KEY = 'wl_user_session'

export function loadUsers() {
  try {
    const raw = localStorage.getItem(USERS_KEY)
    if (raw) return JSON.parse(raw)
  } catch (_) {}
  return []
}

export function saveUsers(users) {
  try {
    localStorage.setItem(USERS_KEY, JSON.stringify(users))
  } catch (_) {}
}

export function loadUserSession() {
  try {
    const raw = sessionStorage.getItem(USER_SESSION_KEY)
    if (raw) return JSON.parse(raw)
  } catch (_) {}
  return null
}

export function saveUserSession(user) {
  try {
    sessionStorage.setItem(USER_SESSION_KEY, JSON.stringify(user))
  } catch (_) {}
}

export function clearUserSession() {
  try {
    sessionStorage.removeItem(USER_SESSION_KEY)
  } catch (_) {}
}

export function sanitizeUser(user) {
  if (!user) return null
  const { password, ...safe } = user
  return safe
}

/** Demo account — created automatically if missing */
export const TEST_USER = {
  id: 'user-test-wl',
  name: 'WL Test',
  email: 'test@weeleaf.com',
  password: 'test1234',
  createdAt: '2026-01-01T00:00:00.000Z',
}

export function ensureTestUser() {
  const users = loadUsers()
  if (!users.some((u) => u.email === TEST_USER.email)) {
    saveUsers([...users, TEST_USER])
  }
}
