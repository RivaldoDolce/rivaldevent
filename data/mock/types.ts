/**
 * Interfaces mock pour le developpement.
 *
 * Ces types sont alignes sur les vrais types de `types/models.ts` mais
 * restent separes car ils servent uniquement au developpement sans backend.
 * Quand les donnees Supabase seront branchees, ces interfaces seront
 * remplacees par les vrais types importes depuis `@/types`.
 *
 * Conventions :
 * - Champs readonly sur toutes les props immuables
 * - Alignement sur les champs de `types/database.ts` (Row types)
 * - Champs calculs (available_tickets, min_price) inclus pour simuler les agregations
 * - Pas de type any
 * - as const sur les tableaux immuables
 */

import type {
  EventStatus,
  PaymentMethod,
  PaymentStatus,
  UserRole,
  PromotionTier,
} from '@/types';

// ============================================================
// CATEGORIE
// ============================================================

export interface MockCategory {
  readonly id: string;
  readonly label: string;
}

// ============================================================
// EVENEMENT
// ============================================================

/**
 * Evenement simplifie pour les listes (home feed, explore).
 * Aligne sur EventListItem de types/models.ts.
 */
export interface MockEvent {
  readonly id: string;
  readonly title: string;
  readonly image: string;
  readonly date: string;
  readonly location: string;
  readonly time: string;
  readonly organizerName: string;
  readonly organizerAvatar: string | null;
  readonly price: number;
  readonly currency: string;
  readonly category: string;
  readonly isFeatured: boolean;
}

/**
 * Evenement "a la une" pour le carrousel featured.
 * Sous-ensemble de MockEvent avec moins de champs.
 */
export interface MockFeaturedEvent {
  readonly id: string;
  readonly title: string;
  readonly image: string;
  readonly date: string;
  readonly location: string;
  readonly category: string;
  readonly price: number;
  readonly currency: string;
}

/**
 * Evenement complet pour la page detail ([id].tsx).
 * Aligne sur EventWithAvailability de types/models.ts.
 * Inclut organisateur, lieu, tiers de billets, et champs calculs.
 */
export interface MockEventDetail {
  readonly id: string;
  readonly title: string;
  readonly description: string | null;
  readonly category: string | null;
  readonly event_type: string | null;
  readonly cover_image: string | null;
  readonly images: readonly string[];
  readonly start_date: string;
  readonly end_date: string | null;
  readonly address: string | null;
  readonly city: string | null;
  readonly status: EventStatus;
  readonly is_featured: boolean;
  readonly organizer: MockOrganizer | null;
  readonly venue: MockVenueSummary | null;
  readonly ticket_tiers: readonly MockTicketTier[];
  readonly total_available: number;
  readonly is_sold_out: boolean;
}

/**
 * Organisateur simplifie (profil public).
 * Aligne sur Pick<Profile, 'id' | 'full_name' | 'avatar_url' | 'phone'>.
 */
export interface MockOrganizer {
  readonly id: string;
  readonly full_name: string | null;
  readonly avatar_url: string | null;
  readonly phone: string | null;
}

// ============================================================
// LIEU
// ============================================================

/**
 * Lieu simplifie pour les cartes horizontales (home feed).
 * Aligne partiellement sur Venue de types/models.ts.
 */
export interface MockVenue {
  readonly id: string;
  readonly name: string;
  readonly image: string;
  readonly location: string;
  readonly rating: number;
  readonly badge: string | null;
}

/**
 * Lieu complet pour la page detail (venues/[id]).
 * Aligne sur Venue + VenueWithPromotion de types/models.ts.
 */
export interface MockVenueDetail {
  readonly id: string;
  readonly name: string;
  readonly description: string | null;
  readonly address: string | null;
  readonly city: string | null;
  readonly country: string | null;
  readonly capacity_min: number | null;
  readonly capacity_max: number | null;
  readonly price_per_day: number | null;
  readonly images: readonly string[];
  readonly amenities: readonly string[];
  readonly event_types: readonly string[];
  readonly is_premium: boolean;
  readonly promotion_tier: PromotionTier | null;
  readonly lat: number | null;
  readonly lng: number | null;
  readonly owner: MockOrganizer | null;
  readonly active_promotion: MockVenuePromotion | null;
}

/**
 * Lieu simplifie pour les references dans les evenements.
 * Aligne sur Pick<Venue, 'id' | 'name' | 'city'>.
 */
