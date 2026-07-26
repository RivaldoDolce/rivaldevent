/**
 * NotificationBell - Icone de notification avec badge compteur.
 *
 * Design "Minimalisme Africain Camerounais" :
 * - Cloche (Bell) lucide avec contour fin
 * - Badge rouge (danger) avec compteur si > 0
 * - Animation de rebond quand le compteur change
 * - Press feedback haptique
 *
 * Conventions :
 * - lucide-react-native pour les icones
 * - Animated natif (pas reanimated)
 * - Pas de type any, pas d'emojis
 * - Design tokens depuis lib/constants.ts
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

import { colors, typography } from '@/lib/constants';

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

const BELL_SIZE = 22;
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
    justifyContent: 'center',
    alignItems: 'center',
  };

  const badgeContainerStyle: ViewStyle = {
    position: 'absolute',
    top: 6,
    right: 4,
    minWidth: BADGE_SIZE,
    height: BADGE_SIZE,
    borderRadius: BADGE_SIZE / 2,
    backgroundColor: colors.danger,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  };

  const badgeTextStyle: TextStyle = {
    ...typography.overline,
    color: colors.white,
    fontWeight: '700',
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
          color={count > 0 ? colors.onyx : colors.stone}
          strokeWidth={1.5}
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
