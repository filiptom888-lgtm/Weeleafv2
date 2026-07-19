import { WL } from '../../styles/modalTheme'

/** Shared pill tab bar — member dashboard + admin panel */
export default function AccountTabBar({ tabs, active, onChange }) {
  return (
    <div
      className="flex gap-1.5 p-1 rounded-2xl overflow-x-auto"
      style={{ background: 'rgba(255,255,255,0.5)', border: `1px solid ${WL.borderLight}` }}
    >
      {tabs.map(({ key, label, icon }) => (
        <button
          key={key}
          type="button"
          onClick={() => onChange(key)}
          className="flex-shrink-0 min-w-0 py-2.5 px-3 rounded-xl text-[11px] font-semibold transition-all whitespace-nowrap"
          style={{
            background: active === key ? 'rgba(61,158,95,0.14)' : 'transparent',
            border: `1px solid ${active === key ? WL.greenBright : 'transparent'}`,
            color: active === key ? WL.green : WL.textMuted,
          }}
        >
          {icon ? `${icon} ` : ''}{label}
        </button>
      ))}
    </div>
  )
}
