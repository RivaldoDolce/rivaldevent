/**
 * Layout groupe client (mode client, 4 onglets).
 *
 * Tab Bar custom avec :
 * - Home (terracotta actif)
 * - Explore
 * - Tickets
 * - Profile
 *
 * L'onglet actif est en terracotta (CTA principal client).
 * Les inactifs sont en stone outline.
 */

import { Tabs } from 'expo-router';
import type { Href } from 'expo-router';

import { colors } from '@/lib/constants';
import {
  HomeIcon,
  ExploreIcon,
  TicketIcon,
  ProfileIcon,
  type IconComponent,
} from '@/components/icons/TabIcons';

const TABS: ReadonlyArray<{
  readonly name: string;
  readonly label: string;
  readonly icon: IconComponent;
  readonly href: Href;
}> = [
  { name: 'home', label: 'Accueil', icon: HomeIcon, href: '/(client)/home' },
  { name: 'explore', label: 'Explorer', icon: ExploreIcon, href: '/(client)/explore' },
  { name: 'tickets', label: 'Billets', icon: TicketIcon, href: '/(client)/tickets' },
  { name: 'profile', label: 'Profil', icon: ProfileIcon, href: '/(client)/profile' },
];

export default function ClientLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.terracotta,
        tabBarInactiveTintColor: colors.stone,
        tabBarStyle: {
          backgroundColor: colors.sand,
          borderTopWidth: 1,
          borderTopColor: `${colors.stone}33`,
          paddingBottom: 8,
          paddingTop: 4,
          height: 60,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '500',
        },
      }}
    >
      {TABS.map((tab) => (
        <Tabs.Screen
          key={tab.name}
          name={tab.name}
          options={{
            title: tab.label,
            tabBarIcon: ({ color, size }) => {
              const Icon = tab.icon;
              return <Icon color={color} size={size} />;
            },
          }}
        />
      ))}
    </Tabs>
  );
}