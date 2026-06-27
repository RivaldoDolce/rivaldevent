import { Tabs } from 'expo-router';

import { colors } from '@/lib/constants';
import {
  HomeIcon,
  ExploreIcon,
  TicketIcon,
  ProfileIcon,
  type IconComponent,
} from '@/components/icons/TabIcons';

interface TabConfig {
  readonly name: string;
  readonly label: string;
  readonly icon: IconComponent;
}

const TABS: readonly TabConfig[] = [
  { name: 'home/index', label: 'Accueil', icon: HomeIcon },
  { name: 'explore/index', label: 'Explorer', icon: ExploreIcon },
  { name: 'tickets/index', label: 'Billets', icon: TicketIcon },
  { name: 'profile/index', label: 'Profil', icon: ProfileIcon },
];

const HIDDEN_TAB_ROUTES = [
  'home/[id]',
  'tickets/[id]',
  'explore/venues',
  'explore/venues/index',
  'explore/venues/[id]',
  'profile/switch-seller',
] as const;

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
            tabBarLabel: tab.label,
            title: tab.label,
            tabBarIcon: ({ color, size }) => {
              const Icon = tab.icon;
              return <Icon color={color} size={size} />;
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