/**
 * Input — design system « Noir & Or ».
 *
 * - Surface verre fumé, filet hairline blanc 8%
 * - Focus : filet or + halo doré subtil
 * - Erreur : filet danger + message
 * - Valide : filet succès
 * - Label ouverline doré, followes d'un champ profond
 *
 * Compatible React Hook Form (onChangeText / onBlur / error).
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Animated,
  type TextStyle,
  type ViewStyle,
} from 'react-native';

import { colors, spacing, radius, typography } from '@/lib/constants';

// ============================================================
// Types
// ============================================================

interface InputProps {
  readonly label?: string;
  readonly value: string;
  readonly onChangeText: (text: string) => void;
  readonly onBlur?: () => void;
  readonly onFocus?: () => void;
  readonly placeholder?: string;
  readonly error?: string;
  readonly isValid?: boolean;
  readonly helperText?: string;
  readonly iconLeft?: React.ReactNode;
  readonly iconRight?: React.ReactNode;
  readonly secureTextEntry?: boolean;
  readonly keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad';
  readonly autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  readonly autoCorrect?: boolean;
  readonly editable?: boolean;
  readonly maxLength?: number;
  readonly testID?: string;
}

// ============================================================
// Composant
// ============================================================

export const Input = React.memo(function Input({
  label,
  value,
  onChangeText,
  onBlur,
  onFocus,
  placeholder,
  error,
  isValid,
  helperText,
  iconLeft,
  iconRight,
  secureTextEntry = false,
  keyboardType = 'default',
  autoCapitalize = 'none',
  autoCorrect = false,
  editable = true,
  maxLength,
  testID,
}: InputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const glowAnim = useRef(new Animated.Value(0)).current;
  const floatAnim = useRef(new Animated.Value(value ? 1 : 0)).current;
  const hasFloating = !label && !!placeholder;
  const floatingLabel = placeholder ?? label ?? '';

  useEffect(() => {
    if (!hasFloating) return;
    const shouldFloat = isFocused || value.length > 0;
    Animated.timing(floatAnim, { toValue: shouldFloat ? 1 : 0, duration: 200, useNativeDriver: false }).start();
  }, [isFocused, value, hasFloating, floatAnim]);

  const handleFocus = useCallback(() => {
    setIsFocused(true);
    Animated.timing(glowAnim, { toValue: 1, duration: 180, useNativeDriver: false }).start();
    onFocus?.();
  }, [glowAnim, onFocus]);

  const handleBlur = useCallback(() => {
    setIsFocused(false);
    Animated.timing(glowAnim, { toValue: 0, duration: 180, useNativeDriver: false }).start();
    onBlur?.();
  }, [glowAnim, onBlur]);

  const isError = !!error;

  const borderColor = isError
    ? colors.danger
    : isValid
      ? colors.success
      : isFocused
        ? colors.borderGold
        : colors.border;

  const containerStyle: ViewStyle = {
    borderColor,
    borderWidth: 1,
    borderRadius: radius.md,
    backgroundColor: editable ? 'rgba(30,26,22,0.92)' : 'rgba(30,26,22,0.55)',
    paddingHorizontal: spacing.md,
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    opacity: editable ? 1 : 0.55,
    outlineWidth: 0,
  };

  const glowStyle = {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: isError ? colors.danger : colors.borderGold,
    opacity: glowAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 0.9] }),
  };

  const labelColor = isError
    ? colors.danger
    : isValid
      ? colors.success
      : isFocused
        ? colors.goldBright
        : colors.textSecondary;

  const inputStyle: TextStyle = {
    ...typography.body,
    color: colors.text,
    flex: 1,
    paddingVertical: hasFloating ? 16 : 14,
    paddingHorizontal: iconLeft ? spacing.sm : 0,
    outlineWidth: 0,
  };

  const floatingStyle = hasFloating
    ? {
        position: 'absolute' as const,
        left: iconLeft ? 42 : 14,
        top: floatAnim.interpolate({ inputRange: [0, 1], outputRange: [18, -9] }),
        backgroundColor: 'rgba(30,26,22,1)',
        paddingHorizontal: 6,
        borderRadius: 4,
        zIndex: 2,
        transform: [
          { scale: floatAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 0.82] }) },
        ],
        opacity: floatAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 1] }),
      }
    : null;

  const floatingTextStyle: TextStyle = {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0.4,
    color: floatAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [colors.textMuted, colors.text] as unknown as string[],
    }) as unknown as string,
  };

  return (
    <View style={{ marginBottom: spacing.md }}>
      {label && (
        <Text
          style={[
            label ? typography.captionSemiBold : typography.caption,
            {
              color: labelColor,
              marginBottom: spacing.sm,
              letterSpacing: 0.4,
            },
          ]}
        >
          {label}
        </Text>
      )}

      <Animated.View style={containerStyle}>
        <Animated.View pointerEvents="none" style={glowStyle} />
        {hasFloating && (
          <Animated.View pointerEvents="none" style={floatingStyle}>
            <Animated.Text style={floatingTextStyle}>{floatingLabel}</Animated.Text>
          </Animated.View>
        )}
        {iconLeft && (
          <View style={{ marginRight: spacing.sm, opacity: 0.85 }}>{iconLeft}</View>
        )}

        <TextInput
          testID={testID}
          style={inputStyle}
          value={value}
          onChangeText={onChangeText}
          onBlur={handleBlur}
          onFocus={handleFocus}
          placeholder={hasFloating && (isFocused || value.length > 0) ? '' : placeholder}
          placeholderTextColor="rgba(245,240,230,0.58)"
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          autoCorrect={autoCorrect}
          editable={editable}
          maxLength={maxLength}
          accessibilityLabel={label ?? placeholder}
          accessibilityState={{ disabled: !editable }}
          selectionColor={colors.gold}
          cursorColor={colors.gold}
        />

        {iconRight && <View style={{ marginLeft: spacing.sm, opacity: 0.85 }}>{iconRight}</View>}
      </Animated.View>

      {error ? (
        <Text
          style={[typography.caption, { color: colors.danger, marginTop: spacing.xs, marginLeft: spacing.xs }]}
        >
          {error}
        </Text>
      ) : helperText ? (
        <Text
          style={[typography.caption, { color: colors.textMuted, marginTop: spacing.xs, marginLeft: spacing.xs }]}
        >
          {helperText}
        </Text>
      ) : null}
    </View>
  );
});