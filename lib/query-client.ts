import { QueryClient } from '@tanstack/react-query';

/**
 * QueryClient global configuré pour offline-first.
 * - staleTime 5min : évite les refetch trop fréquents
 * - gcTime 24h : garde les données en cache longtemps
 * - retry 3x avec backoff exponentiel
 * - networkMode 'offlineFirst' : sert le cache même hors ligne
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 60 * 24, // 24h en cache
      retry: 3,
      retryDelay: (attemptIndex: number): number =>
        Math.min(1000 * 2 ** attemptIndex, 30000),
      networkMode: 'offlineFirst',
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
    },
    mutations: {
      retry: 3,
      networkMode: 'offlineFirst',
    },
  },
});

// Cache version — incrémenter quand le schéma change pour invalider le cache
export const CACHE_VERSION = 'v1';
export const CACHE_KEY = `rivaldevent-query-cache-${CACHE_VERSION}`;