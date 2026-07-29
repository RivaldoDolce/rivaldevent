/**
 * Store global pour l'ecran Explorer.
 *
 * Gere les filtres de categorie, la recherche textuelle,
 * le mode de vue (grille/liste) et le focus de la barre de recherche.
 *
 * Permet a la page d'accueil de pre-definir une categorie avant
 * de naviguer vers Explorer (ex: cliquer sur "Concerts" sur l'accueil
 * applique le filtre concerts sur Explorer).
 *
 * Zustand v5 avec curried create<T>()() pattern.
 */

import { create } from 'zustand';

// -- Types --

type ViewMode = 'grid' | 'list';

interface ExploreState {
  readonly activeCategory: string;
  readonly searchQuery: string;
  readonly viewMode: ViewMode;
  readonly shouldFocusSearch: boolean;
  readonly showFilters: boolean;

  setActiveCategory: (category: string) => void;
  setSearchQuery: (query: string) => void;
  setViewMode: (mode: ViewMode) => void;
  setShouldFocusSearch: (focus: boolean) => void;
  setShowFilters: (show: boolean) => void;
  resetFilters: () => void;
}

// -- Store --

export const useExploreStore = create<ExploreState>()((set) => ({
  activeCategory: 'all',
  searchQuery: '',
  viewMode: 'grid',
  shouldFocusSearch: false,
  showFilters: false,

  setActiveCategory: (category) => set({ activeCategory: category }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  setViewMode: (mode) => set({ viewMode: mode }),
  setShouldFocusSearch: (focus) => set({ shouldFocusSearch: focus }),
  setShowFilters: (show) => set({ showFilters: show }),
  resetFilters: () => set({ activeCategory: 'all', searchQuery: '', showFilters: false }),
}));
