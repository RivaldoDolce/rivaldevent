/**
 * Layout du mode Client.
 *
 * Utilise le composant TabBar personnalise qui gere :
 *   - Les safe areas (useSafeAreaInsets dans TabBar.tsx)
 *   - La hauteur dynamique de la barre
 *   - L'affichage fiable des icones
 *   - L'ordre des onglets (Profil TOUJOURS en dernier)
 *
 * Plus besoin de calculer insets/tabBarHeight ici : TabBar.tsx s'en charge.
 */

import { Tabs } from 'expo-router';
import {
  HomeIcon,
  ExploreIcon,
  TicketIcon,
  ProfileIcon,
  type IconComponent,
} from '@/components/icons/TabIcons';
import { TabBar } from '@/components/ui/TabBar';

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
      // TabBar personnalisee : icones, ordre, safe areas tout est gere
      tabBar={(props) => (
        <TabBar
          state={props.state}
          mode="client"
          tabs={TABS.map((t) => ({ key: t.name, label: t.label, icon: t.icon }))}
          onTabPress={(routeName) => props.navigation.navigate(routeName)}
        />
      )}
      screenOptions={{
        headerShown: false,
        // Plus besoin de tabBarStyle/height/paddingBottom : TabBar.tsx gere tout
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