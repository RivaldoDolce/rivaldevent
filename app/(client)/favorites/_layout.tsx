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

export default function FavoritesStackLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="[id]" />
      <Stack.Screen name="venues/[id]" />
      <Stack.Screen name="venues/reserve/[id]" />
    </Stack>
  );
}