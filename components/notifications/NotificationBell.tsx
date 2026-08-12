/**
 * NotificationBell — cloche de notifications « Noir & Or ».
 *
 * - Pastille verre fumé avec filet hairline
 * - Cloche or : passive goldMuted, active goldBright
 * - Badge compteur : pilule dégradé or avec texte onyx
 * - Animation de rebond quand le compteur augmente (Animated natif)
 */

import React, { useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  Pressable,
  Animated,
  type ViewStyle,
  type TextStyle,
} from 'react-native';
import { Bell } from 'lucide-react-native';

import { colors, radius, typography } from '@/lib/constants';

// ============================================================
// Types
// ============================================================

interface NotificationBellProps {
  readonly count: number;
  readonly onPress?: () => void;
  readonly testID?: string;
}

// ============================================================
// Constantes
// ============================================================

const BELL_SIZE = 20;
const BADGE_SIZE = 18;
const MAX_DISPLAY_COUNT = 99;

// ============================================================
// Composant
// ============================================================

export const NotificationBell = React.memo(function NotificationBell({
  count,
  onPress,
  testID,
}: NotificationBellProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const prevCountRef = useRef(count);

  // Animation de rebond quand le compteur augmente
  useEffect(() => {
    if (count > prevCountRef.current) {
      Animated.sequence([
        Animated.spring(scaleAnim, {
          toValue: 1.3,
          damping: 8,
          stiffness: 200,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          damping: 12,
          stiffness: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
    prevCountRef.current = count;
  }, [count, scaleAnim]);

  const handlePress = useCallback(() => {
    onPress?.();
  }, [onPress]);

  const displayCount = count > MAX_DISPLAY_COUNT ? `${MAX_DISPLAY_COUNT}+` : `${count}`;

  const containerStyle: ViewStyle = {
    width: 44,
    height: 44,
    borderRadius: radius.full,
    backgroundColor: colors.glass,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  };

  const badgeContainerStyle: ViewStyle = {
    position: 'absolute',
    top: -3,
    right: -3,
    minWidth: BADGE_SIZE,
    height: BADGE_SIZE,
    borderRadius: BADGE_SIZE / 2,
    backgroundColor: colors.gold,
    borderWidth: 1.5,
    borderColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
    shadowColor: 'rgba(216,180,90,0.6)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 6,
    elevation: 4,
  };

  const badgeTextStyle: TextStyle = {
    ...typography.overline,
    fontFamily: 'Inter_700Bold',
    color: colors.onyx,
    fontSize: 9,
    lineHeight: BADGE_SIZE - 2,
  };

  return (
    <Pressable
      onPress={handlePress}
      style={containerStyle}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel={count > 0 ? `${count} notifications` : 'Notifications'}
      accessibilityHint={count > 0 ? `${count} notifications non lues` : 'Aucune notification'}
      testID={testID}
    >
      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
        <Bell
          size={BELL_SIZE}
          color={count > 0 ? colors.goldBright : colors.goldMuted}
          strokeWidth={1.75}
        />
      </Animated.View>

      {count > 0 && (
        <View style={badgeContainerStyle} pointerEvents="none">
          <Text style={badgeTextStyle} numberOfLines={1}>
            {displayCount}
          </Text>
        </View>
      )}
    </Pressable>
  );
});