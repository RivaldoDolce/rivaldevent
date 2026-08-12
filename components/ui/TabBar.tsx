/**
 * TabBar — design system « Noir & Or ».
 *
 * Barre flottante sombre avec :
 * - Surface verre fumé à coins très arrondis, filet hairline doré
 * - Onglet actif : pastille dorée lumineuse sous l'icône + texte or
 * - Onglet spécial (Vendre) : médaillon or surélevé avec halo
 *
 * Architecture : onglets normaux flex:1, onglet spécial centré
 * et surélevé, safe areas gérées via useSafeAreaInsets.
 */

import React, { useCallback } from 'react';
import {
  View,
  TouchableOpacity,
  Text,
  StyleSheet,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, gradients, radius, shadows } from '@/lib/constants';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface IconProps {
  readonly color: string;
  readonly size: number;
}

interface TabConfig {
  /** Cle logique (ex: 'sell', 'home') */
  key: string;
  /** Label affiche sous l'icone */
  label: string;
  /** Composant icone -- doit accepter { color, size } */
  icon: React.ComponentType<IconProps>;
  /** Si true, onglet special avec medaillon or surleve */
  isSpecial?: boolean;
}

interface TabBarProps extends BottomTabBarProps {
  tabs: TabConfig[];
  /** Mode d'affichage ('client' | 'seller') -- peut servir pour des variantes */
  mode?: string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const TAB_BAR_BASE_HEIGHT = 64;
const SPECIAL_CIRCLE_SIZE = 56;
const NORMAL_ICON_SIZE = 21;
const SPECIAL_ICON_SIZE = 24;
const LABEL_FONT_SIZE = 10;
const BAR_MARGIN = 16;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function TabBar(props: TabBarProps) {
  const { state, navigation, tabs } = props;
  const insets = useSafeAreaInsets();

  const safeBottom = Math.max(insets.bottom, 0);
  const tabBarHeight = TAB_BAR_BASE_HEIGHT + safeBottom + 8;

  const handleTabPress = useCallback(
    (routeIndex: number) => {
      const route = state.routes[routeIndex];
      if (!route) return;

      const event = navigation.emit({
        type: 'tabPress',
        target: route.key,
        canPreventDefault: true,
      });

      const isAlreadyFocused = route.name === state.routes[state.index]?.name;

      if (!isAlreadyFocused && !event.defaultPrevented) {
        navigation.navigate(route.name, route.params, { merge: true });
      }
    },
    [navigation, state],
  );

  const getRouteIndexForTab = useCallback(
    (tab: TabConfig): number => {
      return state.routes.findIndex((r) => {
        if (r.name === tab.key) return true;
        if (r.name.startsWith(tab.key + '/')) return true;
        const routeBase = r.name.split('/')[0];
        return routeBase === tab.key;
      });
    },
    [state.routes],
  );

  const activeRoute = state.routes[state.index];
  const activeRouteBase = activeRoute?.name.split('/')[0] ?? '';

  return (
    <View
      style={[
        styles.container,
        { height: tabBarHeight, paddingBottom: safeBottom },
      ]}
    >
      <LinearGradient
        colors={['rgba(30,26,22,0.98)', 'rgba(19,17,16,0.98)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.bar}
      >
        <View style={styles.tabRow}>
          {tabs.map((tab) => {
            const routeIndex = getRouteIndexForTab(tab);
            const isActive = activeRouteBase === tab.key;
            const IconComponent = tab.icon;

            if (tab.isSpecial) {
              return (
                <TouchableOpacity
                  key={tab.key}
                  activeOpacity={0.7}
                  onPress={() => {
                    if (routeIndex >= 0) handleTabPress(routeIndex);
                  }}
                  style={styles.specialTab}
                >
                  <LinearGradient
                    colors={
                      isActive
                        ? (gradients.gold as unknown as readonly [string, string, ...string[]])
                        : (['#3A332A', '#241F1A'] as unknown as readonly [string, string, ...string[]])
                    }
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={[styles.specialCircle, isActive ? shadows.goldGlow : undefined]}
                  >
                    <IconComponent
                      color={isActive ? colors.onyx : colors.goldMuted}
                      size={SPECIAL_ICON_SIZE}
                    />
                  </LinearGradient>
                  <Text
                    style={[
                      styles.specialLabel,
                      { color: isActive ? colors.goldBright : colors.textMuted },
                    ]}
                    numberOfLines={1}
                  >
                    {tab.label}
                  </Text>
                </TouchableOpacity>
              );
            }

            return (
              <TouchableOpacity
                key={tab.key}
                activeOpacity={0.7}
                onPress={() => {
                  if (routeIndex >= 0) handleTabPress(routeIndex);
                }}
                style={styles.normalTab}
              >
                <View style={styles.iconWrap}>
                  {isActive && <View style={styles.activePill} />}
                  <IconComponent
                    color={isActive ? colors.goldBright : colors.textMuted}
                    size={NORMAL_ICON_SIZE}
                  />
                </View>
                <Text
                  style={[
                    styles.normalLabel,
                    { color: isActive ? colors.goldBright : colors.textMuted },
                  ]}
                  numberOfLines={1}
                >
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </LinearGradient>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: BAR_MARGIN,
  },
  bar: {
    flex: 1,
    borderRadius: radius.xxl,
    borderWidth: 1,
    borderColor: `${colors.gold}2E`,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.5,
        shadowRadius: 20,
      },
      android: {
        elevation: 16,
      },
    }),
  },
  tabRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: TAB_BAR_BASE_HEIGHT,
    paddingHorizontal: 4,
  },
  normalTab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    paddingBottom: 6,
  },
  iconWrap: {
    width: 44,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activePill: {
    position: 'absolute',
    top: 0,
    width: 34,
    height: 3,
    borderRadius: 2,
    backgroundColor: colors.gold,
    opacity: 0.85,
  },
  normalLabel: {
    fontSize: LABEL_FONT_SIZE,
    fontFamily: 'Inter_600SemiBold',
    letterSpacing: 0.3,
    lineHeight: 13,
  },
  specialTab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: 4,
  },
  specialCircle: {
    width: SPECIAL_CIRCLE_SIZE,
    height: SPECIAL_CIRCLE_SIZE,
    borderRadius: SPECIAL_CIRCLE_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -(SPECIAL_CIRCLE_SIZE / 2 + 8),
    borderWidth: 1,
    borderColor: `${colors.goldBright}59`,
    ...Platform.select({
      ios: {
        shadowColor: 'rgba(216, 180, 90, 0.5)',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 1,
        shadowRadius: 12,
      },
      android: {
        elevation: 14,
      },
    }),
  },
  specialLabel: {
    fontSize: LABEL_FONT_SIZE,
    fontFamily: 'Inter_700Bold',
    letterSpacing: 0.3,
    lineHeight: 13,
    marginTop: 4,
  },
});