/**
 * Layout racine de l'application.
 *
 * Initialise tous les providers globaux :
 * - QueryClientProvider (TanStack Query)
 * - SafeAreaProvider (insets)
 * - StatusBar (style auto, bg sand)
 * - useFonts (expo-font)
 *
 * Redirige vers (auth)/splash au demarrage.
 */

import { LogBox } from 'react-native';
import { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import { preventAutoHideAsync, hideAsync } from 'expo-splash-screen';
import { QueryClientProvider } from '@tanstack/react-query';
import { useFonts, Lobster_400Regular } from '@expo-google-fonts/lobster';

import { queryClient, initQueryClientPersistence } from '@/lib/query-client';
import { logger } from '@/lib/logger';
import { colors } from '@/lib/constants';

// ============================================================
// Configuration & Initialisation
// ============================================================

// Filtre les warnings de navigation Expo Router
LogBox.ignoreLogs(['[Layout children]', 'Unable to resolve manifest assets']);

// Supprime les erreurs réseau internes de la console
const _originalConsoleError = console.error;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
console.error = (...args: any[]) => {
  const message = args.map((a: unknown) => (typeof a === 'string' ? a : '')).join(' ');
  if (
    message.includes('Network request failed') ||
    message.includes('AuthRetryableFetchError') ||
    message.includes('fetch.umd.js')
  ) {
    return;
  }
  _originalConsoleError.apply(console, args);
};

// Empêche le splash screen de se cacher automatiquement
preventAutoHideAsync().catch(() => {
  /* Silent fail */
});

// ============================================================
// Composant Racine
// ============================================================

export default function RootLayout() {
  const [isQueryClientReady, setQueryClientReady] = useState(false);
  const [fontsLoaded] = useFonts({
    Lobster_400Regular,
    // On peut charger d'autres polices ici si besoin
  });

  // Initialise la persistance de React Query
  useEffect(() => {
    const init = async () => {
      try {
        await initQueryClientPersistence();
      } catch (err) {
        logger.debug('[RootLayout] init error:', err);
      } finally {
        setQueryClientReady(true);
      }
    };

    init();
  }, []);

  const isAppReady = fontsLoaded && isQueryClientReady;

  // Cache le splash screen une fois que l'app est prête
  useEffect(() => {
    if (isAppReady) {
      hideAsync();
    }
  }, [isAppReady]);

  if (!isAppReady) {
    return null; // Affiche le splash screen natif
  }

  return (
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider>
        <StatusBar style="dark" backgroundColor={colors.sand} />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: colors.sand },
          }}
        >
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(client)" />
          <Stack.Screen name="(seller)" />
          <Stack.Screen name="(purchase)" options={{ presentation: 'modal' }} />
          <Stack.Screen name="(modal)" options={{ presentation: 'modal' }} />
        </Stack>
      </SafeAreaProvider>
    </QueryClientProvider>
  );
}