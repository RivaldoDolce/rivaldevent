/**
 * Store global des favoris (evenements + lieux).
 *
 * Persiste les identifiants favoris en memoire (mock) :
 * - `eventIds` : evenements mis en favori (cartes, detail evenement, liste)
 * - `venueIds` : lieux mis en favori (details lieu)
 *
 * Quand Supabase sera branche (Jalon 6), ces fonctions seront
 * remplacees par les appels API sans changer les consommateurs.
 *
 * Zustand v5 avec curried create<T>()() pattern.
 */

import { create } from 'zustand';

// -- Seeds mock : quelques favoris pre-remplis pour la demo --

const SEED_EVENT_IDS: readonly string[] = ['2', '5'];

const SEED_VENUE_IDS: readonly string[] = ['1'];

// -- Store --

interface FavoritesState {
  readonly eventIds: readonly string[];
  readonly venueIds: readonly string[];

  toggleEvent: (id: string) => void;
  toggleVenue: (id: string) => void;
  isEventFavorited: (id: string) => boolean;
  isVenueFavorited: (id: string) => boolean;
  clearAll: () => void;
}

export const useFavoritesStore = create<FavoritesState>()((set, get) => ({
  eventIds: SEED_EVENT_IDS,
  venueIds: SEED_VENUE_IDS,

  toggleEvent: (id) =>
    set((state) => ({
      eventIds: state.eventIds.includes(id)
        ? state.eventIds.filter((item) => item !== id)
        : [...state.eventIds, id],
    })),

  toggleVenue: (id) =>
    set((state) => ({
      venueIds: state.venueIds.includes(id)
        ? state.venueIds.filter((item) => item !== id)
        : [...state.venueIds, id],
    })),

  isEventFavorited: (id) => get().eventIds.includes(id),
  isVenueFavorited: (id) => get().venueIds.includes(id),

  clearAll: () => set({ eventIds: [], venueIds: [] }),
}));