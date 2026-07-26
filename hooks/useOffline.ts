/**
 * Hook d'indicateur hors-ligne.
 *
 * Wrapper simplifie autour de useNetworkStatus.
 * Retourne uniquement un booleen `isOffline`.
 *
 * Usage :
 *   const isOffline = useOffline();
 *   if (isOffline) return <OfflineBanner />;
 */



import { useNetworkStatus } from './useNetworkStatus';



export function useOffline(): boolean {

  const { isInternetReachable } = useNetworkStatus();

  if (isInternetReachable === null) {

    return false;

  }
  
  return !isInternetReachable;

}
