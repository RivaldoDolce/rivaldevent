/**
 * Donnees mock de l'espace vendeur.
 *
 * Simule le portefeuille d'un organisateur (Pro Events CMR) :
 * - MOCK_SELLER_EVENTS : evenements organisés avec billetterie
 * - MOCK_SELLER_SALES : ventes recents (acheteurs, tiers, statuts)
 * - MOCK_SELLER_WALLET : solde disponible et retraits en attente
 *
 * Les unites sont degressives (FCFA).
 * as const sur les tableaux immuables.
 */

import type { MockSellerEvent, MockSellerSale } from './types';

export const MOCK_SELLER_EVENTS: readonly MockSellerEvent[] = [
  {
    id: '1',
    title: 'Soiree Afrobeats Yaounde',
    image: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800',
    start_date: '2026-08-12T20:00:00Z',
    city: 'Yaounde',
    venue: 'Palais des Sports',
    category: 'concerts',
    status: 'published',
    capacity: 800,
    tickets_sold: 342,
    revenue: 2740000,
  },
  {
    id: '6',
    title: 'Gala de Charite 2026',
    image: 'https://images.unsplash.com/photo-1519671482749-fd09be7ccebf?w=800',
    start_date: '2026-09-02T20:00:00Z',
    city: 'Yaounde',
    venue: 'Hilton Yaounde',
    category: 'galas',
    status: 'published',
    capacity: 300,
    tickets_sold: 96,
    revenue: 6200000,
  },
  {
    id: 'evt-draft-1',
    title: 'Concert Gospel Douala',
    image: 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=800',
    start_date: '2026-10-10T19:00:00Z',
    city: 'Douala',
    venue: 'Centre Culturel',
    category: 'concerts',
    status: 'draft',
    capacity: 500,
    tickets_sold: 0,
    revenue: 0,
  },
  {
    id: '3',
    title: 'Conference Tech CMR 2026',
    image: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800',
    start_date: '2026-07-03T09:00:00Z',
    city: 'Douala',
    venue: 'Hotel Pullman',
    category: 'conferences',
    status: 'completed',
    capacity: 250,
    tickets_sold: 250,
    revenue: 1250000,
  },
] as const;

export const MOCK_SELLER_SALES: readonly MockSellerSale[] = [
  {
    id: 'sale-1',
    event_id: '1',
    event_title: 'Soiree Afrobeats Yaounde',
    buyer_name: 'Aicha M.',
    tier_name: 'VIP',
    quantity: 2,
    total_price: 30000,
    status: 'completed',
    is_scanned: false,
    purchased_at: '2026-08-10T09:42:00Z',
  },
  {
    id: 'sale-2',
    event_id: '1',
    event_title: 'Soiree Afrobeats Yaounde',
    buyer_name: 'Samuel Tchoua',
    tier_name: 'Standard',
    quantity: 1,
    total_price: 5000,
    status: 'completed',
    is_scanned: true,
    purchased_at: '2026-08-09T18:15:00Z',
  },
  {
    id: 'sale-3',
    event_id: '6',
    event_title: 'Gala de Charite 2026',
    buyer_name: 'Clarisse Ngo',
    tier_name: 'Premium',
    quantity: 1,
    total_price: 100000,
    status: 'pending',
    is_scanned: false,
    purchased_at: '2026-08-10T11:03:00Z',
  },
  {
    id: 'sale-4',
    event_id: '6',
    event_title: 'Gala de Charite 2026',
    buyer_name: 'Yvan K.',
    tier_name: 'Standard',
    quantity: 4,
    total_price: 200000,
    status: 'completed',
    is_scanned: false,
    purchased_at: '2026-08-08T20:31:00Z',
  },
  {
    id: 'sale-5',
    event_id: '1',
    event_title: 'Soiree Afrobeats Yaounde',
    buyer_name: 'Mireille O.',
    tier_name: 'Standard',
    quantity: 3,
    total_price: 15000,
    status: 'failed',
    is_scanned: false,
    purchased_at: '2026-08-07T14:22:00Z',
  },
] as const;

export const MOCK_SELLER_WALLET = {
  available_balance: 8940000,
  pending_withdrawals: 150000,
} as const;