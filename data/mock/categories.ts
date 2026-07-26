/**
 * Categories d'evenements mock.
 *
 * Utilisees dans le home feed (chips horizontaux scrollables).
 * Extrait de `app/(client)/home/index.tsx` pour separer les donnees
 * du composant.
 *
 * Aligne sur les categories reellement utilisees dans l'app Camerounaise.
 * as const pour garantir l'immutabilite.
 */

import type { MockCategory } from './types';

/**
 * 7 categories : Tous (filtre par defaut) + 6 categories metier.
 * Les id correspondent aux valeurs stockees dans le champ `category`
 * de la table `events` en Supabase.
 */
export const CATEGORIES: readonly MockCategory[] = [
  { id: 'all', label: 'Tous' },
  { id: 'concerts', label: 'Concerts' },
  { id: 'festivals', label: 'Festivals' },
  { id: 'conferences', label: 'Conferences' },
  { id: 'sports', label: 'Sports' },
  { id: 'theatre', label: 'Theatre' },
  { id: 'galas', label: 'Galas' },
] as const;
