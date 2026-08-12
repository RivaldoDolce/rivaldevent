/**
 * Card — design system « Noir & Or ».
 *
 * Variantes :
 * - default  : verre fumé + filet hairline
 * - elevated : surface ornée, ombre profonde, filet doré subtil
 * - outlined : transparent, filet hairline blanc
 * - featured : filet doré + halo (événement à la une)
 *
 * Press feedback : scale 0.97 avec Animated natif.
 */

import React, { useCallback, useRef } from 'react';
import { Pressable, View, Animated, type ViewStyle } from 'react-native';

import { colors, radius, spacing, shadows } from '@/lib/constants';

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

  const getVariantStyle = (): ViewStyle => {
    switch (variant) {
      case 'elevated':
        return {
          backgroundColor: colors.elevated,
          borderRadius: radius.lg,
          borderWidth: 1,
          borderColor: `${colors.gold}1F`,
          ...shadows.card,
        };
      case 'outlined':
        return {
          backgroundColor: 'transparent',
          borderRadius: radius.lg,
          borderWidth: 1,
          borderColor: colors.border,
        };
      case 'featured':
        return {
          backgroundColor: colors.glassGold,
          borderRadius: radius.lg,
          borderWidth: 1,
          borderColor: colors.borderGold,
          ...shadows.goldGlowSoft,
        };
      case 'default':
      default:
        return {
          backgroundColor: colors.glass,
          borderRadius: radius.lg,
          borderWidth: 1,
          borderColor: colors.border,
        };
    }
  };

  const containerStyle: ViewStyle = {
    ...getVariantStyle(),
    padding: PADDING_VALUE[padding],
    width: fullWidth ? '100%' : undefined,
  };

  if (!onPress) {
    return (
      <View testID={testID} style={containerStyle}>
        {children}
      </View>
    );
  }

  return (
    <Animated.View style={[containerStyle, { transform: [{ scale: scaleAnim }] }]}>
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