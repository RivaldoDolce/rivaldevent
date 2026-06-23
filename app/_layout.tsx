/**
 * Layout racine de l'application.
 *
 * Initialise tous les providers globaux :
 * - QueryClientProvider (TanStack Query)
 * - SafeAreaProvider (insets)
 * - GestureHandlerRootView (requise par @gorhom/bottom-sheet)
 * - StatusBar (style auto, bg sand)
 *
 * Redirige vers (auth)/splash au demarrage.
 */

import { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
// eslint-disable-next-line import/no-unresolved
import * as SplashScreen from 'expo-splash-screen';
import { QueryClientProvider } from '@tanstack/react-query';

import { queryClient, initQueryClientPersistence } from '@/lib/query-client';
import { colors } from '@/lib/constants';

// Garder le splash screen visible pendant le chargement initial
SplashScreen.preventAutoHideAsync().catch(() => {
  // Silent fail : peut arriver si le splash est deja masque
});

export default function RootLayout() {
  const [isReady, setIsReady] = useState(false);

  // Initialisation async (fonts, persistence query client, etc.)
  useEffect(() => {
    const init = async () => {
      try {
        await initQueryClientPersistence();
      } catch (err) {
        console.error('[RootLayout] init error:', err);
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
        <GestureHandlerRootView style={{ flex: 1 }}>
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
        </GestureHandlerRootView>
      </SafeAreaProvider>
    </QueryClientProvider>
  );
}