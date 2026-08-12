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
import { PlayfairDisplay_400Regular, PlayfairDisplay_500Medium, PlayfairDisplay_600SemiBold, PlayfairDisplay_700Bold, PlayfairDisplay_800ExtraBold, PlayfairDisplay_900Black } from '@expo-google-fonts/playfair-display';
import { Inter_300Light, Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold, Inter_800ExtraBold } from '@expo-google-fonts/inter';

import { queryClient, initQueryClientPersistence } from '@/lib/query-client';
import { logger } from '@/lib/logger';
import { colors } from '@/lib/constants';

// ============================================================
// Configuration & Initialisation
// ============================================================

const clerkPublishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY ?? '';

if (!clerkPublishableKey) {
  throw new Error('EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY est manquant (voir .env)');
}

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
    PlayfairDisplay_400Regular,
    PlayfairDisplay_500Medium,
    PlayfairDisplay_600SemiBold,
    PlayfairDisplay_700Bold,
    PlayfairDisplay_800ExtraBold,
    PlayfairDisplay_900Black,
    Inter_300Light,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Inter_800ExtraBold,
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
    <ClerkProvider publishableKey={clerkPublishableKey} tokenCache={tokenCache}>
      <QueryClientProvider client={queryClient}>
        <SafeAreaProvider>
          <StatusBar style="light" backgroundColor={colors.background} />
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: colors.background },
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
    </ClerkProvider>
  );
}