/**
 * Hook infini pour lieux avec pagination realiste (Supabase .range + fallback mock).
 *
 * Strategie :
 * - Tente Supabase .range(offset, offset+limit-1) avec count exact.
 * - Si erreur ou 0 resultat, fallback vers venueService.fetchVenuesPaginated (slice mock).
 * - Pas de over-fetch : pageSize 20, on ne charge jamais tout MOCK_VENUES d'un coup.
 *
 * Usage dans venues/index.tsx :
 *   const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } = useVenues({ category: activeCategory, search: searchQuery });
 *   const venues = useMemo(() => data?.pages.flatMap(p => p.data) ?? [], [data]);
 *   // FlatList onEndReached={() => hasNextPage && fetchNextPage()}
 *
 * queryKey : ['venues', filters] -> cache separe par filtre.
 * getNextPageParam : offset suivant = cumul, undefined si fin ou derniere page incomplète.
 */

import { useInfiniteQuery } from '@tanstack/react-query';
import { venueService } from '@/services/venue.service';
import type { Venue } from '@/types';

const PAGE_SIZE = 20;

export type UseVenuesFilters = {
  readonly category?: string;
  readonly search?: string;
};

export type UseVenuesPage = {
  readonly data: Venue[];
  readonly count: number;
};

export function useVenues(filters: UseVenuesFilters = {}) {
  const normalized: UseVenuesFilters = {
    category: filters.category ?? 'all',
    search: filters.search?.trim() ?? '',
  };

  return useInfiniteQuery<UseVenuesPage, Error>({
    queryKey: ['venues', normalized] as const,
    initialPageParam: 0,
    queryFn: async ({ pageParam }) => {
      const offset = pageParam as number;
      return venueService.fetchVenuesPaginated({
        limit: PAGE_SIZE,
        offset,
        category: normalized.category,
        search: normalized.search,
      });
    },
    getNextPageParam: (lastPage, allPages) => {
      const fetched = allPages.reduce((sum, p) => sum + p.data.length, 0);
      if (fetched >= lastPage.count) return undefined;
      if (lastPage.data.length < PAGE_SIZE) return undefined;
      return fetched;
    },
  });
}

export const VENUES_PAGE_SIZE = PAGE_SIZE;
