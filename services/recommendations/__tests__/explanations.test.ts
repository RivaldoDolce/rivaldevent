import {
  buildExplanations,
  categoryLabel,
  formatEventDate,
  formatPriceRange,
  formatXAF,
} from '../explanations';
import { makeEvent, makeProfile } from './fixtures';

describe('explanations', () => {
  it('formate les prix sans ambiguïté', () => {
    expect(formatXAF(15000)).toBe('15 000');
    expect(formatPriceRange(0, 0)).toBe('entrée gratuite');
    expect(formatPriceRange(null, null)).toBe('prix inconnu');
    expect(formatPriceRange(5000, 5000)).toBe('5 000 XAF');
    expect(formatPriceRange(5000, 15000)).toBe('5 000–15 000 XAF');
  });

  it('formate les dates en français sans dépendre du fuseau', () => {
    const formatted = formatEventDate('2026-12-15T12:00:00');
    expect(formatted).toContain('décembre');
    expect(formatted).toContain('2026');
    expect(formatEventDate('pas-une-date')).toBe('date non confirmée');
  });

  it('traduit les catégories', () => {
    expect(categoryLabel('music')).toBe('Musique');
    expect(categoryLabel('technology')).toBe('Technologie');
  });

  it('ne montre que les facteurs réellement non nuls', () => {
    const explanations = buildExplanations({
      profile: makeProfile(),
      event: makeEvent('e1'),
      signals: { category: 1, location: 1, budget: 0, temporal: 0, semantic: 0.8 },
      contributions: {
        semantic: 0.48,
        category: 0.16,
        location: 0.1,
        budget: 0,
        temporal: 0,
        total: 0.74,
      },
    });
    expect(explanations.map((item) => item.key)).toEqual([
      'semantic',
      'category',
      'location',
    ]);
    expect(explanations[0].contribution).toBeCloseTo(0.48, 10);
    expect(explanations[0].signal).toBeCloseTo(0.8, 10);
  });

  it('n’invente pas de compatibilité budget quand le prix est inconnu', () => {
    const explanations = buildExplanations({
      profile: makeProfile(),
      event: makeEvent('e1', { priceMin: null, priceMax: null }),
      signals: { category: 0, location: 0, budget: 0, temporal: 0, semantic: 0 },
      contributions: {
        semantic: 0,
        category: 0,
        location: 0,
        budget: 0,
        temporal: 0,
        total: 0,
      },
    });
    expect(explanations).toEqual([]);
  });

  it('limite à trois explications triées par contribution', () => {
    const explanations = buildExplanations({
      profile: makeProfile(),
      event: makeEvent('e1'),
      signals: { category: 1, location: 1, budget: 1, temporal: 1, semantic: 1 },
      contributions: {
        semantic: 0.6,
        category: 0.16,
        location: 0.1,
        budget: 0.09,
        temporal: 0.05,
        total: 1,
      },
    });
    expect(explanations).toHaveLength(3);
    expect(explanations.map((item) => item.key)).toEqual([
      'semantic',
      'category',
      'location',
    ]);
  });
});
