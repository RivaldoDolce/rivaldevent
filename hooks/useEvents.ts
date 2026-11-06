/**
 * Hook infini pour evenements avec pagination realiste (Supabase .range + fallback mock).
 *
 * Strategie :
 * - Tente Supabase .range(offset, offset+limit-1) avec count exact.
 * - Si erreur ou 0 resultat, fallback vers eventService.fetchEventsPaginated (slice mock).
 * - Pas de over-fetch : pageSize 20, on ne charge jamais 420 d'un coup.
 *
 * Usage dans explore/index.tsx :
 *   const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, refetch } = useEvents({ category: activeCategory, search: searchQuery });
 *   const events = useMemo(() => data?.pages.flatMap(p => p.data) ?? [], [data]);
 *   // FlatList onEndReached={() => hasNextPage && fetchNextPage()}
 *
 * Usage sans filtre :
 *   const { data } = useEvents();
 *
 * queryKey : ['events', filters] -> invalide auto si filtre change.
 * getNextPageParam : offset suivant = pages cumulees, undefined si fin.
 */

import { useInfiniteQuery } from '@tanstack/react-query';
import { eventService } from '@/services/event.service';
import type { EventListItem } from '@/types';

const PAGE_SIZE = 20;

export type UseEventsFilters = {
  readonly category?: string;
  readonly search?: string;
};

export type UseEventsPage = {
  readonly data: EventListItem[];
  readonly count: number;
};

export function useEvents(filters: UseEventsFilters = {}) {
  const normalized: UseEventsFilters = {
    category: filters.category ?? 'all',
    search: filters.search?.trim() ?? '',
  };

  return useInfiniteQuery<UseEventsPage, Error>({
    queryKey: ['events', normalized] as const,
    initialPageParam: 0,
    queryFn: async ({ pageParam }) => {
      const offset = pageParam as number;
      return eventService.fetchEventsPaginated({
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

export const EVENTS_PAGE_SIZE = PAGE_SIZE;
