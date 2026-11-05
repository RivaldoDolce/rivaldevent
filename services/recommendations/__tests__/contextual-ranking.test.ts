import {
  CITY_REGIONS,
  budgetScore,
  categoryScore,
  combineScores,
  contextSignals,
  isEventExpired,
  locationScore,
  normalizeWeights,
  temporalScore,
} from '../contextual-ranking';
import { makeEvent, makeProfile, REFERENCE, TEST_WEIGHTS } from './fixtures';

describe('contextual-ranking', () => {
  it('score la catégorie par appartenance', () => {
    const profile = makeProfile({ preferredCategories: ['music', 'festival'] });
    expect(categoryScore(profile, makeEvent('e1', { category: 'music' }))).toBe(1);
    expect(categoryScore(profile, makeEvent('e2', { category: 'sport' }))).toBe(0);
  });

  it('accorde un bonus de région mais jamais une exclusion', () => {
    const profile = makeProfile({ city: 'Buea' });
    expect(locationScore(profile, makeEvent('e1', { city: 'Buea' }))).toBe(1);
    expect(locationScore(profile, makeEvent('e2', { city: 'Limbe' }))).toBe(0.4);
    expect(locationScore(profile, makeEvent('e3', { city: 'Garoua' }))).toBe(0);
    expect(CITY_REGIONS.Buea).toBe('south_west');
  });

  it('traite un prix inconnu comme inconnu, pas comme gratuit', () => {
    const profile = makeProfile({ budgetMin: 0 });
    expect(budgetScore(profile, makeEvent('e1', { priceMin: null, priceMax: null }))).toEqual({
      score: 0,
      known: false,
    });
  });

  it('ne considère gratuit que si le profil accepte 0', () => {
    const free = makeEvent('free', { priceMin: 0, priceMax: 0 });
    expect(budgetScore(makeProfile({ budgetMin: 0 }), free)).toEqual({ score: 1, known: true });
    expect(budgetScore(makeProfile({ budgetMin: 5000 }), free)).toEqual({
      score: 0,
      known: true,
    });
  });

  it('calcule un chevauchement partiel proportionnel', () => {
    const profile = makeProfile({ budgetMin: 5000, budgetMax: 15000 });
    const result = budgetScore(
      profile,
      makeEvent('e1', { priceMin: 10000, priceMax: 25000 }),
    );
    expect(result.known).toBe(true);
    expect(result.score).toBeCloseTo(5000 / 15000, 10);
  });

  it('score zéro hors budget', () => {
    const profile = makeProfile({ budgetMin: 5000, budgetMax: 10000 });
    expect(
      budgetScore(profile, makeEvent('e1', { priceMin: 50000, priceMax: 60000 })),
    ).toEqual({ score: 0, known: true });
  });

  it('applique les paliers temporels', () => {
    expect(temporalScore(makeEvent('e1', { startAt: '2026-11-20T10:00:00+01:00' }), REFERENCE)).toBe(1);
    expect(temporalScore(makeEvent('e1', { startAt: '2027-01-20T10:00:00+01:00' }), REFERENCE)).toBe(0.6);
    expect(temporalScore(makeEvent('e1', { startAt: '2027-09-20T10:00:00+01:00' }), REFERENCE)).toBe(0.3);
    expect(temporalScore(makeEvent('e1', { startAt: '2026-01-01T10:00:00+01:00' }), REFERENCE)).toBe(0);
  });

  it('gère une date invalide sans planter', () => {
    expect(temporalScore(makeEvent('e1', { startAt: 'pas-une-date' }), REFERENCE)).toBe(0);
    expect(
      isEventExpired(
        makeEvent('e1', { startAt: 'pas-une-date', endAt: null }),
        REFERENCE,
      ),
    ).toBe(true);
  });

  it('exclut un événement dont la fin est passée', () => {
    expect(
      isEventExpired(
        makeEvent('e1', {
          startAt: '2026-11-01T10:00:00+01:00',
          endAt: '2026-11-02T10:00:00+01:00',
        }),
        REFERENCE,
      ),
    ).toBe(true);
    expect(
      isEventExpired(
        makeEvent('e2', {
          startAt: '2026-11-01T10:00:00+01:00',
          endAt: '2026-11-10T10:00:00+01:00',
        }),
        REFERENCE,
      ),
    ).toBe(false);
  });

  it('renormalise les poids quand le sémantique est absent', () => {
    const normalized = normalizeWeights(TEST_WEIGHTS, false);
    expect(normalized.semantic).toBe(0);
    const sum =
      normalized.category + normalized.location + normalized.budget + normalized.temporal;
    expect(sum).toBeCloseTo(1, 10);
  });

  it('produit un score total égal à la somme des composantes', () => {
    const profile = makeProfile();
    const signals = contextSignals(profile, makeEvent('e1'), REFERENCE);
    const components = combineScores(0.8, signals, TEST_WEIGHTS);
    const sum =
      components.semantic +
      components.category +
      components.location +
      components.budget +
      components.temporal;
    expect(components.total).toBeCloseTo(sum, 10);
    expect(components.total).toBeGreaterThan(0);
  });

  it('rejette des poids tous nuls', () => {
    expect(() =>
      normalizeWeights(
        { semantic: 0, category: 0, location: 0, budget: 0, temporal: 0 },
        true,
      ),
    ).toThrow('somme des poids');
  });
});
