/**
 * Construction du vecteur de profil à partir des événements de référence
 * et des interactions locales de démonstration.
 *
 * Règles (heuristiques configurables, non apprises) :
 * - une action répétée n'est comptée qu'une fois par événement ;
 * - les signaux positifs et négatifs sont accumulés séparément ;
 * - le poids positif cumulé par événement est plafonné ;
 * - une impression (`view`) reste un signal faible, jamais négatif ;
 * - les négatifs ne alimentent jamais le prototype positif : ils forment un
 *   prototype distinct que le moteur utilise comme pénalité de similarité ;
 * - les prototypes sont normalisés L2 ;
 * - sans preuve positive exploitable, `vector` vaut `null` et le moteur
 *   bascule sur un classement contextuel documenté.
 */

import type { Interaction, InteractionAction } from '@/types/recommendations';

import { l2Normalize } from './similarity';

export const INTERACTION_WEIGHTS: Readonly<Record<InteractionAction, number>> = {
  view: 1,
  share: 2,
  favorite: 3,
  reserve_intent: 4,
  purchase_simulated: 5,
  dislike: -3,
};

export interface ProfileVectorInput {
  readonly seedEventIds: readonly string[];
  readonly embeddings: Readonly<Record<string, readonly number[]>>;
  readonly dimension: number;
  readonly interactions?: readonly Interaction[];
  readonly seedWeight?: number;
  readonly maxPositivePerEvent?: number;
  readonly maxNegativePerEvent?: number;
}

export interface ProfileVectorResult {
  /** Prototype positif (seeds + actions positives), normalisé L2. */
  readonly vector: number[] | null;
  /** Prototype négatif (désintérêts), normalisé L2. */
  readonly negativeVector: number[] | null;
  readonly usedEventIds: readonly string[];
  readonly positiveWeight: number;
  readonly negativeWeight: number;
  readonly hasFeedback: boolean;
  readonly missingSeedEventIds: readonly string[];
}

interface EventWeight {
  positive: number;
  negative: number;
  seenActions: Set<InteractionAction>;
}

function assertVectorDimension(
  vector: readonly number[],
  dimension: number,
  eventId: string,
): void {
  if (vector.length !== dimension) {
    throw new Error(
      `Embedding de ${eventId} de dimension ${vector.length}, attendu ${dimension}.`,
    );
  }
  for (const value of vector) {
    if (!Number.isFinite(value)) {
      throw new Error(`Embedding de ${eventId} contient une valeur non finie.`);
    }
  }
}

export function buildProfileVector(input: ProfileVectorInput): ProfileVectorResult {
  const {
    seedEventIds,
    embeddings,
    dimension,
    interactions = [],
    seedWeight = 1,
    maxPositivePerEvent = 5,
    maxNegativePerEvent = 3,
  } = input;

  if (dimension <= 0) {
    throw new Error('Dimension d’embedding invalide.');
  }

  const weights = new Map<string, EventWeight>();
  const missingSeedEventIds: string[] = [];

  for (const eventId of seedEventIds) {
    if (!embeddings[eventId]) {
      missingSeedEventIds.push(eventId);
      continue;
    }
    const current = weights.get(eventId) ?? {
      positive: 0,
      negative: 0,
      seenActions: new Set<InteractionAction>(),
    };
    current.positive += seedWeight;
    weights.set(eventId, current);
  }

  for (const interaction of interactions) {
    if (!embeddings[interaction.eventId]) {
      continue;
    }
    const current = weights.get(interaction.eventId) ?? {
      positive: 0,
      negative: 0,
      seenActions: new Set<InteractionAction>(),
    };
    if (current.seenActions.has(interaction.action)) {
      continue; // un clic répété ne compte pas plusieurs fois
    }
    current.seenActions.add(interaction.action);

    const weight = INTERACTION_WEIGHTS[interaction.action];
    if (weight >= 0) {
      current.positive += weight;
    } else {
      current.negative += weight;
    }
    weights.set(interaction.eventId, current);
  }

  if (weights.size === 0) {
    return {
      vector: null,
      negativeVector: null,
      usedEventIds: [],
      positiveWeight: 0,
      negativeWeight: 0,
      hasFeedback: interactions.length > 0,
      missingSeedEventIds,
    };
  }

  const positiveAggregate = new Array<number>(dimension).fill(0);
  const negativeAggregate = new Array<number>(dimension).fill(0);
  const used = new Set<string>();
  let positiveWeight = 0;
  let negativeMagnitude = 0;

  for (const [eventId, weight] of weights) {
    const vector = embeddings[eventId];
    if (!vector) {
      continue;
    }
    assertVectorDimension(vector, dimension, eventId);

    const positive = Math.min(weight.positive, maxPositivePerEvent);
    const negative = Math.min(-weight.negative, maxNegativePerEvent);

    if (positive > 0) {
      for (let index = 0; index < dimension; index += 1) {
        positiveAggregate[index] += positive * vector[index];
      }
      positiveWeight += positive;
      used.add(eventId);
    }

    if (negative > 0) {
      for (let index = 0; index < dimension; index += 1) {
        negativeAggregate[index] += negative * vector[index];
      }
      negativeMagnitude += negative;
      used.add(eventId);
    }
  }

  return {
    // Les négatifs ne créent jamais un profil : sans preuve positive, le
    // moteur doit basculer sur un classement contextuel explicite.
    vector: positiveWeight > 0 ? l2Normalize(positiveAggregate) : null,
    negativeVector: negativeMagnitude > 0 ? l2Normalize(negativeAggregate) : null,
    usedEventIds: Array.from(used),
    positiveWeight,
    negativeWeight: -negativeMagnitude,
    hasFeedback: interactions.length > 0,
    missingSeedEventIds,
  };
}
