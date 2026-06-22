/**
 * Layout groupe vendeur (mode vendeur, 5 onglets).
 *
 * Tab Bar custom avec :
 * - Home (forest actif)
 * - Explore
 * - Tickets
 * - Sell : onglet special gold surleve de 4px
 * - Profile
 *
 * L'onglet "Sell" est toujours en gold et surleve pour mettre en avant
 * l'action principale vendeur.
 */

import { Tabs } from 'expo-router';
import type { Href } from 'expo-router';

import { colors } from '@/lib/constants';
import {
  HomeIcon,
  ExploreIcon,
  TicketIcon,
  ProfileIcon,
  SellIcon,
  type IconComponent,
} from '@/components/icons/TabIcons';

const TABS: readonly {
  readonly name: string;
  readonly label: string;
  readonly icon: IconComponent;
  readonly href: Href;
  readonly isSpecial?: boolean;
}[] = [
  { name: 'home', label: 'Accueil', icon: HomeIcon, href: '/(seller)/home' },
  { name: 'explore', label: 'Explorer', icon: ExploreIcon, href: '/(seller)/explore' },
  { name: 'tickets', label: 'Billets', icon: TicketIcon, href: '/(seller)/tickets' },
  {
    name: 'sell',
    label: 'Vendre',
    icon: SellIcon,
    href: '/(seller)/sell',
    isSpecial: true,
  },
  { name: 'profile', label: 'Profil', icon: ProfileIcon, href: '/(seller)/profile' },
];

export default function SellerLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.forest,
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
              return <Icon color={tab.isSpecial ? colors.gold : color} size={size} />;
            },
            tabBarButton: tab.isSpecial
              ? () => null // On garde le bouton natif pour l'instant ; le custom TabBar viendra quand on aura les vrais ecrans
              : undefined,
          }}
        />
      ))}
    </Tabs>
  );
}