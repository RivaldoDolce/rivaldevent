/**
 * Card du design system.
 *
 * Regles UI/UX :
 * - radius 16px par defaut
 * - 4 variants : default, elevated, outlined, featured
 * - Padding 16-24px selon le contenu
 * - Press feedback optionnel (scale 0.97 + shadow increase)
 *
 * Animations : Animated natif RN (pas reanimated — cause erreur TurboModule avec Expo Go).
 * Conformement au handoff section 8.6.
 *
 * Variants :
 * - default  : bg ivory, shadow-sm
 * - elevated : bg sand, shadow-md (cards mises en avant)
 * - outlined : bg transparent, border 1px stone
 * - featured : bg terracotta a 5%, border-left 4px terracotta (evenement a la une)
 */

import React, { useCallback, useRef } from 'react';
import { Pressable, View, Animated, type ViewStyle } from 'react-native';

import { colors, radius, spacing } from '@/lib/constants';

// ============================================================
// Types
// ============================================================

interface CardProps {
  readonly variant?: 'default' | 'elevated' | 'outlined' | 'featured';
  readonly children: React.ReactNode;
  readonly onPress?: () => void;
  readonly padding?: 'sm' | 'md' | 'lg' | 'none';
  readonly fullWidth?: boolean;
  readonly testID?: string;
}

// ============================================================
// Constantes de style
// ============================================================

const PADDING_VALUE: Record<NonNullable<CardProps['padding']>, number> = {
  none: 0,
  sm: spacing.sm,
  md: spacing.md,
  lg: spacing.lg,
};

const SHADOW_SMALL: ViewStyle = {
  shadowColor: colors.onyx,
  shadowOffset: { width: 0, height: 1 },
  shadowOpacity: 0.08,
  shadowRadius: 3,
  elevation: 1,
};

const SHADOW_MEDIUM: ViewStyle = {
  shadowColor: colors.onyx,
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.12,
  shadowRadius: 8,
  elevation: 3,
};

// ============================================================
// Composant
// ============================================================

export const Card = React.memo(function Card({
  variant = 'default',
  children,
  onPress,
  padding = 'md',
  fullWidth = true,
  testID,
}: CardProps) {
  // ── Animation avec Animated natif (pas reanimated) ──
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = useCallback(() => {
    if (!onPress) return;
    Animated.spring(scaleAnim, {
      toValue: 0.97,
      damping: 15,
      stiffness: 300,
      useNativeDriver: true,
    }).start();
  }, [onPress, scaleAnim]);

  const handlePressOut = useCallback(() => {
    if (!onPress) return;
    Animated.spring(scaleAnim, {
      toValue: 1,
      damping: 15,
      stiffness: 300,
      useNativeDriver: true,
    }).start();
  }, [onPress, scaleAnim]);

  // Style selon le variant
  const getVariantStyle = (): ViewStyle => {
    switch (variant) {
      case 'elevated':
        return {
          backgroundColor: colors.sand,
          borderRadius: radius.lg,
          ...SHADOW_MEDIUM,
        };
      case 'outlined':
        return {
          backgroundColor: 'transparent',
          borderRadius: radius.lg,
          borderWidth: 1,
          borderColor: colors.stone,
        };
      case 'featured':
        return {
          backgroundColor: `${colors.terracotta}0D`, // 5% opacity
          borderRadius: radius.lg,
          borderLeftWidth: 4,
          borderLeftColor: colors.terracotta,
          ...SHADOW_SMALL,
        };
      case 'default':
      default:
        return {
          backgroundColor: colors.ivory,
          borderRadius: radius.lg,
          ...SHADOW_SMALL,
        };
    }
  };

  const containerStyle: ViewStyle = {
    ...getVariantStyle(),
    padding: PADDING_VALUE[padding],
    width: fullWidth ? '100%' : undefined,
  };

  // Si pas de onPress, render simple View (pas d'animation)
  if (!onPress) {
    return (
      <View testID={testID} style={containerStyle}>
        {children}
      </View>
    );
  }

  return (
    <Animated.View
      style={[
        containerStyle,
        { transform: [{ scale: scaleAnim }] },
      ]}
    >
      <Pressable
        testID={testID}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        accessibilityRole="button"
      >
        {children}
      </Pressable>
    </Animated.View>
  );
});