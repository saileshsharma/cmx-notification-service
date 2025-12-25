// Color palette
export const colors = {
  primary: '#3B82F6',
  primaryDark: '#1E40AF',
  primaryLight: '#60A5FA',

  success: '#10B981',
  successDark: '#059669',

  warning: '#F59E0B',
  warningDark: '#D97706',

  danger: '#EF4444',
  dangerDark: '#DC2626',

  purple: '#8B5CF6',
  purpleDark: '#7C3AED',

  gray: {
    50: '#F8FAFC',
    100: '#F1F5F9',
    200: '#E2E8F0',
    300: '#CBD5E1',
    400: '#94A3B8',
    500: '#64748B',
    600: '#475569',
    700: '#334155',
    800: '#1E293B',
    900: '#0F172A',
  },

  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent',
};

// Gradients
export const gradients = {
  primary: ['#3B82F6', '#2563EB'] as [string, string],
  primaryDark: ['#1E40AF', '#3B82F6'] as [string, string],
  success: ['#10B981', '#059669'] as [string, string],
  warning: ['#F59E0B', '#D97706'] as [string, string],
  danger: ['#EF4444', '#DC2626'] as [string, string],
  purple: ['#8B5CF6', '#7C3AED'] as [string, string],
  sky: ['#0EA5E9', '#0284C7'] as [string, string],
  dark: ['#1E293B', '#0F172A'] as [string, string],
  darkFull: ['#0F172A', '#1E293B', '#334155'] as [string, string, string],
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
};

// Border radius
export const borderRadius = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
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
};

// Font weights
export const fontWeight = {
  normal: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
};

// Shadows
export const shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
};
