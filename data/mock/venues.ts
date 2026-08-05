/**
 * Lieux mock pour le developpement.
 *
 * Extrait de `app/(client)/home/index.tsx` + enrichi avec des donnees
 * detailles pour la page venues/[id].
 *
 * 2 groupes :
 * - MOCK_VENUES : 5 lieux simplifies pour les cartes horizontales
 * - MOCK_VENUE_DETAILS : 2 lieux complets avec amenities, capacite, promotion
 *
 * Les images utilisent des URLs Unsplash publiques.
 * as const sur les tableaux immuables.
 */

import type { MockVenue, MockVenueDetail, MockOrganizer, MockVenuePromotion, MockCategory } from './types';

// ============================================================
// Proprietaires mock (references dans les lieux)
// ============================================================

const MOCK_VENUE_OWNERS: readonly MockOrganizer[] = [
  {
    id: 'owner-1',
    full_name: 'Jean-Pierre Fotso',
    avatar_url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100',
    phone: '+237 6 99 12 34 56',
  },
  {
    id: 'owner-2',
    full_name: 'Marie Nkoulou',
    avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100',
    phone: '+237 6 77 88 99 00',
  },
] as const;

// ============================================================
// Categories de lieux (chips sur la page Lieux)
// ============================================================

export const VENUE_CATEGORIES: readonly MockCategory[] = [
  { id: 'all', label: 'Tous' },
  { id: 'lounge', label: 'Lounges' },
  { id: 'reception', label: 'Receptions' },
  { id: 'conference', label: 'Conferences' },
  { id: 'sports', label: 'Stades' },
  { id: 'spectacle', label: 'Spectacles' },
] as const;

// ============================================================
// VENUES : cartes pour le carrousel "Lieux a decouvrir"
// ============================================================

export const MOCK_VENUES: readonly MockVenue[] = [
  {
    id: '1',
    name: 'The Golden Lounge',
    image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400',
    location: 'Bastos, Yaounde',
    rating: 4.7,
    badge: 'Or Savane',
    category: 'lounge',
    capacity_max: 300,
    price_per_day: 75000,
    event_types: ['soiree', 'gala', 'conference', 'cocktail', 'diner'],
  },
  {
    id: '2',
    name: 'Suna \' a Home Bonapriso',
    image: 'https://cf.bstatic.com/xdata/images/hotel/max1024x768/509004353.jpg?k=e299286e7a5328538faeffe4d7cd874f2cc4c31f498228afc0f15e5d70f7d501&o=',
    location: 'Bonapriso, Douala',
    rating: 4.5,
    badge: null,
    category: 'reception',
    capacity_max: 250,
    price_per_day: 60000,
    event_types: ['wedding', 'cocktail', 'diner', 'gala'],
  },
  {
    id: '3',
    name: 'Espace Mont Febe',
    image: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400',
    location: 'Mont Febe, Yaounde',
    rating: 4.8,
    badge: 'Premium',
    category: 'reception',
    capacity_max: 500,
    price_per_day: 120000,
    event_types: ['concert', 'conference', 'gala', 'wedding', 'festival', 'exposition'],
  },
  {
    id: '4',
    name: 'Stade Japoma',
    image: 'https://images.unsplash.com/photo-1459865264687-595d652de67e?w=400',
    location: 'Japoma, Douala',
    rating: 4.3,
    badge: null,
    category: 'sports',
    capacity_max: 50000,
    price_per_day: 300000,
    event_types: ['sport', 'concert', 'festival'],
  },
  {
    id: '5',
    name: 'Silicon Mountain Hub',
    image: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=400',
    location: 'Buea, Sud-Ouest',
    rating: 4.6,
    badge: 'Recommande',
    category: 'conference',
    capacity_max: 150,
    price_per_day: 45000,
    event_types: ['conference', 'exposition', 'atelier', 'seminaire'],
  },
] as const;

// ============================================================
// VENUE DETAILS : lieux complets pour la page detail
// ============================================================

/**
 * Promotion mock pour The Golden Lounge.
 */
const promotionGoldenLounge: MockVenuePromotion = {
  id: 'promo-1',
  venue_id: '1',
  tier: 'vip',
  start_date: '2026-07-01',
  end_date: '2026-09-30',
  amount_paid: 25000,
  impressions: 12500,
  clicks: 380,
  is_active: true,
};

/**
 * Promotion mock pour Espace Mont Febe.
 */
