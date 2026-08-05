/**
 * Evenements mock pour le developpement.
 *
 * Extrait de `app/(client)/home/index.tsx` + enrichi avec des donnees
 * detailles pour la page `[id].tsx` (detail evenement).
 *
 * 3 groupes de donnees :
 * - MOCK_FEATURED : 3 evenements "a la une" pour le carrousel
 * - MOCK_EVENTS : 6 evenements simplifies pour les cartes de la home
 * - MOCK_EVENT_DETAILS : 2 evenements complets avec tiers/organisateur/lieu
 *   pour la page detail et la selection de billets
 *
 * Les images utilisent des URLs Unsplash publiques (remplacer par
 * les vraies images du bucket Supabase quand le backend sera branche).
 *
 * as const sur les tableaux immuables.
 */

import type { MockEvent, MockFeaturedEvent, MockEventDetail, MockOrganizer, MockVenueSummary, MockTicketTier } from './types';

// ============================================================
// Organisateurs mock
// ============================================================

const MOCK_ORGANIZERS: readonly MockOrganizer[] = [
  {
    id: 'org-1',
    full_name: 'Pro Events CMR',
    avatar_url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100',
    phone: '+237 6 99 88 77 66',
  },
  {
    id: 'org-2',
    full_name: 'Ministere de la Culture',
    avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100',
    phone: '+237 2 22 33 44 55',
  },
  {
    id: 'org-3',
    full_name: 'Cameroon Tech Hub',
    avatar_url: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=100',
    phone: '+237 6 77 66 55 44',
  },
  {
    id: 'org-4',
    full_name: 'FECAfoot',
    avatar_url: null,
    phone: '+237 2 33 44 55 66',
  },
  {
    id: 'org-5',
    full_name: 'Troupe Les Eclats',
    avatar_url: null,
    phone: '+237 6 55 44 33 22',
  },
  {
    id: 'org-6',
    full_name: 'Fondation Hope',
    avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100',
    phone: '+237 6 98 11 22 33',
  },
] as const;

// ============================================================
// Lieux simplifies (references dans les evenements)
// ============================================================

const MOCK_VENUE_SUMMARIES: readonly MockVenueSummary[] = [
  { id: 'venue-1', name: 'Palais des Sports', city: 'Yaounde' },
  { id: 'venue-2', name: 'Centre Culturel', city: 'Douala' },
  { id: 'venue-3', name: 'Hotel Pullman', city: 'Douala' },
  { id: 'venue-4', name: 'Stade Japoma', city: 'Douala' },
  { id: 'venue-5', name: 'Maison de la Culture', city: 'Yaounde' },
  { id: 'venue-6', name: 'Hilton Yaounde', city: 'Yaounde' },
] as const;

// ============================================================
// FEATURED : carrousel "A la une"
// ============================================================

export const MOCK_FEATURED: readonly MockFeaturedEvent[] = [
  {
    id: '1',
    title: 'Soiree Afrobeats Yaounde',
    image: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800',
    date: '12 Juil.',
    location: 'Palais des Sports, Yaounde',
    category: 'Concerts',
    price: 5000,
    currency: 'FCFA',
  },
  {
    id: '2',
    title: 'Festival Culturel Nguon 2026',
    image: 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=800',
    date: '25 Juil.',
    location: 'Centre Culturel, Douala',
    category: 'Festivals',
    price: 2000,
    currency: 'FCFA',
  },
  {
    id: '6',
    title: 'Gala de Charite 2026',
    image: 'https://images.unsplash.com/photo-1519671482749-fd09be7ccebf?w=800',
    date: '02 Sept.',
    location: 'Hilton Yaounde',
    category: 'Galas',
    price: 50000,
    currency: 'FCFA',
  },
] as const;

// ============================================================
// EVENTS : cartes pour le feed "Evenements a proximite"
// ============================================================

