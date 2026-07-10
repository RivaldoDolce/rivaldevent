/**
 * Layout du mode Vendeur.
 *
 * Utilise le MEME composant TabBar personnalise que le mode client
 * pour garantir :
 *   - Affichage fiable des icones (lucide-react-native)
 *   - Ordre des onglets controle (Profil TOUJOURS en dernier)
 *   - Onglet "Vendre" surleve en or (isSpecial)
 *   - Safe areas gerees par TabBar.tsx
 *   - Comportement uniforme entre les deux modes
 *
 * Noms de route Expo Router :
 *   Les ecrans sont dans des dossiers (home/index.tsx)
 *   donc les noms de route sont "home/index", "explore/index", etc.
 *   Tabs.Screen name DOIT matcher le chemin reel du fichier.
 *
 * Corrections vs version precedente :
 *   - Retrait de la prop onTabPress (inexistante sur TabBar)
 *   - Navigation geree nativement par BottomTabBarProps
 *   - Icones passees comme composants (pas comme ReactNode)
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
import TabBar from '@/components/ui/TabBar';

interface TabConfig {
  readonly name: string;
  readonly label: string;
  readonly icon: IconComponent;
  readonly isSpecial?: boolean;
  /**
   * Cle logique pour la TabBar custom.
   * Permet de mapper "home/index" -> "home" pour l'affichage.
   * Si non renseigne, utilise le dernier segment du name.
   */
  readonly tabKey?: string;
}

// Ordre garanti : Profil TOUJOURS en dernier
// Vendre au centre (3e sur 5) pour un acces naturel au pouce
const TABS: readonly TabConfig[] = [
  { name: 'home/index', label: 'Accueil', icon: HomeIcon, tabKey: 'home' },
  { name: 'explore/index', label: 'Explorer', icon: ExploreIcon, tabKey: 'explore' },
  { name: 'tickets/index', label: 'Billets', icon: TicketIcon, tabKey: 'tickets' },
  { name: 'sell/index', label: 'Vendre', icon: SellIcon, isSpecial: true, tabKey: 'sell' },
  { name: 'profile/index', label: 'Profil', icon: ProfileIcon, tabKey: 'profile' },
];

// Routes imbriquees a cacher de la tab bar
// Seulement les routes qui EXISTENT reellement dans le filesystem
const HIDDEN_TAB_ROUTES = [
  'profile/switch-client',
] as const;

export default function SellerLayout() {
  return (
    <Tabs
      tabBar={(props) => (
        <TabBar
          state={props.state}
          navigation={props.navigation}
          descriptors={props.descriptors}
          insets={props.insets}
          tabs={TABS.map((t) => ({
            key: t.tabKey ?? t.name.split('/').pop() ?? t.name,
            label: t.label,
            icon: t.icon,
            isSpecial: t.isSpecial,
          }))}
        />
      )}
      screenOptions={{
        headerShown: false,
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
