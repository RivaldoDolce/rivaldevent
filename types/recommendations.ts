/**
 * Contrats de données du recommandeur Rivald'event.
 *
 * Ces types décrivent exactement les artefacts JSON produits par
 * `ml/scripts/export_runtime_assets.py` :
 * - events.v1.json
 * - embeddings.v1.json
 * - profiles.v1.json
 * - benchmark.v1.json
 *
 * Toute évolution de schéma doit incrémenter `schemaVersion` et être
 * répercutée des deux côtés (Python et TypeScript).
 */

// ============================================================
// Événements
// ============================================================

export type EventCategory =
  | 'music'
  | 'festival'
  | 'culture'
  | 'arts'
  | 'technology'
  | 'entrepreneurship'
  | 'sport'
  | 'education'
  | 'entertainment'
  | 'conference'
  | 'theatre'
  | 'gala';

export type EventLanguage = 'fr' | 'en';

export type EventSourceType = 'official' | 'public_listing' | 'demo_fixture';

export interface RecommendationEvent {
  readonly eventId: string;
  readonly title: string;
  readonly description: string;
  readonly category: EventCategory;
  readonly city: string;
  readonly venue: string | null;
  /** `null` signifie prix inconnu — jamais « gratuit ». */
  readonly priceMin: number | null;
  readonly priceMax: number | null;
  readonly currency: string;
  readonly startAt: string;
  readonly endAt: string | null;
  readonly language: EventLanguage;
  readonly tags: readonly string[];
  readonly sourceType: EventSourceType;
  readonly sourceUrl: string | null;
  readonly verifiedAt: string | null;
  readonly isDemo: boolean;
}

export interface EventsArtifact {
  readonly schemaVersion: number;
  readonly datasetVersion: string;
  readonly generatedAt: string;
  readonly textTemplateVersion: number;
  readonly eventCount: number;
  readonly events: readonly RecommendationEvent[];
}

export interface EmbeddingsArtifact {
  readonly schemaVersion: number;
  readonly datasetVersion: string;
  readonly generatedAt: string;
  readonly model: string;
  readonly modelRevision: string;
  readonly dimension: number;
  readonly normalized: boolean;
  readonly textTemplateVersion: number;
  readonly vectors: Readonly<Record<string, readonly number[]>>;
}

// ============================================================
// Profils de démonstration
// ============================================================

export interface DemoProfile {
  readonly profileId: string;
  readonly displayName: string;
  readonly description: string;
  readonly city: string;
  readonly budgetMin: number;
  readonly budgetMax: number;
  readonly preferredCategories: readonly EventCategory[];
  readonly seedEventIds: readonly string[];
  readonly language: EventLanguage;
  readonly isDemo: true;
}

export interface ProfilesArtifact {
  readonly schemaVersion: number;
  readonly datasetVersion: string;
  readonly generatedAt: string;
  readonly profileCount: number;
  readonly profiles: readonly DemoProfile[];
}

/** Profil de démonstration enrichi de métadonnées de présentation (TS only). */
export interface DemoProfileView extends DemoProfile {
  readonly tagline: string;
  readonly accentColor: string;
}

// ============================================================
// Benchmark
// ============================================================

export type BenchmarkSplit = 'dev' | 'test';

export interface BenchmarkMetrics {
  readonly [metric: string]: number;
}

export interface BenchmarkResult {
  readonly method: string;
  readonly label: string;
  readonly split: BenchmarkSplit;
  readonly metrics: BenchmarkMetrics;
  readonly perProfile?: Readonly<Record<string, BenchmarkMetrics>>;
}

export interface RankingWeights {
  readonly semantic: number;
  readonly category: number;
  readonly location: number;
  readonly budget: number;
  readonly temporal: number;
}

export interface TemporalScoringConfig {
  readonly nearDays: number;
  readonly midDays: number;
  readonly nearScore: number;
  readonly midScore: number;
  readonly farScore: number;
}

export interface RuntimeConfig {
  readonly weights: RankingWeights;
  readonly mmr: {
    readonly enabled: boolean;
    readonly lambda: number;
    readonly poolSize: number;
  };
  readonly temporal: TemporalScoringConfig;
}

