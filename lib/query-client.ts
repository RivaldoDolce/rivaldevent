/**
 * QueryClient TanStack Query configuré pour offline-first.
 *
 * - Persistance AsyncStorage (cache survive aux redémarrages)
 * - staleTime 5min : évite les refetch trop fréquents
 * - gcTime 24h : garde les données en cache longtemps
 * - retry 3x avec backoff exponentiel
 * - networkMode 'offlineFirst' : sert le cache même hors ligne
 */

import { QueryClient } from '@tanstack/react-query';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { persistQueryClient } from '@tanstack/react-query-persist-client';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';

import { APP_CONFIG } from './constants';

// ============================================================
// QueryClient singleton
// ============================================================

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: APP_CONFIG.CACHE_DURATION_MS, // 24h en cache
      retry: 3,
      retryDelay: (attemptIndex: number): number =>
        Math.min(1000 * 2 ** attemptIndex, 30000), // 1s, 2s, 4s, 8s max
      networkMode: 'offlineFirst', // ⭐ CLÉ : sert le cache même offline
      refetchOnWindowFocus: false, // Pas pertinent sur mobile
      refetchOnReconnect: true, // Sync au retour online
    },
    mutations: {
      retry: 3,
      networkMode: 'offlineFirst',
    },
  },
});

// ============================================================
// Persistance du cache (AsyncStorage)
// ============================================================

const asyncStoragePersister = createAsyncStoragePersister({
  storage: AsyncStorage,
  key: `rivaldevent-query-cache-${APP_CONFIG.CACHE_VERSION}`,
  throttleTime: 1000, // Évite d'écrire trop souvent dans AsyncStorage
});

/**
 * Initialise la persistance du QueryClient.
 * À appeler dans app/_layout.tsx avant le premier render.
 */
export async function initQueryClientPersistence(): Promise<void> {
  await persistQueryClient({
    queryClient,
    persister: asyncStoragePersister,
    maxAge: 1000 * 60 * 60 * 24 * 7, // 7 jours max en cache
    buster: APP_CONFIG.CACHE_VERSION, // Invalide le cache si version change
  });
}

// ============================================================
// Keys centralisées (pour éviter les doublons)
// ============================================================

export const queryKeys = {
  events: ['events'] as const,
  eventDetail: (id: string) => ['events', id] as const,
  eventsByCategory: (category: string) => ['events', 'category', category] as const,
  eventsFeatured: ['events', 'featured'] as const,

  venues: ['venues'] as const,
  venueDetail: (id: string) => ['venues', id] as const,
  venuesFeatured: ['venues', 'featured'] as const,

  tickets: ['tickets'] as const,
  ticketDetail: (id: string) => ['tickets', id] as const,
  ticketsByBuyer: (buyerId: string) => ['tickets', 'buyer', buyerId] as const,

  profile: (userId: string) => ['profile', userId] as const,

  transactions: (userId: string) => ['transactions', userId] as const,
} as const;