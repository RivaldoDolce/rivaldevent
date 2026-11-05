/**
 * Génération des explications affichées pour chaque recommandation.
 *
 * Chaque explication est reliée à une composante réellement calculée du score :
 * la contribution affichée est le poids normalisé multiplié par le signal brut.
 * Aucun texte n'est ajouté s'il ne correspond pas à un facteur non nul.
 */

import type {
  DemoProfile,
  EventCategory,
  RecommendationEvent,
  RecommendationExplanation,
  ScoreComponents,
} from '@/types/recommendations';

import type { ContextSignals } from './contextual-ranking';
import { CITY_REGIONS } from './contextual-ranking';

const CATEGORY_LABELS: Readonly<Record<EventCategory, string>> = {
  music: 'Musique',
  festival: 'Festival',
  culture: 'Culture',
  arts: 'Arts',
  technology: 'Technologie',
  entrepreneurship: 'Entrepreneuriat',
  sport: 'Sport',
  education: 'Éducation',
  entertainment: 'Divertissement',
  conference: 'Conférence',
  theatre: 'Théâtre',
  gala: 'Gala',
};

const MONTHS = [
  'janvier',
  'février',
  'mars',
  'avril',
  'mai',
  'juin',
  'juillet',
  'août',
  'septembre',
  'octobre',
  'novembre',
  'décembre',
] as const;

export function formatXAF(value: number): string {
  return String(Math.round(value)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}

export function formatEventDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return 'date non confirmée';
  }
  return `${date.getDate()} ${MONTHS[date.getMonth()]} ${date.getFullYear()}`;
}

export function formatPriceRange(
  min: number | null,
  max: number | null,
): string {
  if (min === null || max === null) {
    return 'prix inconnu';
  }
  if (min === 0 && max === 0) {
    return 'entrée gratuite';
  }
  if (min === max) {
    return `${formatXAF(min)} XAF`;
  }
  return `${formatXAF(min)}–${formatXAF(max)} XAF`;
}

export function categoryLabel(category: EventCategory): string {
  return CATEGORY_LABELS[category];
}

export interface ExplanationSignals extends ContextSignals {
  readonly semantic: number;
}

export interface ExplanationInput {
  readonly profile: DemoProfile;
  readonly event: RecommendationEvent;
  readonly signals: ExplanationSignals;
  readonly contributions: ScoreComponents;
}

export function buildExplanations(
  input: ExplanationInput,
): RecommendationExplanation[] {
  const { profile, event, signals, contributions } = input;
  const explanations: RecommendationExplanation[] = [];

  if (contributions.semantic > 0) {
    explanations.push({
      key: 'semantic',
      title: 'Affinité sémantique',
      detail: `Affinité de ${Math.round(signals.semantic * 100)} % avec vos événements de référence.`,
      contribution: contributions.semantic,
      signal: signals.semantic,
    });
  }

  if (signals.category > 0) {
    explanations.push({
      key: 'category',
      title: 'Catégorie recherchée',
      detail: `« ${categoryLabel(event.category)} » fait partie de vos préférences.`,
      contribution: contributions.category,
      signal: signals.category,
    });
  }

  if (signals.location > 0) {
    const sameCity = event.city === profile.city;
    const profileRegion = CITY_REGIONS[profile.city];
    const detail = sameCity
      ? `Événement à ${event.city}, votre ville de référence.`
      : `Même région que ${profile.city}${profileRegion ? ` (${profileRegion})` : ''}.`;
    explanations.push({
      key: 'location',
      title: 'Proximité géographique',
      detail,
      contribution: contributions.location,
      signal: signals.location,
    });
  }

  if (signals.budget > 0) {
    explanations.push({
      key: 'budget',
      title: 'Compatible avec votre budget',
      detail: `${formatPriceRange(event.priceMin, event.priceMax)} pour un budget de ${formatPriceRange(
        profile.budgetMin,
        profile.budgetMax,
      )}.`,
      contribution: contributions.budget,
      signal: signals.budget,
    });
  }

  if (signals.temporal > 0) {
    explanations.push({
      key: 'temporal',
      title: 'Date à venir',
      detail: `Débute le ${formatEventDate(event.startAt)}.`,
      contribution: contributions.temporal,
      signal: signals.temporal,
    });
  }

  return explanations.sort((left, right) => right.contribution - left.contribution).slice(0, 3);
}
