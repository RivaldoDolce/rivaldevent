/**
 * Orchestrateur du recommandeur — indépendant de React et du réseau.
 *
 * Chaîne : validation des artefacts → profil vectoriel → similarité sémantique
 * → signaux contextuels → score → diversification MMR → explications.
 *
 * Aucun appel Supabase, Clerk, paiement ou service ML distant.
 */

import type {
  ArtifactDiagnostics,
  BenchmarkArtifact,
  DemoProfile,
  EmbeddingsArtifact,
  EventCategory,
  EventsArtifact,
  Interaction,
  ProfilesArtifact,
  RankingWeights,
  Recommendation,
  RecommendationEvent,
  RecommendationPreferences,
  RecommendationRequest,
  RecommendationResult,
  RuntimeConfig,
  ScoreComponents,
  TemporalScoringConfig,
} from '@/types/recommendations';

import {
  DEFAULT_TEMPORAL,
  DEFAULT_WEIGHTS,
  combineScores,
  contextSignals,
  isEventExpired,
  type ContextSignals,
} from './contextual-ranking';
import { buildExplanations } from './explanations';
import { mmrRerank } from './mmr-reranker';
import { buildProfileVector } from './profile-builder';
import { cosineSimilarity } from './similarity';

const DEFAULT_RUNTIME_CONFIG: RuntimeConfig = {
  weights: DEFAULT_WEIGHTS,
  mmr: { enabled: true, lambda: 0.7, poolSize: 30 },
  temporal: DEFAULT_TEMPORAL,
};

/**
 * Pénalité appliquée à la similarité sémantique d'un contenu proche d'un
 * événement explicitement rejeté. Heuristique fixe, documentée : elle réduit
 * l'affinité sans jamais inverser le profil positif ni créer une composante
 * de score supplémentaire.
 */
export const NEGATIVE_PENALTY = 0.5;

export interface EngineArtifacts {
  readonly events: EventsArtifact;
  readonly embeddings: EmbeddingsArtifact;
  readonly profiles: ProfilesArtifact;
  readonly benchmark?: BenchmarkArtifact;
}

interface ScoredCandidate {
  readonly event: RecommendationEvent;
  readonly vector: readonly number[];
  readonly semantic: number;
  readonly signals: ContextSignals;
  readonly components: ScoreComponents;
}

function assertSchema(payload: { schemaVersion: number }, label: string): void {
  if (payload.schemaVersion !== 1) {
    throw new Error(
      `Schéma ${label} non supporté : ${payload.schemaVersion} (attendu 1).`,
    );
  }
}

export function validateArtifacts(artifacts: EngineArtifacts): ArtifactDiagnostics {
  assertSchema(artifacts.events, 'events.v1.json');
  assertSchema(artifacts.embeddings, 'embeddings.v1.json');
  assertSchema(artifacts.profiles, 'profiles.v1.json');

  const versions = new Set([
    artifacts.events.datasetVersion,
    artifacts.embeddings.datasetVersion,
    artifacts.profiles.datasetVersion,
  ]);
  if (artifacts.benchmark) {
    assertSchema(artifacts.benchmark, 'benchmark.v1.json');
    versions.add(artifacts.benchmark.datasetVersion);
  }
  if (versions.size !== 1) {
    throw new Error(
      `Versions de dataset incohérentes : ${Array.from(versions).join(', ')}. ` +
        'Relancer l’export Python.',
    );
  }

  const { dimension } = artifacts.embeddings;
  if (!Number.isInteger(dimension) || dimension <= 0) {
    throw new Error('Dimension d’embedding invalide dans embeddings.v1.json.');
  }

  const eventIds = new Set<string>();
  const warnings: string[] = [];
  for (const event of artifacts.events.events) {
    if (eventIds.has(event.eventId)) {
      throw new Error(`Identifiant d’événement dupliqué : ${event.eventId}.`);
    }
    eventIds.add(event.eventId);
    const vector = artifacts.embeddings.vectors[event.eventId];
    if (!vector) {
      warnings.push(`Événement sans embedding : ${event.eventId}`);
      continue;
    }
    if (vector.length !== dimension) {
      throw new Error(
        `Vecteur ${event.eventId} de dimension ${vector.length}, attendu ${dimension}.`,
      );
    }
  }

  const profileIds = new Set<string>();
  for (const profile of artifacts.profiles.profiles) {
    if (profileIds.has(profile.profileId)) {
      throw new Error(`Profil dupliqué : ${profile.profileId}.`);
    }
    profileIds.add(profile.profileId);
    for (const seed of profile.seedEventIds) {
      if (!eventIds.has(seed)) {
        warnings.push(`Profil ${profile.profileId} : seed inconnu ${seed}.`);
      }
    }
  }

  return {
    eventCount: eventIds.size,
    profileCount: profileIds.size,
    dimension,
    datasetVersion: artifacts.events.datasetVersion,
    model: artifacts.embeddings.model,
    warnings,
  };
}

