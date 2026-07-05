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
 *
 * Noms de route Expo Router :
 *   Les ecrans sont dans des dossiers (home/index.tsx)
 *   donc les noms de route sont "home/index", "explore/index", etc.
 *   Tabs.Screen name DOIT matcher le chemin reel du fichier.
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
  { name: 'sell/index', label: 'Vendre', icon: SellIcon, isSpecial: true, tabKey: 'sell' },
  { name: 'profile/index', label: 'Profil', icon: ProfileIcon, tabKey: 'profile' },
];

// Routes imbriquees a cacher de la tab bar
// Seulement les routes qui EXISTENT reellement dans le filesystem
// Les routes sell/create/*, sell/sales, etc. seront ajoutees
// quand les fichiers seront crees.
const HIDDEN_TAB_ROUTES = [
  'profile/switch-client',
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
            key: t.tabKey ?? t.name.split('/').pop() ?? t.name,
            label: t.label,
            icon: t.icon,
            isSpecial: t.isSpecial,
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