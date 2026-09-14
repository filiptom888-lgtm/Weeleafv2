/** Warm palette — living sunset over the 3D scene */
export const WL = {
  pageBg:
    'linear-gradient(180deg, #e8a878 0%, #ebb588 18%, #f0c49a 40%, #f6d9b8 62%, #faf0e4 82%, #f7f1e8 100%)',
  headerBg: 'rgba(255, 251, 244, 0.92)',
  panelBg: 'rgba(255, 251, 244, 0.78)',
  panelBgSolid: '#fffbf5',
  feedBg: 'rgba(255, 250, 242, 0.94)',
  border: 'rgba(200, 144, 74, 0.38)',
  borderLight: 'rgba(200, 144, 74, 0.22)',
  text: '#2a2218',
  textMuted: '#6b5c48',
  textSoft: '#9a8870',
  green: '#2d6a42',
  greenBright: '#3d9e5f',
  gold: '#c8904a',
  goldLight: '#e8b060',
  accentBar: 'linear-gradient(90deg, #2d6a42, #c8904a, #f0c070)',
  shadow: '0 12px 40px rgba(120, 70, 30, 0.14)',
  modalBackdrop:
    'linear-gradient(180deg, #f3d2b0 0%, #ebb588 32%, #e8a878 70%, #e29a6c 100%)',
  modalHeaderGlass: 'rgba(255, 251, 244, 0.86)',
  modalHeaderBorder: 'rgba(200, 144, 74, 0.28)',
  textOnModal: '#2a2218',
  textMutedOnModal: 'rgba(42, 34, 24, 0.75)',
  textSoftOnModal: 'rgba(42, 34, 24, 0.55)',
  skyAccent: '#3d9e5f',
  skyAccentSoft: 'rgba(61, 158, 95, 0.12)',
  glassHeader: 'rgba(255, 251, 244, 0.62)',
  glassCard: 'rgba(255, 250, 242, 0.8)',
  glassPanel: 'rgba(255, 251, 244, 0.68)',
}

export const modalPad = 'px-5 sm:px-6 md:px-8'

export const accountInputCls =
  'w-full text-sm rounded-2xl px-4 py-2.5 outline-none border transition-all placeholder:opacity-50 focus:ring-2 focus:ring-offset-0'

export const accountInputStyle = {
  color: WL.text,
  background: 'rgba(255, 251, 244, 0.94)',
  borderColor: WL.border,
}

export const accountLabelCls = 'wl-eyebrow mb-1.5 block'

export const glassStyle = {
  background: 'rgba(255, 251, 244, 0.84)',
  border: `1px solid ${WL.border}`,
  boxShadow: '0 12px 40px rgba(120, 70, 30, 0.14), 0 1px 0 rgba(255,255,255,0.75) inset',
  backdropFilter: 'blur(18px)',
  WebkitBackdropFilter: 'blur(18px)',
}

/** Liquid glass — frosted enough for type, still lets the sunset through */
export const airGlassStyle = {
  background: 'rgba(255, 251, 244, 0.34)',
  border: '1px solid rgba(255, 255, 255, 0.5)',
  boxShadow: '0 18px 48px rgba(80, 40, 10, 0.12), 0 1px 0 rgba(255,255,255,0.5) inset',
  backdropFilter: 'blur(22px)',
  WebkitBackdropFilter: 'blur(22px)',
}

export const paperTileStyle = {
  background: 'rgba(255, 250, 242, 0.72)',
  border: `1px solid ${WL.borderLight}`,
  boxShadow: '0 1px 0 rgba(255,255,255,0.7) inset',
}

export const airTileStyle = {
  background: 'rgba(255, 250, 242, 0.28)',
  border: '1px solid rgba(255, 255, 255, 0.4)',
  boxShadow: '0 1px 0 rgba(255,255,255,0.35) inset',
}

export const primaryBtnStyle = {
  background: `linear-gradient(160deg, ${WL.green} 0%, ${WL.greenBright} 100%)`,
  color: '#fff8ec',
  boxShadow: '0 8px 20px rgba(45, 106, 66, 0.28)',
  letterSpacing: '0.04em',
}

export const closeBtnStyle = {
  color: WL.text,
}

export const pillHeaderStyle = {
  background: 'rgba(255, 251, 244, 0.88)',
  border: `1px solid ${WL.border}`,
  boxShadow: '0 8px 32px rgba(120, 70, 30, 0.12)',
}

export const accountCardStyle = {
  ...glassStyle,
}

/** Admin panel — same light glass as member account */
export const adminShellStyle = {
  ...glassStyle,
}
