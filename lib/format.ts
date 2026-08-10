/**
 * Helpers de formatage — FCFA, nombres, dates courtes.
 *
 * Sans Intl (Hermes) : formatage manuel stable entre iOS et Android.
 */

const MONTHS_SHORT_FR = [
  'janv.',
  'févr.',
  'mars',
  'avr.',
  'mai',
  'juin',
  'juil.',
  'août',
  'sept.',
  'oct.',
  'nov.',
  'déc.',
] as const;

/**
 * Insere des espaces tous les 3 chiffres : 30000 -> "30 000".
 */
export function formatNumber(value: number): string {
  return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}

/**
 * Montant en FCFA : 30000 -> "30 000 FCFA".
 */
export function formatFCFA(value: number): string {
  return `${formatNumber(value)} FCFA`;
}

/**
 * Date courte : '2026-08-12T20:00:00Z' -> "12 juil. 2026".
 * Retourne une chaine vide si la date est invalide.
 */
export function formatShortDate(iso: string | null | undefined): string {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return `${date.getDate()} ${MONTHS_SHORT_FR[date.getMonth()]} ${date.getFullYear()}`;
}