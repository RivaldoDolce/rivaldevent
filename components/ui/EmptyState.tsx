/**
 * EmptyState — design system « Noir & Or ».
 *
 * - Icône dans un médaillon verre avec halo doré
 * - Titre Playfair Display, description tamisée
 * - CTA optionnel (bouton outline)
 */

import React from 'react';
import { View, Text, StyleSheet, type ViewStyle } from 'react-native';

import { Button } from './Button';
import { colors, spacing, typography, radius, shadows } from '@/lib/constants';

// ============================================================
// Types
// ============================================================

interface EmptyStateProps {
  readonly icon?: React.ReactNode;
  readonly title: string;
  readonly description?: string;
  readonly actionLabel?: string;
  readonly onAction?: () => void;
  readonly testID?: string;
}

// ============================================================
// Composant
// ============================================================

export const EmptyState = React.memo(function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  testID,
}: EmptyStateProps) {
  const containerStyle: ViewStyle = {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xxxl,
  };

  return (
    <View testID={testID} style={containerStyle}>
      {icon && (
        <View style={styles.iconShadow}>
          <View style={styles.iconMedallion}>{icon}</View>
        </View>
      )}

      <Text style={[typography.h3, styles.title]}>{title}</Text>

      {description && (
        <Text style={[typography.bodySmall, styles.description]}>{description}</Text>
      )}

      {actionLabel && onAction && (
        <View style={{ marginTop: spacing.sm }}>
          <Button variant="outline" size="md" onPress={onAction}>
            {actionLabel}
          </Button>
        </View>
      )}
    </View>
  );
});

// ============================================================
// Styles
// ============================================================

const styles = StyleSheet.create({
  iconShadow: {
    marginBottom: spacing.lg,
    ...shadows.goldGlowSoft,
    borderRadius: radius.xxl,
  },
  iconMedallion: {
    width: 88,
    height: 88,
    borderRadius: radius.xxl,
    backgroundColor: colors.glassGold,
    borderWidth: 1,
    borderColor: colors.borderGold,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  description: {
    color: colors.textMuted,
    textAlign: 'center',
    marginBottom: spacing.xl,
    maxWidth: 300,
    lineHeight: 22,
  },
});