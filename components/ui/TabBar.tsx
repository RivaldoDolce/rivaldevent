/**
 * TabBar personnalisee -- Rivald'Event
 *
 * Gere l'affichage des onglets normaux ET de l'onglet special (Vendre)
 * avec un cercle or surleve au centre de la barre.
 *
 * Architecture :
 *   - Onglets normaux : flex:1, icone + label centres
 *   - Onglet special : cercle or surleve (debordement vertical gere),
 *     icone blanche a l'interieur, label en dessous
 *   - Safe areas gerees via useSafeAreaInsets
 *
 * Corrections apporte vs version precedente :
 *   1. Icone de l'onglet special est desormais rendue comme un composant
 *      (React.ComponentType<IconProps>) au lieu d'un ReactNode vide
 *   2. Alignement vertical coherent entre onglets normaux et special
 *   3. Navigation fonctionnelle via les props de BottomTabBarProps
 *   4. Dimensions et espacement calibres pour 5 onglets vendeur
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
import { colors } from '@/lib/constants';

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
  /** Si true, onglet special avec cercle or surleve */
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

const TAB_BAR_BASE_HEIGHT = 60;
const SPECIAL_CIRCLE_SIZE = 52;
const NORMAL_ICON_SIZE = 22;
const SPECIAL_ICON_SIZE = 24;
const LABEL_FONT_SIZE = 10;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function TabBar(props: TabBarProps) {
  const { state, navigation, tabs } = props;
  const insets = useSafeAreaInsets();

  const safeBottom = Math.max(insets.bottom, 0);
  const tabBarHeight = TAB_BAR_BASE_HEIGHT + safeBottom;

  const handleTabPress = useCallback(
    (routeIndex: number) => {
      const route = state.routes[routeIndex];
      if (!route) return;

      const event = navigation.emit({
        type: 'tabPress',
        target: route.key,
        canPreventDefault: true,
      });

      const isAlreadyFocused =
        route.name === state.routes[state.index]?.name;

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
        // Match "sell/index" -> tab.key "sell"
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
      <View style={styles.tabRow}>
        {tabs.map((tab) => {
          const routeIndex = getRouteIndexForTab(tab);
          const isActive = activeRouteBase === tab.key;

          // Rendre le composant icone avec les bonnes props
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
                <View
                  style={[
                    styles.specialCircle,
                    {
                      backgroundColor: isActive
                        ? colors.primary
                        : colors.gold,
                    },
                  ]}
                >
                  <IconComponent
                    color={colors.white}
                    size={SPECIAL_ICON_SIZE}
                  />
                </View>
                <Text
                  style={[
                    styles.specialLabel,
                    { color: isActive ? colors.primary : colors.gold },
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
              <IconComponent
                color={isActive ? colors.primary : colors.muted}
                size={NORMAL_ICON_SIZE}
              />
              <Text
                style={[
                  styles.normalLabel,
                  { color: isActive ? colors.primary : colors.muted },
                ]}
                numberOfLines={1}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
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
    backgroundColor: colors.background,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.08,
        shadowRadius: 6,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  tabRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: TAB_BAR_BASE_HEIGHT,
  },
  // -- Onglet normal --
  normalTab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingBottom: 2,
  },
  normalLabel: {
    fontSize: LABEL_FONT_SIZE,
    fontFamily: 'Inter-Medium',
    letterSpacing: 0.2,
    lineHeight: 13,
  },
  // -- Onglet special (Vendre) --
  specialTab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: 2,
  },
  specialCircle: {
    width: SPECIAL_CIRCLE_SIZE,
    height: SPECIAL_CIRCLE_SIZE,
    borderRadius: SPECIAL_CIRCLE_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    // Le cercle deborde vers le haut de la barre
    marginTop: -(SPECIAL_CIRCLE_SIZE / 2 + 4),
    ...Platform.select({
      ios: {
        shadowColor: 'rgba(201, 168, 76, 0.5)',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 1,
        shadowRadius: 10,
      },
      android: {
        elevation: 12,
      },
    }),
  },
  specialLabel: {
    fontSize: LABEL_FONT_SIZE,
    fontFamily: 'Inter-Bold',
    letterSpacing: 0.3,
    lineHeight: 13,
    marginTop: 6,
  },
});