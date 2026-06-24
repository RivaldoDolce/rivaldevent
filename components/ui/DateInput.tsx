/**
 * Champ de date - sélecteur de date pour les formulaires.
 *
 * Affiche la date au format JJ/MM/AAAA.
 * Pour Android/iOS : utilise une approche native (sélecteur système ou modal).
 */

import React from 'react';
import {
  View,
  Text,
  Pressable,
  type ViewStyle,
} from 'react-native';
import { Calendar } from 'lucide-react-native';

import { colors, spacing, radius, typography } from '@/lib/constants';

interface DateInputProps {
  readonly value: string; // Format: YYYY-MM-DD
  readonly onDateChange: (date: string) => void;
  readonly label?: string;
  readonly placeholder?: string;
  readonly error?: string;
  readonly testID?: string;
}

// Helper: format date for display DD/MM/YYYY
const formatDateDisplay = (dateStr: string): string => {
  if (!dateStr) return '';
  try {
    const [year, month, day] = dateStr.split('-');
    return `${day}/${month}/${year}`;
  } catch {
    return '';
  }
};

// Helper: convert DD/MM/YYYY to YYYY-MM-DD
// (currently unused, but kept for future validation)
// const parseDisplayDate = (display: string): string | null => {
//   const parts = display.split('/');
//   if (parts.length !== 3) return null;
//   const [day, month, year] = parts;
//   if (!day || !month || !year || year.length !== 4) return null;
//   return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
// };

export const DateInput = React.memo(function DateInput({
  value,
  label,
  placeholder = 'DD/MM/YYYY',
  error,
  testID,
}: DateInputProps) {
  const displayValue = value ? formatDateDisplay(value) : '';

  const borderColor = error ? colors.terracotta : `${colors.stone}40`;

  const containerStyle: ViewStyle = {
    borderColor,
    borderWidth: 1,
    borderRadius: radius.lg,
    backgroundColor: colors.ivory,
    paddingHorizontal: spacing.md,
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    outlineWidth: 0,
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

      <Pressable
        testID={testID}
        style={containerStyle}
        accessibilityRole="button"
      >
        <Text
          style={[
            typography.body,
            {
              color: displayValue ? colors.onyx : colors.stone,
              flex: 1,
              fontFamily: 'monospace',
            },
          ]}
        >
          {displayValue || placeholder}
        </Text>
        <Calendar color={colors.stone} size={20} strokeWidth={1.5} />
      </Pressable>

      {error && (
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
      )}
    </View>
  );
});