export const MOCK_EVENTS: readonly MockEvent[] = [
  {
    id: '1',
    title: 'Soiree Afrobeats Yaounde',
    image: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800',
    date: '12 Juil.',
    location: 'Palais des Sports, Yaounde',
    time: '20h00',
    organizerName: 'Pro Events CMR',
    organizerAvatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100',
    price: 5000,
    currency: 'FCFA',
    category: 'concerts',
    isFeatured: true,
  },
  {
    id: '2',
    title: 'Festival Culturel Nguon 2026',
    image: 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=800',
    date: '25 Juil.',
    location: 'Centre Culturel, Douala',
    time: '18h30',
    organizerName: 'Ministere de la Culture',
    organizerAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100',
    price: 2000,
    currency: 'FCFA',
    category: 'festivals',
    isFeatured: false,
  },
  {
    id: '3',
    title: 'Conference Tech Douala',
    image: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800',
    date: '03 Aout',
    location: 'Hotel Pullman, Douala',
    time: '09h00',
    organizerName: 'Cameroon Tech Hub',
    organizerAvatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=100',
    price: 15000,
    currency: 'FCFA',
    category: 'conferences',
    isFeatured: false,
  },
  {
    id: '4',
    title: 'Match Football Classique',
    image: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800',
    date: '15 Aout',
    location: 'Stade Japoma, Douala',
    time: '16h00',
    organizerName: 'FECAfoot',
    organizerAvatar: null,
    price: 3000,
    currency: 'FCFA',
    category: 'sports',
    isFeatured: false,
  },
  {
    id: '5',
    title: 'Piece de Theatre "Le Choix"',
    image: 'https://images.unsplash.com/photo-1507924538820-ede94a04019d?w=800',
    date: '20 Aout',
    location: 'Maison de la Culture, Yaounde',
    time: '19h30',
    organizerName: 'Troupe Les Eclats',
    organizerAvatar: null,
    price: 3500,
    currency: 'FCFA',
    category: 'theatre',
    isFeatured: false,
  },
  {
    id: '6',
    title: 'Gala de Charite 2026',
    image: 'https://images.unsplash.com/photo-1519671482749-fd09be7ccebf?w=800',
    date: '02 Sept.',
    location: 'Hilton Yaounde',
    time: '20h00',
    organizerName: 'Fondation Hope',
    organizerAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100',
    price: 50000,
    currency: 'FCFA',
    category: 'galas',
    isFeatured: true,
  },
] as const;

// ============================================================
// EVENT DETAILS : evenements complets pour la page detail
// ============================================================

/**
 * Tiers de billets pour l'evenement "Soiree Afrobeats Yaounde" (id: '1').
 * 3 tiers : Standard, VIP, PREMIUM.
 */
const tiersEvent1: readonly MockTicketTier[] = [
  {
    id: 'tier-1-std',
    event_id: '1',
    name: 'Standard',
    price: 5000,
    quantity_total: 500,
    quantity_sold: 320,
    description: 'Acces general, place debout',
    benefits: ['Acces zone debout', '1 boisson offerte'],
    available_quantity: 180,
    is_sold_out: false,
    is_low_stock: false,
  },
  {
    id: 'tier-1-vip',
    event_id: '1',
    name: 'VIP',
    price: 15000,
    quantity_total: 100,
    quantity_sold: 87,
    description: 'Acces VIP, place assise, cocktail',
    benefits: ['Acces zone VIP assise', 'Cocktail welcome', 'Parking VIP'],
    available_quantity: 13,
    is_sold_out: false,
    is_low_stock: true,
  },
  {
    id: 'tier-1-prem',
    event_id: '1',
    name: 'PREMIUM',
    price: 50000,
    quantity_total: 20,
    quantity_sold: 18,
    description: 'Table reservee, champagne, meet & greet',
    benefits: ['Table reservee front-row', 'Champagne illimite', 'Meet & greet artistes', 'Parking VIP couvert'],
    available_quantity: 2,
    is_sold_out: false,
    is_low_stock: true,
  },
] as const;

/**
 * Tiers de billets pour le "Gala de Charite 2026" (id: '6').
 * 2 tiers : Standard, Premium.
 */
const tiersEvent6: readonly MockTicketTier[] = [
  {
    id: 'tier-6-std',
    event_id: '6',
    name: 'Standard',
    price: 50000,
    quantity_total: 200,
    quantity_sold: 150,
    description: 'Diner gala, place assise standard',
    benefits: ['Diner 3 services', 'Acces soiree', 'Place assise'],
    available_quantity: 50,
    is_sold_out: false,
    is_low_stock: false,
  },
  {
    id: 'tier-6-prem',
    event_id: '6',
    name: 'Premium',
    price: 100000,
    quantity_total: 50,
    quantity_sold: 45,
    description: 'Diner premium, table front-row, champagne',
    benefits: ['Diner premium 5 services', 'Champagne', 'Table front-row', 'Photo officielle'],
    available_quantity: 5,
    is_sold_out: false,
    is_low_stock: true,
  },
] as const;

/**
 * Evenements complets pour la page detail.
 * 2 evenements detailles : la soiree Afrobeats et le Gala de Charite.
 * Les autres evenements peuvent etre simules avec un mapping depuis MOCK_EVENTS.
 */
