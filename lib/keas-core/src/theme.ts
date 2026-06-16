// Shared KEAS design tokens (mirrors artifacts/mobile/constants/theme.ts) so the
// web command center matches the mobile visual style and uses the SAME map layer
// colors the mobile native/Leaflet maps already standardize on.

export const KEAS_COLORS = {
  primary: '#5B3A8E',
  primaryDim: 'rgba(91, 58, 142, 0.08)',
  primaryBorder: 'rgba(91, 58, 142, 0.16)',
  background: '#F5F6F8',
  surface: '#FFFFFF',
  surfaceElevated: '#F0F1F4',
  border: '#E5E7EB',
  borderLight: '#D1D5DB',
  text: '#111111',
  textSecondary: '#6B7280',
  textTertiary: '#9CA3AF',
  safe: '#16A34A',
  amber: '#D97706',
  missing: '#D97706',
  danger: '#DC2626',
  white: '#FFFFFF',

  // Map/status layer colors (must match the mobile maps exactly)
  personnelSafe: '#34D399',
  personnelPending: '#FBBF24',
  personnelNeedHelp: '#EF4444',
  hazardCold: '#34D399',
  hazardWarm: '#FBBF24',
  hazardHot: '#F87171',
  routeActive: '#10B981',
  streetNormal: '#9CA3AF',
  streetSelected: '#3B82F6',
} as const;

export type KeasColor = keyof typeof KEAS_COLORS;

/** Personnel dot color by response status (matches mobile GoogleMapsView/Leaflet). */
export function personnelColor(status: string): string {
  if (status === 'confirmed') return KEAS_COLORS.personnelSafe;
  if (status === 'need_help') return KEAS_COLORS.personnelNeedHelp;
  return KEAS_COLORS.personnelPending;
}
