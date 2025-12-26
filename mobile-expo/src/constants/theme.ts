// Design 1 - Premium Dark Theme with Neon Accents
// Vehicle Inspection App - Enterprise Grade

export const colors = {
  // Primary - Dark backgrounds
  primary: '#1A1A1A',
  primaryDark: '#111111',
  primaryLight: '#2A2A2A',
  primarySoft: '#333333',

  // Secondary - Charcoal grays
  secondary: '#1F1F1F',
  secondaryDark: '#151515',
  secondaryLight: '#2D2D2D',

  // Accent - Neon Yellow-Green (from Design 1)
  accent: '#CCFF00',
  accentDark: '#A8D600',
  accentLight: '#D9FF33',
  accentSoft: 'rgba(204, 255, 0, 0.15)',

  // Success - Bright Green
  success: '#00D26A',
  successDark: '#00A854',
  successLight: '#4DE89A',
  successSoft: 'rgba(0, 210, 106, 0.15)',

  // Warning - Amber
  warning: '#FFB800',
  warningDark: '#CC9400',
  warningLight: '#FFC833',
  warningSoft: 'rgba(255, 184, 0, 0.15)',

  // Danger - Coral Red (from Design 1 charts)
  danger: '#FF4757',
  dangerDark: '#CC3945',
  dangerLight: '#FF6B7A',
  dangerSoft: 'rgba(255, 71, 87, 0.15)',

  // Purple - For highlights
  purple: '#7B61FF',
  purpleDark: '#5B44CC',
  purpleLight: '#9D8AFF',
  purpleSoft: 'rgba(123, 97, 255, 0.15)',

  // Cyan - For info
  cyan: '#00D4FF',
  cyanDark: '#00A8CC',
  cyanLight: '#4DE1FF',
  cyanSoft: 'rgba(0, 212, 255, 0.15)',

  // Coral/Pink
  coral: '#FF6B9D',
  coralDark: '#E55A87',
  coralLight: '#FF8DB5',

  // Neutral Grays - Dark theme optimized
  gray: {
    50: '#FAFAFA',
    100: '#F5F5F5',
    200: '#E5E5E5',
    300: '#D4D4D4',
    400: '#A3A3A3',
    500: '#737373',
    600: '#525252',
    700: '#404040',
    800: '#262626',
    900: '#171717',
  },

  // Card backgrounds (glassmorphic dark)
  card: '#1E1E1E',
  cardLight: '#252525',
  cardDark: '#161616',
  cardBorder: 'rgba(255, 255, 255, 0.08)',

  // Text colors for dark theme
  text: {
    primary: '#FFFFFF',
    secondary: 'rgba(255, 255, 255, 0.7)',
    tertiary: 'rgba(255, 255, 255, 0.5)',
    muted: 'rgba(255, 255, 255, 0.35)',
    inverse: '#111111',
  },

  // Base colors
  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent',

  // Background
  background: '#111111',
  backgroundSecondary: '#1A1A1A',
  backgroundTertiary: '#222222',

  // Status colors for surveyors
  statusAvailable: '#00D26A',
  statusBusy: '#FFB800',
  statusOffline: '#525252',
  statusOnWay: '#00D4FF',
  statusInspecting: '#7B61FF',
};

// Premium Dark Gradients
export const gradients = {
  // Primary dark gradients
  primary: ['#1A1A1A', '#111111'] as [string, string],
  primaryReverse: ['#111111', '#1A1A1A'] as [string, string],

  // Accent gradients (neon yellow-green)
  accent: ['#CCFF00', '#A8D600'] as [string, string],
  accentVibrant: ['#CCFF00', '#00D26A'] as [string, string],
  accentSoft: ['rgba(204, 255, 0, 0.2)', 'rgba(204, 255, 0, 0.05)'] as [string, string],

  // Card backgrounds with subtle gradient
  card: ['#1E1E1E', '#1A1A1A'] as [string, string],
  cardPremium: ['#252525', '#1A1A1A'] as [string, string],
  cardGlass: ['rgba(30, 30, 30, 0.9)', 'rgba(20, 20, 20, 0.95)'] as [string, string],

  // Status gradients
  success: ['#00D26A', '#00A854'] as [string, string],
  warning: ['#FFB800', '#FF9500'] as [string, string],
  danger: ['#FF4757', '#CC3945'] as [string, string],
  purple: ['#7B61FF', '#5B44CC'] as [string, string],
  cyan: ['#00D4FF', '#00A8CC'] as [string, string],

  // Special effect gradients
  dark: ['#1A1A1A', '#111111'] as [string, string],
  darkPremium: ['#222222', '#111111'] as [string, string],
  darkDeep: ['#0A0A0A', '#000000'] as [string, string],

  // Glass effect overlays
  glassLight: ['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.05)'] as [string, string],
  glassDark: ['rgba(0,0,0,0.8)', 'rgba(0,0,0,0.6)'] as [string, string],

  // Header gradient (subtle)
  header: ['#1A1A1A', '#151515'] as [string, string],

  // Button gradients
  buttonPrimary: ['#CCFF00', '#A8D600'] as [string, string],
  buttonSecondary: ['#2A2A2A', '#222222'] as [string, string],

  // Chart/data visualization
  chartRed: ['#FF4757', '#FF6B7A'] as [string, string],
  chartYellow: ['#CCFF00', '#A8D600'] as [string, string],
  chartGreen: ['#00D26A', '#4DE89A'] as [string, string],
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

// Border radius - More rounded for premium feel
export const borderRadius = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  card: 20,
  button: 12,
  input: 12,
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
  title: 32,
};

// Font weights
export const fontWeight = {
  normal: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
  extrabold: '800' as const,
};

// Modern Shadows - Optimized for dark theme
export const shadows = {
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  sm: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
  },
  xl: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.4,
    shadowRadius: 24,
    elevation: 12,
  },
  // Glow effects for accent elements
  accentGlow: {
    shadowColor: '#CCFF00',
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
    shadowColor: '#FF4757',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  card: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
};

// Animation durations
export const animation = {
  fast: 150,
  normal: 300,
  slow: 500,
};

// Glass effect styles
export const glassEffect = {
  light: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
  },
  medium: {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderColor: 'rgba(255, 255, 255, 0.15)',
    borderWidth: 1,
  },
  dark: {
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
  },
};
