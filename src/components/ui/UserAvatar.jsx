import { WL } from '../../styles/modalTheme'
import { avatarSrc } from '../../data/avatarOptions'

function initialsFromName(name) {
  if (!name) return '?'
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

/** Shared avatar — stock image, custom upload, or initials fallback */
export default function UserAvatar({
  name = '',
  avatarId = null,
  avatarUrl = null,
  size = 40,
  rounded = 'full',
  className = '',
}) {
  const src = avatarSrc(avatarId, avatarUrl)
  const radius = rounded === 'square' ? 'rounded-2xl' : 'rounded-full'
  const px = typeof size === 'number' ? size : 40
  const textSize = px >= 56 ? 'text-lg' : px >= 40 ? 'text-xs' : 'text-[10px]'

  if (src) {
    return (
      <img
        src={src}
        alt=""
        className={`flex-shrink-0 object-cover ${radius} ${className}`}
        style={{ width: px, height: px, boxShadow: '0 0 0 2px #fff' }}
      />
    )
  }

  return (
    <div
      className={`flex-shrink-0 flex items-center justify-center font-bold text-white ${radius} ${textSize} ${className}`}
      style={{
        width: px,
        height: px,
        background: `linear-gradient(135deg, ${WL.greenBright}, #4ade80)`,
        boxShadow: '0 0 0 2px #fff',
      }}
    >
      {initialsFromName(name)}
    </div>
  )
}
