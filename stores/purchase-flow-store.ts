/**
 * Store du flux d'achat en cours - Zustand v5.
 *
 * Stocke temporairement les informations de la reservation
 * en cours (evenement, tiers selectionnes, total, operateur)
 * pendant que l'utilisateur effectue le paiement Mobile Money.
 *
 * Quand le paiement est confirme, ces infos sont utilisees pour
 * creer le billet dans le tickets-store.
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

/** Info d'un tier selectionne */
export interface SelectedTierInfo {
  readonly tierId: string;
  readonly tierName: string;
  readonly quantity: number;
  readonly unitPrice: number;
}

/** Etat du flux d'achat */
interface PurchaseFlowState {
  /** Evenement en cours de reservation */
  readonly eventId: string | null;
  /** Titre de l'evenement */
  readonly eventTitle: string | null;
  /** Image cover de l'evenement */
  readonly eventCoverImage: string | null;
  /** Date de debut de l'evenement */
  readonly eventStartDate: string | null;
  /** Ville de l'evenement */
  readonly eventCity: string | null;
  /** Tiers selectionnes */
  readonly selectedTiers: readonly SelectedTierInfo[];
  /** Montant total */
  readonly totalAmount: number;
  /** Operateur choisi */
  readonly operator: 'mtn' | 'orange' | 'moov' | null;
  /** Numero de telephone */
  readonly phoneNumber: string | null;

  /** Definir les infos de la reservation */
  setReservation: (data: {
    eventId: string;
    eventTitle: string;
    eventCoverImage: string | null;
    eventStartDate: string | null;
    eventCity: string | null;
    selectedTiers: readonly SelectedTierInfo[];
    totalAmount: number;
    operator: 'mtn' | 'orange' | 'moov';
    phoneNumber: string;
  }) => void;
  /** Reinitialiser le flux */
  reset: () => void;
}

// ============================================================
// Store
// ============================================================

export const usePurchaseFlowStore = create<PurchaseFlowState>((set) => ({
  eventId: null,
  eventTitle: null,
  eventCoverImage: null,
  eventStartDate: null,
  eventCity: null,
  selectedTiers: [],
  totalAmount: 0,
  operator: null,
  phoneNumber: null,

  setReservation: (data) =>
    set({
      eventId: data.eventId,
      eventTitle: data.eventTitle,
      eventCoverImage: data.eventCoverImage,
      eventStartDate: data.eventStartDate,
      eventCity: data.eventCity,
      selectedTiers: data.selectedTiers,
      totalAmount: data.totalAmount,
      operator: data.operator,
      phoneNumber: data.phoneNumber,
    }),

  reset: () =>
    set({
      eventId: null,
      eventTitle: null,
      eventCoverImage: null,
      eventStartDate: null,
      eventCity: null,
      selectedTiers: [],
      totalAmount: 0,
      operator: null,
      phoneNumber: null,
    }),
}));
