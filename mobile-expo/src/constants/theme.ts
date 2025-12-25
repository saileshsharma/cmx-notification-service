// Modern Vibrant Color Palette - Vehicle Inspection App
export const colors = {
  // Primary - Deep Ocean Blue with Electric accents
  primary: '#0066FF',
  primaryDark: '#0047B3',
  primaryLight: '#3D8BFF',
  primarySoft: '#E6F0FF',

  // Secondary - Rich Teal
  secondary: '#00C9A7',
  secondaryDark: '#00A388',
  secondaryLight: '#4DDDC1',

  // Accent - Vibrant Orange for CTAs
  accent: '#FF6B35',
  accentDark: '#E55A2B',
  accentLight: '#FF8C5F',

  // Success - Fresh Green
  success: '#00D26A',
  successDark: '#00A854',
  successLight: '#4DE89A',
  successSoft: '#E6FFF2',

  // Warning - Warm Amber
  warning: '#FFB800',
  warningDark: '#CC9400',
  warningLight: '#FFC833',
  warningSoft: '#FFF8E6',

  // Danger - Bold Red
  danger: '#FF3B3B',
  dangerDark: '#CC2F2F',
  dangerLight: '#FF6B6B',
  dangerSoft: '#FFE6E6',

  // Purple - Modern Violet
  purple: '#7B61FF',
  purpleDark: '#5B44CC',
  purpleLight: '#9D8AFF',
  purpleSoft: '#F0EDFF',

  // Coral/Pink for special highlights
  coral: '#FF6B9D',
  coralDark: '#E55A87',
  coralLight: '#FF8DB5',

  // Cyan for informational
  cyan: '#00D4FF',
  cyanDark: '#00A8CC',
  cyanLight: '#4DE1FF',

  // Neutral Grays - Warmer tones
  gray: {
    50: '#FAFBFC',
    100: '#F4F6F8',
    200: '#E8ECF0',
    300: '#D0D7DE',
    400: '#9BA4AE',
    500: '#6E7A87',
    600: '#4D5A68',
    700: '#364152',
    800: '#1F2937',
    900: '#111827',
  },

  // Base colors
  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent',

  // Status colors for surveyors
  statusAvailable: '#00D26A',
  statusBusy: '#FFB800',
  statusOffline: '#9BA4AE',
};

// Vibrant Gradients
export const gradients = {
  primary: ['#0066FF', '#0047B3'] as [string, string],
  primaryVibrant: ['#0066FF', '#7B61FF'] as [string, string],
  primaryDark: ['#0047B3', '#002266'] as [string, string],

  secondary: ['#00C9A7', '#00A388'] as [string, string],
  accent: ['#FF6B35', '#FF3B3B'] as [string, string],

  success: ['#00D26A', '#00A854'] as [string, string],
  successVibrant: ['#00D26A', '#00C9A7'] as [string, string],

  warning: ['#FFB800', '#FF6B35'] as [string, string],
  danger: ['#FF3B3B', '#CC2F2F'] as [string, string],

  purple: ['#7B61FF', '#5B44CC'] as [string, string],
  purpleVibrant: ['#7B61FF', '#FF6B9D'] as [string, string],

  sky: ['#00D4FF', '#0066FF'] as [string, string],
  ocean: ['#0066FF', '#00C9A7'] as [string, string],
  sunset: ['#FF6B35', '#FF6B9D'] as [string, string],
  aurora: ['#00D26A', '#00D4FF', '#7B61FF'] as [string, string, string],

  dark: ['#1F2937', '#111827'] as [string, string],
  darkPremium: ['#1F2937', '#0047B3'] as [string, string],
  darkFull: ['#111827', '#1F2937', '#364152'] as [string, string, string],

  // Glass effect overlays
  glassLight: ['rgba(255,255,255,0.9)', 'rgba(255,255,255,0.7)'] as [string, string],
  glassDark: ['rgba(0,0,0,0.7)', 'rgba(0,0,0,0.5)'] as [string, string],
};

// Spacing
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  xxxxl: 48,
};

// Border radius
export const borderRadius = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  full: 9999,
};

// Font sizes
export const fontSize = {
  xs: 10,
  sm: 12,
  md: 14,
  lg: 16,
  xl: 18,
  xxl: 20,
  xxxl: 24,
  display: 28,
  hero: 36,
};

// Font weights
export const fontWeight = {
  normal: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
  extrabold: '800' as const,
};

// Modern Shadows with color
export const shadows = {
  sm: {
    shadowColor: '#0066FF',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  md: {
    shadowColor: '#0066FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: '#0066FF',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.16,
    shadowRadius: 16,
    elevation: 8,
  },
  xl: {
    shadowColor: '#0066FF',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.20,
    shadowRadius: 24,
    elevation: 12,
  },
  glow: {
    shadowColor: '#0066FF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 10,
  },
  successGlow: {
    shadowColor: '#00D26A',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  dangerGlow: {
    shadowColor: '#FF3B3B',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
};

// Animation durations
export const animation = {
  fast: 150,
  normal: 300,
  slow: 500,
};
