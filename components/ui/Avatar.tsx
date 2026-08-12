/**
 * Avatar — design system « Noir & Or ».
 *
 * - Cercle verre fumé avec initiale dorée en fallback
 * - Bordure fine par défaut (white 10%)
 * - Bordure or champagne surlignée quand border="highlight"
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
  xs: 26,
  sm: 38,
  md: 46,
  lg: 60,
  xl: 80,
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

  const containerStyle: ViewStyle = {
    width: dimension,
    height: dimension,
    borderRadius,
    overflow: 'hidden',
    backgroundColor: colors.glass,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  };

  const wrapperStyle: ViewStyle = {
    padding: 0,
    borderRadius,
  };

  if (border === 'highlight') {
    wrapperStyle.padding = 3;
    wrapperStyle.borderRadius = halfDim + 3;
    (wrapperStyle as Record<string, unknown>).borderWidth = 2;
    (wrapperStyle as Record<string, unknown>).borderColor = colors.gold;
  } else if (border === 'default') {
    wrapperStyle.padding = 1.5;
    wrapperStyle.borderRadius = halfDim + 1.5;
    (wrapperStyle as Record<string, unknown>).borderWidth = 1.5;
    (wrapperStyle as Record<string, unknown>).borderColor = `${colors.gold}40`;
  }

  const fallbackStyle: TextStyle = {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize,
    lineHeight: dimension - 2,
    color: colors.goldBright,
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