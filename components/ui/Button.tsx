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
 * - md : 48px de haut, padding 16px (défaut)
 * - lg : 56px de haut, padding 24px
 */

import React, { useCallback } from 'react';
import { Pressable, Text, ActivityIndicator, Platform, type ViewStyle } from 'react-native';

// Importation sécurisée de react-native-reanimated avec fallback.
// Reanimated nécessite le plugin Babel et une construction native ; si non configuré correctement,
// nous utilisons les styles statiques pour éviter les erreurs TurboModule.
let AnimatedPressable: typeof Pressable = Pressable;
let useAnimatedStyle: any = () => () => ({});
let useSharedValue: any = () => ({ value: 1 });
let withSpring: any = (v: any) => v;
let withTiming: any = (v: any) => v;

if (Platform.OS !== 'web') {
  try {
    // eslint-disable-next-line global-require
    const ReanimatedModule = require('react-native-reanimated');
    const Reanimated = ReanimatedModule.default ?? ReanimatedModule;

    if (typeof Reanimated.createAnimatedComponent === 'function') {
      AnimatedPressable = Reanimated.createAnimatedComponent(Pressable);
    }

    useAnimatedStyle = ReanimatedModule.useAnimatedStyle ?? (() => () => ({}));
    useSharedValue = ReanimatedModule.useSharedValue ?? (() => ({ value: 1 }));
    withSpring = ReanimatedModule.withSpring ?? ((value: any) => value);
    withTiming = ReanimatedModule.withTiming ?? ((value: any) => value);
  } catch {
    // Reanimated non disponible ; utilisation des styles statiques
  }
}

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
  const scale = useSharedValue(1);

  // Animation à l'appui
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

  // Style avec animation
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

  // Couleur de fond inline — source unique de vérité (NativeWind en complément)
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
    </AnimatedPressable>
  );
});

// ============================================================
// Sous-composant : wrapper d'icône
// ============================================================

function IconWrapper({ children }: { readonly children: React.ReactNode }) {
  return <>{children}</>;
}