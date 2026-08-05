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

/**
 * Filtres avances SPECIFIQUES aux lieux.
 * Separes des filtres evenements car les lieux ont des criteres
 * differents (capacite, types d'evenements, tarif par jour, prestige).
 */
export interface VenueAdvancedFilters {
  readonly city: string;
  readonly capacityRange: string;
  readonly eventType: string;
  readonly pricePerDayRange: string;
  readonly prestige: string;
}

interface ExploreState {
  readonly activeCategory: string;
  readonly searchQuery: string;
  readonly viewMode: ViewMode;
  readonly shouldFocusSearch: boolean;
  readonly showFilters: boolean;
  readonly advancedFilters: AdvancedFilters;
  readonly venueFilters: VenueAdvancedFilters;

  setActiveCategory: (category: string) => void;
  setSearchQuery: (query: string) => void;
  setViewMode: (mode: ViewMode) => void;
  setShouldFocusSearch: (focus: boolean) => void;
  setShowFilters: (show: boolean) => void;
  setAdvancedFilters: (filters: AdvancedFilters) => void;
  setVenueFilters: (filters: VenueAdvancedFilters) => void;
  resetFilters: () => void;
}

// -- Valeurs par defaut des filtres --

const DEFAULT_ADVANCED_FILTERS: AdvancedFilters = {
  city: 'all',
  priceRange: 'all',
  date: 'all',
};

const DEFAULT_VENUE_FILTERS: VenueAdvancedFilters = {
  city: 'all',
  capacityRange: 'all',
  eventType: 'all',
  pricePerDayRange: 'all',
  prestige: 'all',
};

// -- Store --

export const useExploreStore = create<ExploreState>()((set) => ({
  activeCategory: 'all',
  searchQuery: '',
  viewMode: 'grid',
  shouldFocusSearch: false,
  showFilters: false,
  advancedFilters: DEFAULT_ADVANCED_FILTERS,
  venueFilters: DEFAULT_VENUE_FILTERS,

  setActiveCategory: (category) => set({ activeCategory: category }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  setViewMode: (mode) => set({ viewMode: mode }),
  setShouldFocusSearch: (focus) => set({ shouldFocusSearch: focus }),
  setShowFilters: (show) => set({ showFilters: show }),
  setAdvancedFilters: (filters) => set({ advancedFilters: filters }),
  setVenueFilters: (filters) => set({ venueFilters: filters }),
  resetFilters: () => set({
    activeCategory: 'all',
    searchQuery: '',
    showFilters: false,
    advancedFilters: DEFAULT_ADVANCED_FILTERS,
    venueFilters: DEFAULT_VENUE_FILTERS,
  }),
}));