export interface MockVenueSummary {
  readonly id: string;
  readonly name: string;
  readonly city: string | null;
}

/**
 * Promotion d'un lieu.
 * Aligne sur VenuePromotion de types/models.ts.
 */
export interface MockVenuePromotion {
  readonly id: string;
  readonly venue_id: string;
  readonly tier: PromotionTier | null;
  readonly start_date: string | null;
  readonly end_date: string | null;
  readonly amount_paid: number | null;
  readonly impressions: number;
  readonly clicks: number;
  readonly is_active: boolean;
}

// ============================================================
// BILLET
// ============================================================

/**
 * Tier de billet (Standard, VIP, PREMIUM).
 * Aligne sur TicketTierWithAvailability de types/models.ts.
 */
export interface MockTicketTier {
  readonly id: string;
  readonly event_id: string;
  readonly name: string;
  readonly price: number;
  readonly quantity_total: number;
  readonly quantity_sold: number;
  readonly description: string | null;
  readonly benefits: readonly string[];
  readonly available_quantity: number;
  readonly is_sold_out: boolean;
  readonly is_low_stock: boolean;
}

/**
 * Billet achete par un client.
 * Aligne sur TicketWithEvent de types/models.ts.
 */
export interface MockTicket {
  readonly id: string;
  readonly event_id: string;
  readonly tier_id: string;
  readonly buyer_id: string;
  readonly quantity: number;
  readonly total_price: number;
  readonly payment_method: PaymentMethod | null;
  readonly payment_status: PaymentStatus;
  readonly qr_code: string | null;
  readonly qr_secret: string | null;
  readonly is_scanned: boolean;
  readonly scanned_at: string | null;
  readonly expires_at: string | null;
  readonly created_at: string;
  readonly event: MockTicketEventSummary | null;
  readonly tier: MockTicketTierSummary | null;
}

/**
 * Resume d'evenement pour un billet.
 * Aligne sur Pick<Event, 'id' | 'title' | 'cover_image' | 'start_date' | 'city'>.
 */
export interface MockTicketEventSummary {
  readonly id: string;
  readonly title: string;
  readonly cover_image: string | null;
  readonly start_date: string;
  readonly city: string | null;
}

/**
 * Resume de tier pour un billet.
 * Aligne sur Pick<TicketTier, 'id' | 'name' | 'price'>.
 */
export interface MockTicketTierSummary {
  readonly id: string;
  readonly name: string;
  readonly price: number;
}

// ============================================================
// PROFIL / UTILISATEUR
// ============================================================

/**
 * Profil utilisateur mock.
 * Aligne sur Profile de types/database.ts (Row).
 */
export interface MockProfile {
  readonly id: string;
  readonly full_name: string | null;
  readonly avatar_url: string | null;
  readonly phone: string | null;
  readonly role: UserRole;
  readonly is_seller: boolean;
  readonly created_at: string;
  readonly updated_at: string;
}

// ============================================================
// TRANSACTION
// ============================================================

/**
 * Transaction (paiement, vente, retrait).
 * Aligne sur Transaction de types/database.ts (Row).
 */
export interface MockTransaction {
  readonly id: string;
  readonly user_id: string | null;
  readonly type: 'ticket_sale' | 'venue_promo' | 'withdrawal';
  readonly amount: number;
  readonly currency: string;
  readonly status: 'pending' | 'completed' | 'failed';
  readonly provider: string | null;
  readonly provider_ref: string | null;
  readonly idempotency_key: string | null;
  readonly metadata: Record<string, unknown>;
  readonly created_at: string;
  readonly updated_at: string;
}

// ============================================================
// DASHBOARD VENDEUR
// ============================================================

/**
 * Stats du dashboard vendeur.
 * Aligne sur SellerStats de types/models.ts.
 */
export interface MockSellerStats {
  readonly total_events: number;
  readonly active_events: number;
  readonly total_tickets_sold: number;
  readonly total_revenue: number;
  readonly pending_withdrawals: number;
  readonly available_balance: number;
}

/**
 * Vente recente pour le dashboard vendeur.
 * Aligne sur RecentSale de types/models.ts.
 */
export interface MockRecentSale {
  readonly id: string;
  readonly event_title: string;
  readonly buyer_name: string;
  readonly tier_name: string;
  readonly quantity: number;
  readonly total_price: number;
  readonly purchased_at: string;
}
