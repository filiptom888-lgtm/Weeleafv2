/** Warm palette — matches the 3D scene sky, tree & HUD */
export const WL = {
  pageBg:
    'linear-gradient(180deg, #b8845a 0%, #ddb88a 18%, #f0dcc0 42%, #faf4ea 72%, #f5efe6 100%)',
  headerBg: 'rgba(255, 251, 244, 0.92)',
  panelBg: 'rgba(255, 255, 255, 0.78)',
  panelBgSolid: '#fffbf5',
  feedBg: 'rgba(255, 252, 246, 0.94)',
  border: 'rgba(200, 144, 74, 0.32)',
  borderLight: 'rgba(200, 144, 74, 0.18)',
  text: '#2a2218',
  textMuted: '#6b5c48',
  textSoft: '#9a8870',
  green: '#2d6a42',
  greenBright: '#3d9e5f',
  gold: '#c8904a',
  goldLight: '#e8b060',
  accentBar: 'linear-gradient(90deg, #4ade80, #c8904a, #f0c070)',
  shadow: '0 8px 40px rgba(120, 80, 40, 0.12)',
  /* Modal — warm sunset sky (lighter than main page) */
  modalBackdrop:
    'linear-gradient(180deg, #faf0e4 0%, #f5e2cc 28%, #edd4b8 58%, #e4c4a0 100%)',
  modalHeaderGlass: 'rgba(255, 251, 244, 0.82)',
  modalHeaderBorder: 'rgba(255, 255, 255, 0.55)',
  textOnModal: '#2a2218',
  textMutedOnModal: 'rgba(42, 34, 24, 0.75)',
  textSoftOnModal: 'rgba(42, 34, 24, 0.55)',
  skyAccent: '#3d9e5f',
  skyAccentSoft: 'rgba(61, 158, 95, 0.12)',
  glassHeader: 'rgba(255, 251, 244, 0.58)',
  glassCard: 'rgba(255, 252, 246, 0.78)',
  glassPanel: 'rgba(255, 251, 244, 0.65)',
}

export const modalPad = 'px-4 sm:px-5 md:px-6'

export const accountInputCls =
  'w-full text-sm rounded-xl px-4 py-2.5 outline-none border transition-all placeholder:opacity-50 focus:ring-2 focus:ring-offset-0'

export const accountInputStyle = {
  color: WL.text,
  background: 'rgba(255, 255, 255, 0.92)',
  borderColor: WL.border,
}

export const accountLabelCls =
  'text-[10px] uppercase tracking-widest font-semibold mb-1.5 block'

export const glassStyle = {
  background: 'rgba(255, 255, 255, 0.88)',
  border: '1px solid rgba(255, 255, 255, 0.7)',
  boxShadow: '0 8px 32px rgba(120, 80, 40, 0.1), 0 1px 0 rgba(255,255,255,0.8) inset',
  backdropFilter: 'blur(16px)',
  WebkitBackdropFilter: 'blur(16px)',
}

export const accountCardStyle = {
  ...glassStyle,
}

/** Dark glass panel for admin — readable white text on warm sky modals */
export const adminShellStyle = {
  background: 'rgba(16, 28, 40, 0.88)',
  border: '1px solid rgba(255, 255, 255, 0.14)',
  boxShadow: '0 16px 48px rgba(0, 0, 0, 0.35)',
  backdropFilter: 'blur(20px)',
  WebkitBackdropFilter: 'blur(20px)',
}
