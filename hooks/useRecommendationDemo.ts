/**
 * État local de la démonstration de recommandation.
 *
 * Aucune persistance, aucun appel réseau : profil choisi, préférences
 * modifiées et interactions simulées vivent en mémoire pendant la session.
 * Le rechargement de la page réinitialise tout, conformément à ADR-006.
 */

import { useCallback, useMemo, useState } from 'react';

import {
  BENCHMARK_ARTIFACT,
  EMBEDDINGS_ARTIFACT,
  EVENTS_ARTIFACT,
  PROFILES_ARTIFACT,
} from '@/data/recommendations/artifacts';
import { DEMO_PROFILES, findProfileView } from '@/data/recommendations/demo-profiles';
import { RecommendationEngine } from '@/services/recommendations/recommendation-engine';
import type {
  BenchmarkArtifact,
  DemoProfileView,
  EventCategory,
  Interaction,
  RecommendationResult,
} from '@/types/recommendations';

export interface BudgetPreset {
  readonly label: string;
  readonly min: number;
  readonly max: number;
}

export const BUDGET_PRESETS: readonly BudgetPreset[] = [
  { label: 'Gratuit – 5 000', min: 0, max: 5000 },
  { label: '5 000 – 25 000', min: 5000, max: 25000 },
  { label: '25 000 – 50 000', min: 25000, max: 50000 },
  { label: '50 000 – 150 000', min: 50000, max: 150000 },
];

const FALLBACK_PROFILE_ID = DEMO_PROFILES[0]?.profileId ?? 'music_fan_douala';

function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : 'Erreur inconnue.';
}

export interface UseRecommendationDemoResult {
  readonly profiles: readonly DemoProfileView[];
  readonly selectedProfile: DemoProfileView | undefined;
  readonly selectedProfileId: string;
  readonly selectProfile: (profileId: string) => void;
  readonly result: RecommendationResult | null;
  readonly error: string | null;
  readonly engineError: string | null;
  readonly cities: readonly string[];
  readonly cityOverride: string | null;
  readonly setCityOverride: (city: string | null) => void;
  readonly budgetOverride: { min: number; max: number } | null;
  readonly setBudgetPreset: (preset: BudgetPreset) => void;
  readonly preferredCategories: readonly EventCategory[];
  readonly toggleCategory: (category: EventCategory) => void;
  readonly favoriteIds: ReadonlySet<string>;
  readonly dislikedIds: ReadonlySet<string>;
  readonly toggleFavorite: (eventId: string) => void;
  readonly toggleDislike: (eventId: string) => void;
  readonly resetScenario: () => void;
  readonly benchmark: BenchmarkArtifact;
  readonly referenceDate: Date;
}

