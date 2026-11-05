/**
 * Diversification Maximal Marginal Relevance.
 *
 * MMR(e) = λ·Rel(e) − (1−λ)·max_{s∈Selected} Sim(e,s)
 *
 * `Rel` est normalisé min-max sur le pool pour que λ reste interprétable.
 * Le tri est déterministe : à valeur égale, l'`eventId` le plus petit passe
 * d'abord. Les scores d'origine sont conservés pour l'affichage.
 */

import { cosineSimilarity } from './similarity';

export interface MmrCandidate {
  readonly eventId: string;
  readonly score: number;
  readonly vector: readonly number[];
}

export interface MmrOptions {
  readonly k: number;
  readonly lambda: number;
  readonly poolSize?: number;
}

export function mmrRerank(
  candidates: readonly MmrCandidate[],
  options: MmrOptions,
): MmrCandidate[] {
  const { k, lambda, poolSize = 30 } = options;

  if (!Number.isFinite(lambda) || lambda < 0 || lambda > 1) {
    throw new Error('lambda doit appartenir à [0, 1].');
  }
  if (k <= 0) {
    throw new Error('k doit être strictement positif.');
  }

  const pool = candidates.slice(0, Math.max(k, poolSize));
  if (pool.length <= k) {
    // Même sans sélection à opérer, l'ordre reste déterministe : score
    // décroissant puis eventId croissant.
    return [...pool].sort(
      (left, right) =>
        right.score - left.score || left.eventId.localeCompare(right.eventId),
    );
  }

  const scores = pool.map((candidate) => candidate.score);
  const low = Math.min(...scores);
  const high = Math.max(...scores);
  const span = high - low;

  const relevance = new Map<string, number>();
  for (const candidate of pool) {
    relevance.set(candidate.eventId, span > 0 ? (candidate.score - low) / span : 1);
  }

  const selected: MmrCandidate[] = [];
  const remaining = [...pool];

  while (remaining.length > 0 && selected.length < k) {
    let best: MmrCandidate | null = null;
    let bestValue = Number.NEGATIVE_INFINITY;

    for (const candidate of remaining) {
      const maxSimilarity =
        selected.length === 0
          ? 0
          : Math.max(
              ...selected.map((chosen) =>
                cosineSimilarity(candidate.vector, chosen.vector),
              ),
            );

      const value =
        lambda * (relevance.get(candidate.eventId) ?? 0) -
        (1 - lambda) * maxSimilarity;

      if (
        value > bestValue ||
        (value === bestValue && best !== null && candidate.eventId < best.eventId)
      ) {
        bestValue = value;
        best = candidate;
      }
    }

    if (!best) {
      break;
    }
    selected.push(best);
    const index = remaining.findIndex((item) => item.eventId === best?.eventId);
    if (index >= 0) {
      remaining.splice(index, 1);
    }
  }

  return selected;
}
