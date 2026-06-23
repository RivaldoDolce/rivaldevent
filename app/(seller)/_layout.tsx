import { Tabs } from 'expo-router';

import { colors } from '@/lib/constants';
import {
  HomeIcon,
  ExploreIcon,
  TicketIcon,
  ProfileIcon,
  SellIcon,
  type IconComponent,
} from '@/components/icons/TabIcons';

interface TabConfig {
  readonly name: string;
  readonly label: string;
  readonly icon: IconComponent;
  readonly isSpecial?: boolean;
}

const TABS: readonly TabConfig[] = [
  { name: 'home', label: 'Accueil', icon: HomeIcon },
  { name: 'explore', label: 'Explorer', icon: ExploreIcon },
  { name: 'tickets', label: 'Billets', icon: TicketIcon },
  { name: 'sell', label: 'Vendre', icon: SellIcon, isSpecial: true },
  { name: 'profile', label: 'Profil', icon: ProfileIcon },
];

const HIDDEN_TAB_ROUTES = [
  'home/[id]',
  'tickets/[id]',
  'explore/venues',
  'explore/venues/index',
  'explore/venues/[id]',
  'profile/switch-client',
  'sell/create/step1',
  'sell/create/step2',
  'sell/create/step3',
  'sell/sales',
  'sell/scanner',
  'sell/wallet',
  'sell/promote',
] as const;

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
            tabBarLabel: tab.label,
            title: tab.label,
            tabBarIcon: ({ color, size }) => {
              const Icon = tab.icon;
              return <Icon color={tab.isSpecial ? colors.gold : color} size={size} />;
            },
          }}
        />
      ))}

      {HIDDEN_TAB_ROUTES.map((route) => (
        <Tabs.Screen key={route} name={route} options={{ href: null }} />
      ))}
    </Tabs>
  );
}