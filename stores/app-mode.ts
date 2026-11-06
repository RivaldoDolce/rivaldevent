/**
 * Store global du mode actif de l'application (acheteur / vendeur).
 *
 * Ce store est la source de verite IMMEDIATE pour le mode actif.
 * Il est initialise depuis profile.is_seller au chargement de la session.
 *
 * Pourquoi un store separé de useAuth ?
 * - useAuth gere la session/auth (Supabase)
 * - app-mode gere le mode UI (Zustand, synchrone)
 * - L'UI peut lire le mode sans attendre un fetch async
 *
 * Persistence : le mode est persiste en DB (profiles.is_seller).
 * Ce store est le cache memoire pour la reactivite.
 */

import { create } from 'zustand';

export type AppMode = 'buyer' | 'seller';

interface AppModeState {
  readonly mode: AppMode;
  readonly isTransitioning: boolean;
  setMode: (mode: AppMode) => void;
  setTransitioning: (value: boolean) => void;
  initializeFromProfile: (isSeller: boolean) => void;
}

export const useAppMode = create<AppModeState>((set) => ({
  mode: 'buyer',
  isTransitioning: false,

  setMode: (mode) => set({ mode }),

  setTransitioning: (value) => set({ isTransitioning: value }),

  initializeFromProfile: (isSeller) =>
    set({ mode: isSeller ? 'seller' : 'buyer' }),
}));