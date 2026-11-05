import { RecommendationEngine } from '../recommendation-engine';
import {
  DATASET_VERSION,
  makeBenchmark,
  makeEmbeddingsArtifact,
  makeEvent,
  makeEventsArtifact,
  makeProfile,
  makeProfilesArtifact,
  REFERENCE,
} from './fixtures';

const EVENTS = [
  makeEvent('e1'),
  makeEvent('e2', { category: 'technology', priceMin: 0, priceMax: 5000 }),
  makeEvent('e3', {
    startAt: '2026-01-10T19:00:00+01:00',
    endAt: '2026-01-10T22:00:00+01:00',
  }),
  makeEvent('e4', {
    city: 'Yaounde',
    startAt: '2027-06-01T19:00:00+01:00',
    endAt: '2027-06-01T22:00:00+01:00',
  }),
];

const VECTORS = {
  e1: [1, 0, 0],
  e2: [0, 1, 0],
  e3: [1, 0, 0],
  e4: [0.8, 0.2, 0],
};

function makeEngine(overrides: {
  vectors?: Readonly<Record<string, readonly number[]>>;
  profileSeeds?: readonly string[];
  benchmarkDatasetVersion?: string;
} = {}) {
  return new RecommendationEngine({
    events: makeEventsArtifact(EVENTS),
    embeddings: makeEmbeddingsArtifact(overrides.vectors ?? VECTORS),
    profiles: makeProfilesArtifact([
      makeProfile(
        overrides.profileSeeds ? { seedEventIds: overrides.profileSeeds } : undefined,
      ),
    ]),
    benchmark: makeBenchmark(
      overrides.benchmarkDatasetVersion
        ? { datasetVersion: overrides.benchmarkDatasetVersion }
        : undefined,
    ),
  });
}

describe('RecommendationEngine', () => {
  it('valide les artefacts et expose des diagnostics', () => {
    const engine = makeEngine();
    const diagnostics = engine.getDiagnostics();
    expect(diagnostics.eventCount).toBe(4);
    expect(diagnostics.profileCount).toBe(1);
    expect(diagnostics.dimension).toBe(3);
    expect(diagnostics.datasetVersion).toBe(DATASET_VERSION);
    expect(diagnostics.warnings).toEqual([]);
  });

  it('exclut les événements expirés à la date de référence', () => {
    const engine = makeEngine();
    const result = engine.recommend({
      profileId: 'profile_test',
      now: REFERENCE,
      k: 10,
    });
    expect(result.excludedExpired).toBe(1);
    expect(result.candidateCount).toBe(3);
    expect(result.recommendations.map((item) => item.event.eventId)).not.toContain('e3');
    expect(result.referenceDate).toBe(REFERENCE.toISOString());
  });

  it('classe en tête l’événement le plus proche du profil', () => {
    const engine = makeEngine();
    const result = engine.recommend({
      profileId: 'profile_test',
      now: REFERENCE,
      k: 2,
    });
    expect(result.recommendations[0].event.eventId).toBe('e1');
    expect(result.recommendations).toHaveLength(2);
    expect(result.recommendations[0].score).toBeGreaterThan(
      result.recommendations[1].score,
    );
  });

  it('fournit des explications cohérentes avec les composantes du score', () => {
    const engine = makeEngine();
    const result = engine.recommend({
      profileId: 'profile_test',
      now: REFERENCE,
      k: 10,
    });
    for (const recommendation of result.recommendations) {
      for (const explanation of recommendation.explanations) {
        expect(explanation.contribution).toBeCloseTo(
          recommendation.components[explanation.key],
          10,
        );
      }
    }
    expect(result.recommendations[0].explanations[0].key).toBe('semantic');
  });

  it('exclut un événement désintéressé et re-classe', () => {
    const engine = makeEngine();
    const result = engine.recommend({
      profileId: 'profile_test',
      now: REFERENCE,
      k: 10,
      interactions: [
        { eventId: 'e1', action: 'dislike', at: '2026-11-05T10:00:00Z' },
      ],
    });
    expect(result.excludedDisliked).toBe(1);
    expect(result.recommendations[0].event.eventId).toBe('e4');
  });

  it('peut inclure les événements expirés sur demande explicite', () => {
    const engine = makeEngine();
    const result = engine.recommend({
      profileId: 'profile_test',
      now: REFERENCE,
      k: 10,
      includeExpired: true,
    });
    expect(result.excludedExpired).toBe(0);
    expect(result.recommendations.map((item) => item.event.eventId)).toContain('e3');
  });

  it('applique les préférences sans modifier le profil source', () => {
    const engine = makeEngine();
    const result = engine.recommend({
      profileId: 'profile_test',
      now: REFERENCE,
      preferences: {
        city: 'Yaounde',
        budgetMin: 10000,
        budgetMax: 20000,
        preferredCategories: ['technology'],
      },
    });
    expect(result.appliedPreferences.city).toBe('Yaounde');
    expect(result.appliedPreferences.preferredCategories).toEqual(['technology']);
    expect(
      Object.values(result.recommendations).some(
        (item) => item.event.city === 'Yaounde',
      ),
    ).toBe(true);
  });

  it('signale les événements sans embedding et les ignore', () => {
    const engine = makeEngine({
      vectors: { e1: [1, 0, 0], e3: [1, 0, 0], e4: [0.8, 0.2, 0] },
    });
    const diagnostics = engine.getDiagnostics();
    expect(diagnostics.warnings).toEqual(['Événement sans embedding : e2']);
    const result = engine.recommend({
      profileId: 'profile_test',
      now: REFERENCE,
      k: 10,
    });
    expect(result.missingEmbeddings).toBe(1);
    expect(result.candidateCount).toBe(2);
  });

  it('bascule en classement contextuel sans vecteur de profil', () => {
    const engine = makeEngine({ profileSeeds: ['absent'] });
    const result = engine.recommend({
      profileId: 'profile_test',
      now: REFERENCE,
      k: 3,
    });
    expect(result.profileVectorAvailable).toBe(false);
    expect(result.recommendations.length).toBeGreaterThan(0);
  });

  it('rejette un profil inconnu', () => {
    const engine = makeEngine();
    expect(() =>
      engine.recommend({ profileId: 'inconnu', now: REFERENCE }),
    ).toThrow('Profil inconnu');
  });

  it('rejette un budget incohérent', () => {
    const engine = makeEngine();
    expect(() =>
      engine.recommend({
        profileId: 'profile_test',
        now: REFERENCE,
        preferences: { budgetMin: 20000, budgetMax: 5000 },
      }),
    ).toThrow('Budget invalide');
  });

  it('rejette une dimension de vecteur incohérente', () => {
    expect(() => makeEngine({ vectors: { e1: [1, 0], e2: [1, 0, 0] } })).toThrow(
      'dimension 3, attendu 2',
    );
  });

  it('rejette un benchmark rattaché à une autre version', () => {
    expect(() =>
      makeEngine({ benchmarkDatasetVersion: 'dataset-autre' }),
    ).toThrow('Versions de dataset incohérentes');
  });

  it('désactive MMR sur demande et borne k', () => {
    const engine = makeEngine();
    const result = engine.recommend({
      profileId: 'profile_test',
      now: REFERENCE,
      k: 0,
      mmr: { enabled: false },
    });
    expect(result.mmrApplied).toBe(false);
    expect(result.recommendations).toHaveLength(1);
  });
});
