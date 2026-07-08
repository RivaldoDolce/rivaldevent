/**
 * Bouton principal du design system.
 *
 * Variantes :
 * - primary   : bg terracotta (client) — CTA principal
 * - secondary : bg gold (premium, actions vendeur)
 * - outline   : border stone, transparent — actions secondaires
 * - ghost     : texte seul, underline — liens
 *
 * Tailles :
 * - sm : 36px de haut, padding 12px
 * - md : 48px de haut, padding 16px (defaut)
 * - lg : 56px de haut, padding 24px
 *
 * Animations : Animated natif RN (pas reanimated — cause erreur TurboModule avec Expo Go).
 * Conformement au handoff section 8.6 : "ne PAS en ajouter de nouveau".
 */

import React, { useCallback, useRef } from 'react';
import { Pressable, Text, ActivityIndicator, Animated, type ViewStyle } from 'react-native';

import { useHaptics } from '@/hooks/useHaptics';
import { colors, spacing, radius, typography } from '@/lib/constants';

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

  // ── Animations avec Animated natif (pas reanimated) ──
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(disabled ? 0.5 : 1)).current;

  const handlePressIn = useCallback(() => {
    if (disabled || loading) return;
    Animated.spring(scaleAnim, {
      toValue: 0.98,
      damping: 15,
      stiffness: 300,
      useNativeDriver: true,
    }).start();
    Animated.timing(opacityAnim, {
      toValue: 0.8,
      duration: 100,
      useNativeDriver: true,
    }).start();
    impact('light');
    onPressIn?.();
  }, [disabled, loading, scaleAnim, opacityAnim, impact, onPressIn]);

  const handlePressOut = useCallback(() => {
    if (disabled || loading) return;
    Animated.spring(scaleAnim, {
      toValue: 1,
      damping: 15,
      stiffness: 300,
      useNativeDriver: true,
    }).start();
    Animated.timing(opacityAnim, {
      toValue: 1,
      duration: 150,
      useNativeDriver: true,
    }).start();
  }, [disabled, loading, scaleAnim, opacityAnim]);

  const handlePress = useCallback(() => {
    if (disabled || loading) return;
    onPress?.();
  }, [disabled, loading, onPress]);

  // Mise a jour de l'opacite si disabled change
  React.useEffect(() => {
    Animated.timing(opacityAnim, {
      toValue: disabled ? 0.5 : 1,
      duration: 150,
      useNativeDriver: true,
    }).start();
  }, [disabled, opacityAnim]);

  const textColor = {
    primary: colors.sand,
    secondary: colors.onyx,
    outline: colors.onyx,
    ghost: colors.terracotta,
  }[variant];

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
    justifyContent: 'center',
    alignItems: 'center',
    ...(variant === 'outline' ? { borderWidth: 1, borderColor: `${colors.stone}60` } : {}),
  };

  return (
    <Animated.View
      style={[
        containerStyle,
        fullWidth ? { width: '100%' as const } : {},
        {
          transform: [{ scale: scaleAnim }],
          opacity: opacityAnim,
        },
      ]}
    >
      <Pressable
        testID={testID}
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled || loading}
        style={{ justifyContent: 'center', alignItems: 'center', flexDirection: 'row' }}
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
                  textAlign: 'center',
                  textAlignVertical: 'center',
                },
              ]}
            >
              {children}
            </Text>
            {icon && iconPosition === 'right' && <IconWrapper>{icon}</IconWrapper>}
          </>
        )}
      </Pressable>
    </Animated.View>
  );
});

// ============================================================
// Sous-composant : wrapper d'icone
// ============================================================

function IconWrapper({ children }: { readonly children: React.ReactNode }) {
  return <>{children}</>;
}
