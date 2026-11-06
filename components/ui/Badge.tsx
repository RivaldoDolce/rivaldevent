/**
 * Badge — design system « Noir & Or ».
 *
 * Variantes :
 * - pro         : verre doré, texte or — Prestataire Pro
 * - particulier : verre terracotta, texte terracotta — vendeur particulier
 * - sponsored   : verre indigo, texte indigo — lieu sponsorisé
 * - premium     : dégradé or, texte noir — forfait premium
 * - status      : dynamique selon la valeur (a_venir, en_cours, passe, annule)
 *
 * Style : pastilles pill avec point indicateur pour le status.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

import { colors, radii, spacing, typography } from '@/lib/constants';

// ============================================================
// Types
// ============================================================

type BadgeVariant = 'pro' | 'particulier' | 'sponsored' | 'premium' | 'status';
type StatusValue = 'a_venir' | 'en_cours' | 'passe' | 'annule' | 'en_attente';

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
  { bg: string; text: string; dot: string; label: string }
> = {
  a_venir: { bg: 'rgba(76,154,110,0.12)', text: colors.success, dot: colors.success, label: 'À venir' },
  en_cours: { bg: 'rgba(232,182,76,0.12)', text: colors.mango, dot: colors.mango, label: 'En cours' },
  passe: { bg: 'rgba(124,116,102,0.15)', text: colors.textSecondary, dot: colors.textMuted, label: 'Passé' },
  annule: { bg: 'rgba(255,107,94,0.12)', text: colors.danger, dot: colors.danger, label: 'Annulé' },
  en_attente: { bg: 'rgba(127,167,206,0.12)', text: colors.info, dot: colors.info, label: 'En attente' },
};

const STATIC_CONFIG: Record<StaticVariant, { bg: string; text: string }> = {
  pro: { bg: 'rgba(216,180,90,0.14)', text: colors.goldBright },
  particulier: { bg: 'rgba(201,96,63,0.14)', text: colors.terracotta },
  sponsored: { bg: 'rgba(127,167,206,0.14)', text: colors.info },
  premium: { bg: colors.gold, text: colors.onyx },
};

// ============================================================
// Composant
// ============================================================

export const Badge = React.memo(function Badge(props: BadgeProps) {
  const isStatus = props.variant === 'status';

  if (isStatus) {
    const config = STATUS_CONFIG[props.status];
    return (
      <View
        testID={props.testID}
        style={[styles.container, { backgroundColor: config.bg, borderColor: `${config.dot}38` }]}
        accessibilityRole="text"
      >
        <View style={[styles.dot, { backgroundColor: config.dot }]} />
        <Text style={[typography.captionSemiBold, { color: config.text }]}>
          {props.children ?? config.label}
        </Text>
      </View>
    );
  }

  const config = STATIC_CONFIG[props.variant];
  return (
    <View
      testID={props.testID}
      style={[styles.container, { backgroundColor: config.bg, borderColor: `${colors.gold}26` }]}
      accessibilityRole="text"
    >
      <Text style={[typography.captionSemiBold, { color: config.text, letterSpacing: 0.3 }]}>
        {props.children}
      </Text>
    </View>
  );
});

// ============================================================
// Styles
// ============================================================

const styles = StyleSheet.create({
  container: {
    borderRadius: radii.full,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 5,
    alignSelf: 'flex-start',
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
});

// Re-export pour usage externe
export type { BadgeProps, StatusValue, BadgeVariant };