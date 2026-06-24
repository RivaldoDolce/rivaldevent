/**
 * Bouton principal du design system.
 *
 * Règles UI/UX :
 * - 1 seul bouton primary par écran (hiérarchie violente)
 * - Press feedback : scale 0.98 + haptic light
 * - Disabled : opacité 0.5, pas de haptic
 * - Loading : spinner remplace le texte, bouton désactivé
 * - Radius 16px partout (radius.lg)
 *
 * Variants :
 * - primary   : bg terracotta (client) — CTA principal
 * - secondary : bg gold (premium, actions vendeur)
 * - outline   : border stone, transparent — actions secondaires
 * - ghost     : texte seul, underline — liens
 *
 * Sizes :
 * - sm : 36px de haut, padding 12px
 * - md : 48px de haut, padding 16px (défaut)
 * - lg : 56px de haut, padding 24px
 */

import React, { useCallback } from 'react';
import { Pressable, Text, ActivityIndicator, type ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { useHaptics } from '@/hooks/useHaptics';
import { colors, spacing, radius, typography } from '@/lib/constants';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// ============================================================
// Types
// ============================================================

interface ButtonProps {
  readonly variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  readonly size?: 'sm' | 'md' | 'lg';
  readonly children: React.ReactNode;
  readonly onPress?: () => void;
  readonly onPressIn?: () => void;
  readonly disabled?: boolean;
  readonly loading?: boolean;
  readonly icon?: React.ReactNode;
  readonly iconPosition?: 'left' | 'right';
  readonly fullWidth?: boolean;
  readonly testID?: string;
}

// ============================================================
// Constantes de style
// ============================================================

const SIZE_HEIGHT: Record<NonNullable<ButtonProps['size']>, number> = {
  sm: 36,
  md: 48,
  lg: 56,
};

const SIZE_PADDING: Record<NonNullable<ButtonProps['size']>, number> = {
  sm: spacing.md,
  md: spacing.lg,
  lg: spacing.xl,
};

const SIZE_FONT: Record<NonNullable<ButtonProps['size']>, number> = {
  sm: 14,
  md: 16,
  lg: 18,
};

// ============================================================
// Composant
// ============================================================

export const Button = React.memo(function Button({
  variant = 'primary',
  size = 'md',
  children,
  onPress,
  onPressIn,
  disabled = false,
  loading = false,
  icon,
  iconPosition = 'left',
  fullWidth = false,
  testID,
}: ButtonProps) {
  const { impact } = useHaptics();
  const scale = useSharedValue(1);

  // Animation au press
  const handlePressIn = useCallback(() => {
    if (disabled || loading) return;
    scale.value = withSpring(0.98, { damping: 15, stiffness: 300 });
    impact('light');
    onPressIn?.();
  }, [disabled, loading, scale, impact, onPressIn]);

  const handlePressOut = useCallback(() => {
    if (disabled || loading) return;
    scale.value = withSpring(1, { damping: 15, stiffness: 300 });
  }, [disabled, loading, scale]);

  const handlePress = useCallback(() => {
    if (disabled || loading) return;
    onPress?.();
  }, [disabled, loading, onPress]);

  // Style animé
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: withTiming(disabled ? 0.5 : 1, { duration: 150 }),
  }));

  const textColor = {
    primary: colors.sand,
    secondary: colors.onyx,
    outline: colors.onyx,
    ghost: colors.terracotta,
  }[variant];

  // Inline backgroundColor — source de vérité (NativeWind en complément)
  const variantBg: Record<NonNullable<ButtonProps['variant']>, string> = {
    primary: colors.terracotta,
    secondary: colors.gold,
    outline: 'transparent',
    ghost: 'transparent',
  };

  const containerStyle: ViewStyle = {
    height: SIZE_HEIGHT[size],
    paddingHorizontal: SIZE_PADDING[size],
    borderRadius: radius.lg,
    backgroundColor: variantBg[variant],
    ...(variant === 'outline' ? { borderWidth: 1, borderColor: `${colors.stone}60` } : {}),
  };

  return (
    <AnimatedPressable
      testID={testID}
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled || loading}
      style={[
        animatedStyle,
        containerStyle,
        fullWidth ? { width: '100%' as const } : {},
      ]}
      className="flex-row items-center justify-center"
      accessibilityRole="button"
      accessibilityState={{ disabled: disabled || loading }}
    >
      {loading ? (
        <ActivityIndicator
          color={textColor}
          size={size === 'sm' ? 'small' : 'small'}
        />
      ) : (
        <>
          {icon && iconPosition === 'left' && <IconWrapper>{icon}</IconWrapper>}
          <Text
            style={[
              typography.button,
              {
                color: textColor,
                fontSize: SIZE_FONT[size],
                marginLeft: icon && iconPosition === 'left' ? spacing.sm : 0,
                marginRight: icon && iconPosition === 'right' ? spacing.sm : 0,
              },
            ]}
            className={variant === 'ghost' ? 'underline' : ''}
          >
            {children}
          </Text>
          {icon && iconPosition === 'right' && <IconWrapper>{icon}</IconWrapper>}
        </>
      )}
    </AnimatedPressable>
  );
});

// ============================================================
// Sous-composant : wrapper d'icône
// ============================================================

function IconWrapper({ children }: { readonly children: React.ReactNode }) {
  return <>{children}</>;
}