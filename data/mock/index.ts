/**
 * Barrel export pour les donnees mock.
 *
 * Usage : `import { MOCK_EVENTS, MOCK_VENUES, CATEGORIES } from '@/data/mock';`
 * Au lieu d'importer depuis chaque fichier individuellement.
 *
 * Quand les donnees Supabase seront branchees, remplacer les imports
 * depuis `@/data/mock` par les hooks TanStack Query (useEvents, useVenues, etc.)
 * et supprimer le dossier `data/mock/` entier.
 */

// ============================================================
// TYPES (interfaces mock)
// ============================================================

export type {
  MockCategory,
  MockEvent,
  MockFeaturedEvent,
  MockEventDetail,
  MockOrganizer,
  MockVenue,
  MockVenueDetail,
  MockVenueSummary,
  MockVenuePromotion,
  MockTicketTier,
  MockTicket,
  MockTicketEventSummary,
  MockTicketTierSummary,
  MockProfile,
  MockTransaction,
  MockSellerStats,
  MockRecentSale,
} from './types';

// ============================================================
// CATEGORIES
// ============================================================

export { CATEGORIES } from './categories';

// ============================================================
// EVENEMENTS
// ============================================================

export {
  MOCK_FEATURED,
  MOCK_EVENTS,
  MOCK_EVENT_DETAILS,
  getMockEventDetailById,
  buildMockEventDetailFromList,
  getMockEventDetailWithFallback,
} from './events';

// ============================================================
// LIEUX
// ============================================================

export {
  MOCK_VENUES,
  MOCK_VENUE_DETAILS,
  getMockVenueDetailById,
  buildMockVenueDetailFromList,
  getMockVenueDetailWithFallback,
} from './venues';

// ============================================================
// BILLETS
// ============================================================

export {
  MOCK_TICKETS,
  getMockTicketById,
  getMockTicketsByBuyer,
  getMockTicketsByEvent,
} from './tickets';

// ============================================================
// PROFILS / UTILISATEURS
// ============================================================

export {
  MOCK_PROFILES,
  getMockProfileById,
  getMockClientProfile,
  getMockSellerProfile,
} from './users';

// ============================================================
// TRANSACTIONS
// ============================================================

export {
  MOCK_TRANSACTIONS,
  getMockTransactionsByUser,
  getMockTransactionsByType,
} from './transactions';
