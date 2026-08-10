/**
 * Helper pour confirmer un paiement et ajouter les billets au store.
 *
 * Utilise par les pages de paiement operateur (MTN, Orange, Moov)
 * pour transformer les infos du flux d'achat en billets reels
 * dans le tickets-store.
 *
 * En production, cette logique fera un appel API a Supabase.
 * Pour l'instant, elle simule la creation de billets cote client.
 *
 * Conventions :
 * - Pas de type any, pas d'emojis
 * - Imports @/
 * - Commentaires en francais
 */

import { useTicketsStore } from '@/stores/tickets-store';
import { usePurchaseFlowStore } from '@/stores/purchase-flow-store';
import type { PurchasedTicket } from '@/stores/tickets-store';

// ============================================================
// Helper : confirmer le paiement et creer les billets
// ============================================================

/**
 * Confirme le paiement en cours et ajoute les billets au store.
 *
 * Doit etre appele apres la confirmation du paiement USSD.
 * Utilise les infos stockees dans le purchase-flow-store
 * pour creer les billets dans le tickets-store.
 *
 * @returns le nombre de billets crees
 */
export function confirmPaymentAndCreateTickets(): number {
  const flow = usePurchaseFlowStore.getState();
  const { addTicket } = useTicketsStore.getState();

  if (!flow.eventId || flow.selectedTiers.length === 0 || !flow.operator) {
    return 0;
  }

  const now = new Date().toISOString();
  let createdCount = 0;

  for (const tier of flow.selectedTiers) {
    if (tier.quantity <= 0) continue;

    const ticketId = `ticket-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    const ticket: PurchasedTicket = {
      id: ticketId,
      event_id: flow.eventId,
      tier_id: tier.tierId,
      quantity: tier.quantity,
      total_price: tier.quantity * tier.unitPrice,
      payment_method: flow.operator,
      payment_status: 'completed',
      is_scanned: false,
      expires_at: null,
      created_at: now,
      event: {
        id: flow.eventId,
        title: flow.eventTitle ?? 'Evenement',
        cover_image: flow.eventCoverImage,
        start_date: flow.eventStartDate,
        city: flow.eventCity,
      },
      tier: {
        id: tier.tierId,
        name: tier.tierName,
        price: tier.unitPrice,
      },
    };

    addTicket(ticket);
    createdCount++;
  }

  // Reinitialiser le flux d'achat
  usePurchaseFlowStore.getState().reset();

  return createdCount;
}
