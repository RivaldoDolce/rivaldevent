/**
 * Qualité des gammes de billets — Rivald'event.
 *
 * Mapping centralisé nom de gamme → icône SVG officielle (assets/icons),
 * label et couleur d'accent, utilisé par les cartes de sélection de billets
 * et les récapitulatifs de commande.
 *
 * Gammes :
 * - Premium / VVIP : emblème doré (quality-premium)
 * - VIP : emblème terracotta (quality-VIP)
 * - Standard : emblème forêt (quality-standart)
 *
 * Conventions :
 * - Design tokens depuis lib/constants.ts
 * - Imports @/
 * - Pas de type any
 */

import type { ComponentType } from 'react';

import QualityPremiumIcon from '@/assets/icons/quality-premium.svg';
import QualityVipIcon from '@/assets/icons/quality-VIP.svg';
import QualityStandardIcon from '@/assets/icons/quality-standart.svg';

import { colors } from '@/lib/constants';

export interface TierQualityInfo {
  /** Icône SVG officielle de la gamme */
  readonly icon: ComponentType<{ width?: number; height?: number }>;
  /** Label court affiché dans les badges (PREMIUM, VIP, STANDARD) */
  readonly label: string;
  /** Couleur d'accent principale */
  readonly color: string;
  /** Dégradé d'accent (fonds de tuile) */
  readonly gradient: readonly [string, string];
}

export const TIER_QUALITIES: Record<
  'premium' | 'vip' | 'standard',
  TierQualityInfo
> = {
  premium: {
    icon: QualityPremiumIcon,
    label: 'PREMIUM',
    color: colors.goldBright,
    gradient: ['rgba(242,220,155,0.16)', 'rgba(216,180,90,0.05)'],
  },
  vip: {
    icon: QualityVipIcon,
    label: 'VIP',
    color: colors.terracotta,
    gradient: ['rgba(201,96,63,0.18)', 'rgba(201,96,63,0.04)'],
  },
  standard: {
    icon: QualityStandardIcon,
    label: 'STANDARD',
    color: colors.forest,
    gradient: ['rgba(76,154,110,0.18)', 'rgba(76,154,110,0.04)'],
  },
};

/**
 * Détermine la qualité d'un tier à partir de son nom.
 * Premium/VVIP → premium, VIP → vip, sinon → standard.
 */
export function getTierQualityInfo(name: string): TierQualityInfo {
  const lower = name.toLowerCase();
  if (lower.includes('vvip') || lower.includes('premium')) {
    return TIER_QUALITIES.premium;
  }
  if (lower.includes('vip')) {
    return TIER_QUALITIES.vip;
  }
  return TIER_QUALITIES.standard;
}