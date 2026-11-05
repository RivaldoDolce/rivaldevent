import type { Interaction } from '@/types/recommendations';

import { INTERACTION_WEIGHTS, buildProfileVector } from '../profile-builder';

const EMBEDDINGS: Readonly<Record<string, readonly number[]>> = {
  a: [1, 0, 0],
  b: [0, 1, 0],
};

function interaction(eventId: string, action: Interaction['action']): Interaction {
  return { eventId, action, at: '2026-11-05T10:00:00Z' };
}

describe('buildProfileVector', () => {
  it('agrège et normalise les événements de référence', () => {
    const result = buildProfileVector({
      seedEventIds: ['a', 'a'],
      embeddings: EMBEDDINGS,
      dimension: 3,
    });
    expect(result.vector).toEqual([1, 0, 0]);
    expect(result.missingSeedEventIds).toEqual([]);
    expect(result.hasFeedback).toBe(false);
  });

  it('ignore les seeds absents et les signale', () => {
    const result = buildProfileVector({
      seedEventIds: ['a', 'absent'],
      embeddings: EMBEDDINGS,
      dimension: 3,
    });
    expect(result.vector).toEqual([1, 0, 0]);
    expect(result.missingSeedEventIds).toEqual(['absent']);
  });

  it('ne compte pas deux fois la même action', () => {
    const result = buildProfileVector({
      seedEventIds: ['a'],
      embeddings: EMBEDDINGS,
      dimension: 3,
      interactions: [interaction('a', 'view'), interaction('a', 'view')],
    });
    // seed 1 + view 1 (une seule fois) = 2
    expect(result.positiveWeight).toBe(2);
    expect(result.vector).toEqual([1, 0, 0]);
  });

  it('cumule des actions distinctes et plafonne le poids positif', () => {
    const result = buildProfileVector({
      seedEventIds: ['a'],
      embeddings: EMBEDDINGS,
      dimension: 3,
      interactions: [
        interaction('a', 'view'),
        interaction('a', 'share'),
        interaction('a', 'favorite'),
        interaction('a', 'reserve_intent'),
        interaction('a', 'purchase_simulated'),
      ],
    });
    expect(result.positiveWeight).toBe(5);
    expect(result.vector).toEqual([1, 0, 0]);
  });

  it('applique un poids négatif séparé pour un désintérêt', () => {
    const result = buildProfileVector({
      seedEventIds: ['a'],
      embeddings: EMBEDDINGS,
      dimension: 3,
      interactions: [interaction('a', 'dislike')],
    });
    // Le prototype positif reste intact ; le négatif est distinct.
    expect(result.vector).toEqual([1, 0, 0]);
    expect(result.negativeVector).toEqual([1, 0, 0]);
    expect(result.negativeWeight).toBe(-3);
  });

  it('combine un événement positif et un événement négatif', () => {
    const result = buildProfileVector({
      seedEventIds: ['a'],
      embeddings: EMBEDDINGS,
      dimension: 3,
      interactions: [interaction('b', 'dislike')],
    });
    expect(result.vector).toEqual([1, 0, 0]);
    expect(result.negativeVector).toEqual([0, 1, 0]);
  });

  it('ne crée pas de profil positif à partir d’un désintérêt seul', () => {
    const result = buildProfileVector({
      seedEventIds: [],
      embeddings: EMBEDDINGS,
      dimension: 3,
      interactions: [interaction('b', 'dislike')],
    });
    expect(result.vector).toBeNull();
    expect(result.negativeVector).toEqual([0, 1, 0]);
    expect(result.negativeWeight).toBe(-3);
  });

  it('renvoie null sans aucun vecteur exploitable', () => {
    const result = buildProfileVector({
      seedEventIds: ['absent'],
      embeddings: EMBEDDINGS,
      dimension: 3,
    });
    expect(result.vector).toBeNull();
    expect(result.negativeVector).toBeNull();
    expect(result.usedEventIds).toEqual([]);
    expect(result.positiveWeight).toBe(0);
  });

  it('rejette une dimension incohérente', () => {
    expect(() =>
      buildProfileVector({
        seedEventIds: ['a'],
        embeddings: { a: [1, 0] },
        dimension: 3,
      }),
    ).toThrow('dimension 2, attendu 3');
  });

  it('expose les poids heuristiques documentés', () => {
    expect(INTERACTION_WEIGHTS.view).toBe(1);
    expect(INTERACTION_WEIGHTS.share).toBe(2);
    expect(INTERACTION_WEIGHTS.favorite).toBe(3);
    expect(INTERACTION_WEIGHTS.reserve_intent).toBe(4);
    expect(INTERACTION_WEIGHTS.purchase_simulated).toBe(5);
    expect(INTERACTION_WEIGHTS.dislike).toBe(-3);
  });
});
