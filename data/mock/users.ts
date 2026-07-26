/**
 * Profils utilisateurs mock pour le developpement.
 *
 * 4 profils representant les 3 types d'utilisateurs + 1 admin :
 * - Client : l'utilisateur par defaut qui achete des billets
 * - Particulier/vendeur : organise des evenements, scanne QR
 * - Prestataire : cree des fiches lieu, paie forfait promotion
 * - Admin : gestionnaire (reference uniquement, pas d'ecran admin)
 *
 * Aligne sur Profile de types/database.ts (Row).
 * as const sur le tableau immuable.
 */

import type { MockProfile } from './types';

export const MOCK_PROFILES: readonly MockProfile[] = [
  // Client : utilisateur par defaut (acheteur)
  {
    id: 'user-client-1',
    full_name: 'Emmanuel Ngassa',
    avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100',
    phone: '+237 6 55 44 33 22',
    role: 'client',
    is_seller: false,
    created_at: '2026-06-15T08:00:00Z',
    updated_at: '2026-07-20T10:30:00Z',
  },
  // Particulier/vendeur : organise des evenements
  {
    id: 'user-particulier-1',
    full_name: 'Pro Events CMR',
    avatar_url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100',
    phone: '+237 6 99 88 77 66',
    role: 'particulier',
    is_seller: true,
    created_at: '2026-05-01T09:00:00Z',
    updated_at: '2026-07-25T15:00:00Z',
  },
  // Prestataire : cree des fiches lieu
  {
    id: 'user-prestataire-1',
    full_name: 'Jean-Pierre Fotso',
    avatar_url: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=100',
    phone: '+237 6 77 66 55 44',
    role: 'prestataire',
    is_seller: true,
    created_at: '2026-04-10T07:00:00Z',
    updated_at: '2026-07-22T12:00:00Z',
  },
  // Admin : gestionnaire (reference uniquement)
  {
    id: 'user-admin-1',
    full_name: 'Admin Rivaldevent',
    avatar_url: null,
    phone: null,
    role: 'client',
    is_seller: false,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-07-01T00:00:00Z',
  },
] as const;

/**
 * Helper : trouve un profil par son id.
 */
export function getMockProfileById(id: string): MockProfile | null {
  const profile = MOCK_PROFILES.find((p) => p.id === id);
  return profile ?? null;
}

/**
 * Helper : profil du client par defaut (utilise dans useAuth mock).
 * Retourne le premier profil avec role 'client'.
 */
export function getMockClientProfile(): MockProfile {
  const client = MOCK_PROFILES.find((p) => p.role === 'client' && p.id === 'user-client-1');
  if (!client) throw new Error('Profil client mock non trouve');
  return client;
}

/**
 * Helper : profil du vendeur par defaut (utilise dans le switch vendeur).
 * Retourne le premier profil avec role 'particulier'.
 */
export function getMockSellerProfile(): MockProfile {
  const seller = MOCK_PROFILES.find((p) => p.role === 'particulier');
  if (!seller) throw new Error('Profil vendeur mock non trouve');
  return seller;
}
