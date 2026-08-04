/**
 * Rivald'event — Design Tokens
 *
 * Source unique de vérité pour la palette, l'espacement, les rayons,
 * la typographie et les routes de navigation.
 *
 * ⚠️ JAMAIS hardcoder de couleurs ailleurs — toujours importer depuis ici.
 */

// ============================================================
// PALETTE — Minimalisme Africain Camerounais
// ============================================================

// ---------------------------------------------------------------------------
// Design System Constants - Rivald'Event
// ---------------------------------------------------------------------------

export const colors = {
  // -- Base palette --
  sand: '#F7F4ED',
  ivory: '#F0EBE3',
  terracotta: '#B84A32',
  forest: '#1A4D2E',
  gold: '#C9A84C',
  goldBright: '#FFD700',
  indigo: '#2C3E5A',
  mango: '#E8A838',
  onyx: '#1A1816',
  stone: '#6B6560',

  // -- Semantic aliases --
  primary: '#B84A32',
  primaryDark: '#1A4D2E',
  goldDark: '#E8A838',
  muted: '#6B6560',
  background: '#F7F4ED',
  card: '#F0EBE3',
  border: '#E0D8CC',
  text: '#1A1816',
  white: '#FFFFFF',
  danger: '#FF3B30',
  success: '#34C759',
} as const;

// ---------------------------------------------------------------------------
// Spacing
// ---------------------------------------------------------------------------

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 40,
  xxxl: 48,
} as const;

// ---------------------------------------------------------------------------
// Typography
// ---------------------------------------------------------------------------

export const typography = {
  h1: { fontFamily: 'PlayfairDisplay-Bold', fontSize: 28, lineHeight: 36 },
  h2: { fontFamily: 'PlayfairDisplay-Bold', fontSize: 24, lineHeight: 32 },
  h3: { fontFamily: 'PlayfairDisplay-SemiBold', fontSize: 20, lineHeight: 26, letterSpacing: -0.3 },
  body: { fontFamily: 'Inter-Regular', fontSize: 16, lineHeight: 22 },
  bodySemiBold: { fontFamily: 'Inter-SemiBold', fontSize: 16, lineHeight: 22, fontWeight: '600' as const },
  bodySmall: { fontFamily: 'Inter-Regular', fontSize: 14, lineHeight: 20 },
  caption: { fontFamily: 'Inter-Medium', fontSize: 12, lineHeight: 16, letterSpacing: 0.2 },
  overline: { fontFamily: 'Inter-SemiBold', fontSize: 10, lineHeight: 14 },
  button: { fontFamily: 'Inter-SemiBold', fontSize: 16, lineHeight: 24 },
} as const;

// ---------------------------------------------------------------------------
// Border Radius
// ---------------------------------------------------------------------------

export const radii = {
  sm: 6,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  full: 9999,
} as const;

// Alias de compatibilite (ancien nom utilise dans les composants existants)
export const radius = radii;

// ---------------------------------------------------------------------------
// Shadows
// ---------------------------------------------------------------------------

export const shadows = {
  card: {
    shadowColor: '#1A1816',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  search: {
    shadowColor: '#1A1816',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  eventCard: {
    shadowColor: '#1A1816',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
} as const;

// ---------------------------------------------------------------------------
// Z-Index
// ---------------------------------------------------------------------------

export const zIndex = {
  bottomSheet: 100,
  overlay: 90,
  header: 50,
  tab: 10,
} as const;

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------

export const ROUTES = {
  SPLASH: '/(auth)/splash' as const,
  ONBOARDING: '/(auth)/onboarding' as const,
  LOGIN: '/(auth)/login' as const,
  REGISTER: '/(auth)/register' as const,
  OTP: '/(auth)/otp' as const,
  HOME: '/(client)/home' as const,
  EVENT_DETAIL: '/(client)/home/[id]' as const,
  HOME_VENUE_DETAIL: '/(client)/home/venues/[id]' as const,
  EXPLORE_EVENT_DETAIL: '/(client)/explore/[id]' as const,
  EXPLORE: '/(client)/explore' as const,
  VENUES: '/(client)/explore/venues' as const,
  VENUE_DETAIL: '/(client)/explore/venues/[id]' as const,
  TICKETS: '/(client)/tickets' as const,
  TICKET_DETAIL: '/(client)/tickets/[id]' as const,
  PROFILE: '/(client)/profile' as const,
  SWITCH_SELLER: '/(client)/profile/switch-seller' as const,
  SELLER_HOME: '/(seller)/home' as const,
  SELLER_EXPLORE: '/(seller)/explore' as const,
  SELLER_TICKETS: '/(seller)/tickets' as const,
  SELL: '/(seller)/sell' as const,
  SELLER_PROFILE: '/(seller)/profile' as const,
  SWITCH_CLIENT: '/(seller)/profile/switch-client' as const,
  PURCHASE_TICKETS: '/(purchase)/event/[id]/tickets' as const,
  PAYMENT: '/(purchase)/payment' as const,
  PAYMENT_MTN: '/(purchase)/payment/mtn' as const,
  PAYMENT_ORANGE: '/(purchase)/payment/orange' as const,
  PAYMENT_MOOV: '/(purchase)/payment/moov' as const,
  FILTERS: '/(modal)/filters' as const,
  QR_FULLSCREEN: '/(modal)/qr-fullscreen' as const,
} as const;

// ---------------------------------------------------------------------------
// App Config
// ---------------------------------------------------------------------------

export const APP_CONFIG = {
  OTP_MAX_ATTEMPTS: 3,
  OTP_LOCK_MINUTES: 2,
  OTP_CODE_LENGTH: 4,
  SESSION_TIMEOUT_DAYS: 1,                      // 24 heures avant reconnexion obligatoire
  CACHE_VERSION: 'v1',
  CACHE_STALE_TIME: 5 * 60 * 1000,       // 5 minutes
  CACHE_GC_TIME: 24 * 60 * 60 * 1000,    // 24 hours
  SEARCH_DEBOUNCE_MS: 300,
} as const;
