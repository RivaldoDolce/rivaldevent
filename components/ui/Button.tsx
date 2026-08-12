/**
 * Button — design system « Noir & Or ».
 *
 * Variantes :
 * - primary   : dégradé or champagne + ombre dorée — CTA principal
 * - secondary : surface verre fumé + filet doré — action alternative
 * - outline   : transparent, filet hairline — action secondaire
 * - ghost     : texte seul or — lien/action tertiaire
 *
 * Tailles :
 * - sm : 40px de haut
 * - md : 52px de haut (défaut)
 * - lg : 60px de haut
 *
 * Animations : Animated natif RN (pas reanimated — erreur TurboModule en Expo Go).
 */

import React, { useCallback, useRef } from 'react';
import {
  Pressable,
  Text,
  View,
  ActivityIndicator,
  Animated,
  type ViewStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { useHaptics } from '@/hooks/useHaptics';
import { colors, gradients, spacing, radius, typography, shadows } from '@/lib/constants';

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
  sm: 40,
  md: 52,
  lg: 60,
};

const SIZE_PADDING: Record<NonNullable<ButtonProps['size']>, number> = {
  sm: spacing.md,
  md: spacing.lg,
  lg: spacing.xl,
};

const SIZE_FONT: Record<NonNullable<ButtonProps['size']>, number> = {
  sm: 14,
  md: 16,
  lg: 17,
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

  const scaleAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(disabled ? 0.45 : 1)).current;

  const handlePressIn = useCallback(() => {
    if (disabled || loading) return;
    Animated.spring(scaleAnim, {
      toValue: 0.98,
      damping: 15,
      stiffness: 300,
      useNativeDriver: true,
    }).start();
    Animated.timing(opacityAnim, {
      toValue: 0.85,
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

  React.useEffect(() => {
    Animated.timing(opacityAnim, {
      toValue: disabled ? 0.45 : 1,
      duration: 150,
      useNativeDriver: true,
    }).start();
  }, [disabled, opacityAnim]);

  const isGradient = variant === 'primary' || variant === 'secondary';

  const textColor = variant === 'primary' ? colors.onyx : colors.text;
  const spinnerColor =
    variant === 'primary'
      ? colors.onyx
      : variant === 'ghost'
        ? colors.goldBright
        : colors.goldBright;

  const containerBase: ViewStyle = {
    height: SIZE_HEIGHT[size],
    paddingHorizontal: SIZE_PADDING[size],
    borderRadius: radius.full,
    justifyContent: 'center',
    alignItems: 'center',
  };

  const containerSolid: ViewStyle = {
    ...containerBase,
    backgroundColor:
      variant === 'outline' ? 'transparent' : variant === 'ghost' ? 'transparent' : colors.surfaceAlt,
    ...(variant === 'outline'
      ? { borderWidth: 1, borderColor: `${colors.text}33` }
      : {}),
  };

  const content = loading ? (
    <ActivityIndicator color={spinnerColor} size="small" />
  ) : (
    <>
      {icon && iconPosition === 'left' && (
        <ViewIcon dim={SIZE_FONT[size] + 4} color={textColor}>
          {icon}
        </ViewIcon>
      )}
      <Text
        style={[
          typography.button,
          {
            color: textColor,
            fontSize: SIZE_FONT[size],
            textAlign: 'center',
            textAlignVertical: 'center',
            marginLeft: icon && iconPosition === 'left' ? spacing.sm : 0,
            marginRight: icon && iconPosition === 'right' ? spacing.sm : 0,
            letterSpacing: 0.1,
          },
        ]}
      >
        {children}
      </Text>
      {icon && iconPosition === 'right' && (
        <ViewIcon dim={SIZE_FONT[size] + 4} color={textColor}>
          {icon}
        </ViewIcon>
      )}
    </>
  );

  return (
    <Animated.View
      style={[
        fullWidth ? { width: '100%' as const } : {},
        { transform: [{ scale: scaleAnim }], opacity: opacityAnim },
      ]}
    >
      <Pressable
        testID={testID}
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled || loading}
        accessibilityRole="button"
        accessibilityState={{ disabled: disabled || loading }}
      >
        {isGradient ? (
          <LinearGradient
            colors={
              variant === 'primary'
                ? (gradients.gold as unknown as readonly [string, string, ...string[]])
                : (['#26211B', '#181512'] as unknown as readonly [string, string, ...string[]])
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[
              containerBase,
              {
                ...(variant === 'primary' ? shadows.goldGlow : {}),
                borderWidth: 1,
                borderColor:
                  variant === 'primary' ? `${colors.goldBright}66` : `${colors.text}1F`,
              },
            ]}
          >
            {content}
          </LinearGradient>
        ) : (
          <View
            style={[
              containerSolid,
              variant === 'ghost' && { borderWidth: 0 },
              { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
            ]}
          >
            {content}
          </View>
        )}
      </Pressable>
    </Animated.View>
  );
});

// ============================================================
// Sous-composants
// ============================================================

function ViewIcon({
  dim,
  color,
  children,
}: {
  readonly dim: number;
  readonly color: string;
  readonly children: React.ReactNode;
}) {
  return (
    <View style={{ width: dim, height: dim, justifyContent: 'center', alignItems: 'center', opacity: 0.95 }}>
      {React.cloneElement(children as React.ReactElement<{ color?: string }>, { color })}
    </View>
  );
}

// Réexport du type pour usage externe
export type { ButtonProps };