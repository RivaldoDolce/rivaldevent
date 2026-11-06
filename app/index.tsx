import { Redirect } from 'expo-router';

/**
 * Ecran racine.
 * Redirige systematiquement vers le splash qui gere
 * l'animation + la verification de session + le redirect final.
 */
export default function Index() {
  return <Redirect href="/(auth)/splash" />;
}