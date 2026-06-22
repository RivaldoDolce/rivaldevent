/**
 * Ecran de chargement plein ecran.
 *
 * Utilise sur les splash, transitions auth, sync offline, etc.
 * - Background sand
 * - Spinner terracotta
 * - Message optionnel en stone, typography body
 * - Possibilite d'ajouter un logo/image
 */

import React from 'react';
import { View, Text, ActivityIndicator, type ViewStyle } from 'react-native';

import { colors, spacing, typography } from '@/lib/constants';

// ============================================================
// Types
// ============================================================

interface LoadingScreenProps {
  readonly message?: string;
  readonly testID?: string;
}

// ============================================================
// Composant
// ============================================================

export const LoadingScreen = React.memo(function LoadingScreen({
  message,
  testID,
}: LoadingScreenProps) {
  const containerStyle: ViewStyle = {
    flex: 1,
    backgroundColor: colors.sand,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  };

  return (
    <View testID={testID} style={containerStyle}>
      <ActivityIndicator size="large" color={colors.terracotta} />
      {message && (
        <Text
          style={[
            typography.body,
            {
              color: colors.stone,
              marginTop: spacing.lg,
              textAlign: 'center',
            },
          ]}
        >
          {message}
        </Text>
      )}
    </View>
  );
});