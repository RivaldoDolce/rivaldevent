/**
 * Tab Bar custom pour Expo Router.
 * - Mode Client (4 onglets) : actif terracotta
 * - Mode Vendeur (5 onglets) : actif forest, onglet Vendre gold surleve
 */

import React from 'react';
import { Pressable, View, Text, type ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  type SharedValue,
} from 'react-native-reanimated';

import { useHaptics } from '@/hooks/useHaptics';
import { colors, spacing, typography } from '@/lib/constants';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

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
// TabItem (composant separer pour respecter les rules of hooks)
// ============================================================

function TabItem({
  tab,
  isFocused,
  onPress,
  activeColor,
  inactiveColor,
}: TabItemProps) {
  const { impact } = useHaptics();
  const scale = useSharedValue(1);

  const Icon = tab.icon;
  const isSpecial = tab.isSpecial === true;

  const animatedIconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.95, { damping: 15 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15 });
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
      <AnimatedPressable
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
        <Animated.View style={animatedIconStyle}>
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
      </AnimatedPressable>
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
  const activeColor = mode === 'seller' ? colors.forest : colors.terracotta;
  const inactiveColor = colors.stone;

  const containerStyle: ViewStyle = {
    flexDirection: 'row',
    backgroundColor: colors.sand,
    borderTopWidth: 1,
    borderTopColor: `${colors.stone}33`,
    paddingBottom: spacing.sm + 4,
    paddingTop: spacing.xs,
    paddingHorizontal: spacing.xs,
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
export type { TabConfig, SharedValue };