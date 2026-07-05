/**
 * Tab Bar custom pour Expo Router.
 * - Mode Client (4 onglets) : actif terracotta
 * - Mode Vendeur (5 onglets) : actif forest, onglet Vendre gold surleve
 *
 * Safe areas : utilise useSafeAreaInsets() pour ne JAMAIS
 * s'incruster dans la barre de navigation du telephone.
 * La hauteur totale = 68 + insets.bottom.
 *
 * Utilise Animated de react-native (PAS reanimated)
 * pour eviter l'erreur TurboModule au lancement.
 */

import React, { useRef } from 'react';
import { Pressable, View, Text, Animated, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useHaptics } from '@/hooks/useHaptics';
import { colors, spacing, typography } from '@/lib/constants';

// ============================================================
// Types
// ============================================================

interface TabConfig {
  readonly key: string;
  readonly label: string;
  readonly icon: React.ComponentType<{ color: string; size: number }>;
  readonly isSpecial?: boolean;
}

interface TabItemProps {
  readonly tab: TabConfig;
  readonly isFocused: boolean;
  readonly onPress: () => void;
  readonly activeColor: string;
  readonly inactiveColor: string;
}

// ============================================================
// TabItem (composant separe pour respecter les rules of hooks)
// ============================================================

function TabItem({
  tab,
  isFocused,
  onPress,
  activeColor,
  inactiveColor,
}: TabItemProps) {
  const { impact } = useHaptics();

  // Animation avec Animated natif (pas reanimated)
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const Icon = tab.icon;
  const isSpecial = tab.isSpecial === true;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.95,
      damping: 15,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      damping: 15,
      useNativeDriver: true,
    }).start();
  };

  const handlePress = () => {
    impact('light');
    onPress();
  };

  const specialStyle: ViewStyle = isSpecial
    ? {
        backgroundColor: colors.gold,
        borderRadius: 16,
        marginTop: -4,
        paddingHorizontal: spacing.md + 4,
        paddingVertical: spacing.sm,
      }
    : {};

  const labelColor = isFocused
    ? isSpecial
      ? colors.onyx
      : activeColor
    : isSpecial
      ? colors.onyx
      : inactiveColor;

  return (
    <View style={{ flex: 1, alignItems: 'center' }}>
      <Pressable
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[
          {
            alignItems: 'center',
            justifyContent: 'center',
            paddingVertical: spacing.sm,
          },
          specialStyle,
        ]}
        accessibilityRole="button"
        accessibilityState={isFocused ? { selected: true } : {}}
        accessibilityLabel={tab.label}
      >
        <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
          <Icon color={labelColor} size={24} />
        </Animated.View>
        <Text
          style={[
            typography.caption,
            {
              color: labelColor,
              marginTop: 4,
              fontSize: 11,
              fontWeight: isFocused ? '600' : '400',
            },
          ]}
        >
          {tab.label}
        </Text>
      </Pressable>
    </View>
  );
}

// ============================================================
// TabBar (container)
// ============================================================

interface TabBarProps {
  readonly state: {
    readonly routes: readonly { key: string; name: string }[];
    readonly index: number;
  };
  readonly mode?: 'client' | 'seller';
  readonly tabs: readonly TabConfig[];
  readonly onTabPress: (routeName: string, key: string) => void;
}

export function TabBar({ state, mode = 'client', tabs, onTabPress }: TabBarProps) {
  // Safe area insets : empeche tout chevauchement avec la barre systeme
  const insets = useSafeAreaInsets();

  const activeColor = mode === 'seller' ? colors.forest : colors.terracotta;
  const inactiveColor = colors.stone;

  const containerStyle: ViewStyle = {
    flexDirection: 'row',
    backgroundColor: colors.sand,
    borderTopWidth: 1,
    borderTopColor: `${colors.stone}33`,
    // Safe area : paddingBottom respecte toujours la barre de navigation du telephone
    paddingBottom: Math.max(insets.bottom, 12),
    paddingTop: 8,
    paddingHorizontal: spacing.xs,
    // Hauteur totale : contenu (68) + inset bottom pour ne jamais s'incruster
    height: 68 + Math.max(insets.bottom, 0),
  };

  return (
    <View style={containerStyle}>
      {state.routes.map((route, index) => {
        const tab = tabs.find((t) => t.key === route.name);
        if (!tab) return null;

        const isFocused = state.index === index;

        return (
          <TabItem
            key={route.key}
            tab={tab}
            isFocused={isFocused}
            onPress={() => onTabPress(route.name, route.key)}
            activeColor={activeColor}
            inactiveColor={inactiveColor}
          />
        );
      })}
    </View>
  );
}

// Re-export
export type { TabConfig };