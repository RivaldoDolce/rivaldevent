/**
 * Layout racine de l'application.
 *
 * Initialise tous les providers globaux :
 * - QueryClientProvider (TanStack Query)
 * - SafeAreaProvider (insets)
 * - StatusBar (style auto, bg sand)
 *
 * GestureHandlerRootView a ete retire car @gorhom/bottom-sheet
 * (qui en dependait) a ete remplace par une implementation native.
 * react-native-gesture-handler reste en dependance pour un
 * eventuel usage futur mais n'est plus wrappe ici.
 *
 * Redirige vers (auth)/splash au demarrage.
 */

import { LogBox } from 'react-native';
import { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';

import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
// eslint-disable-next-line import/no-unresolved
import * as SplashScreen from 'expo-splash-screen';
import { QueryClientProvider } from '@tanstack/react-query';

import { queryClient, initQueryClientPersistence } from '@/lib/query-client';
import { logger } from '@/lib/logger';
import { colors } from '@/lib/constants';

// ============================================================
// Couche 1 : LogBox — filtre les warnings Expo Router
// ============================================================
LogBox.ignoreLogs([
  '[Layout children]',
  'Unable to resolve manifest assets',
]);

// ============================================================
// Couche 2 : Override console.error pour supprimer les erreurs
// reseau internes (non declenchees par l'utilisateur).
// Les erreurs utilisateur sont gerees par l'UI (toast/alert).
// ============================================================
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

SplashScreen.preventAutoHideAsync().catch(() => {
  // Silent fail
});

export default function RootLayout() {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const init = async () => {
      try {
        await initQueryClientPersistence();
      } catch (err) {
        logger.debug('[RootLayout] init error:', err);
      } finally {
        setIsReady(true);
        await SplashScreen.hideAsync();
      }
    };

    init();
  }, []);

  if (!isReady) {
    return null;
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