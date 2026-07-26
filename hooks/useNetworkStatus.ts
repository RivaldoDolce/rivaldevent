/**
 * Hook de detection du statut reseau.
 *
 * Utilise expo-network pour detecter :
 * - isConnected : le telephone a un reseau actif (WiFi/Mobile)
 * - isInternetReachable : le reseau a acces a internet (ping)
 * - type : 'wifi' | 'cellular' | 'unknown' | 'none'
 *
 * Usage dans les composants :
 *   const { isConnected, isInternetReachable, type } = useNetworkStatus();
 *
 * Pour bloquer une action hors ligne :
 *   if (!isConnected) { showOfflineBanner(); return; }
 */

import { useState, useEffect } from 'react';
import { useNetworkState as useExpoNetworkStatus } from 'expo-network';

interface NetworkStatus {
  readonly isConnected: boolean;
  readonly isInternetReachable: boolean | null;
  readonly type: string;
}

export function useNetworkStatus(): NetworkStatus {
  const expoStatus = useExpoNetworkStatus();

  const [status, setStatus] = useState<NetworkStatus>({
    isConnected: expoStatus.isConnected ?? false,
    isInternetReachable: expoStatus.isInternetReachable ?? null,
    type: expoStatus.type ?? 'unknown',
  });

  useEffect(() => {
    setStatus({
      isConnected: expoStatus.isConnected ?? false,
      isInternetReachable: expoStatus.isInternetReachable ?? null,
      type: expoStatus.type ?? 'unknown',
    });
  }, [expoStatus.isConnected, expoStatus.isInternetReachable, expoStatus.type]);

  return status;
}
