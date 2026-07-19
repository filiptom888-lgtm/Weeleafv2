/** Default stock avatars — served from /public/avatars */
export const AVATAR_OPTIONS = [
  { id: '1', label: 'Grøn', src: '/avatars/avatar-1.svg' },
  { id: '2', label: 'Guld', src: '/avatars/avatar-2.svg' },
  { id: '3', label: 'Blå', src: '/avatars/avatar-3.svg' },
  { id: '4', label: 'Lilla', src: '/avatars/avatar-4.svg' },
  { id: '5', label: 'Orange', src: '/avatars/avatar-5.svg' },
]

export function avatarSrc(avatarId, avatarUrl = null) {
  if (avatarId === 'custom' && avatarUrl) return avatarUrl
  const opt = AVATAR_OPTIONS.find((a) => a.id === String(avatarId))
  return opt?.src ?? null
}
