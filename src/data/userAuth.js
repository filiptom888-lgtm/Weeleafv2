export function loadCachedUser() {
  return null
}

export function saveCachedUser() {}

export function clearUserSession() {}

export function sanitizeUser(user) {
  if (!user) return null
  const { password, ...safe } = user
  return safe
}

export const TEST_USER = {
  id: 'user-test-wl',
  name: 'WL Test',
  email: 'test@weeleaf.com',
  password: 'test1234',
  createdAt: '2026-01-01T00:00:00.000Z',
}

export function ensureTestUser() {}
