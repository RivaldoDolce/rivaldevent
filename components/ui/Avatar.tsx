/**
 * Avatar du design system.
 *
 * Regles UI/UX :
 * - 3 tailles : sm (32px), md (48px), lg (64px)
 * - Fallback : initiales sur bg terracotta/10
 * - Border optionnel : 2px white + shadow (avatars dans des listes)
 * - utilise expo-image (cache memory-disk, transitions)
 * - Radius full (9999px)
 */

import React, { useCallback, useState } from 'react';
import { View, Text, type ViewStyle } from 'react-native';
import { Image } from 'expo-image';

import { colors, spacing } from '@/lib/constants';

// ============================================================
// Types
// ============================================================

interface AvatarProps {
  readonly source?: string | null;
  readonly fallback?: string;
  readonly size?: 'sm' | 'md' | 'lg';
  readonly border?: boolean;
  readonly testID?: string;
}

// ============================================================
// Constantes
// ============================================================

const SIZE_PX: Record<NonNullable<AvatarProps['size']>, number> = {
  sm: 32,
  md: 48,
  lg: 64,
};

const SIZE_FONT: Record<NonNullable<AvatarProps['size']>, number> = {
  sm: 12,
  md: 16,
  lg: 22,
};

// ============================================================
// Composant
// ============================================================

export const Avatar = React.memo(function Avatar({
  source,
  fallback,
  size = 'md',
  border = false,
  testID,
}: AvatarProps) {
  const [hasError, setHasError] = useState(false);

  const handleError = useCallback(() => {
    setHasError(true);
  }, []);

  const dimension = SIZE_PX[size];

  const containerStyle: ViewStyle = {
    width: dimension,
    height: dimension,
    borderRadius: 9999,
    backgroundColor: `${colors.terracotta}1A`,
    borderWidth: border ? 2 : 0,
    borderColor: border ? colors.sand : 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  };

  // Calcul des initiales depuis le fallback
  const initials = getInitials(fallback);

  // Afficher le fallback si pas d'image, erreur, ou source vide
  if (!source || hasError) {
    return (
      <View testID={testID} style={containerStyle} accessibilityRole="image">
        <Text
          style={{
            color: colors.terracotta,
            fontSize: SIZE_FONT[size],
            fontWeight: '600',
          }}
        >
          {initials}
        </Text>
      </View>
    );
  }

  return (
    <View testID={testID} style={containerStyle}>
      <Image
        source={{ uri: source }}
        style={{ width: dimension, height: dimension }}
        contentFit="cover"
        transition={300}
        cachePolicy="memory-disk"
        onError={handleError}
        accessibilityLabel={fallback ? `Avatar de ${fallback}` : 'Avatar'}
      />
    </View>
  );
});

// ============================================================
// Helpers
// ============================================================

function getInitials(name?: string): string {
  if (!name || typeof name !== 'string') return '?';

  const trimmed = name.trim();
  if (trimmed.length === 0) return '?';

  const parts = trimmed.split(/\s+/);
  if (parts.length === 1) {
    return parts[0].charAt(0).toUpperCase();
  }

  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

// Variable utilisee pour eviter le warning "spacing is declared but never used"
// (sera utilise quand on ajoutera des props de margin)
void spacing;