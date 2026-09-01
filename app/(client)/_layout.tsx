/**
 * Layout du mode Client.
 *
 * Utilise le composant TabBar personnalise qui gere :
 *   - Les safe areas (useSafeAreaInsets dans TabBar.tsx)
 *   - La hauteur dynamique de la barre
 *   - L'affichage fiable des icones
 *   - L'ordre des onglets (Profil TOUJOURS en dernier)
 *
 * Noms de route Expo Router :
 *   Chaque onglet pointe vers un dossier qui contient sa propre Stack.
 *   Les details sont ainsi depiles dans l'onglet d'origine au retour.
 *
 * Corrections vs version precedente :
 *   - Retrait de la prop onTabPress (inexistante sur TabBar)
 *   - Navigation geree nativement par BottomTabBarProps
 *   - Icones passees comme composants (pas comme ReactNode)
 */

import React, { useCallback, useMemo } from 'react';
import { Tabs } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  HomeIcon,
  ExploreIcon,
  TicketIcon,
  ProfileIcon,
  type IconComponent,
} from '@/components/icons/TabIcons';
import TabBar from '@/components/ui/TabBar';
import { OfflineBanner } from '@/components/ui/OfflineBanner';

interface TabConfig {
  readonly name: string;
  readonly label: string;
  readonly icon: IconComponent;
}

// Ordre garanti : Profil TOUJOURS en dernier
const TABS: readonly TabConfig[] = [
  { name: 'home', label: 'Accueil', icon: HomeIcon },
  { name: 'explore', label: 'Explorer', icon: ExploreIcon },
  { name: 'tickets', label: 'Billets', icon: TicketIcon },
  { name: 'profile', label: 'Profil', icon: ProfileIcon },
];

const MemoTabBar = React.memo(TabBar);

const tabBarIconMap: Record<string, IconComponent> = {
  home: HomeIcon,
  explore: ExploreIcon,
  tickets: TicketIcon,
  profile: ProfileIcon,
};

export default function ClientLayout() {
  const insets = useSafeAreaInsets();
  const tabsForBar = useMemo(() => TABS.map((t) => ({ key: t.name, label: t.label, icon: t.icon })), []);
  const renderTabBar = useCallback(
    (props: any) => (
      <MemoTabBar state={props.state} navigation={props.navigation} descriptors={props.descriptors} insets={insets} tabs={tabsForBar} />
    ),
    [insets, tabsForBar],
  );

  return (
    <>
      <OfflineBanner />
      <Tabs
        tabBar={renderTabBar}
        screenOptions={{
          headerShown: false,
          // @ts-ignore expo-router Tabs extra props
          lazy: true,
          detachInactiveScreens: true,
          freezeOnBlur: true,
          tabBarHideOnKeyboard: true,
        } as any}
      >
        {TABS.map((tab) => (
          <Tabs.Screen
            key={tab.name}
            name={tab.name}
            options={{
              tabBarLabel: tab.label,
              title: tab.label,
              tabBarIcon: ({ color, size }) => {
                const Icon = tabBarIconMap[tab.name]!;
                return <Icon color={color} size={size} />;
              },
            }}
          />
        ))}
      </Tabs>
    </>
  );
}
