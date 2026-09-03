import { createClient } from '@supabase/supabase-js';
import 'react-native-url-polyfill/auto';

import type { Database } from '@/types/database';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl) throw new Error('[supabase] EXPO_PUBLIC_SUPABASE_URL manquant (.env)');
if (!supabaseAnonKey) throw new Error('[supabase] EXPO_PUBLIC_SUPABASE_ANON_KEY manquant (.env)');

let clerkToken: string | null = null;

export function setSupabaseClerkToken(token: string | null) {
  clerkToken = token;
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
  },
  global: {
    fetch: async (input: RequestInfo | URL, init: RequestInit = {}) => {
      const headers = new Headers(init.headers);
      if (clerkToken) headers.set('Authorization', `Bearer ${clerkToken}`);
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
