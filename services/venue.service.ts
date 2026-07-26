/**
 * Service lieux - couche d'acces aux donnees.
 *
 * Methodes :
 * - fetchVenues : liste des lieux (home feed, explore)
 * - fetchVenueDetail : detail complet avec owner + promotion
 * - fetchFeaturedVenues : lieux sponsorises / premium
 *
 * Mode de dev : chaque methode tente d'appeler Supabase, puis fallback
 * sur les donnees mock si l'appel echoue (pas de backend configure).
 * Quand le backend sera operationnel, le fallback mock sera retire.
 *
 * Convention : les types retournes sont les modeles metier (types/models.ts),
 * pas les types bruts Supabase.
 */

import { supabase } from '@/lib/supabase';
import { logger } from '@/lib/logger';
import type { Venue, VenueWithPromotion } from '@/types';
import {
  MOCK_VENUES,
  getMockVenueDetailWithFallback,
} from '@/data/mock';

// ============================================================
// Helpers mock -> types metier
// ============================================================

/**
 * Convertit les MOCK_VENUES en Venue[] pour le fallback.
 */
function mockVenuesToVenueList(): Venue[] {
  return MOCK_VENUES.map((mock) => ({
    id: mock.id,
    owner_id: null,
    name: mock.name,
    description: null,
    address: mock.location,
    city: mock.location.includes('Yaounde') ? 'Yaounde' : mock.location.includes('Douala') ? 'Douala' : 'Buea',
    country: 'Cameroun',
    capacity_min: null,
    capacity_max: null,
    price_per_day: null,
    images: [mock.image],
    amenities: [],
    event_types: [],
    is_premium: mock.badge !== null,
    promotion_tier: mock.badge === 'Premium' ? 'premium' as const : mock.badge === 'Or Savane' ? 'vip' as const : mock.badge === 'Recommande' ? 'basique' as const : null,
    lat: null,
    lng: null,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  }));
}

/**
 * Convertit un MockVenueDetail en VenueWithPromotion pour le fallback.
 */
function mockDetailToVenueWithPromotion(mock: ReturnType<typeof getMockVenueDetailWithFallback>): VenueWithPromotion | null {
  if (!mock) return null;

  const venue: Venue = {
    id: mock.id,
    owner_id: mock.owner?.id ?? null,
    name: mock.name,
    description: mock.description,
    address: mock.address,
    city: mock.city,
    country: mock.country ?? 'Cameroun',
    capacity_min: mock.capacity_min,
    capacity_max: mock.capacity_max,
    price_per_day: mock.price_per_day,
    images: [...mock.images],
    amenities: [...mock.amenities],
    event_types: [...mock.event_types],
    is_premium: mock.is_premium,
    promotion_tier: mock.promotion_tier,
    lat: mock.lat,
    lng: mock.lng,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  };

  const activePromotion = mock.active_promotion
    ? {
        id: mock.active_promotion.id,
        venue_id: mock.active_promotion.venue_id,
        tier: mock.active_promotion.tier,
        start_date: mock.active_promotion.start_date,
        end_date: mock.active_promotion.end_date,
        amount_paid: mock.active_promotion.amount_paid,
        impressions: mock.active_promotion.impressions,
        clicks: mock.active_promotion.clicks,
        is_active: mock.active_promotion.is_active,
        created_at: '2026-01-01T00:00:00Z',
      }
    : null;

  return {
    ...venue,
    active_promotion: activePromotion,
  };
}

// ============================================================
// Service
// ============================================================

export const venueService = {
  /**
   * Liste des lieux.
   * Fallback mock si Supabase echoue.
   */
  async fetchVenues(): Promise<Venue[]> {
    try {
      const { data, error } = await supabase
        .from('venues')
        .select('*');

      if (error) {
        logger.warn('[venueService] fetchVenues Supabase error, fallback mock:', error.message);
        return mockVenuesToVenueList();
      }

      if (!data || data.length === 0) {
        logger.warn('[venueService] fetchVenues : 0 resultats Supabase, fallback mock');
        return mockVenuesToVenueList();
      }

      return data as Venue[];
    } catch (err) {
      logger.warn('[venueService] fetchVenues exception, fallback mock:', err);
      return mockVenuesToVenueList();
    }
  },

  /**
   * Detail complet d'un lieu avec owner + promotion.
   * Fallback mock si Supabase echoue.
   */
  async fetchVenueDetail(venueId: string): Promise<VenueWithPromotion | null> {
    try {
      const { data, error } = await supabase
        .from('venues')
        .select(`
          *,
          owner:profiles!owner_id(id, full_name, avatar_url),
          active_promotion:venue_promotions!venue_id(
            id, venue_id, tier, start_date, end_date,
            amount_paid, impressions, clicks, is_active, created_at
          )
        `)
        .eq('id', venueId)
        .single();

      if (error) {
        logger.warn('[venueService] fetchVenueDetail Supabase error, fallback mock:', error.message);
        return mockDetailToVenueWithPromotion(getMockVenueDetailWithFallback(venueId));
      }

      if (!data) {
        logger.warn('[venueService] fetchVenueDetail : pas de donnee Supabase, fallback mock');
        return mockDetailToVenueWithPromotion(getMockVenueDetailWithFallback(venueId));
      }

      return data as VenueWithPromotion;
    } catch (err) {
      logger.warn('[venueService] fetchVenueDetail exception, fallback mock:', err);
      return mockDetailToVenueWithPromotion(getMockVenueDetailWithFallback(venueId));
    }
  },

  /**
   * Lieux sponsorises / premium (pour le carrousel "Lieux a decouvrir").
   * Fallback mock si Supabase echoue.
   */
  async fetchFeaturedVenues(): Promise<Venue[]> {
    try {
      const { data, error } = await supabase
        .from('venues')
        .select('*')
        .eq('is_premium', true)
        .order('created_at', { ascending: false });

      if (error) {
        logger.warn('[venueService] fetchFeaturedVenues Supabase error, fallback mock:', error.message);
        return mockVenuesToVenueList().filter((v) => v.is_premium);
      }

      if (!data || data.length === 0) {
        logger.warn('[venueService] fetchFeaturedVenues : 0 resultats, fallback mock');
        return mockVenuesToVenueList();
      }

      return data as Venue[];
    } catch (err) {
      logger.warn('[venueService] fetchFeaturedVenues exception, fallback mock:', err);
      return mockVenuesToVenueList().filter((v) => v.is_premium);
    }
  },
};

// Export legacy pour compatibilite
export async function fetchVenues() {
  return venueService.fetchVenues();
}
