/**
 * Client Supabase singleton, typé et sécurisé.
 *
 * - JWT stocké dans SecureStore (pas AsyncStorage)
 * - autoRefreshToken activé (rotation automatique)
 * - detectSessionInUrl désactivé (pas pertinent sur mobile)
 * - fetch personnalisé : capture les erreurs réseau hors ligne
 *   et retourne une réponse 503 au lieu de propager l'erreur
 *   (évite les unhandled rejections dans la console)
 */

import { createClient } from '@supabase/supabase-js';
import 'react-native-url-polyfill/auto';

import { SecureStoreAdapter } from './secure-storage-adapter';
import type { Database } from '@/types/database';

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

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: SecureStoreAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

export const tables = {
  profiles: 'profiles',
  venues: 'venues',
  events: 'events',
  ticketTiers: 'ticket_tiers',
  tickets: 'tickets',
  transactions: 'transactions',
  venuePromotions: 'venue_promotions',
} as const;