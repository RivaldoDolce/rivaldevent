/**
 * Store global pour l'ecran Explorer et Venues.
 *
 * Gere les filtres de categorie, la recherche textuelle,
 * le mode de vue (grille/liste) et les filtres avances (ville, prix, date).
 *
 * Permet a la page d'accueil de pre-definir une categorie avant
 * de naviguer vers Explorer (ex: cliquer sur "Concerts" sur l'accueil
 * applique le filtre concerts sur Explorer).
 *
 * Les filtres avances sont partages entre les pages Explorer et Venues.
 *
 * Zustand v5 avec curried create<T>()() pattern.
 */

import { create } from 'zustand';

// -- Types --

type ViewMode = 'grid' | 'list';

interface AdvancedFilters {
  readonly city: string;
  readonly priceRange: string;
  readonly date: string;
}

interface ExploreState {
  readonly activeCategory: string;
  readonly searchQuery: string;
  readonly viewMode: ViewMode;
  readonly shouldFocusSearch: boolean;
  readonly showFilters: boolean;
  readonly advancedFilters: AdvancedFilters;

  setActiveCategory: (category: string) => void;
  setSearchQuery: (query: string) => void;
  setViewMode: (mode: ViewMode) => void;
  setShouldFocusSearch: (focus: boolean) => void;
  setShowFilters: (show: boolean) => void;
  setAdvancedFilters: (filters: AdvancedFilters) => void;
  resetFilters: () => void;
}

// -- Store --

export const useExploreStore = create<ExploreState>()((set) => ({
  activeCategory: 'all',
  searchQuery: '',
  viewMode: 'grid',
  shouldFocusSearch: false,
  showFilters: false,
  advancedFilters: {
    city: 'all',
    priceRange: 'all',
    date: 'all',
  },

  setActiveCategory: (category) => set({ activeCategory: category }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  setViewMode: (mode) => set({ viewMode: mode }),
  setShouldFocusSearch: (focus) => set({ shouldFocusSearch: focus }),
  setShowFilters: (show) => set({ showFilters: show }),
  setAdvancedFilters: (filters) => set({ advancedFilters: filters }),
  resetFilters: () => set({
    activeCategory: 'all',
    searchQuery: '',
    showFilters: false,
    advancedFilters: {
      city: 'all',
      priceRange: 'all',
      date: 'all',
    },
  }),
}));
