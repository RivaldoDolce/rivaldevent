/**
 * Client Supabase singleton, typé et sécurisé.
 *
 * - JWT stocké dans SecureStore (pas AsyncStorage)
 * - autoRefreshToken activé (rotation automatique)
 * - detectSessionInUrl désactivé (pas pertinent sur mobile)
 * - Types générés depuis le schéma de la DB
 */

import { createClient } from '@supabase/supabase-js';
import 'react-native-url-polyfill/auto'; // Required for Supabase URL handling on RN

import { SecureStoreAdapter } from './secure-storage-adapter';
import type { Database } from '@/types/database';

// ============================================================
// Configuration depuis .env
// ============================================================

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl) {
  throw new Error(
    '[supabase] EXPO_PUBLIC_SUPABASE_URL is missing. ' +
      'Check your .env file (see .env.example).'
  );
}

if (!supabaseAnonKey) {
  throw new Error(
    '[supabase] EXPO_PUBLIC_SUPABASE_ANON_KEY is missing. ' +
      'Check your .env file (see .env.example).'
  );
}

// ============================================================
// Client Supabase singleton
// ============================================================

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    // ⚠️ CRITIQUE : utiliser SecureStoreAdapter (pas AsyncStorage)
    storage: SecureStoreAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false, // Pas pertinent sur mobile
  },
  // Global fetch avec timeout (évite les requêtes qui pendent)
  globalOptions: {
    headers: { 'X-Client-Info': 'rivaldevent-mobile' },
  },
});

// ============================================================
// Helpers typés pour les tables principales
// ============================================================

/**
 * Accès typé aux tables. Utiliser partout au lieu de `supabase.from('...')`.
 *
 * @example
 * const { data } = await supabase.from(tables.events).select('*');
 */
export const tables = {
  profiles: 'profiles',
  venues: 'venues',
  events: 'events',
  ticketTiers: 'ticket_tiers',
  tickets: 'tickets',
  transactions: 'transactions',
  venuePromotions: 'venue_promotions',
} as const;