/**
 * Stack de l'onglet Favoris.
 *
 * Donne au Favoris sa propre pile de navigation afin que le retour
 * (router.back) revienne TOUJOURS a la liste des favoris avec son etat
 * exact (segment Evenements/Lieux, scroll), au lieu de basculer vers
 * l'onglet Accueil ou Explorer qui contient les pages de detail.
 *
 * Les ecrans de detail sont des fichiers de re-export qui partagent
 * exactement le meme composant que leurs equivalents Home/Explorer.
 */

import { Stack } from 'expo-router';

import { colors } from '@/lib/constants';
import { useRouteTransitionScreenListeners } from '@/components/ui/RouteTransitionLoader';

export default function FavoritesStackLayout() {
  const routeTransitionScreenListeners = useRouteTransitionScreenListeners();

  return (
    <Stack
      screenListeners={routeTransitionScreenListeners}
      screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="[id]" />
      <Stack.Screen name="venues/[id]" />
      <Stack.Screen name="venues/reserve/[id]" />
    </Stack>
  );
}
