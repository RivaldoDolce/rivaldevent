/**
 * Etat vide du design system.
 *
 * A utiliser quand une liste est vide, une recherche ne retourne rien,
 * ou l'utilisateur n'a pas encore de billets/evenements.
 *
 * Regles UI/UX :
 * - Illustration/icon au centre (pas de centrage parfait : offset vertical)
 * - Titre h3 onyx
 * - Description body stone
 * - CTA optionnel (bouton outline ou ghost)
 */

import React from 'react';
import { View, Text, type ViewStyle } from 'react-native';

import { Button } from './Button';
import { colors, spacing, typography } from '@/lib/constants';

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
        <View
          style={{
            width: 80,
            height: 80,
            borderRadius: 40,
            backgroundColor: `${colors.terracotta}1A`,
            justifyContent: 'center',
            alignItems: 'center',
            marginBottom: spacing.lg,
          }}
        >
          {icon}
        </View>
      )}

      <Text
        style={[
          typography.h3,
          {
            color: colors.onyx,
            textAlign: 'center',
            marginBottom: spacing.sm,
          },
        ]}
      >
        {title}
      </Text>

      {description && (
        <Text
          style={[
            typography.body,
            {
              color: colors.stone,
              textAlign: 'center',
              marginBottom: spacing.xl,
            },
          ]}
        >
          {description}
        </Text>
      )}

      {actionLabel && onAction && (
        <Button
          variant="outline"
          size="md"
          onPress={onAction}
        >
          {actionLabel}
        </Button>
      )}
    </View>
  );
});