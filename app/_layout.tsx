/**
 * Layout racine de l'application.
 *
 * Initialise tous les providers globaux :
 * - ClerkProvider (auth : email/password, OTP, Google OAuth)
 * - QueryClientProvider (TanStack Query)
 * - SafeAreaProvider (insets)
 * - StatusBar (style light, fond noir)
 * - useFonts (Playfair Display + Inter — design system Noir & Or)
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
import { ClerkProvider } from '@clerk/expo';
import { tokenCache } from '@clerk/expo/token-cache';
import { useFonts } from 'expo-font';
import { PlayfairDisplay_600SemiBold, PlayfairDisplay_700Bold } from '@expo-google-fonts/playfair-display';
import { Inter_400Regular, Inter_600SemiBold } from '@expo-google-fonts/inter';
// @ts-ignore
import { Asset } from 'expo-asset';

import { queryClient, initQueryClientPersistence } from '@/lib/query-client';
import { logger } from '@/lib/logger';
import { colors } from '@/lib/constants';
import { RouteTransitionLoader, RouteTransitionProvider } from '@/components/ui/RouteTransitionLoader';
import { clientBackgrounds } from '@/lib/images';

// ============================================================
// Configuration & Initialisation
// ============================================================

const clerkPublishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY ?? '';

if (!clerkPublishableKey) {
  throw new Error('EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY est manquant (voir .env)');
}

LogBox.ignoreLogs(['[Layout children]', 'Unable to resolve manifest assets']);

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
    PlayfairDisplay_600SemiBold,
    PlayfairDisplay_700Bold,
    Inter_400Regular,
    Inter_600SemiBold,
  });

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

  useEffect(() => {
    Asset.loadAsync(Object.values(clientBackgrounds)).catch(() => {});
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
    <ClerkProvider publishableKey={clerkPublishableKey} tokenCache={tokenCache}>
      <QueryClientProvider client={queryClient}>
        <SafeAreaProvider>
          <RouteTransitionProvider>
            <StatusBar style="light" backgroundColor={colors.background} />
            <Stack
              screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: colors.background },
                animation: 'slide_from_right',
                animationDuration: 250,
                gestureEnabled: true,
              }}
            >
              <Stack.Screen name="(auth)" />
              <Stack.Screen name="oauth-callback" />
              <Stack.Screen name="(client)" />
              <Stack.Screen name="(seller)" />
              <Stack.Screen name="(shared)" options={{ headerShown: false, animation: 'slide_from_right' }} />
              <Stack.Screen name="(purchase)" options={{ presentation: 'modal' }} />
              <Stack.Screen name="(modal)" options={{ presentation: 'modal' }} />
            </Stack>
            <RouteTransitionLoader />
          </RouteTransitionProvider>
        </SafeAreaProvider>
      </QueryClientProvider>
    </ClerkProvider>
  );
}