const promotionMontFebe: MockVenuePromotion = {
  id: 'promo-2',
  venue_id: '3',
  tier: 'premium',
  start_date: '2026-06-01',
  end_date: '2026-08-31',
  amount_paid: 15000,
  impressions: 8700,
  clicks: 210,
  is_active: true,
};

export const MOCK_VENUE_DETAILS: readonly MockVenueDetail[] = [
  {
    id: '1',
    name: 'The Golden Lounge',
    description: 'Le lounge le plus exclusif de Bastos, Yaounde. Ambiance raffinee, cuisine fusion africaine-europeenne, bar premium avec cocktails signature. Ideal pour soirees privees, receptions d\'entreprise et diners romantiques. Terrasse panoramique avec vue sur la ville.',
    address: '237 Rue Bastos, Yaounde',
    city: 'Yaounde',
    country: 'Cameroun',
    capacity_min: 50,
    capacity_max: 300,
    price_per_day: 75000,
    images: [
      'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800',
      'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600',
      'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=600',
    ],
    amenities: ['Bar premium', 'Terrasse', 'Parking VIP', 'Vestiaire', 'Son professionnel', 'Eclairage scene', 'Cuisine sur site', 'Wi-Fi'],
    event_types: ['soiree', 'gala', 'conference', 'cocktail', 'diner'],
    is_premium: true,
    promotion_tier: 'vip',
    lat: 3.8733,
    lng: 11.5235,
    owner: MOCK_VENUE_OWNERS[0],
    active_promotion: promotionGoldenLounge,
  },
  {
    id: '3',
    name: 'Espace Mont Febe',
    description: 'Un espace exceptionnel niché sur les hauteurs de Mont Febe, Yaounde. Vue imprenable sur la ville, architecture contemporaine africaine, jardins tropicaux. Convient aux evenements de grande envergure : concerts, conferences, weddings, galas. Capacite modulable de 100 a 500 places.',
    address: 'Mont Febe Hill, Yaounde',
    city: 'Yaounde',
    country: 'Cameroun',
    capacity_min: 100,
    capacity_max: 500,
    price_per_day: 120000,
    images: [
      'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800',
      'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600',
      'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=600',
    ],
    amenities: ['Jardin tropical', 'Vue panoramique', 'Scene modulable', 'Parking 200 places', 'Catering', 'Systeme son premium', 'Projection HD', 'Wi-Fi', 'Vestiaire securise'],
    event_types: ['concert', 'conference', 'gala', 'wedding', 'festival', 'exposition'],
    is_premium: true,
    promotion_tier: 'premium',
    lat: 3.8780,
    lng: 11.5140,
    owner: MOCK_VENUE_OWNERS[1],
    active_promotion: promotionMontFebe,
  },
] as const;

/**
 * Helper : trouve un lieu detail par son id.
 * Retourne null si l'id n'existe pas dans MOCK_VENUE_DETAILS.
 */
export function getMockVenueDetailById(id: string): MockVenueDetail | null {
  const detail = MOCK_VENUE_DETAILS.find((v) => v.id === id);
  return detail ?? null;
}

/**
 * Helper : construit un MockVenueDetail simplifie a partir de MOCK_VENUES
 * pour les lieux qui n'ont pas de detail complet predefini.
 */
export function buildMockVenueDetailFromList(id: string): MockVenueDetail | null {
  const venue = MOCK_VENUES.find((v) => v.id === id);
  if (!venue) return null;

  return {
    id: venue.id,
    name: venue.name,
    description: `Description detaillee pour le lieu "${venue.name}". Plus d'informations seront disponibles une fois le backend branche.`,
    address: venue.location,
    city: venue.location.includes('Yaounde') ? 'Yaounde' : venue.location.includes('Douala') ? 'Douala' : 'Buea',
    country: 'Cameroun',
    capacity_min: 50,
    capacity_max: 200,
    price_per_day: 50000,
    images: [venue.image],
    amenities: ['Wi-Fi', 'Parking', 'Son'],
    event_types: ['soiree', 'conference'],
    is_premium: venue.badge !== null,
    promotion_tier: venue.badge === 'Premium' ? 'premium' : venue.badge === 'Or Savane' ? 'vip' : null,
    lat: null,
    lng: null,
    owner: null,
    active_promotion: null,
  };
}

/**
 * Helper : recupere un lieu detail par id, avec fallback.
 */
export function getMockVenueDetailWithFallback(id: string): MockVenueDetail | null {
  return getMockVenueDetailById(id) ?? buildMockVenueDetailFromList(id);
}
