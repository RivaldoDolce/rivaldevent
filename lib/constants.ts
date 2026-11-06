import type { ViewStyle } from 'react-native';

/**
 * Rivald'event — Design Tokens
 *
 * Source unique de vérité pour la palette, l'espacement, les rayons,
 * la typographie, les dégradés et les routes de navigation.
 *
 * ⚠️ JAMAIS hardcoder de couleurs ailleurs — toujours importer depuis ici.
 *
 * ------------------------------------------------------------------
 * Design system « NOIR & OR » — édition premium
 * ------------------------------------------------------------------
 * - Fonds profonds quasi-noirs, surfaces verre fumé
 * - Accent or champagne avec dégradés doux
 * - Serif éditoriale (Playfair Display) pour les titres
 * - Sans-serif technique (Inter) pour l'interface
 * - Filets hairline, halos dorés, ombres profondes
 */

// ============================================================
// PALETTE — Noir & Or (Premium Edition)
// ============================================================

export const colors = {
  // -- Fonds --
  background: '#0A0908',
  surface: '#131110',
  surfaceAlt: '#181512',
  elevated: '#1E1A16',
  raised: '#26211B',

  // -- Verre fumé --
  glass: 'rgba(255,255,255,0.085)',
  glassStrong: 'rgba(255,255,255,0.13)',
  glassGold: 'rgba(216,180,90,0.16)',

  // -- Or champagne --
  gold: '#D8B45A',
  goldBright: '#F2DC9B',
  goldSoft: '#C7A05A',
  goldDeep: '#9A7528',
  goldMuted: 'rgba(216,180,90,0.35)',

  // -- Texte --
  text: '#F5F0E6',
  textSecondary: '#B5AC9C',
  textMuted: '#7C7466',
  textFaint: '#56504A',

  // -- Sémantique --
  primary: '#D8B45A',
  primaryDark: '#9A7528',
  terracotta: '#C9603F',
  forest: '#4C9A6E',
  indigo: '#7FA7CE',
  mango: '#E8B64C',
  danger: '#FF6B5E',
  success: '#5BC48B',
  warning: '#E8B64C',
  info: '#7FA7CE',

  // -- Filets / surfaces neutres --
  border: 'rgba(255,255,255,0.13)',
  borderStrong: 'rgba(255,255,255,0.20)',
  borderGold: 'rgba(216,180,90,0.42)',
  divider: 'rgba(255,255,255,0.08)',

  // -- Aliases hérités (compatibilité) --
  sand: '#F5F0E6',
  ivory: '#F5F0E6',
  goldBrightLegacy: '#FFD700',
  onyx: '#0A0908',
  stone: '#7C7466',
  white: '#FFFFFF',
  black: '#000000',
  muted: '#7C7466',
  goldDark: '#9A7528',
  forestDeep: '#21412F',
  forestMid: '#2E5C40',
  terracottaSoft: '#D97A55',
} as const;

// ============================================================
// Dégradés (LinearGradient)
// ============================================================

export const gradients = {
  // Or champagne (CTA primaires)
  gold: ['#F2DC9B', '#D8B45A', '#A87F2E'] as const,
  goldSubtle: ['rgba(242,220,155,0.16)', 'rgba(216,180,90,0.05)'] as const,

  // Fonds de héros / bannières
  hero: ['#221C15', '#141110', '#0A0908'] as const,
  heroGold: ['#2A2318', '#141110'] as const,
  noir: ['#181512', '#0A0908'] as const,

  // Surfaces
  surface: ['#1E1A16', '#131110'] as const,
  surfaceInvert: ['#131110', '#1E1A16'] as const,

  // Accents
  terracotta: ['#D97A55', '#B44A2E'] as const,
  forestGlow: ['#4C9A6E', '#21412F'] as const,
  successGlow: ['#5BC48B', '#1F4A35'] as const,
  dangerGlow: ['#FF7A6E', '#7A2A22'] as const,
} as const;

// ============================================================
// Espacement
// ============================================================

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 40,
  xxxl: 48,
} as const;

// ============================================================
// Typographie
// ============================================================

const FONT_DISPLAY_BOLD = 'PlayfairDisplay_700Bold';
const FONT_DISPLAY_SEMI = 'PlayfairDisplay_600SemiBold';
const FONT_UI_SEMI = 'Inter_600SemiBold';
const FONT_UI_MEDIUM = 'Inter_600SemiBold';
const FONT_UI_REGULAR = 'Inter_400Regular';

export const typography = {
  // Titres éditoriaux (Playfair Display)
  display: { fontFamily: FONT_DISPLAY_BOLD, fontSize: 40, lineHeight: 48, letterSpacing: -0.5 },
  h1: { fontFamily: FONT_DISPLAY_BOLD, fontSize: 32, lineHeight: 40, letterSpacing: -0.4 },
  h2: { fontFamily: FONT_DISPLAY_BOLD, fontSize: 26, lineHeight: 34, letterSpacing: -0.3 },
  h3: { fontFamily: FONT_DISPLAY_SEMI, fontSize: 22, lineHeight: 30, letterSpacing: -0.2 },
  title: { fontFamily: FONT_DISPLAY_SEMI, fontSize: 19, lineHeight: 26, letterSpacing: -0.1 },
  subtitle: { fontFamily: FONT_DISPLAY_SEMI, fontSize: 15, lineHeight: 21 },

  // Corps (Inter)
  body: { fontFamily: FONT_UI_REGULAR, fontSize: 16, lineHeight: 24 },
  bodyMedium: { fontFamily: FONT_UI_MEDIUM, fontSize: 16, lineHeight: 24 },
  bodySemiBold: { fontFamily: FONT_UI_SEMI, fontSize: 16, lineHeight: 24 },
  bodySmall: { fontFamily: FONT_UI_REGULAR, fontSize: 14, lineHeight: 20 },
  bodySmallMedium: { fontFamily: FONT_UI_MEDIUM, fontSize: 14, lineHeight: 20 },
  bodySmallSemiBold: { fontFamily: FONT_UI_SEMI, fontSize: 14, lineHeight: 20 },
  caption: { fontFamily: FONT_UI_MEDIUM, fontSize: 12, lineHeight: 17 },
  captionSemiBold: { fontFamily: FONT_UI_SEMI, fontSize: 12, lineHeight: 17 },
  overline: { fontFamily: FONT_UI_SEMI, fontSize: 11, lineHeight: 15, letterSpacing: 1.4 },
  button: { fontFamily: FONT_UI_SEMI, fontSize: 16, lineHeight: 24 },
  buttonSmall: { fontFamily: FONT_UI_SEMI, fontSize: 14, lineHeight: 20 },
} as const;

