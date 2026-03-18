export const Colors = {
  background: '#0F1117',
  surface: '#171B24',
  surfaceElevated: '#1E2330',
  border: '#2A2F3C',
  borderLight: '#353B4A',

  text: '#F0F1F3',
  textSecondary: '#8B91A0',
  textTertiary: '#5C6275',

  primary: '#EF4444',
  primaryDim: 'rgba(239, 68, 68, 0.15)',
  primaryBorder: 'rgba(239, 68, 68, 0.25)',

  safe: '#22C55E',
  safeDim: 'rgba(34, 197, 94, 0.15)',
  safeBorder: 'rgba(34, 197, 94, 0.25)',

  missing: '#EAB308',
  missingDim: 'rgba(234, 179, 8, 0.15)',
  missingBorder: 'rgba(234, 179, 8, 0.25)',

  noreply: '#6B7280',
  noreplyDim: 'rgba(107, 114, 128, 0.15)',

  info: '#3B82F6',
  infoDim: 'rgba(59, 130, 246, 0.15)',
  infoBorder: 'rgba(59, 130, 246, 0.25)',

  amber: '#F59E0B',
  amberDim: 'rgba(245, 158, 11, 0.15)',

  destructive: '#EF4444',

  white: '#FFFFFF',
  black: '#000000',
} as const;

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 14,
  lg: 18,
  xl: 24,
  xxl: 32,
  xxxl: 40,
} as const;

export const FontSize = {
  xs: 11,
  sm: 13,
  md: 15,
  lg: 17,
  xl: 20,
  xxl: 24,
  xxxl: 30,
  display: 36,
} as const;

export const BorderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  full: 9999,
} as const;

export const ALERT_TYPES = [
  'Blackout',
  'Shelter-in',
  'Security Alert',
  'Restricted Movement',
  'Drill',
  'All Clear',
  'Custom',
] as const;

export const DEFAULT_MESSAGES: Record<string, string> = {
  'Blackout': 'A blackout condition has been detected. All personnel must immediately proceed to their designated muster points and await further instructions.',
  'Shelter-in': 'A hazardous condition has been detected. All personnel must shelter in place immediately. Do not leave your current location until further notice.',
  'Security Alert': 'A security incident is in progress. Remain indoors, lock all doors and windows, and await further instructions from security personnel.',
  'Restricted Movement': 'Movement across zones is currently restricted. Remain at your current location and await further instructions.',
  'Drill': 'This is an emergency evacuation drill. Proceed to your designated muster points in a calm and orderly fashion. This is only a drill.',
  'Custom': '',
  'All Clear': 'The emergency condition has been resolved. All personnel may return to normal operations.',
};

export const CPF_LOCATIONS = [
  'OT-1', 'OT-2', 'OT-3',
  'Gas Train-1', 'Gas Train-2',
  'Camp', 'CCR',
];
