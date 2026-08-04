/**
 * Service evenements - couche d'acces aux donnees.
 *
 * Methodes :
 * - fetchEvents : liste des evenements publies (home, explore)
 * - fetchEventDetail : detail complet avec organisateur + lieu + tiers
 * - fetchSimilarEvents : evenements de meme categorie (pour section similaires)
 * - fetchFeaturedEvents : evenements a la une (home carousel)
 *
 * Convention : les types retournes sont les modeles metier (types/models.ts),
 * pas les types bruts Supabase.
 */

import { supabase } from '@/lib/supabase';
import { logger } from '@/lib/logger';
import type { EventWithAvailability, EventListItem, TicketTierWithAvailability, Venue } from '@/types';
import { getMockEventDetailWithFallback, MOCK_EVENTS } from '@/data/mock';
import type { MockEventDetail } from '@/data/mock';

// ============================================================
// Helpers
// ============================================================

/**
 * Verifie si un ID est un UUID valide (format v4).
 * Les IDs mock ('1', '2', 'tier-1-std', etc.) ne sont pas des UUIDs
 * et causent des erreurs Supabase (invalid input syntax for type uuid).
 * Quand l'ID n'est pas un UUID, on saute la requete Supabase
 * et on passe directement au fallback mock.
 */
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
function isUuid(id: string): boolean {
  return UUID_REGEX.test(id);
}

/**
 * Formate un prix en FCFA avec separateur de milliers.
 * Ex: 5000 -> "5 000 FCFA"
 */
export function formatPrice(price: number, currency = 'FCFA'): string {
  const absPrice = Math.abs(price);
  if (absPrice >= 1000) {
    const formatted = absPrice.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '\u202F');
    return `${price < 0 ? '-' : ''}${formatted} ${currency}`;
  }
  return `${price} ${currency}`;
}

/**
 * Formate une date ISO en chaine lisible en francais.
 * Ex: "2026-07-12T20:00:00Z" -> "12 Juillet 2026"
 */
export function formatDate(isoDate: string): string {
  const date = new Date(isoDate);
  const months = [
    'Janvier', 'Fevrier', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Aout', 'Septembre', 'Octobre', 'Novembre', 'Decembre',
  ];
  const day = date.getDate();
  const month = months[date.getMonth()];
  const year = date.getFullYear();
  return `${day} ${month} ${year}`;
}

/**
 * Formate une heure ISO en chaine lisible.
 * Ex: "2026-07-12T20:00:00Z" -> "20h00"
 */
