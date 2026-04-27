// MindTalk Design System — pixel-perfect match with website
export const Colors = {
  // Primary (Teal) – exact website values
  primary: {
    50: '#E6F4F1',
    100: '#C0E4DD',
    200: '#96D3C9',
    300: '#6BC2B5',
    400: '#4DB5A6',
    500: '#2F7D73',
    600: '#2A7168',
    700: '#2F7D73', // DEFAULT in website
    800: '#23625A',
    900: '#0F302C',
    ink: '#0F302C', // primary-ink from website
  },
  // Sand (Warm Gold)
  sand: {
    50: '#FDF9F0',
    100: '#FAF2DE',
    200: '#F5E5BF',
    300: '#F3E3B5',
    400: '#EDCF8D',
    500: '#E8C98D',
    600: '#D4A84E',
    700: '#8F6B25',
    800: '#5C4515',
    900: '#2E220A',
    DEFAULT: '#E8C98D',
  },
  // Terracotta
  terracotta: {
    50: '#FBF0ED',
    100: '#F5D9D1',
    200: '#EBB3A3',
    300: '#EFB39A',
    400: '#D38872',
    500: '#C86F52',
    600: '#AE5538',
    700: '#8A4229',
    800: '#452216',
    900: '#23110B',
  },
  // Coral
  coral: {
    400: '#EFB39A',
    600: '#C86F52',
  },
  // Cream palette – from website
  cream: {
    50: '#FEFDFB',
    100: '#FAF8F3',
    200: '#F5F3EE',
    300: '#E8E5DE',
    400: '#DDD1B5',
    DEFAULT: '#FAF8F3',
  },
  // Ink palette – from website
  ink: {
    DEFAULT: '#1A2E2A',
    soft: '#3A4E49',
    muted: '#667570',
    10: 'rgba(26,46,42,0.10)',
    15: 'rgba(26,46,42,0.15)',
    20: 'rgba(26,46,42,0.20)',
    5: 'rgba(26,46,42,0.05)',
  },
  // Semantic
  success: '#3B804D',
  warning: '#8F6B25',
  danger: '#B04A3E',
  // Base
  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent',
  // Borders – website uses ink/10 everywhere
  border: 'rgba(26,46,42,0.10)',
  borderHover: 'rgba(26,46,42,0.20)',
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  '4xl': 40,
  '5xl': 48,
  '6xl': 64,
};

export const BorderRadius = {
  sm: 10,
  md: 14,
  lg: 20,
  xl: 24,
  '2xl': 28,
  card: 22,
  full: 9999,
};

export const FontSize = {
  '2xs': 10,
  xs: 11,
  sm: 13,
  'sm+': 13.5,
  base: 15,
  md: 17,
  lg: 19,
  xl: 22,
  '2xl': 28,
  '3xl': 36,
  '4xl': 44,
  display: 48,
};

export const FontWeight = {
  normal: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
};

// Website uses very subtle shadows with ink color
export const Shadow = {
  sm: {
    shadowColor: '#0F302C',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 1,
  },
  md: {
    shadowColor: '#0F302C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  lg: {
    shadowColor: '#0F302C',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.15,
    shadowRadius: 50,
    elevation: 8,
  },
};

// Card accent band colors (cycling per card)
export const CARD_BAND_COLORS = [
  Colors.sand[300],
  Colors.primary[200],
  Colors.terracotta[300],
  Colors.cream[400],
];
