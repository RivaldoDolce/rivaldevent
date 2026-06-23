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

export const colors = {
  // Fonds
  sand: '#F7F4ED', // Fond principal — Coton du Nord, ndop blanc
  ivory: '#F0EBE3', // Fond secondaire/cards — Patine bronzes Bamiléké

  // Actions
  terracotta: '#B84A32', // CTA principal client — Latérite Sahel
  forest: '#1A4D2E', // Espace vendeur/business — Forêt Bassin Congo

  // Accents
  gold: '#C9A84C', // Luxe, premium, badge Pro — Or artisans
  indigo: '#2C3E5A', // Badges, sponsors — Teinture indigo
  mango: '#E8A838', // État actif/sélectionné — Soleil harmattan

  // Texte
  onyx: '#1A1816', // Texte principal — Bois masques, bronze fondu
  stone: '#6B6560', // Texte secondaire — Pierre volcanique
} as const;

export type ColorToken = keyof typeof colors;

// ============================================================
// SPACING
// ============================================================

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  '2xl': 48,
  '3xl': 64,
} as const;

// ============================================================
// RADIUS — 16px par défaut partout
// ============================================================

export const radius = {
  sm: 8, // Badges petits
  md: 12, // Inputs
  lg: 16, // ⭐ VALEUR PAR DÉFAUT (buttons, cards, images)
  xl: 24, // Modals, hero
  full: 9999, // Avatars, pills
} as const;

// ============================================================
// TYPOGRAPHIE
// ============================================================

export const typography = {
  h1: { fontSize: 32, lineHeight: 40, fontFamily: 'PlayfairDisplay-Bold' },
  h2: { fontSize: 24, lineHeight: 32, fontFamily: 'PlayfairDisplay-SemiBold' },
  h3: { fontSize: 20, lineHeight: 28, fontFamily: 'PlayfairDisplay-SemiBold' },
  body: { fontSize: 16, lineHeight: 24, fontFamily: 'Inter-Regular' },
  bodySmall: { fontSize: 14, lineHeight: 20, fontFamily: 'Inter-Regular' },
  caption: { fontSize: 12, lineHeight: 16, fontFamily: 'Inter-Medium' },
  button: { fontSize: 16, lineHeight: 24, fontFamily: 'Inter-SemiBold' },
} as const;

// ============================================================
// Z-INDEX (pour les overlays, modals, banners)
// ============================================================

export const zIndex = {
  base: 0,
  dropdown: 100,
  sticky: 200,
  banner: 500,
  bottomSheet: 800,
  modal: 1000,
  toast: 1500,
} as const;

// ============================================================
// ROUTES — Centralisation des chemins de navigation
// ============================================================

export const ROUTES = {
  // Auth
  SPLASH: '/(auth)/splash',
  ONBOARDING: '/(auth)/onboarding',
  LOGIN: '/(auth)/login',
  REGISTER: '/(auth)/register',
  OTP: '/(auth)/otp',

  // Client
  HOME: '/(client)/home',
  EVENT_DETAIL: '/(client)/home/[id]',
  EXPLORE: '/(client)/explore',
  VENUES: '/(client)/explore/venues',
  VENUE_DETAIL: '/(client)/explore/venues/[id]',
  TICKETS: '/(client)/tickets',
  TICKET_DETAIL: '/(client)/tickets/[id]',
  PROFILE: '/(client)/profile',
  SWITCH_SELLER: '/(client)/profile/switch-seller',

  // Seller
  SELLER_DASHBOARD: '/(seller)/sell',
  SELLER_CREATE_STEP1: '/(seller)/sell/create/step1',
  SELLER_CREATE_STEP2: '/(seller)/sell/create/step2',
  SELLER_CREATE_STEP3: '/(seller)/sell/create/step3',
  SELLER_SALES: '/(seller)/sell/sales',
  SELLER_SCANNER: '/(seller)/sell/scanner',
  SELLER_WALLET: '/(seller)/sell/wallet',
  SELLER_PROMOTE: '/(seller)/sell/promote',

  // Purchase
  PURCHASE_TICKETS: '/(purchase)/event/[id]/tickets',
  PAYMENT: '/(purchase)/payment',
  PAYMENT_MTN: '/(purchase)/payment/mtn',
  PAYMENT_ORANGE: '/(purchase)/payment/orange',
  PAYMENT_MOOV: '/(purchase)/payment/moov',
  CONFIRMATION: '/(purchase)/confirmation/[ticketId]',

  // Modal
  FILTERS: '/(modal)/filters',
  QR_FULLSCREEN: '/(modal)/qr-fullscreen',
} as const;

// ============================================================
// CONSTANTES MÉTIER
// ============================================================

export const APP_CONFIG = {
  // QR Code
  QR_EXPIRATION_HOURS: 24, // QR valide 24h après la fin de l'événement

  // OTP
  OTP_LENGTH: 6,
  OTP_EXPIRATION_MINUTES: 5,
  OTP_MAX_ATTEMPTS: 3,
  OTP_LOCK_MINUTES: 15,

  // Session
  SESSION_TIMEOUT_DAYS: 7, // Déconnexion auto après 7 jours d'inactivité

  // Paiement
  PAYMENT_TIMEOUT_MINUTES: 10,
  PAYMENT_MAX_RETRIES: 3,

  // Cache
  CACHE_VERSION: 'v1',
  CACHE_DURATION_MS: 1000 * 60 * 60 * 24, // 24h

  // Storage buckets
  STORAGE_BUCKETS: {
    EVENTS: 'event-images',
    VENUES: 'venue-images',
    AVATARS: 'avatars',
  } as const,
} as const;

// ============================================================
// HELPERS
// ============================================================

/**
 * Convertit un token de couleur en valeur hex.
 * Utile pour les styles inline ou les librairies qui ne supportent pas NativeWind.
 */
export function getColor(token: ColorToken): string {
  return colors[token];
}