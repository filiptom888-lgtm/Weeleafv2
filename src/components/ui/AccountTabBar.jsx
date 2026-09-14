import { WL } from '../../styles/modalTheme'

/** Shared pill tab bar — shop, community, member dashboard */
export default function AccountTabBar({ tabs, active, onChange }) {
  return (
    <div
      className="flex gap-1.5 p-1 rounded-2xl overflow-x-auto"
      style={{
        background: 'rgba(255, 248, 238, 0.28)',
        border: `1px solid rgba(255, 255, 255, 0.4)`,
      }}
    >
      {tabs.map(({ key, label }) => {
        const isOn = active === key
        return (
          <button
            key={key}
            type="button"
            onClick={() => onChange(key)}
            className="flex-shrink-0 min-w-0 py-2.5 px-3 rounded-xl text-[11px] font-semibold transition-all whitespace-nowrap"
            style={{
              background: isOn ? 'rgba(200, 144, 74, 0.16)' : 'transparent',
              border: `1px solid ${isOn ? WL.gold : 'transparent'}`,
              color: isOn ? WL.green : WL.textMuted,
            }}
          >
            {label}
          </button>
        )
      })}
    </div>
  )
}
