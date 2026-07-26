/**
 * Billets mock pour le developpement.
 *
 * Simule les billets achetes par un client pour la page "Mes Billets"
 * et la page detail billet avec QR code.
 *
 * 2 groupes :
 * - MOCK_TICKETS : 4 billets achetes (1 complete, 1 pending, 1 expired, 1 scanned)
 *   pour tester les differents statuts dans l'UI
 * - Les tiers de billets sont definis dans events.ts (MOCK_EVENT_DETAILS)
 *
 * Les qr_code et qr_secret sont des valeurs mock. En production,
 * ils seront generes avec HMAC-SHA256.
 *
 * as const sur les tableaux immuables.
 */

import type { MockTicket, MockTicketEventSummary, MockTicketTierSummary } from './types';

// ============================================================
// Resume d'evenement pour les billets
// ============================================================

const MOCK_TICKET_EVENT_SUMMARIES: readonly MockTicketEventSummary[] = [
  {
    id: '1',
    title: 'Soiree Afrobeats Yaounde',
    cover_image: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800',
    start_date: '2026-08-12T20:00:00Z',
    city: 'Yaounde',
  },
  {
    id: '6',
    title: 'Gala de Charite 2026',
    cover_image: 'https://images.unsplash.com/photo-1519671482749-fd09be7ccebf?w=800',
    start_date: '2026-09-02T20:00:00Z',
    city: 'Yaounde',
  },
  {
    id: '2',
    title: 'Festival Culturel Nguon 2026',
    cover_image: 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=800',
    start_date: '2026-08-25T18:30:00Z',
    city: 'Douala',
  },
] as const;

// ============================================================
// Resume de tiers pour les billets
// ============================================================

const MOCK_TICKET_TIER_SUMMARIES: readonly MockTicketTierSummary[] = [
  { id: 'tier-1-vip', name: 'VIP', price: 15000 },
  { id: 'tier-1-std', name: 'Standard', price: 5000 },
  { id: 'tier-6-std', name: 'Standard', price: 50000 },
  { id: 'tier-6-prem', name: 'Premium', price: 100000 },
] as const;

// ============================================================
// TICKETS : 4 billets achetes avec differents statuts
// ============================================================

/**
 * Billets mock pour la page "Mes Billets".
 * 4 statuts different pour tester l'UI :
 * - completed : billet valide, QR disponible, pas encore scanne
 * - pending : paiement en cours, QR pas encore genere
 * - completed + is_scanned : billet deja utilise/scanne
 * - completed + expires_at passe : billet expire
 *
 * buyer_id = 'user-client-1' (le client mock par defaut)
 */
export const MOCK_TICKETS: readonly MockTicket[] = [
  // Billet VIP valide (non scanne, non expire)
  {
    id: 'ticket-1',
    event_id: '1',
    tier_id: 'tier-1-vip',
    buyer_id: 'user-client-1',
    quantity: 2,
    total_price: 30000,
    payment_method: 'mtn',
    payment_status: 'completed',
    qr_code: 'RVEVT-1-tier-1-vip-2-30000-MTN-abc123def456',
    qr_secret: 'mock_hmac_sha256_secret_ticket_1',
    is_scanned: false,
    scanned_at: null,
    expires_at: '2026-08-13T04:00:00Z',
    created_at: '2026-07-26T10:00:00Z',
    event: MOCK_TICKET_EVENT_SUMMARIES[0],
    tier: MOCK_TICKET_TIER_SUMMARIES[0],
  },
  // Billet Standard en attente (paiement pending)
  {
    id: 'ticket-2',
    event_id: '1',
    tier_id: 'tier-1-std',
    buyer_id: 'user-client-1',
    quantity: 1,
    total_price: 5000,
    payment_method: 'orange',
    payment_status: 'pending',
    qr_code: null,
    qr_secret: null,
    is_scanned: false,
    scanned_at: null,
    expires_at: '2026-08-13T04:00:00Z',
    created_at: '2026-07-26T11:30:00Z',
    event: MOCK_TICKET_EVENT_SUMMARIES[0],
    tier: MOCK_TICKET_TIER_SUMMARIES[1],
  },
  // Billet Standard deja scanne (utilise a l'entree)
  {
    id: 'ticket-3',
    event_id: '6',
    tier_id: 'tier-6-std',
    buyer_id: 'user-client-1',
    quantity: 1,
    total_price: 50000,
    payment_method: 'mtn',
    payment_status: 'completed',
    qr_code: 'RVEVT-6-tier-6-std-1-50000-MTN-scan789xyz012',
    qr_secret: 'mock_hmac_sha256_secret_ticket_3',
    is_scanned: true,
    scanned_at: '2026-09-02T20:15:00Z',
    expires_at: '2026-09-03T02:00:00Z',
    created_at: '2026-08-15T09:00:00Z',
    event: MOCK_TICKET_EVENT_SUMMARIES[1],
    tier: MOCK_TICKET_TIER_SUMMARIES[2],
  },
  // Billet Festival expire (date d'expiration passe)
  {
    id: 'ticket-4',
    event_id: '2',
    tier_id: 'tier-2-std',
    buyer_id: 'user-client-1',
    quantity: 1,
    total_price: 2000,
    payment_method: 'orange',
    payment_status: 'completed',
    qr_code: 'RVEVT-2-tier-2-std-1-2000-ORANGE-exp345abc678',
    qr_secret: 'mock_hmac_sha256_secret_ticket_4',
    is_scanned: false,
    scanned_at: null,
    expires_at: '2025-08-26T23:30:00Z', // Date passe => expire
    created_at: '2025-07-20T08:00:00Z',
    event: MOCK_TICKET_EVENT_SUMMARIES[2],
    tier: { id: 'tier-2-std', name: 'Standard', price: 2000 },
  },
] as const;

/**
 * Helper : trouve un billet par son id.
 */
export function getMockTicketById(id: string): MockTicket | null {
  const ticket = MOCK_TICKETS.find((t) => t.id === id);
  return ticket ?? null;
}

/**
 * Helper : billets d'un utilisateur (buyer_id).
 */
export function getMockTicketsByBuyer(buyerId: string): readonly MockTicket[] {
  return MOCK_TICKETS.filter((t) => t.buyer_id === buyerId);
}

/**
 * Helper : billets d'un evenement (pour le dashboard vendeur).
 */
export function getMockTicketsByEvent(eventId: string): readonly MockTicket[] {
  return MOCK_TICKETS.filter((t) => t.event_id === eventId);
}