export function useRecommendationDemo(): UseRecommendationDemoResult {
  const [selectedProfileId, setSelectedProfileId] = useState(FALLBACK_PROFILE_ID);
  const [cityOverride, setCityOverrideState] = useState<string | null>(null);
  const [budgetOverride, setBudgetOverride] = useState<{ min: number; max: number } | null>(
    null,
  );
  const [categoriesOverride, setCategoriesOverride] = useState<EventCategory[] | null>(null);
  const [interactions, setInteractions] = useState<readonly Interaction[]>([]);
  // Date figée à l'ouverture de la démo : le classement reste stable pendant
  // la session, même si l'horloge change.
  const [referenceDate] = useState(() => new Date());

  const engineState = useMemo(() => {
    try {
      return {
        engine: new RecommendationEngine({
          events: EVENTS_ARTIFACT,
          embeddings: EMBEDDINGS_ARTIFACT,
          profiles: PROFILES_ARTIFACT,
          benchmark: BENCHMARK_ARTIFACT,
        }),
        error: null as string | null,
      };
    } catch (error) {
      return { engine: null, error: messageOf(error) };
    }
  }, []);

  const selectedProfile = findProfileView(selectedProfileId);

  const outcome = useMemo(() => {
    if (!engineState.engine) {
      return { result: null as RecommendationResult | null, error: engineState.error };
    }
    try {
      const result = engineState.engine.recommend({
        profileId: selectedProfileId,
        k: 10,
        now: referenceDate,
        interactions,
        preferences: {
          city: cityOverride ?? undefined,
          budgetMin: budgetOverride?.min,
          budgetMax: budgetOverride?.max,
          preferredCategories: categoriesOverride ?? undefined,
        },
      });
      return { result, error: null as string | null };
    } catch (error) {
      return { result: null, error: messageOf(error) };
    }
  }, [
    engineState,
    selectedProfileId,
    referenceDate,
    interactions,
    cityOverride,
    budgetOverride,
    categoriesOverride,
  ]);

  const cities = useMemo(() => {
    const engine = engineState.engine;
    if (!engine) {
      return [];
    }
    return Array.from(new Set(engine.getEvents().map((event) => event.city))).sort((left, right) =>
      left.localeCompare(right, 'fr'),
    );
  }, [engineState.engine]);

  const favoriteIds = useMemo(
    () =>
      new Set(
        interactions
          .filter((interaction) => interaction.action === 'favorite')
          .map((interaction) => interaction.eventId),
      ),
    [interactions],
  );

  const dislikedIds = useMemo(
    () =>
      new Set(
        interactions
          .filter((interaction) => interaction.action === 'dislike')
          .map((interaction) => interaction.eventId),
      ),
    [interactions],
  );

  const selectProfile = useCallback((profileId: string) => {
    setSelectedProfileId(profileId);
    setCityOverrideState(null);
    setBudgetOverride(null);
    setCategoriesOverride(null);
    setInteractions([]);
  }, []);

  const setCityOverride = useCallback((city: string | null) => {
    setCityOverrideState(city);
  }, []);

  const setBudgetPreset = useCallback((preset: BudgetPreset) => {
    setBudgetOverride((current) =>
      current && current.min === preset.min && current.max === preset.max
        ? null
        : { min: preset.min, max: preset.max },
    );
  }, []);

  const toggleCategory = useCallback(
    (category: EventCategory) => {
      setCategoriesOverride((current) => {
        const base = current ?? [...(selectedProfile?.preferredCategories ?? [])];
        if (base.includes(category)) {
          if (base.length === 1) {
            return base;
          }
          return base.filter((item) => item !== category);
        }
        return [...base, category];
      });
    },
    [selectedProfile],
  );

  const toggleFavorite = useCallback((eventId: string) => {
    setInteractions((current) => {
      const alreadyFavorite = current.some(
        (interaction) => interaction.eventId === eventId && interaction.action === 'favorite',
      );
      const withoutThisEvent = current.filter(
        (interaction) =>
          !(interaction.eventId === eventId && interaction.action !== 'view'),
      );
      if (alreadyFavorite) {
        return withoutThisEvent;
      }
      return [
        ...withoutThisEvent,
        { eventId, action: 'favorite', at: new Date().toISOString() },
      ];
    });
  }, []);

  const toggleDislike = useCallback((eventId: string) => {
    setInteractions((current) => {
      const alreadyDisliked = current.some(
        (interaction) => interaction.eventId === eventId && interaction.action === 'dislike',
      );
      const withoutThisEvent = current.filter(
        (interaction) =>
          !(interaction.eventId === eventId && interaction.action !== 'view'),
      );
      if (alreadyDisliked) {
        return withoutThisEvent;
      }
      return [
        ...withoutThisEvent,
        { eventId, action: 'dislike', at: new Date().toISOString() },
      ];
    });
  }, []);

  const resetScenario = useCallback(() => {
    setCityOverrideState(null);
    setBudgetOverride(null);
    setCategoriesOverride(null);
    setInteractions([]);
  }, []);

  const preferredCategories =
    categoriesOverride ??
    outcome.result?.appliedPreferences.preferredCategories ??
    selectedProfile?.preferredCategories ??
    [];

  return {
    profiles: DEMO_PROFILES,
    selectedProfile,
    selectedProfileId,
    selectProfile,
    result: outcome.result,
    error: outcome.error,
    engineError: engineState.error,
    cities,
    cityOverride,
    setCityOverride,
    budgetOverride,
    setBudgetPreset,
    preferredCategories,
    toggleCategory,
    favoriteIds,
    dislikedIds,
    toggleFavorite,
    toggleDislike,
    resetScenario,
    benchmark: BENCHMARK_ARTIFACT,
    referenceDate,
  };
}
