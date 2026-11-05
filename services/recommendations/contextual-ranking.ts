/**
 * Signaux contextuels et combinaison du score final.
 *
 * S(u,e) = w_s·S_semantic + w_c·S_category + w_l·S_location
 *        + w_b·S_budget + w_t·S_temporal
 *
 * Les poids sont normalisés avant usage (somme = 1). Lorsque le profil n'a pas
 * de vecteur sémantique exploitable, les poids contextuels sont renormalisés
 * entre eux : aucune composante fantôme ne vient gonfler le score.
 */

import type {
  RankingWeights,
  RecommendationEvent,
  ScoreComponents,
  TemporalScoringConfig,
} from '@/types/recommendations';

import { clamp01 } from './similarity';

export interface RankingProfile {
  readonly city: string;
  readonly budgetMin: number;
  readonly budgetMax: number;
  readonly preferredCategories: readonly string[];
}

export interface ContextSignals {
  readonly category: number;
  readonly location: number;
  readonly budget: number;
  readonly temporal: number;
}

export interface BudgetResult {
  readonly score: number;
  readonly known: boolean;
}

/** Régions utilisées uniquement pour accorder un bonus partiel de proximité. */
export const CITY_REGIONS: Readonly<Record<string, string>> = {
  Douala: 'littoral',
  Yaounde: 'centre',
  Buea: 'south_west',
  Limbe: 'south_west',
  Bafoussam: 'west',
  Kribi: 'south',
  Garoua: 'north',
  Bamenda: 'north_west',
  Ngaoundere: 'adamaoua',
};

const MS_PER_DAY = 86_400_000;

export const DEFAULT_WEIGHTS: RankingWeights = {
  semantic: 0.6,
  category: 0.16,
  location: 0.1,
  budget: 0.09,
  temporal: 0.05,
};

export const DEFAULT_TEMPORAL: TemporalScoringConfig = {
  nearDays: 45,
  midDays: 120,
  nearScore: 1,
  midScore: 0.6,
  farScore: 0.3,
};

export function normalizeWeights(
  weights: RankingWeights,
  includeSemantic: boolean,
): RankingWeights {
  const semantic = includeSemantic ? weights.semantic : 0;
  const total =
    semantic + weights.category + weights.location + weights.budget + weights.temporal;

  if (total <= 0) {
    throw new Error('La somme des poids de ranking doit être strictement positive.');
  }

  return {
    semantic: semantic / total,
    category: weights.category / total,
    location: weights.location / total,
    budget: weights.budget / total,
    temporal: weights.temporal / total,
  };
}

export function categoryScore(
  profile: RankingProfile,
  event: RecommendationEvent,
): number {
  return profile.preferredCategories.includes(event.category) ? 1 : 0;
}

/** Même ville = 1, même région = 0.4, sinon 0 (jamais d'exclusion). */
export function locationScore(
  profile: RankingProfile,
  event: RecommendationEvent,
): number {
  if (event.city === profile.city) {
    return 1;
  }
  const profileRegion = CITY_REGIONS[profile.city];
  const eventRegion = CITY_REGIONS[event.city];
  if (profileRegion && profileRegion === eventRegion) {
    return 0.4;
  }
  return 0;
}

/**
 * Chevauchement explicite entre budget du profil et fourchette de prix.
 * Un prix inconnu (`null`) renvoie 0 et `known = false` : il n'est jamais
 * interprété comme gratuit.
 */
export function budgetScore(
  profile: RankingProfile,
  event: RecommendationEvent,
): BudgetResult {
  if (event.priceMin === null || event.priceMax === null) {
    return { score: 0, known: false };
  }

  const low = event.priceMin;
  const high = event.priceMax;

  if (low === 0 && high === 0) {
    return { score: profile.budgetMin === 0 ? 1 : 0, known: true };
  }

  if (high < profile.budgetMin || low > profile.budgetMax) {
    return { score: 0, known: true };
  }

  const overlap = Math.min(high, profile.budgetMax) - Math.max(low, profile.budgetMin);
  const span = Math.max(high - low, 1);
  return { score: clamp01(overlap / span), known: true };
}

/** Proximité temporelle ; un événement passé vaut 0 et doit être exclu en amont. */
export function temporalScore(
  event: RecommendationEvent,
  reference: Date,
  config: TemporalScoringConfig = DEFAULT_TEMPORAL,
): number {
  const start = Date.parse(event.startAt);
  if (!Number.isFinite(start)) {
    return 0;
  }
  const deltaDays = (start - reference.getTime()) / MS_PER_DAY;
  if (deltaDays < 0) {
    return 0;
  }
  if (deltaDays <= config.nearDays) {
    return config.nearScore;
  }
  if (deltaDays <= config.midDays) {
    return config.midScore;
  }
  return config.farScore;
}

export function contextSignals(
  profile: RankingProfile,
  event: RecommendationEvent,
  reference: Date,
  temporalConfig: TemporalScoringConfig = DEFAULT_TEMPORAL,
): ContextSignals {
  return {
    category: categoryScore(profile, event),
    location: locationScore(profile, event),
    budget: budgetScore(profile, event).score,
    temporal: temporalScore(event, reference, temporalConfig),
  };
}

export function combineScores(
  semantic: number | null,
  signals: ContextSignals,
  weights: RankingWeights,
): ScoreComponents {
  const normalized = normalizeWeights(weights, semantic !== null);
  const semanticValue = semantic ?? 0;

  const components = {
    semantic: normalized.semantic * semanticValue,
    category: normalized.category * signals.category,
    location: normalized.location * signals.location,
    budget: normalized.budget * signals.budget,
    temporal: normalized.temporal * signals.temporal,
  };

  return {
    ...components,
    total:
      components.semantic +
      components.category +
      components.location +
      components.budget +
      components.temporal,
  };
}

/**
 * Un événement est expiré quand sa fin (ou son début) est antérieure à la
 * date de référence. Une date invalide est traitée comme expirée : mieux vaut
 * masquer une offre douteuse que recommander une date impossible.
 */
export function isEventExpired(event: RecommendationEvent, reference: Date): boolean {
  const moment = event.endAt ?? event.startAt;
  const timestamp = Date.parse(moment);
  if (!Number.isFinite(timestamp)) {
    return true;
  }
  return timestamp < reference.getTime();
}
