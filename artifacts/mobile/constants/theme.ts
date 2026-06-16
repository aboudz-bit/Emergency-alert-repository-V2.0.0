export const Colors = {
  background: '#F5F6F8',
  surface: '#FFFFFF',
  surfaceElevated: '#F0F1F4',
  border: '#E5E7EB',
  borderLight: '#D1D5DB',

  text: '#111111',
  textTitle: '#1F2937',
  textSecondary: '#6B7280',
  textTertiary: '#9CA3AF',

  primary: '#5B3A8E',
  primaryDim: 'rgba(91, 58, 142, 0.08)',
  primaryBorder: 'rgba(91, 58, 142, 0.16)',

  safe: '#16A34A',
  safeDim: 'rgba(22, 163, 74, 0.08)',
  safeBorder: 'rgba(22, 163, 74, 0.16)',

  missing: '#D97706',
  missingDim: 'rgba(217, 119, 6, 0.08)',
  missingBorder: 'rgba(217, 119, 6, 0.16)',

  noreply: '#6B7280',
  noreplyDim: 'rgba(107, 114, 128, 0.08)',

  info: '#5B3A8E',
  infoDim: 'rgba(91, 58, 142, 0.08)',
  infoBorder: 'rgba(91, 58, 142, 0.16)',

  amber: '#D97706',
  amberDim: 'rgba(217, 119, 6, 0.08)',

  destructive: '#DC2626',
  danger: '#DC2626',

  white: '#FFFFFF',
  black: '#000000',

  headerBg: '#5B3A8E',
  headerText: '#FFFFFF',
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
  'Security Alert',
  'Restricted Movement',
  'Drill',
  'All Clear',
  'Custom',
] as const;

export const DEFAULT_MESSAGES: Record<string, string> = {
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
