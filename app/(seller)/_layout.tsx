/**
 * Layout du mode Vendeur.
 *
 * Utilise le MEME composant TabBar personnalise que le mode client
 * pour garantir :
 *   - Affichage fiable des icones (lucide-react-native)
 *   - Ordre des onglets controle (Profil TOUJOURS en dernier)
 *   - Onglet "Vendre" surleve en gold (isSpecial)
 *   - Safe areas gerees par TabBar.tsx
 *   - Comportement uniforme entre les deux modes
 */

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
import { TabBar } from '@/components/ui/TabBar';

interface TabConfig {
  readonly name: string;
  readonly label: string;
  readonly icon: IconComponent;
  readonly isSpecial?: boolean;
}

// Ordre garanti : Profil TOUJOURS en dernier
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
      // TabBar personnalisee : memes icones, meme ordre, meme safe areas que le client
      tabBar={(props) => (
        <TabBar
          state={props.state}
          mode="seller"
          tabs={TABS.map((t) => ({
            key: t.name,
            label: t.label,
            icon: t.icon,
            isSpecial: t.isSpecial,
          }))}
          onTabPress={(routeName) => props.navigation.navigate(routeName)}
        />
      )}
      screenOptions={{
        headerShown: false,
        // Plus besoin de tabBarStyle/paddingBottom/height : TabBar.tsx gere tout
      }}
    >
      {TABS.map((tab) => (
        <Tabs.Screen
          key={tab.name}
          name={tab.name}
          options={{
            tabBarLabel: tab.label,
            title: tab.label,
            // tabBarIcon reste pour la compat Expo Router, mais TabBar personnalisee
            // utilise directement les icones du tableau TABS
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