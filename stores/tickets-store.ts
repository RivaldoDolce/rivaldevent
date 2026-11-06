/**
 * Store des billets achetes - Zustand v5.
 *
 * Remplace les donnees mock de la page "Mes Billets".
 * Les billets sont ajoutes ici lorsqu'un paiement est confirme
 * via le tunnel d'achat (selection billets → paiement → confirmation).
 *
 * En production, ce store sera synchronise avec Supabase.
 * Pour l'instant, il sert de source de verite cote client.
 *
 * Conventions :
 * - Zustand v5 avec create
 * - Pas de type any, pas d'emojis
 * - Imports @/
 * - Commentaires en francais
 */

import { create } from 'zustand';

// ============================================================
// Types
// ============================================================

/** Resume d'un evenement pour un billet */
export interface TicketEventSummary {
  readonly id: string;
  readonly title: string;
  readonly cover_image: string | null;
  readonly start_date: string | null;
  readonly city: string | null;
}

/** Resume d'un tier pour un billet */
export interface TicketTierSummary {
  readonly id: string;
  readonly name: string;
  readonly price: number;
}

/** Billet achete par l'utilisateur */
export interface PurchasedTicket {
  readonly id: string;
  readonly event_id: string;
  readonly tier_id: string;
  readonly quantity: number;
  readonly total_price: number;
  readonly payment_method: 'mtn' | 'orange' | 'moov';
  readonly payment_status: 'completed' | 'pending';
  readonly is_scanned: boolean;
  readonly expires_at: string | null;
  readonly created_at: string;
  readonly event: TicketEventSummary;
  readonly tier: TicketTierSummary;
}

/** Etat du store */
interface TicketsState {
  /** Liste des billets achetes */
  readonly tickets: readonly PurchasedTicket[];
  /** Ajouter un billet apres confirmation de paiement */
  addTicket: (ticket: PurchasedTicket) => void;
  /** Marquer un billet comme scanne */
  markAsScanned: (ticketId: string) => void;
  /** Supprimer un billet (annulation) */
  removeTicket: (ticketId: string) => void;
  /** Reinitialiser le store */
  reset: () => void;
}

// ============================================================
// Store
// ============================================================

export const useTicketsStore = create<TicketsState>((set) => ({
  tickets: [],

  addTicket: (ticket) =>
    set((state) => ({
      tickets: [ticket, ...state.tickets],
    })),

  markAsScanned: (ticketId) =>
    set((state) => ({
      tickets: state.tickets.map((t) =>
        t.id === ticketId ? { ...t, is_scanned: true } : t
      ),
    })),

  removeTicket: (ticketId) =>
    set((state) => ({
      tickets: state.tickets.filter((t) => t.id !== ticketId),
    })),

  reset: () => set({ tickets: [] }),
}));
