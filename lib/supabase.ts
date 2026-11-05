import { createClient } from '@supabase/supabase-js';
import 'react-native-url-polyfill/auto';

import type { Database } from '@/types/database';
import { SecureStoreAdapter } from '@/lib/secure-storage-adapter';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl) throw new Error('[supabase] EXPO_PUBLIC_SUPABASE_URL manquant (.env)');
if (!supabaseAnonKey) throw new Error('[supabase] EXPO_PUBLIC_SUPABASE_ANON_KEY manquant (.env)');

let clerkAppleToken: string | null = null;

export function setSupabaseClerkToken(token: string | null) {
  clerkAppleToken = token;
}

// Utiliser l'adaptateur qui supporte le web (AsyncStorage) et le natif (SecureStore)
const SecureStorage = {
  getItem: (key: string) => SecureStoreAdapter.getItem(key),
  setItem: (key: string, value: string) => SecureStoreAdapter.setItem(key, value),
  removeItem: (key: string) => SecureStoreAdapter.removeItem(key),
};

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: SecureStorage,
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
  },
  global: {
    fetch: async (input: RequestInfo | URL, init: RequestInit = {}) => {
      if (!clerkAppleToken) return fetch(input as Request, init);
      const headers = new Headers(init.headers);
      if (!headers.has('Authorization')) headers.set('Authorization', `Bearer ${clerkAppleToken}`);
      return fetch(input as Request, { ...init, headers });
    },
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
