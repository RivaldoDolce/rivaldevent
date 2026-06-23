/**
 * Badge du design system.
 *
 * Regles UI/UX :
 * - radius 8px (petit, sauf avatars)
 * - 5 variants : pro, particulier, sponsored, premium, status
 * - Pas de centrage parfait (sauf cas du status)
 * - Taille compacte : padding 4px vertical, 8px horizontal
 *
 * Variants :
 * - pro         : bg gold/10, texte gold - badge Prestataire Pro
 * - particulier : bg terracotta/10, texte terracotta - vendeur particulier
 * - sponsored   : bg indigo, texte blanc - lieu sponsorise
 * - premium     : bg gold, texte onyx - forfait premium
 * - status      : dynamique selon la valeur (a_venir, en_cours, passe, annule)
 */

import React from 'react';
import { View, Text, type ViewStyle } from 'react-native';

import { colors, radius, spacing, typography } from '@/lib/constants';

// ============================================================
// Types
// ============================================================

type BadgeVariant = 'pro' | 'particulier' | 'sponsored' | 'premium' | 'status';
type StatusValue = 'a_venir' | 'en_cours' | 'passe' | 'annule' | 'en_attente';

// Variant "static" : exclut 'status' pour permettre la discrimination
type StaticVariant = Exclude<BadgeVariant, 'status'>;

interface StaticBadgeProps {
  readonly variant: StaticVariant;
  readonly children: React.ReactNode;
  readonly testID?: string;
}

interface StatusBadgeProps {
  readonly variant: 'status';
  readonly status: StatusValue;
  readonly children?: React.ReactNode;
  readonly testID?: string;
}

type BadgeProps = StaticBadgeProps | StatusBadgeProps;

// ============================================================
// Helpers
// ============================================================

const STATUS_CONFIG: Record<
  StatusValue,
  { bg: string; text: string; label: string }
> = {
  a_venir: { bg: `${colors.forest}1A`, text: colors.forest, label: 'A venir' },
  en_cours: { bg: `${colors.mango}26`, text: colors.mango, label: 'En cours' },
  passe: { bg: `${colors.stone}26`, text: colors.stone, label: 'Passe' },
  annule: { bg: `${colors.terracotta}26`, text: colors.terracotta, label: 'Annule' },
  en_attente: { bg: `${colors.indigo}26`, text: colors.indigo, label: 'En attente' },
};

// ============================================================
// Composant
// ============================================================

export const Badge = React.memo(function Badge(props: BadgeProps) {
  const containerStyle = getContainerStyle(props);
  const textColor = getTextColor(props);
  const label = getLabel(props);

  return (
    <View
      testID={props.testID}
      style={containerStyle}
      accessibilityRole="text"
    >
      <Text style={[typography.caption, { color: textColor, fontWeight: '600' }]}>
        {label}
      </Text>
    </View>
  );
});

// ============================================================
// Style helpers (avec discrimination explicite)
// ============================================================

function getContainerStyle(props: BadgeProps): ViewStyle {
  const base: ViewStyle = {
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    alignSelf: 'flex-start',
  };

  if (props.variant === 'status') {
    return { ...base, backgroundColor: STATUS_CONFIG[props.status].bg };
  }

  switch (props.variant) {
    case 'pro':
      return { ...base, backgroundColor: `${colors.gold}1A` };
    case 'particulier':
      return { ...base, backgroundColor: `${colors.terracotta}1A` };
    case 'sponsored':
      return { ...base, backgroundColor: colors.indigo };
    case 'premium':
      return { ...base, backgroundColor: colors.gold };
    default:
      return base;
  }
}

function getTextColor(props: BadgeProps): string {
  if (props.variant === 'status') {
    return STATUS_CONFIG[props.status].text;
  }

  switch (props.variant) {
    case 'pro':
      return colors.gold;
    case 'particulier':
      return colors.terracotta;
    case 'sponsored':
      return colors.sand;
    case 'premium':
      return colors.onyx;
    default:
      return colors.onyx;
  }
}

function getLabel(props: BadgeProps): React.ReactNode {
  if (props.variant === 'status') {
    return props.children ?? STATUS_CONFIG[props.status].label;
  }
  return props.children;
}

// Re-export pour usage externe
export type { BadgeProps, StatusValue, BadgeVariant };