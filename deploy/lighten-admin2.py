from pathlib import Path
import re

p = Path('src/components/ui/AdminPanel.jsx')
t = p.read_text(encoding='utf-8')

# Normalize dark input classes
t = re.sub(
    r"const inputCls = 'w-full text-sm rounded-lg px-3 py-2 text-white/85 placeholder-white/25 outline-none border bg-white/5\s+focus:[^']+'",
    'const inputCls = accountInputCls',
    t,
)
t = t.replace("const labelCls = 'block text-xs text-white/40 mb-1'", "const labelCls = accountLabelCls")

# Remaining tailwind white opacity classes -> remove (rely on parent/context + inline styles where added)
for opacity in ['85', '80', '75', '70', '55', '50', '45', '40', '35', '30', '25', '22']:
    t = t.replace(f'text-white/{opacity}', 'text-inherit')

t = t.replace('placeholder-white/25', '')
t = t.replace('hover:text-white/55', 'hover:opacity-80')
t = t.replace('hover:text-white/45', 'hover:opacity-80')
t = t.replace('hover:text-white/70', 'hover:opacity-80')
t = t.replace('hover:text-white/80', 'hover:opacity-80')
t = t.replace('hover:text-white/60', 'hover:opacity-80')
t = t.replace('hover:border-white/25', '')
t = t.replace('hover:border-white/30', '')
t = t.replace('border  transition-colors', f"border transition-colors\" style={{{{ borderColor: WL.borderLight }}}}")
t = t.replace('file:text-white/70', 'file:text-inherit')
t = t.replace('file:bg-white/10', 'file:bg-white/80')

# Primary action buttons keep white text on green
t = t.replace('className="flex-1 py-2 rounded-xl text-xs font-semibold text-white"', 'className="flex-1 py-2 rounded-xl text-xs font-semibold text-white"')

p.write_text(t, encoding='utf-8')
print('remaining text-white:', t.count('text-white'))
