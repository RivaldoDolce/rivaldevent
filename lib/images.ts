import type { ImageSourcePropType } from 'react-native';

/**
 * Rivald'event — Registre central des images statiques.
 *
 * Source unique de vérité pour tous les assets embarqués (backgrounds,
 * onboarding, logo). Toujours importer depuis ici — jamais de `require()`
 * en dur dans les écrans.
 */

// ============================================================
// Fonds d'écran — Authentification
// ============================================================

export const authBackgrounds = {
  login: require('@/assets/images/background/auth/bg_auth_login.jpg'),
  register: require('@/assets/images/background/auth/bg_auth_register.jpg'),
  forgot: require('@/assets/images/background/auth/bg_auth_forgot.jpg'),
  otp: require('@/assets/images/background/auth/bg_auth_otp.jpg'),
  phone: require('@/assets/images/background/auth/bg_auth_phone.jpg'),
  splash: require('@/assets/images/background/auth/bg_splash.jpg'),
} satisfies Record<string, ImageSourcePropType>;

// ============================================================
// Fonds d'écran — Client
// ============================================================

export const clientBackgrounds = {
  homeHero: require('@/assets/images/background/client/bg_home_hero.jpg'),
  exploreHero: require('@/assets/images/background/client/bg_explore_hero.jpg'),
  profil: require('@/assets/images/background/client/bg_profil_client.jpg'),
  payment: require('@/assets/images/background/client/bg_payment.jpg'),
  success: require('@/assets/images/background/client/bg_success.jpg'),
  modalFilters: require('@/assets/images/background/client/bg_modal_filters.jpg'),
  accueil: require('@/assets/images/background/client/bg_accueil.jpg'),
  fallback: require('@/assets/images/background/client/bg_fallback.jpg'),
} satisfies Record<string, ImageSourcePropType>;

// ============================================================
// Fonds d'écran — Vendeur
// ============================================================

export const sellerBackgrounds = {
  accueilHero: require('@/assets/images/background/seller/bg_accueil_vendeur_hero.jpg'),
  emptyState: require('@/assets/images/background/seller/bg_empty_state.jpg'),
  headerGeneric: require('@/assets/images/background/seller/bg_header_generic.jpg'),
  profil: require('@/assets/images/background/seller/bg_profil_vendeur.jpg'),
  qrFullscreen: require('@/assets/images/background/seller/bg_qr_fullscreen.jpg'),
  sellHeader: require('@/assets/images/background/seller/bg_sell_header.jpg'),
  walletHero: require('@/assets/images/background/seller/bg_wallet_hero.jpg'),
} satisfies Record<string, ImageSourcePropType>;

// ============================================================
// Autres assets
// ============================================================

export const images = {
  logo: require('@/assets/images/logo.png'),
  appIcon: require('@/assets/images/app-icon.png'),
  onboarding: {
    slide1: require('@/assets/images/onboarding/slide1.png'),
    slide2: require('@/assets/images/onboarding/slide2.png'),
    slide3: require('@/assets/images/onboarding/slide3.png'),
  },
} as const;

// ============================================================
// Alias "package unique" (pratique pour un usage composé)
// ============================================================

export const backgroundImages = {
  auth: authBackgrounds,
  client: clientBackgrounds,
  seller: sellerBackgrounds,
} as const;