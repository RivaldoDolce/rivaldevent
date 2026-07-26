/**
 * Modèles métier de l'application.
 *
 * Ces types représentent les entités telles qu'utilisées dans l'UI et les services,
 * au-dessus de la couche `database.ts` (qui reflète exactement le schéma Supabase).
 *
 * Différences avec database.ts :
 * - Champs dénormalisés (ex: EventWithTiers, TicketWithEvent)
 * - Champs calculés (ex: available_tickets, is_active)
 * - Enums string-literal au lieu de types `Database` imbriqués
 * - Champs optionnels simplifiés
 */

import type { Database } from './database';

// ============================================================
// TYPES RACINES (raccourcis vers les types Supabase)
// ============================================================

export type Profile = Database['public']['Tables']['profiles']['Row'];
export type Venue = Database['public']['Tables']['venues']['Row'];
export type Event = Database['public']['Tables']['events']['Row'];
export type TicketTier = Database['public']['Tables']['ticket_tiers']['Row'];
export type Ticket = Database['public']['Tables']['tickets']['Row'];
export type Transaction = Database['public']['Tables']['transactions']['Row'];
export type VenuePromotion = Database['public']['Tables']['venue_promotions']['Row'];

// ============================================================
// ENUMS MÉTIER (string-literal unions, jamais d'enum TS)
// ============================================================

export type UserRole = 'client' | 'particulier' | 'prestataire';
export type EventStatus = 'draft' | 'published' | 'cancelled' | 'completed';
export type PaymentMethod = 'mtn' | 'orange' | 'moov';
export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'refunded';
export type TransactionStatus = 'pending' | 'completed' | 'failed';
export type TransactionType = 'ticket_sale' | 'venue_promo' | 'withdrawal';
export type PromotionTier = 'basique' | 'premium' | 'vip';

// ============================================================
// PROFIL
// ============================================================

export interface ProfileWithStats extends Profile {
  readonly events_count?: number;
  readonly tickets_sold?: number;
  readonly total_revenue?: number;
}

// ============================================================
// ÉVÉNEMENTS — avec relations
// ============================================================

export interface EventWithOrganizer extends Event {
  readonly organizer: Pick<Profile, 'id' | 'full_name' | 'avatar_url' | 'phone'> | null;
}

export interface EventWithVenue extends Event {
  readonly venue: Venue | null;
  readonly organizer: Pick<Profile, 'id' | 'full_name' | 'avatar_url' | 'phone'> | null;
}

export interface EventWithTiers extends EventWithVenue {
  readonly ticket_tiers: TicketTier[];
}

export interface EventListItem extends Event {
  readonly organizer_name: string | null;
  readonly venue_name: string | null;
  readonly min_price: number | null;
  readonly available_tickets: number | null;
}

// ============================================================
// TICKETS — avec relations
// ============================================================

export interface TicketWithEvent extends Ticket {
  readonly event: Pick<Event, 'id' | 'title' | 'cover_image' | 'start_date' | 'city'> | null;
  readonly tier: Pick<TicketTier, 'id' | 'name' | 'price'> | null;
}

export interface TicketWithBuyer extends Ticket {
  readonly buyer: Pick<Profile, 'id' | 'full_name' | 'phone'> | null;
  readonly tier: TicketTier | null;
  readonly event: Event | null;
}

// ============================================================
// LIEUX — avec relations
// ============================================================

export interface VenueWithOwner extends Venue {
  readonly owner: Pick<Profile, 'id' | 'full_name' | 'avatar_url'> | null;
}

export interface VenueWithPromotion extends Venue {
  readonly active_promotion: VenuePromotion | null;
}

// ============================================================
// TRANSACTIONS
// ============================================================

export interface TransactionWithEvent extends Transaction {
  readonly event: Pick<Event, 'id' | 'title' | 'start_date'> | null;
}

// ============================================================
// CHAMPS CALCULÉS
// ============================================================

export interface TicketTierWithAvailability extends TicketTier {
  readonly available_quantity: number;
  readonly is_sold_out: boolean;
  readonly is_low_stock: boolean; // < 10% restant
}

export interface EventWithAvailability extends EventWithTiers {
  readonly ticket_tiers: TicketTierWithAvailability[];
  readonly tiers_with_availability: TicketTierWithAvailability[];
  readonly total_available: number;
  readonly is_sold_out: boolean;
}

// ============================================================
// HELPERS DE TYPE (type guards)
// ============================================================

export function isEventStatus(value: unknown): value is EventStatus {
  return (
    typeof value === 'string' &&
    ['draft', 'published', 'cancelled', 'completed'].includes(value)
  );
}

export function isPaymentMethod(value: unknown): value is PaymentMethod {
  return typeof value === 'string' && ['mtn', 'orange', 'moov'].includes(value);
}

export function isPaymentStatus(value: unknown): value is PaymentStatus {
  return (
    typeof value === 'string' &&
    ['pending', 'completed', 'failed', 'refunded'].includes(value)
  );
}

export function isUserRole(value: unknown): value is UserRole {
  return (
    typeof value === 'string' &&
    ['client', 'particulier', 'prestataire'].includes(value)
  );
}

// ============================================================
// DASHBOARD VENDEUR (stats)
// ============================================================

export interface SellerStats {
  readonly total_events: number;
  readonly active_events: number;
  readonly total_tickets_sold: number;
  readonly total_revenue: number;
  readonly pending_withdrawals: number;
  readonly available_balance: number;
}

export interface RecentSale {
  readonly id: string;
  readonly event_title: string;
  readonly buyer_name: string;
  readonly tier_name: string;
  readonly quantity: number;
  readonly total_price: number;
  readonly purchased_at: string;
}

// ============================================================
// FILTRES
// ============================================================

export interface EventFilters {
  readonly category?: string;
  readonly city?: string;
  readonly date_from?: string;
  readonly date_to?: string;
  readonly min_price?: number;
  readonly max_price?: number;
  readonly search?: string;
}

export interface VenueFilters {
  readonly city?: string;
  readonly min_capacity?: number;
  readonly max_capacity?: number;
  readonly event_type?: string;
  readonly promotion_tier?: PromotionTier;
  readonly search?: string;
}