import {
  assertSameDimension,
  clamp01,
  cosineSimilarity,
  dot,
  l2Normalize,
  l2Norm,
} from '../similarity';

describe('similarity', () => {
  it('calcule un cosinus connu', () => {
    expect(cosineSimilarity([1, 0], [1, 0])).toBeCloseTo(1, 10);
    expect(cosineSimilarity([1, 0], [0, 1])).toBeCloseTo(0, 10);
    expect(cosineSimilarity([1, 1], [1, 0])).toBeCloseTo(Math.SQRT1_2, 10);
  });

  it('renvoie 0 pour un vecteur nul', () => {
    expect(cosineSimilarity([0, 0], [1, 0])).toBe(0);
  });

  it('rejette des dimensions incompatibles', () => {
    expect(() => cosineSimilarity([1, 0], [1, 0, 0])).toThrow('Dimensions incompatibles');
    expect(() => assertSameDimension([], [])).toThrow('Vecteur vide');
  });

  it('normalise en L2 et gère le vecteur nul', () => {
    expect(l2Norm([3, 4])).toBeCloseTo(5, 10);
    expect(l2Normalize([3, 4])).toEqual([0.6, 0.8]);
    expect(l2Normalize([0, 0])).toBeNull();
    expect(l2Normalize([Number.NaN, 0])).toBeNull();
  });

  it('calcule le produit scalaire avec vérification de dimension', () => {
    expect(dot([1, 2, 3], [4, 5, 6])).toBe(32);
    expect(() => dot([1], [1, 2])).toThrow('Dimensions incompatibles');
  });

  it('borne les valeurs dans [0, 1]', () => {
    expect(clamp01(-0.5)).toBe(0);
    expect(clamp01(1.5)).toBe(1);
    expect(clamp01(Number.NaN)).toBe(0);
  });
});
