/**
 * Avatar - Composant avatar avec support taille, fallback et bordure.
 *
 * Design "Minimalisme Africain Camerounais" :
 * - Cercle avec initiale en fallback
 * - Bordure fine par defaut
 * - Bordure grasse subrillee (terracotta) quand border="highlight"
 *
 * Conventions :
 * - expo-image pour la photo
 * - Pas de type any, pas d'emojis
 * - Design tokens depuis lib/constants.ts
 */

import { memo } from 'react';
import { View, Text, type ViewStyle, type TextStyle } from 'react-native';
import { Image } from 'expo-image';

import { colors } from '@/lib/constants';

// ============================================================
// Types
// ============================================================

type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

interface AvatarProps {
  readonly source?: string | null;
  readonly fallback: string;
  readonly size?: AvatarSize;
  readonly border?: 'none' | 'default' | 'highlight';
  readonly testID?: string;
}

// ============================================================
// Constantes
// ============================================================

const SIZE_MAP: Record<AvatarSize, number> = {
  xs: 24,
  sm: 36,
  md: 44,
  lg: 56,
  xl: 72,
};

const FONT_SIZE_MAP: Record<AvatarSize, number> = {
  xs: 10,
  sm: 14,
  md: 16,
  lg: 20,
  xl: 26,
};

// ============================================================
// Composant
// ============================================================

export const Avatar = memo(function Avatar({
  source,
  fallback,
  size = 'md',
  border = 'none',
  testID,
}: AvatarProps) {
  const dimension = SIZE_MAP[size];
  const fontSize = FONT_SIZE_MAP[size];
  const halfDim = dimension / 2;
  const borderRadius = halfDim;

  const fallbackChar = fallback?.charAt(0)?.toUpperCase() ?? '?';

  // -- Style du conteneur --
  const containerStyle: ViewStyle = {
    width: dimension,
    height: dimension,
    borderRadius,
    overflow: 'hidden',
    backgroundColor: colors.ivory,
    justifyContent: 'center',
    alignItems: 'center',
  };

  // -- Style de la bordure (wrapper autour du conteneur) --
  const wrapperStyle: ViewStyle = {
    padding: 0,
    borderRadius,
  };

  // Bordure grasse subrillee
  if (border === 'highlight') {
    wrapperStyle.padding = 3;
    wrapperStyle.borderRadius = halfDim + 3;
    (wrapperStyle as Record<string, unknown>).borderWidth = 3;
    (wrapperStyle as Record<string, unknown>).borderColor = colors.gold;
  }
  // Bordure fine par defaut
  else if (border === 'default') {
    wrapperStyle.padding = 1.5;
    wrapperStyle.borderRadius = halfDim + 1.5;
    (wrapperStyle as Record<string, unknown>).borderWidth = 1.5;
    (wrapperStyle as Record<string, unknown>).borderColor = `${colors.stone}40`;
  }

  const fallbackStyle: TextStyle = {
    fontFamily: 'Inter-SemiBold',
    fontSize,
    lineHeight: dimension,
    color: colors.terracotta,
    textAlign: 'center',
  };

  return (
    <View style={wrapperStyle} testID={testID}>
      {source ? (
        <Image
          source={{ uri: source }}
          style={{ width: dimension, height: dimension, borderRadius }}
          contentFit="cover"
          transition={200}
          cachePolicy="memory-disk"
          accessibilityLabel={fallback}
        />
      ) : (
        <View style={containerStyle}>
          <Text style={fallbackStyle} numberOfLines={1}>
            {fallbackChar}
          </Text>
        </View>
      )}
    </View>
  );
});