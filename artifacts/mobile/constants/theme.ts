export const Colors = {
  background: '#0B0F1E',
  surface: '#111827',
  surfaceElevated: '#1A2035',
  border: '#1F2937',
  borderLight: '#2A3448',

  text: '#E8ECF4',
  textSecondary: '#8B95A8',
  textTertiary: '#5B6478',

  primary: '#C62E3E',
  primaryDim: 'rgba(198, 46, 62, 0.10)',
  primaryBorder: 'rgba(198, 46, 62, 0.18)',

  safe: '#0D9668',
  safeDim: 'rgba(13, 150, 104, 0.10)',
  safeBorder: 'rgba(13, 150, 104, 0.18)',

  missing: '#D97706',
  missingDim: 'rgba(217, 119, 6, 0.10)',
  missingBorder: 'rgba(217, 119, 6, 0.18)',

  noreply: '#5B6478',
  noreplyDim: 'rgba(91, 100, 120, 0.10)',

  info: '#4F5BD5',
  infoDim: 'rgba(79, 91, 213, 0.10)',
  infoBorder: 'rgba(79, 91, 213, 0.18)',

  amber: '#D97706',
  amberDim: 'rgba(217, 119, 6, 0.10)',

  destructive: '#C62E3E',

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
  sm: 6,
  md: 10,
  lg: 12,
  xl: 16,
  xxl: 20,
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
