/**
 * Champ de date - sélecteur de date pour les formulaires.
 *
 * Affiche la date au format JJ/MM/AAAA.
 * Pour Android/iOS : utilise une approche native (sélecteur système ou modal).
 */

import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  Pressable,
  Animated,
  Platform,
  type ViewStyle,
  type TextStyle,
} from 'react-native';
import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Calendar } from 'lucide-react-native';

import { colors, spacing, radius, typography } from '@/lib/constants';

interface DateInputProps {
  readonly value: string; // Format: YYYY-MM-DD
  readonly onDateChange: (date: string) => void;
  readonly label?: string;
  readonly placeholder?: string;
  readonly error?: string;
  readonly isValid?: boolean;
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
  isValid,
  testID,
  onDateChange,
}: DateInputProps) {
  const [showPicker, setShowPicker] = useState(false);

  const displayValue = value ? formatDateDisplay(value) : '';
  const currentDate = value ? new Date(value) : new Date();
  const isFloating = !!value || showPicker;
  const floatAnim = useRef(new Animated.Value(isFloating ? 1 : 0)).current;

  React.useEffect(() => {
    Animated.timing(floatAnim, { toValue: isFloating ? 1 : 0, duration: 200, useNativeDriver: false }).start();
  }, [isFloating, floatAnim]);

  const borderColor = error
    ? colors.danger
    : isValid
      ? colors.success
      : showPicker
        ? colors.borderGold
        : colors.border;

  const containerStyle: ViewStyle = {
    borderColor,
    borderWidth: showPicker ? 1.5 : 1,
    borderRadius: radius.md,
    backgroundColor: 'rgba(30,26,22,0.92)',
    paddingHorizontal: spacing.md,
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    outlineWidth: 0,
  };

  const openPicker = () => setShowPicker(true);

  const handleDateChange = (_event: DateTimePickerEvent, selectedDate?: Date) => {
    const isAndroid = Platform.OS === 'android';
    setShowPicker(!isAndroid);

    if (selectedDate) {
      onDateChange(selectedDate.toISOString().slice(0, 10));
    }
  };

  const floatingStyle: ViewStyle = {
    position: 'absolute',
    left: 14,
    top: floatAnim.interpolate({ inputRange: [0, 1], outputRange: [18, -9] }) as unknown as number,
    backgroundColor: 'rgba(30,26,22,1)',
    paddingHorizontal: 6,
    borderRadius: 4,
    zIndex: 2,
    transform: [{ scale: floatAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 0.82] }) as unknown as number }],
    opacity: floatAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 1] }),
  } as unknown as ViewStyle;

  const floatingTextStyle: TextStyle = {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0.4,
    color: error ? colors.danger : showPicker ? colors.text : colors.textSecondary,
  };

  return (
    <View style={{ marginBottom: spacing.md }}>
      {label && !isFloating && (
        <Text
          style={[
            typography.captionSemiBold,
            { color: colors.textSecondary, marginBottom: spacing.sm, letterSpacing: 0.4 },
          ]}
        >
          {label}
        </Text>
      )}

      <View style={{ position: 'relative' }}>
        {label && (
          <Animated.View pointerEvents="none" style={floatingStyle}>
            <Text style={floatingTextStyle}>{label}</Text>
          </Animated.View>
        )}
        <Pressable
          testID={testID}
          style={containerStyle}
          accessibilityRole="button"
          onPress={openPicker}
        >
          <Text
            style={[
              typography.body,
              {
                color: displayValue ? colors.text : 'rgba(245,240,230,0.58)',
                flex: 1,
                fontFamily: 'Inter_500Medium',
              },
            ]}
          >
            {displayValue || placeholder}
          </Text>
          <Calendar color={showPicker ? colors.goldBright : colors.goldMuted} size={20} strokeWidth={1.5} />
        </Pressable>
      </View>

      {showPicker && (
        <DateTimePicker
          value={currentDate}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'calendar'}
          onChange={handleDateChange}
          maximumDate={new Date()}
          themeVariant="dark"
        />
      )}

      {error && (
        <Text
          style={[
            typography.caption,
            {
              color: colors.danger,
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
