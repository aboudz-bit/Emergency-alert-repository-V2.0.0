export const Colors = {
  background: '#06091A',
  surface: '#0E1330',
  surfaceElevated: '#151B3D',
  border: '#1E2650',
  borderLight: '#283060',

  text: '#F1F5F9',
  textSecondary: '#94A3B8',
  textTertiary: '#64748B',

  primary: '#DC3545',
  primaryDim: 'rgba(220, 53, 69, 0.14)',
  primaryBorder: 'rgba(220, 53, 69, 0.24)',

  safe: '#10B981',
  safeDim: 'rgba(16, 185, 129, 0.14)',
  safeBorder: 'rgba(16, 185, 129, 0.24)',

  missing: '#F59E0B',
  missingDim: 'rgba(245, 158, 11, 0.14)',
  missingBorder: 'rgba(245, 158, 11, 0.24)',

  noreply: '#64748B',
  noreplyDim: 'rgba(100, 116, 139, 0.14)',

  info: '#6366F1',
  infoDim: 'rgba(99, 102, 241, 0.14)',
  infoBorder: 'rgba(99, 102, 241, 0.24)',

  amber: '#F59E0B',
  amberDim: 'rgba(245, 158, 11, 0.14)',

  destructive: '#DC3545',

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
