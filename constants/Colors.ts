export const Colors = {
  primary: '#0D7A3E',
  primaryDark: '#09572B',
  primaryLight: '#D4F5E2',
  accent: '#F5820D',
  accentSoft: '#FEF0DC',
  night: '#0F1A14',
  carbon: '#3D4F44',
  mist: '#EBF0EC',
  white: '#FFFFFF',
  danger: '#E53935',
  info: '#1A73E8',
} as const;
export type ColorKey = keyof typeof Colors;
