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
 *   Les ecrans sont dans des dossiers (home/index.tsx)
 *   donc les noms de route sont "home/index", "explore/index", etc.
 *   Tabs.Screen name DOIT matcher le chemin reel du fichier.
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
  /**
   * Cle logique pour la TabBar custom.
   * Permet de mapper "home/index" -> "home" pour l'affichage.
   * Si non renseigne, utilise le dernier segment du name.
   */
  readonly tabKey?: string;
}

// Ordre garanti : Profil TOUJOURS en dernier
const TABS: readonly TabConfig[] = [
  { name: 'home/index', label: 'Accueil', icon: HomeIcon, tabKey: 'home' },
  { name: 'explore/index', label: 'Explorer', icon: ExploreIcon, tabKey: 'explore' },
  { name: 'tickets/index', label: 'Billets', icon: TicketIcon, tabKey: 'tickets' },
  { name: 'profile/index', label: 'Profil', icon: ProfileIcon, tabKey: 'profile' },
];

// Routes imbriquees a cacher de la tab bar
// Seulement les routes qui EXISTENT reellement dans le filesystem
const HIDDEN_TAB_ROUTES = [
  'home/[id]',
  'tickets/[id]',
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
          tabs={TABS.map((t) => ({
            key: t.tabKey ?? t.name.split('/').pop() ?? t.name,
            label: t.label,
            icon: t.icon,
          }))}
          onTabPress={(routeName) => props.navigation.navigate(routeName)}
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