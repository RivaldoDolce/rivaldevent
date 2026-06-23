/**
 * Input du design system, compatible React Hook Form.
 *
 * Règles UI/UX :
 * - Border 1px stone, radius 16px
 * - Focus : border terracotta + shadow subtil
 * - Error : border terracotta + message en dessous
 * - Label : bodySmall, stone, aligné à gauche
 * - Padding interne : 16px horizontal, 14px vertical
 * - Min height 48px (touch target)
 *
 * Usage avec RHF :
 * <Controller
 *   control={control}
 *   name="email"
 *   render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
 *     <Input
 *       label="Email"
 *       value={value}
 *       onChangeText={onChange}
 *       onBlur={onBlur}
 *       error={error?.message}
 *     />
 *   )}
 * />
 */

import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  TextInput,
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

  const handleFocus = useCallback(() => {
    setIsFocused(true);
    onFocus?.();
  }, [onFocus]);

  const handleBlur = useCallback(() => {
    setIsFocused(false);
    onBlur?.();
  }, [onBlur]);

  // Détermine la couleur de bordure
  const borderColor = error
    ? colors.terracotta
    : isFocused
      ? colors.terracotta
      : colors.stone;

  const containerStyle: ViewStyle = {
    borderColor,
    borderWidth: 1,
    borderRadius: radius.lg,
    backgroundColor: editable ? colors.sand : colors.ivory,
    paddingHorizontal: spacing.md,
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    opacity: editable ? 1 : 0.6,
  };

  const inputStyle: TextStyle = {
    ...typography.body,
    color: colors.onyx,
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: iconLeft ? spacing.sm : 0,
  };

  return (
    <View className="mb-md">
      {label && (
        <Text
          style={[typography.bodySmall, { color: colors.stone, marginBottom: spacing.sm }]}
        >
          {label}
        </Text>
      )}

      <View style={containerStyle}>
        {iconLeft && <View className="mr-sm">{iconLeft}</View>}

        <TextInput
          testID={testID}
          style={inputStyle}
          value={value}
          onChangeText={onChangeText}
          onBlur={handleBlur}
          onFocus={handleFocus}
          placeholder={placeholder}
          placeholderTextColor={colors.stone}
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          autoCorrect={autoCorrect}
          editable={editable}
          maxLength={maxLength}
          accessibilityLabel={label}
          accessibilityState={{ disabled: false }}
        />

        {iconRight && <View className="ml-sm">{iconRight}</View>}
      </View>

      {error ? (
        <Text
          style={[
            typography.caption,
            {
              color: colors.terracotta,
              marginTop: spacing.xs,
              marginLeft: spacing.xs,
            },
          ]}
        >
          {error}
        </Text>
      ) : helperText ? (
        <Text
          style={[
            typography.caption,
            {
              color: colors.stone,
              marginTop: spacing.xs,
              marginLeft: spacing.xs,
            },
          ]}
        >
          {helperText}
        </Text>
      ) : null}
    </View>
  );
});