function resolveRuntimeConfig(benchmark?: BenchmarkArtifact): RuntimeConfig {
  if (!benchmark?.runtimeConfig) {
    return DEFAULT_RUNTIME_CONFIG;
  }
  const { weights, mmr, temporal } = benchmark.runtimeConfig;
  return {
    weights: weights ?? DEFAULT_WEIGHTS,
    mmr: {
      enabled: mmr?.enabled ?? true,
      lambda: mmr?.lambda ?? 0.7,
      poolSize: mmr?.poolSize ?? 30,
    },
    temporal: temporal ?? DEFAULT_TEMPORAL,
  };
}

function resolvePreferences(
  profile: DemoProfile,
  preferences: RecommendationPreferences | undefined,
): {
  city: string;
  budgetMin: number;
  budgetMax: number;
  preferredCategories: readonly EventCategory[];
} {
  const city = preferences?.city?.trim() || profile.city;
  const budgetMin = preferences?.budgetMin ?? profile.budgetMin;
  const budgetMax = preferences?.budgetMax ?? profile.budgetMax;
  const categories =
    preferences?.preferredCategories && preferences.preferredCategories.length > 0
      ? preferences.preferredCategories
      : profile.preferredCategories;

  if (!Number.isFinite(budgetMin) || !Number.isFinite(budgetMax) || budgetMin < 0) {
    throw new Error('Budget invalide : bornes négatives ou non numériques.');
  }
  if (budgetMin > budgetMax) {
    throw new Error('Budget invalide : minimum supérieur au maximum.');
  }

  return { city, budgetMin, budgetMax, preferredCategories: categories };
}

export class RecommendationEngine {
  private readonly events: readonly RecommendationEvent[];
  private readonly eventById: ReadonlyMap<string, RecommendationEvent>;
  private readonly profiles: readonly DemoProfile[];
  private readonly profileById: ReadonlyMap<string, DemoProfile>;
  private readonly embeddings: Readonly<Record<string, readonly number[]>>;
  private readonly dimension: number;
  private readonly runtime: RuntimeConfig;
  private readonly diagnostics: ArtifactDiagnostics;

  constructor(artifacts: EngineArtifacts) {
    this.diagnostics = validateArtifacts(artifacts);
    this.events = artifacts.events.events;
    this.eventById = new Map(this.events.map((event) => [event.eventId, event]));
    this.profiles = artifacts.profiles.profiles;
    this.profileById = new Map(
      this.profiles.map((profile) => [profile.profileId, profile]),
    );
    this.embeddings = artifacts.embeddings.vectors;
    this.dimension = artifacts.embeddings.dimension;
    this.runtime = resolveRuntimeConfig(artifacts.benchmark);
  }

  getDiagnostics(): ArtifactDiagnostics {
    return this.diagnostics;
  }

  getProfiles(): readonly DemoProfile[] {
    return this.profiles;
  }

  getEvents(): readonly RecommendationEvent[] {
    return this.events;
  }

  getEvent(eventId: string): RecommendationEvent | undefined {
    return this.eventById.get(eventId);
  }