export interface BenchmarkArtifact {
  readonly schemaVersion: number;
  readonly datasetVersion: string;
  readonly evaluationVersion: string;
  readonly generatedAt: string;
  readonly model: {
    readonly id: string;
    readonly revision: string;
    readonly dimension: number;
    readonly normalized: boolean;
    readonly textTemplateVersion: number;
  };
  readonly protocol: {
    readonly referenceDate: string;
    readonly relevanceThreshold: number;
    readonly kValues: readonly number[];
    readonly diversityK: number;
    readonly splitStrategy: string;
    readonly aggregation: string;
    readonly expiredEventsExcluded: boolean;
    readonly annotationProtocol: string;
  };
  readonly sampleCounts: {
    readonly profiles: number;
    readonly devProfiles: number;
    readonly testProfiles: number;
    readonly events: number;
    readonly catalogEvents: number;
    readonly judgments: number;
    readonly judgedProfileEventPairs: number;
    readonly expiredEvents: number;
  };
  readonly tuning: {
    readonly objective: string;
    readonly gridSize: number;
    readonly selectedWeights: RankingWeights;
    readonly selectedWeightsNormalized: RankingWeights;
    readonly selectedMmrLambda: number;
  };
  readonly runtimeConfig: RuntimeConfig;
  readonly results: readonly BenchmarkResult[];
  readonly limitations: readonly string[];
}

// ============================================================
// Interactions et recommandations
// ============================================================

/**
 * Actions de démonstration locales. Aucune n'appelle un service distant et
 * aucune ne représente une réservation ou un achat réel.
 */
export type InteractionAction =
  | 'view'
  | 'share'
  | 'favorite'
  | 'reserve_intent'
  | 'purchase_simulated'
  | 'dislike';

export interface Interaction {
  readonly eventId: string;
  readonly action: InteractionAction;
  readonly at: string;
}

export interface ScoreComponents {
  readonly semantic: number;
  readonly category: number;
  readonly location: number;
  readonly budget: number;
  readonly temporal: number;
  readonly total: number;
}

export type ExplanationKey =
  | 'semantic'
  | 'category'
  | 'location'
  | 'budget'
  | 'temporal';

export interface RecommendationExplanation {
  readonly key: ExplanationKey;
  readonly title: string;
  readonly detail: string;
  /** Contribution réelle au score total (poids × signal). */
  readonly contribution: number;
  /** Signal brut : similarité cosinus (éventuellement pénalisée) ou règle contextuelle dans [0, 1]. */
  readonly signal: number;
}

export interface Recommendation {
  readonly event: RecommendationEvent;
  readonly rank: number;
  readonly score: number;
  readonly components: ScoreComponents;
  readonly explanations: readonly RecommendationExplanation[];
}

export interface RecommendationPreferences {
  readonly city?: string;
  readonly budgetMin?: number;
  readonly budgetMax?: number;
  readonly preferredCategories?: readonly EventCategory[];
}

export interface RecommendationRequest {
  readonly profileId: string;
  readonly k?: number;
  readonly now?: Date;
  readonly interactions?: readonly Interaction[];
  readonly preferences?: RecommendationPreferences;
  readonly includeExpired?: boolean;
  readonly mmr?: {
    readonly enabled: boolean;
    readonly lambda?: number;
  };
}

export interface RecommendationResult {
  readonly profileId: string;
  readonly recommendations: readonly Recommendation[];
  readonly referenceDate: string;
  readonly candidateCount: number;
  readonly excludedExpired: number;
  readonly excludedDisliked: number;
  readonly missingEmbeddings: number;
  readonly profileVectorAvailable: boolean;
  readonly mmrApplied: boolean;
  readonly appliedPreferences: {
    readonly city: string;
    readonly budgetMin: number;
    readonly budgetMax: number;
    readonly preferredCategories: readonly EventCategory[];
  };
}

export interface ArtifactDiagnostics {
  readonly eventCount: number;
  readonly profileCount: number;
  readonly dimension: number;
  readonly datasetVersion: string;
  readonly model: string;
  readonly warnings: readonly string[];
}
