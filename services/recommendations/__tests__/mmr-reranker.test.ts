import { mmrRerank, type MmrCandidate } from '../mmr-reranker';

const VECTORS: Readonly<Record<string, readonly number[]>> = {
  a: [1, 0],
  b: [1, 0],
  c: [0, 1],
};

function candidate(eventId: string, score: number): MmrCandidate {
  return { eventId, score, vector: VECTORS[eventId] };
}

describe('mmrRerank', () => {
  it('préfère la diversité quand les pertinences sont proches', () => {
    const selected = mmrRerank(
      [candidate('a', 1), candidate('b', 0.9), candidate('c', 0.85)],
      { k: 2, lambda: 0.5 },
    );
    expect(selected.map((item) => item.eventId)).toEqual(['a', 'c']);
  });

  it('est déterministe et conserve les scores originaux', () => {
    const input = [candidate('a', 1), candidate('b', 0.8), candidate('c', 0.6)];
    const first = mmrRerank(input, { k: 3, lambda: 0.7 });
    const second = mmrRerank(input, { k: 3, lambda: 0.7 });
    expect(first).toEqual(second);
    expect(first.map((item) => item.score)).toEqual([1, 0.8, 0.6]);
  });

  it('départage les égalités par eventId croissant', () => {
    const input = [
      { eventId: 'z', score: 0.5, vector: [1, 0] },
      { eventId: 'a', score: 0.5, vector: [0, 1] },
    ];
    const selected = mmrRerank(input, { k: 2, lambda: 0.5 });
    expect(selected.map((item) => item.eventId)).toEqual(['a', 'z']);
  });

  it('renvoie le pool tel quel quand il est plus petit que k', () => {
    const input = [candidate('a', 1), candidate('b', 0.5)];
    expect(mmrRerank(input, { k: 5, lambda: 0.7 })).toEqual(input);
  });

  it('rejette lambda hors de [0, 1] et k non positif', () => {
    expect(() => mmrRerank([candidate('a', 1)], { k: 1, lambda: 1.1 })).toThrow('lambda');
    expect(() => mmrRerank([candidate('a', 1)], { k: 0, lambda: 0.5 })).toThrow('k doit');
  });

  it('applique le poolSize demandé', () => {
    const input = [
      candidate('a', 1),
      candidate('b', 0.9),
      candidate('c', 0.8),
    ];
    const selected = mmrRerank(input, { k: 1, lambda: 1, poolSize: 3 });
    expect(selected).toHaveLength(1);
    expect(selected[0].eventId).toBe('a');
  });
});
