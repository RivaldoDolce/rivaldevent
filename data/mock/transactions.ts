/**
 * Transactions mock pour le developpement.
 *
 * Simule les paiements Mobile Money et les transactions du dashboard vendeur.
 * 3 transactions avec differents statuts pour tester l'UI :
 * - completed : vente de billet reussie (MTN)
 * - pending : paiement en cours de confirmation (Orange)
 * - failed : paiement echoue (Moov)
 *
 * Aligne sur Transaction de types/database.ts (Row).
 * as const sur le tableau immuable.
 */

import type { MockTransaction } from './types';

export const MOCK_TRANSACTIONS: readonly MockTransaction[] = [
  // Transaction completee : vente de 2 billets VIP Afrobeats (MTN Mobile Money)
  {
    id: 'txn-1',
    user_id: 'user-client-1',
    type: 'ticket_sale',
    amount: 30000,
    currency: 'XAF',
    status: 'completed',
    provider: 'mtn',
    provider_ref: 'MTN-MOMO-REF-001-ABC123',
    idempotency_key: 'idem-ticket-1-mtn-20260726',
    metadata: {
      event_id: '1',
      tier_id: 'tier-1-vip',
      quantity: 2,
      phone: '+237655443322',
    },
    created_at: '2026-07-26T10:00:00Z',
    updated_at: '2026-07-26T10:05:00Z',
  },
  // Transaction en attente : paiement billet Standard via Orange Money
  {
    id: 'txn-2',
    user_id: 'user-client-1',
    type: 'ticket_sale',
    amount: 5000,
    currency: 'XAF',
    status: 'pending',
    provider: 'orange',
    provider_ref: null,
    idempotency_key: 'idem-ticket-2-orange-20260726',
    metadata: {
      event_id: '1',
      tier_id: 'tier-1-std',
      quantity: 1,
      phone: '+237655443322',
    },
    created_at: '2026-07-26T11:30:00Z',
    updated_at: '2026-07-26T11:30:00Z',
  },
  // Transaction echouee : paiement billet via Moov Money (numero invalide)
  {
    id: 'txn-3',
    user_id: 'user-client-1',
    type: 'ticket_sale',
    amount: 15000,
    currency: 'XAF',
    status: 'failed',
    provider: 'moov',
    provider_ref: 'MOOV-ERR-003-REF456',
    idempotency_key: 'idem-ticket-3-moov-20260725',
    metadata: {
      event_id: '3',
      tier_id: 'tier-3-vip',
      quantity: 1,
      phone: '+237600000000',
      error_reason: 'Numero Moov invalide',
    },
    created_at: '2026-07-25T14:00:00Z',
    updated_at: '2026-07-25T14:03:00Z',
  },
  // Transaction venue_promo : paiement promotion lieu (Premium)
  {
    id: 'txn-4',
    user_id: 'user-prestataire-1',
    type: 'venue_promo',
    amount: 15000,
    currency: 'XAF',
    status: 'completed',
    provider: 'mtn',
    provider_ref: 'MTN-PROMO-REF-004',
    idempotency_key: 'idem-promo-venue-3-mtn-20260601',
    metadata: {
      venue_id: '3',
      promotion_tier: 'premium',
      duration_days: 90,
    },
    created_at: '2026-06-01T09:00:00Z',
    updated_at: '2026-06-01T09:02:00Z',
  },
] as const;

/**
 * Helper : transactions d'un utilisateur.
 */
export function getMockTransactionsByUser(userId: string): readonly MockTransaction[] {
  return MOCK_TRANSACTIONS.filter((t) => t.user_id === userId);
}

/**
 * Helper : transactions par type (ticket_sale, venue_promo, withdrawal).
 */
export function getMockTransactionsByType(type: 'ticket_sale' | 'venue_promo' | 'withdrawal'): readonly MockTransaction[] {
  return MOCK_TRANSACTIONS.filter((t) => t.type === type);
}