  recommend(request: RecommendationRequest): RecommendationResult {
    const profile = this.profileById.get(request.profileId);
    if (!profile) {
      throw new Error(`Profil inconnu : ${request.profileId}.`);
    }

    const now = request.now ?? new Date();
    const k = Math.min(50, Math.max(1, Math.trunc(request.k ?? 10)));
    const interactions: readonly Interaction[] = request.interactions ?? [];
    const preferences = resolvePreferences(profile, request.preferences);
    const effectiveProfile: DemoProfile = {
      ...profile,
      city: preferences.city,
      budgetMin: preferences.budgetMin,
      budgetMax: preferences.budgetMax,
      preferredCategories: preferences.preferredCategories,
    };

    const profileVectorResult = buildProfileVector({
      seedEventIds: profile.seedEventIds,
      embeddings: this.embeddings,
      dimension: this.dimension,
      interactions,
    });

    const disliked = new Set(
      interactions
        .filter((interaction) => interaction.action === 'dislike')
        .map((interaction) => interaction.eventId),
    );

    // Exclude seed events from candidate pool to avoid circularity:
    // profile vector = mean of seed vectors → cos(profile, seed) ≈ 1
    const seedEventIds = new Set(profile.seedEventIds);

    const weights: RankingWeights = this.runtime.weights;
    const temporalConfig: TemporalScoringConfig = this.runtime.temporal;

    let excludedExpired = 0;
    let excludedDisliked = 0;
    let excludedSeeds = 0;
    let missingEmbeddings = 0;

    const scored: ScoredCandidate[] = [];
    for (const event of this.events) {
      if (!request.includeExpired && isEventExpired(event, now)) {
        excludedExpired += 1;
        continue;
      }
      if (disliked.has(event.eventId)) {
        excludedDisliked += 1;
        continue;
      }
      if (seedEventIds.has(event.eventId)) {
        excludedSeeds += 1;
        continue;
      }
      const vector = this.embeddings[event.eventId];
      if (!vector) {
        missingEmbeddings += 1;
        continue;
      }

      const semanticBase = profileVectorResult.vector
        ? cosineSimilarity(profileVectorResult.vector, vector)
        : 0;
      const negativeSimilarity =
        profileVectorResult.vector && profileVectorResult.negativeVector
          ? Math.max(0, cosineSimilarity(profileVectorResult.negativeVector, vector))
          : 0;
      const semantic = semanticBase - NEGATIVE_PENALTY * negativeSimilarity;
      const signals = contextSignals(effectiveProfile, event, now, temporalConfig);
      const components = combineScores(semantic, signals, weights);

      scored.push({ event, vector, semantic, signals, components });
    }

    scored.sort(
      (left, right) =>
        right.components.total - left.components.total ||
        left.event.eventId.localeCompare(right.event.eventId),
    );

    const mmrEnabled = request.mmr?.enabled ?? this.runtime.mmr.enabled;
    const lambda = request.mmr?.lambda ?? this.runtime.mmr.lambda;
    let ordered = scored;

    if (mmrEnabled && scored.length > k) {
      const reranked = mmrRerank(
        scored.map((candidate) => ({
          eventId: candidate.event.eventId,
          score: candidate.components.total,
          vector: candidate.vector,
        })),
        { k, lambda, poolSize: this.runtime.mmr.poolSize },
      );
      const byId = new Map(scored.map((candidate) => [candidate.event.eventId, candidate]));
      ordered = reranked
        .map((item) => byId.get(item.eventId))
        .filter((item): item is ScoredCandidate => item !== undefined);
    }

    const recommendations: Recommendation[] = ordered.slice(0, k).map((candidate, index) => ({
      event: candidate.event,
      rank: index + 1,
      score: candidate.components.total,
      components: candidate.components,
      explanations: buildExplanations({
        profile: effectiveProfile,
        event: candidate.event,
        signals: { ...candidate.signals, semantic: candidate.semantic },
        contributions: candidate.components,
      }),
    }));

    return {
      profileId: profile.profileId,
      recommendations,
      referenceDate: now.toISOString(),
      candidateCount: scored.length,
      excludedExpired,
      excludedDisliked,
      excludedSeeds,
      missingEmbeddings,
      profileVectorAvailable: profileVectorResult.vector !== null,
      mmrApplied: mmrEnabled,
      appliedPreferences: preferences,
    };
  }
}