export function formatTime(isoDate: string): string {
  const date = new Date(isoDate);
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${hours}h${minutes}`;
}

/**
 * Formate une date courte.
 * Ex: "2026-07-12T20:00:00Z" -> "12 Juil."
 */
export function formatDateShort(isoDate: string): string {
  const date = new Date(isoDate);
  const months = [
    'Janv.', 'Fevr.', 'Mars', 'Avr.', 'Mai', 'Juin',
    'Juil.', 'Aout', 'Sept.', 'Oct.', 'Nov.', 'Dec.',
  ];
  return `${date.getDate()} ${months[date.getMonth()]}`;
}

// ============================================================
// Service
// ============================================================

export const eventService = {
  /**
   * Liste des evenements publies avec prix min et billets disponibles.
   */
  async fetchEvents(): Promise<EventListItem[]> {
    try {
      const { data, error } = await supabase
        .from('events')
        .select(`
          *,
          organizer:profiles!organizer_id(id, full_name, avatar_url),
          venue:venues(id, name, city),
          ticket_tiers(id, price, quantity_total, quantity_sold)
        `)
        .eq('status', 'published')
        .order('start_date', { ascending: true });

      if (error) {
        logger.error('[eventService] fetchEvents error:', error.message);
        return [];
      }

      if (!data) return [];

      return data.map((row: Record<string, unknown>) => {
        const tiers = (row.ticket_tiers as Record<string, unknown>[]) ?? [];
        const prices = tiers.map((t: Record<string, unknown>) => (t.price as number) ?? 0).filter((p: number) => p > 0);
        const minPrice = prices.length > 0 ? Math.min(...prices) : null;
        const totalAvailable = tiers.reduce(
          (sum: number, t: Record<string, unknown>) =>
            sum + ((t.quantity_total as number) ?? 0) - ((t.quantity_sold as number) ?? 0),
          0,
        );

        const organizer = row.organizer as Record<string, unknown> | null;
        const venue = row.venue as Record<string, unknown> | null;

        return {
          id: row.id as string,
          title: row.title as string,
          description: row.description as string | null,
          category: row.category as string | null,
          event_type: row.event_type as string | null,
          start_date: row.start_date as string,
          end_date: row.end_date as string | null,
          address: row.address as string | null,
          city: row.city as string | null,
          cover_image: row.cover_image as string | null,
          images: (row.images as string[]) ?? [],
          status: row.status as 'draft' | 'published' | 'cancelled' | 'completed',
          is_featured: (row.is_featured as boolean) ?? false,
          organizer_id: row.organizer_id as string | null,
          venue_id: row.venue_id as string | null,
          created_at: row.created_at as string,
          updated_at: row.updated_at as string,
          organizer_name: (organizer?.full_name as string) ?? null,
          venue_name: (venue?.name as string) ?? null,
          min_price: minPrice,
          available_tickets: totalAvailable,
        };
      });
    } catch (err) {
      logger.error('[eventService] fetchEvents exception:', err);
      return [];
    }
  },

  /**
   * Detail complet d'un evenement avec organisateur, lieu et tiers de billets.
   */
  async fetchEventDetail(eventId: string): Promise<EventWithAvailability | null> {
    // Si l'ID n'est pas un UUID valide, on saute Supabase (donnees mock)
    if (!isUuid(eventId)) {
      logger.debug('[eventService] ID mock detecte, fallback direct:', eventId);
      const mockDetail = getMockEventDetailWithFallback(eventId);
      if (mockDetail) {
        return mapMockDetailToEventWithAvailability(mockDetail);
      }
      return null;
    }

    try {
      const { data, error } = await supabase
        .from('events')
        .select(`
          *,
          organizer:profiles!organizer_id(id, full_name, avatar_url, phone),
          venue:venues(*),
          ticket_tiers(*)
        `)
        .eq('id', eventId)
        .single();

      if (!error && data) {
        const row = data as Record<string, unknown>;
        const tiers = (row.ticket_tiers as Record<string, unknown>[]) ?? [];

        const tiersWithAvailability: TicketTierWithAvailability[] = tiers.map(
          (t: Record<string, unknown>) => {
            const total = (t.quantity_total as number) ?? 0;
            const sold = (t.quantity_sold as number) ?? 0;
            const available = Math.max(0, total - sold);
            return {
              id: t.id as string,
              event_id: t.event_id as string,
              name: t.name as string,
              price: t.price as number,
              quantity_total: total,
              quantity_sold: sold,
              description: t.description as string | null,
              benefits: (t.benefits as string[]) ?? [],
              created_at: t.created_at as string,
              available_quantity: available,
              is_sold_out: available === 0,
              is_low_stock: available > 0 && available < total * 0.1,
            };
          },
        );

        const totalAvailable = tiersWithAvailability.reduce(
          (sum, t) => sum + t.available_quantity,
          0,
        );

        return {
          id: row.id as string,
          title: row.title as string,
          description: row.description as string | null,
          category: row.category as string | null,
          event_type: row.event_type as string | null,
          start_date: row.start_date as string,
          end_date: row.end_date as string | null,
          address: row.address as string | null,
          city: row.city as string | null,
          cover_image: row.cover_image as string | null,
          images: (row.images as string[]) ?? [],
          status: row.status as 'draft' | 'published' | 'cancelled' | 'completed',
          is_featured: (row.is_featured as boolean) ?? false,
          organizer_id: row.organizer_id as string | null,
          venue_id: row.venue_id as string | null,
          created_at: row.created_at as string,
          updated_at: row.updated_at as string,
          organizer: row.organizer as { id: string; full_name: string | null; avatar_url: string | null; phone: string | null } | null,
          venue: row.venue as Venue | null,
          ticket_tiers: tiersWithAvailability,
          tiers_with_availability: tiersWithAvailability,
          total_available: totalAvailable,
          is_sold_out: totalAvailable === 0,
        };
      }

      if (error) {
        logger.error('[eventService] fetchEventDetail error:', error.message);
      }
    } catch (err) {
      logger.error('[eventService] fetchEventDetail exception:', err);
    }

    // Fallback mock : si Supabase echoue ou retourne null,
    // on utilise les donnees mock pour le developpement
    logger.debug('[eventService] fallback mock pour detail event:', eventId);
    const mockDetail = getMockEventDetailWithFallback(eventId);
    if (mockDetail) {
      return mapMockDetailToEventWithAvailability(mockDetail);
    }
    return null;
  },

  /**
   * Evenements similaires (meme categorie, excludes l'evenement courant).
   */
  async fetchSimilarEvents(eventId: string, category: string | null, limit = 6): Promise<EventListItem[]> {
    if (!category) return [];

    // Si l'ID n'est pas un UUID valide, on saute Supabase (donnees mock)
    if (!isUuid(eventId)) {
      logger.debug('[eventService] ID mock detecte pour similar, fallback direct:', eventId);
      return MOCK_EVENTS
        .filter((e) => e.category === category && e.id !== eventId)
        .slice(0, limit)
        .map((mockEvent) => ({
          id: mockEvent.id,
          title: mockEvent.title,
          description: null,
          category: mockEvent.category,
          event_type: mockEvent.category,
          start_date: `2026-08-${parseInt(mockEvent.id, 10) + 10}T20:00:00Z`,
          end_date: null,
          address: mockEvent.location,
          city: mockEvent.location.includes('Yaounde') ? 'Yaounde' : 'Douala',
          cover_image: mockEvent.image,
          images: [mockEvent.image],
          status: 'published' as const,
          is_featured: mockEvent.isFeatured,
          organizer_id: null,
          venue_id: null,
          created_at: '2026-01-01T00:00:00Z',
          updated_at: '2026-01-01T00:00:00Z',
          organizer_name: mockEvent.organizerName,
          venue_name: null,
          min_price: mockEvent.price,
          available_tickets: 120,
        }));
    }

    try {
      const { data, error } = await supabase
        .from('events')
        .select(`
          *,
          organizer:profiles!organizer_id(id, full_name, avatar_url),
          ticket_tiers(id, price, quantity_total, quantity_sold)
        `)
        .eq('status', 'published')
        .eq('category', category)
        .neq('id', eventId)
        .limit(limit)
        .order('start_date', { ascending: true });

      if (error) {
        logger.error('[eventService] fetchSimilarEvents error:', error.message);
        return [];
      }

      if (!data) return [];

      return data.map((row: Record<string, unknown>) => {
        const tiers = (row.ticket_tiers as Record<string, unknown>[]) ?? [];
        const prices = tiers.map((t: Record<string, unknown>) => (t.price as number) ?? 0).filter((p: number) => p > 0);
        const minPrice = prices.length > 0 ? Math.min(...prices) : null;
        const totalAvailable = tiers.reduce(
          (sum: number, t: Record<string, unknown>) =>
            sum + ((t.quantity_total as number) ?? 0) - ((t.quantity_sold as number) ?? 0),
          0,
        );

        const organizer = row.organizer as Record<string, unknown> | null;

        return {
          id: row.id as string,
          title: row.title as string,
          description: row.description as string | null,
          category: row.category as string | null,
          event_type: row.event_type as string | null,
          start_date: row.start_date as string,
          end_date: row.end_date as string | null,
          address: row.address as string | null,
          city: row.city as string | null,
          cover_image: row.cover_image as string | null,
          images: (row.images as string[]) ?? [],
          status: row.status as 'draft' | 'published' | 'cancelled' | 'completed',
          is_featured: (row.is_featured as boolean) ?? false,
          organizer_id: row.organizer_id as string | null,
          venue_id: row.venue_id as string | null,
          created_at: row.created_at as string,
          updated_at: row.updated_at as string,
          organizer_name: (organizer?.full_name as string) ?? null,
          venue_name: null,
          min_price: minPrice,
          available_tickets: totalAvailable,
        };
      });
    } catch (err) {
      logger.error('[eventService] fetchSimilarEvents exception:', err);
    }

    // Fallback mock : evenements de meme categorie
    logger.debug('[eventService] fallback mock pour similar events:', eventId, category);
    return MOCK_EVENTS
      .filter((e) => e.category === category && e.id !== eventId)
      .slice(0, limit)
      .map((mockEvent) => ({
        id: mockEvent.id,
        title: mockEvent.title,
        description: null,
        category: mockEvent.category,
        event_type: mockEvent.category,
        start_date: `2026-08-${parseInt(mockEvent.id, 10) + 10}T20:00:00Z`,
        end_date: null,
        address: mockEvent.location,
        city: mockEvent.location.includes('Yaounde') ? 'Yaounde' : 'Douala',
        cover_image: mockEvent.image,
        images: [mockEvent.image],
        status: 'published' as const,
        is_featured: mockEvent.isFeatured,
        organizer_id: null,
        venue_id: null,
        created_at: '2026-01-01T00:00:00Z',
        updated_at: '2026-01-01T00:00:00Z',
        organizer_name: mockEvent.organizerName,
        venue_name: null,
        min_price: mockEvent.price,
        available_tickets: 120,
      }));
  },
};

// Export legacy pour compatibilite
export async function fetchEvents() {
  return eventService.fetchEvents();
}

// ============================================================
// Helper : Mapper MockEventDetail vers EventWithAvailability
// ============================================================

function mapMockDetailToEventWithAvailability(mock: MockEventDetail): EventWithAvailability {
  const tiersWithAvailability: TicketTierWithAvailability[] = mock.ticket_tiers.map((tier) => ({
    id: tier.id,
    event_id: tier.event_id,
    name: tier.name,
    price: tier.price,
    quantity_total: tier.quantity_total,
    quantity_sold: tier.quantity_sold,
    description: tier.description,
    benefits: [...tier.benefits],
    created_at: '2026-01-01T00:00:00Z',
    available_quantity: tier.available_quantity,
    is_sold_out: tier.is_sold_out,
    is_low_stock: tier.is_low_stock,
  }));

  const totalAvailable = tiersWithAvailability.reduce(
    (sum, t) => sum + t.available_quantity,
    0,
  );

  return {
    id: mock.id,
    title: mock.title,
    description: mock.description,
    category: mock.category,
    event_type: mock.event_type,
    start_date: mock.start_date,
    end_date: mock.end_date,
    address: mock.address,
    city: mock.city,
    cover_image: mock.cover_image,
    images: [...mock.images],
    status: mock.status,
    is_featured: mock.is_featured,
    organizer_id: mock.organizer?.id ?? null,
    venue_id: mock.venue?.id ?? null,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
    organizer: mock.organizer ? {
      id: mock.organizer.id,
      full_name: mock.organizer.full_name,
      avatar_url: mock.organizer.avatar_url,
      phone: mock.organizer.phone,
    } : null,
    venue: mock.venue ? {
      id: mock.venue.id,
      name: mock.venue.name,
      city: mock.venue.city,
      // Champs Venue complets mis a null en mode mock
      description: null,
      address: null,
      country: null,
      capacity_min: null,
      capacity_max: null,
      price_per_day: null,
      images: [],
      amenities: [],
      event_types: [],
      is_premium: false,
      promotion_tier: null,
      lat: null,
      lng: null,
      owner_id: null,
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-01-01T00:00:00Z',
    } : null,
    ticket_tiers: tiersWithAvailability,
    tiers_with_availability: tiersWithAvailability,
    total_available: totalAvailable,
    is_sold_out: mock.is_sold_out,
  };
}
