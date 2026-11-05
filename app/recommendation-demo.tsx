/**
 * Route de démonstration du recommandeur contextuel.
 *
 * Route publique volontairement isolée :
 * - aucun hook d'authentification ;
 * - aucun accès Supabase / Clerk / paiement ;
 * - aucun module natif spécifique ;
 * - données et calculs entièrement locaux.
 *
 * Accessible sur le web via `/recommendation-demo`.
 */

import RecommendationsDemoScreen from '@/components/recommendations/RecommendationsDemoScreen';

export default function RecommendationDemoRoute() {
  return <RecommendationsDemoScreen />;
}
