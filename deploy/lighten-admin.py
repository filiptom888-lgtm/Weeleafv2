from pathlib import Path

p = Path('src/components/ui/AdminPanel.jsx')
t = p.read_text(encoding='utf-8')

if 'AccountTabBar' not in t:
    t = t.replace(
        "import { WL, accountInputCls, accountInputStyle } from '../../styles/modalTheme'",
        "import { WL, accountInputCls, accountInputStyle, accountCardStyle, accountLabelCls } from '../../styles/modalTheme'\nimport AccountTabBar from './AccountTabBar'",
    )

replacements = [
    ("background: 'rgba(255,255,255,0.04)'", "background: 'rgba(255,255,255,0.72)'"),
    ("background: 'rgba(255,255,255,0.03)'", "background: 'rgba(255,255,255,0.65)'"),
    ("background: 'rgba(255,255,255,0.05)'", "background: 'rgba(255,255,255,0.8)'"),
    ("background: 'rgba(255,255,255,0.06)'", "background: 'rgba(255,255,255,0.75)'"),
    ("background: 'rgba(255,255,255,0.08)'", "background: 'rgba(255,255,255,0.55)'"),
    ("border: '1px solid rgba(255,255,255,0.08)'", "border: `1px solid ${WL.borderLight}`"),
    ("border: '1px solid rgba(255,255,255,0.07)'", "border: `1px solid ${WL.borderLight}`"),
    ("border: '1px solid rgba(255,255,255,0.12)'", "border: `1px solid ${WL.borderLight}`"),
    ("border: '1px solid rgba(255,255,255,0.15)'", "border: `1px solid ${WL.border}`"),
    ("borderColor: 'rgba(255,255,255,0.07)'", "borderColor: WL.borderLight"),
    ('className="text-sm font-medium text-white/85"', 'className="text-sm font-medium" style={{ color: WL.text }}'),
    ('className="text-sm font-medium text-white/90 truncate"', 'className="text-sm font-medium truncate" style={{ color: WL.text }}'),
    ('className="text-sm text-white/75 truncate"', 'className="text-sm truncate" style={{ color: WL.textMuted }}'),
    ('className="text-sm font-semibold text-white/90"', 'className="text-sm font-semibold" style={{ color: WL.text }}'),
    ('className="text-[10px] text-white/30"', 'className="text-[10px]" style={{ color: WL.textSoft }}'),
    ('className="text-[10px] text-white/40 uppercase tracking-widest"', 'className="text-[10px] uppercase tracking-widest" style={{ color: WL.textSoft }}'),
    ('className="text-[11px] text-white/20 px-1 py-1"', 'className="text-[11px] px-1 py-1" style={{ color: WL.textSoft }}'),
    ('className="text-xs text-white/40"', 'className="text-xs" style={{ color: WL.textSoft }}'),
    ('className="text-xs text-white/50"', 'className="text-xs" style={{ color: WL.textMuted }}'),
    ('className="text-white/35 text-xs leading-relaxed"', 'className="text-xs leading-relaxed" style={{ color: WL.textMuted }}'),
    ('className="text-white/25 text-xs"', 'className="text-xs" style={{ color: WL.textSoft }}'),
    ('className="text-[10px] text-white/25 uppercase tracking-widest"', 'className="text-[10px] uppercase tracking-widest" style={{ color: WL.textSoft }}'),
    ('className="text-white/50 text-[11px] uppercase tracking-widest font-semibold"', 'className="text-[11px] uppercase tracking-widest font-semibold" style={{ color: WL.textSoft }}'),
    ('className="text-white/50 text-xs mb-1"', 'className="text-xs mb-1" style={{ color: WL.textSoft }}'),
    ('className="block text-white/50 text-xs mb-1"', 'className="block text-xs mb-1" style={{ color: WL.textSoft }}'),
    ('className="text-white/40 text-xs"', 'className="text-xs" style={{ color: WL.textSoft }}'),
    ('className="text-sm text-white/40"', 'className="text-sm" style={{ color: WL.textSoft }}'),
    ('className="text-sm text-white/70"', 'className="text-sm" style={{ color: WL.textMuted }}'),
    ('className="text-sm text-white/85 break-all"', 'className="text-sm break-all" style={{ color: WL.text }}'),
    ('className="text-xs text-white/35"', 'className="text-xs" style={{ color: WL.textSoft }}'),
    ("className=\"text-xs\" style={{ color: 'rgba(255,255,255,0.45)' }}", "className=\"text-xs\" style={{ color: WL.textMuted }}"),
    ("className=\"text-xs\" style={{ color: 'rgba(255,255,255,0.6)' }}", "className=\"text-xs\" style={{ color: WL.textMuted }}"),
    ("color: 'rgba(255,255,255,0.55)'", "color: WL.textMuted"),
    ("color: 'rgba(255,255,255,0.65)'", "color: WL.textMuted"),
    ("color: '#86efac'", "color: WL.green"),
    ("border: `1px solid ${activeTab === key ? WL.greenBright : 'rgba(255,255,255,0.12)'}`", "border: `1px solid ${activeTab === key ? WL.greenBright : WL.borderLight}`"),
    ("color: activeTab === key ? '#86efac' : 'rgba(255,255,255,0.65)'", "color: activeTab === key ? WL.green : WL.textMuted"),
    ("background: activeTab === key ? 'rgba(61, 158, 95, 0.22)' : 'rgba(255,255,255,0.08)'", "background: activeTab === key ? 'rgba(61,158,95,0.14)' : 'transparent'"),
    (
        "const inputClass =\n    'w-full text-sm rounded-lg px-3 py-2 text-white/85 placeholder-white/25 outline-none border bg-white/5 border-white/10 focus:border-green-500/40 transition-colors'",
        "const inputClass = accountInputCls",
    ),
    (
        "const inputCls = 'w-full text-sm rounded-lg px-3 py-2 text-white/85 placeholder-white/25 outline-none border bg-white/5 border-white/10 focus:border-green-400/40 transition-colors'",
        "const inputCls = accountInputCls",
    ),
    ('className="text-white/20 hover:text-red-400', 'className="hover:text-red-500" style={{ color: WL.textSoft }}'),
    ('className="text-white/25 hover:text-red-400', 'className="hover:text-red-500" style={{ color: WL.textSoft }}'),
    ('className="text-white/25 hover:text-white/60', 'className="hover:opacity-80" style={{ color: WL.textMuted }}'),
    ('className="text-white/20 text-xs px-1"', 'className="text-xs px-1" style={{ color: WL.textSoft }}'),
    ('border border-dashed border-white/15', 'border border-dashed'),
    ('border border-dashed border-white/12', 'border border-dashed'),
    ('border-white/10', ''),
    ('border-white/8', ''),
    ('text-white/22 hover:text-white/45 border border-white/8', 'hover:opacity-80'),
    ('className="text-left text-[10px] uppercase tracking-wider font-semibold text-white/45', 'className="text-left text-[10px] uppercase tracking-wider font-semibold" style={{ color: WL.textSoft }}'),
    ('className="px-3 py-2.5 text-[10px] uppercase tracking-wider font-semibold text-white/45"', 'className="px-3 py-2.5 text-[10px] uppercase tracking-wider font-semibold" style={{ color: WL.textSoft }}'),
    ('className="px-3 py-8 text-center text-white/35"', 'className="px-3 py-8 text-center" style={{ color: WL.textSoft }}'),
    ('className="border-t border-white/8"', 'className="border-t" style={{ borderColor: WL.borderLight }}'),
    ('style={{ background: \'rgba(255,255,255,0.05)\' }}', 'style={{ background: \'rgba(255,255,255,0.65)\' }}'),
    ('rounded-xl overflow-hidden border border-white/10', 'rounded-xl overflow-hidden" style={{ border: `1px solid ${WL.borderLight}`'),
]

for a, b in replacements:
    t = t.replace(a, b)

p.write_text(t, encoding='utf-8')
print('remaining text-white:', t.count('text-white'))
