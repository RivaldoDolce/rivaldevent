/**
 * Fixtures synthétiques pour les tests du moteur.
 *
 * Aucune dépendance aux artefacts générés : les tests restent hermétiques et
 * vérifient les contrats, pas les valeurs du benchmark courant.
 */

import type {
  BenchmarkArtifact,
  DemoProfile,
  EmbeddingsArtifact,
  EventsArtifact,
  ProfilesArtifact,
  RankingWeights,
  RecommendationEvent,
  TemporalScoringConfig,
} from '@/types/recommendations';

export const REFERENCE = new Date('2026-11-06T00:00:00+01:00');
export const DATASET_VERSION = 'dataset-test-0000000000';

export const TEST_WEIGHTS: RankingWeights = {
  semantic: 0.6,
  category: 0.16,
  location: 0.1,
  budget: 0.09,
  temporal: 0.05,
};

export const TEST_TEMPORAL: TemporalScoringConfig = {
  nearDays: 45,
  midDays: 120,
  nearScore: 1,
  midScore: 0.6,
  farScore: 0.3,
};

export function makeEvent(
  eventId: string,
  overrides: Partial<Omit<RecommendationEvent, 'eventId'>> = {},
): RecommendationEvent {
  return {
    eventId,
    title: `Événement ${eventId}`,
    description: 'Description de test.',
    category: 'music',
    city: 'Douala',
    venue: 'Salle de test',
    priceMin: 10000,
    priceMax: 15000,
    currency: 'XAF',
    startAt: '2026-12-15T19:00:00+01:00',
    endAt: '2026-12-15T22:00:00+01:00',
    language: 'fr',
    tags: ['test'],
    sourceType: 'demo_fixture',
    sourceUrl: null,
    verifiedAt: null,
    isDemo: true,
    ...overrides,
  };
}

export function makeProfile(overrides: Partial<DemoProfile> = {}): DemoProfile {
  return {
    profileId: 'profile_test',
    displayName: 'Profil de test',
    description: 'Persona de test.',
    city: 'Douala',
    budgetMin: 0,
    budgetMax: 20000,
    preferredCategories: ['music'],
    seedEventIds: ['e1'],
    language: 'fr',
    isDemo: true,
    ...overrides,
  };
}

export function makeEventsArtifact(
  events: readonly RecommendationEvent[],
): EventsArtifact {
  return {
    schemaVersion: 1,
    datasetVersion: DATASET_VERSION,
    generatedAt: '2026-11-05T10:00:00Z',
    textTemplateVersion: 1,
    eventCount: events.length,
    events,
  };
}

export function makeEmbeddingsArtifact(
  vectors: Readonly<Record<string, readonly number[]>>,
): EmbeddingsArtifact {
  const dimension = Object.values(vectors)[0]?.length ?? 0;
  return {
    schemaVersion: 1,
    datasetVersion: DATASET_VERSION,
    generatedAt: '2026-11-05T10:00:00Z',
    model: 'intfloat/multilingual-e5-small',
    modelRevision: 'abcdef1234567890',
    dimension,
    normalized: true,
    textTemplateVersion: 1,
    vectors,
  };
}

export function makeProfilesArtifact(
  profiles: readonly DemoProfile[],
): ProfilesArtifact {
  return {
    schemaVersion: 1,
    datasetVersion: DATASET_VERSION,
    generatedAt: '2026-11-05T10:00:00Z',
    profileCount: profiles.length,
    profiles,
  };
}

export function makeBenchmark(
  overrides: Partial<BenchmarkArtifact> = {},
): BenchmarkArtifact {
  return {
    schemaVersion: 1,
    datasetVersion: DATASET_VERSION,
    evaluationVersion: 'v1',
    generatedAt: '2026-11-05T10:00:00Z',
    model: {
      id: 'intfloat/multilingual-e5-small',
      revision: 'abcdef1234567890',
      dimension: 3,
      normalized: true,
      textTemplateVersion: 1,
    },
    protocol: {
      referenceDate: '2026-11-05T00:00:00+01:00',
      relevanceThreshold: 2,
      kValues: [5, 10],
      diversityK: 10,
      splitStrategy: 'documented-profile-holdout',
      aggregation: 'macro-average-per-profile',
      expiredEventsExcluded: true,
      annotationProtocol: 'single-annotator-guided-rubric',
    },
    sampleCounts: {
      profiles: 1,
      devProfiles: 1,
      testProfiles: 0,
      events: 3,
      catalogEvents: 3,
      judgments: 3,
      judgedProfileEventPairs: 3,
      expiredEvents: 1,
    },
    tuning: {
      objective: 'ndcg@10',
      gridSize: 1,
      selectedWeights: TEST_WEIGHTS,
      selectedWeightsNormalized: TEST_WEIGHTS,
      selectedMmrLambda: 0.7,
    },
    runtimeConfig: {
      weights: TEST_WEIGHTS,
      mmr: { enabled: true, lambda: 0.7, poolSize: 30 },
      temporal: TEST_TEMPORAL,
    },
    results: [
      {
        method: 'e5_context',
        label: 'E5 + context',
        split: 'test',
        metrics: { 'ndcg@10': 0.5 },
      },
    ],
    limitations: ['Fixture de test.'],
    ...overrides,
  };
}