// ============================================================
// Rayons
// ============================================================

export const radii = {
  sm: 10,
  md: 16,
  lg: 20,
  xl: 28,
  xxl: 36,
  full: 9999,
} as const;

// Alias de compatibilité (ancien nom utilisé dans les composants existants)
export const radius = radii;

// ============================================================
// Ombres
// ============================================================

export const shadows = {
  card: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 3,
  },
  elevated: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.22,
    shadowRadius: 10,
    elevation: 4,
  },
  search: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  eventCard: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  goldGlow: {
    shadowColor: 'rgba(216,180,90,0.35)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 3,
  },
  goldGlowSoft: {
    shadowColor: 'rgba(216,180,90,0.2)',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 2,
  },
} as const;

// ============================================================
// Z-Index
// ============================================================

export const zIndex = {
  bottomSheet: 100,
  overlay: 90,
  header: 50,
  tab: 10,
} as const;

// ============================================================
// Routes
// ============================================================

export const ROUTES = {
  SPLASH: '/(auth)/splash' as const,
  ONBOARDING: '/(auth)/onboarding' as const,
  LOGIN: '/(auth)/login' as const,
  REGISTER: '/(auth)/register' as const,
  PHONE_LOGIN: '/(auth)/phone' as const,
  FORGOT_PASSWORD: '/(auth)/forgot-password' as const,
  OTP: '/(auth)/otp' as const,
  HOME: '/(client)/home' as const,
  EVENT_DETAIL: '/(client)/home/[id]' as const,
  HOME_VENUE_DETAIL: '/(client)/home/venues/[id]' as const,
  EXPLORE_EVENT_DETAIL: '/(client)/explore/[id]' as const,
  EXPLORE: '/(client)/explore' as const,
  VENUES: '/(client)/explore/venues' as const,
  VENUE_DETAIL: '/(client)/explore/venues/[id]' as const,
  VENUE_RESERVE: '/(client)/explore/venues/reserve/[id]' as const,
  TICKETS: '/(client)/tickets' as const,
  TICKET_DETAIL: '/(client)/tickets/[id]' as const,
  TICKET_EVENT: '/(client)/tickets/event/[eventId]' as const,
  PROFILE: '/(client)/profile' as const,
  PROFILE_EDIT: '/(shared)/edit-profile' as const,
  PROFILE_SETTINGS: '/(client)/profile/settings' as const,
  HELP: '/(shared)/help' as const,
  PRIVACY: '/(shared)/privacy' as const,
  FAVORITES: '/(client)/favorites' as const,
  FAVORITES_EVENT_DETAIL: '/(client)/favorites/[id]' as const,
  FAVORITES_VENUE_DETAIL: '/(client)/favorites/venues/[id]' as const,
  FAVORITES_VENUE_RESERVE: '/(client)/favorites/venues/reserve/[id]' as const,
  SELLER_HOME: '/(seller)/home' as const,
  SELLER_EXPLORE: '/(seller)/explore' as const,
  SELLER_TICKETS: '/(seller)/tickets' as const,
  SELL: '/(seller)/sell' as const,
  SELLER_PROFILE: '/(seller)/profile' as const,
  SELLER_WALLET: '/(seller)/wallet' as const,
  PURCHASE_TICKETS: '/(purchase)/event/[id]/tickets' as const,
  PAYMENT: '/(purchase)/payment' as const,
  PAYMENT_MTN: '/(purchase)/payment/mtn' as const,
  PAYMENT_ORANGE: '/(purchase)/payment/orange' as const,
  PAYMENT_MOOV: '/(purchase)/payment/moov' as const,
  FILTERS: '/(modal)/filters' as const,
  QR_FULLSCREEN: '/(modal)/qr-fullscreen' as const,
} as const;

// ============================================================
// App Config
// ============================================================

export const APP_CONFIG = {
  OTP_MAX_ATTEMPTS: 3,
  OTP_LOCK_MINUTES: 2,
  OTP_CODE_LENGTH: 6,
  SESSION_TIMEOUT_DAYS: 1,
  CACHE_VERSION: 'v1',
  CACHE_STALE_TIME: 5 * 60 * 1000,
  CACHE_GC_TIME: 24 * 60 * 60 * 1000,
  SEARCH_DEBOUNCE_MS: 300,
} as const;

// ============================================================
// Effets utilitaires (styles réutilisables)
// ============================================================

/** Filet hairline doré + verre fumé — surface de carte premium */
export const glassCard: ViewStyle = {
  backgroundColor: colors.glass,
  borderWidth: 1,
  borderColor: colors.border,
};

/** Filet doré subtil sur surface sombre */
export const goldHairline: ViewStyle = {
  borderWidth: 1,
  borderColor: colors.borderGold,
};