export const MOCK_EVENT_DETAILS: readonly MockEventDetail[] = [
  {
    id: '1',
    title: 'Soiree Afrobeats Yaounde',
    description: 'La plus grande soiree Afrobeats de Yaounde ! Au Palais des Sports, venez vibrer sur les rythmes des meilleurs artistes africains. DJ sets, performances live et ambiance explosive pour une nuit inoubliable. Boissons et snacks disponibles sur site. Vestiaire securise.',
    category: 'concerts',
    event_type: 'soiree',
    cover_image: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800',
    images: [
      'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800',
      'https://images.unsplash.com/photo-1429962764457-bf5390c2c7f9?w=600',
      'https://images.unsplash.com/photo-1506157784157-b1f8f8424e71?w=600',
    ],
    start_date: '2026-08-12T20:00:00Z',
    end_date: '2026-08-13T04:00:00Z',
    address: 'Palais des Sports, Yaounde',
    city: 'Yaounde',
    status: 'published',
    is_featured: true,
    organizer: MOCK_ORGANIZERS[0],
    venue: MOCK_VENUE_SUMMARIES[0],
    ticket_tiers: tiersEvent1,
    total_available: 195,
    is_sold_out: false,
  },
  {
    id: '6',
    title: 'Gala de Charite 2026',
    description: 'Le Gala de Charite annuel de la Fondation Hope. Au Hilton Yaounde, une soiree prestigieuse pour soutenir les enfants defavorises du Cameroun. Diner gastronomique, performances artistiques, tombola et networking avec les leaders d\'opinion. Tenue elegante requise.',
    category: 'galas',
    event_type: 'gala',
    cover_image: 'https://images.unsplash.com/photo-1519671482749-fd09be7ccebf?w=800',
    images: [
      'https://images.unsplash.com/photo-1519671482749-fd09be7ccebf?w=800',
      'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=600',
    ],
    start_date: '2026-09-02T20:00:00Z',
    end_date: '2026-09-03T02:00:00Z',
    address: 'Hilton Yaounde',
    city: 'Yaounde',
    status: 'published',
    is_featured: true,
    organizer: MOCK_ORGANIZERS[5],
    venue: MOCK_VENUE_SUMMARIES[5],
    ticket_tiers: tiersEvent6,
    total_available: 55,
    is_sold_out: false,
  },
] as const;

/**
 * Helper : trouve un evenement detail par son id.
 * Retourne null si l'id n'existe pas dans MOCK_EVENT_DETAILS.
 * Pour les evenements sans detail complet, on peut construire
 * un MockEventDetail a partir de MOCK_EVENTS + MOCK_VENUES.
 */
export function getMockEventDetailById(id: string): MockEventDetail | null {
  const detail = MOCK_EVENT_DETAILS.find((e) => e.id === id);
  return detail ?? null;
}

/**
 * Helper : construit un MockEventDetail simplifie a partir de MOCK_EVENTS
 * pour les evenements qui n'ont pas de detail complet predefini.
 * Utilise des valeurs par defaut pour les champs manquants.
 */
export function buildMockEventDetailFromList(id: string): MockEventDetail | null {
  const event = MOCK_EVENTS.find((e) => e.id === id);
  if (!event) return null;

  // Mapping category -> index organisateur
  const organizerIndex = parseInt(event.id, 10) - 1;
  const organizer = MOCK_ORGANIZERS[organizerIndex] ?? null;

  // Mapping category -> index lieu
  const venueIndex = parseInt(event.id, 10) - 1;
  const venue = MOCK_VENUE_SUMMARIES[venueIndex] ?? null;

  // Tiers par defaut : Standard (50% du prix) + VIP (3x) + PREMIUM (10x)
  const defaultTiers: readonly MockTicketTier[] = [
    {
      id: `tier-${event.id}-std`,
      event_id: event.id,
      name: 'Standard',
      price: event.price,
      quantity_total: 200,
      quantity_sold: 80,
      description: 'Acces general',
      benefits: ['Acces zone debout'],
      available_quantity: 120,
      is_sold_out: false,
      is_low_stock: false,
    },
    {
      id: `tier-${event.id}-vip`,
      event_id: event.id,
      name: 'VIP',
      price: event.price * 3,
      quantity_total: 50,
      quantity_sold: 35,
      description: 'Acces VIP, place assise',
      benefits: ['Acces VIP assise', '1 boisson offerte'],
      available_quantity: 15,
      is_sold_out: false,
      is_low_stock: false,
    },
    {
      id: `tier-${event.id}-prem`,
      event_id: event.id,
      name: 'PREMIUM',
      price: event.price * 10,
      quantity_total: 10,
      quantity_sold: 8,
      description: 'Acces PREMIUM, table reservee',
      benefits: ['Table reservee', 'Service premium', 'Parking VIP'],
      available_quantity: 2,
      is_sold_out: false,
      is_low_stock: true,
    },
  ] as const;

  return {
    id: event.id,
    title: event.title,
    description: `Description detaillee pour l'evenement "${event.title}". Plus d'informations seront disponibles une fois le backend branche.`,
    category: event.category,
    event_type: event.category,
    cover_image: event.image,
    images: [event.image],
    start_date: `2026-08-${parseInt(event.id, 10) + 10}T20:00:00Z`,
    end_date: `2026-08-${parseInt(event.id, 10) + 11}T04:00:00Z`,
    address: event.location,
    city: event.location.includes('Yaounde') ? 'Yaounde' : 'Douala',
    status: 'published',
    is_featured: event.isFeatured,
    organizer,
    venue,
    ticket_tiers: defaultTiers,
    total_available: 137,
    is_sold_out: false,
  };
}

/**
 * Helper : recupere un evenement detail par id, avec fallback
 * sur buildMockEventDetailFromList pour les ids sans detail complet.
 */
export function getMockEventDetailWithFallback(id: string): MockEventDetail | null {
  return getMockEventDetailById(id) ?? buildMockEventDetailFromList(id);
}
