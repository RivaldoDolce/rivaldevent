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
import { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import { preventAutoHideAsync, hideAsync } from 'expo-splash-screen';
import { QueryClientProvider } from '@tanstack/react-query';
import { ClerkProvider } from '@clerk/expo';
import { tokenCache } from '@clerk/expo/token-cache';
import { useFonts } from 'expo-font';
import { PlayfairDisplay_600SemiBold, PlayfairDisplay_700Bold } from '@expo-google-fonts/playfair-display';
import { Inter_400Regular, Inter_500Medium, Inter_600SemiBold } from '@expo-google-fonts/inter';
import { Asset } from 'expo-asset';

import { queryClient, initQueryClientPersistence } from '@/lib/query-client';
import { logger } from '@/lib/logger';
import { colors } from '@/lib/constants';
import { RouteTransitionLoader, RouteTransitionProvider } from '@/components/ui/RouteTransitionLoader';
import { clientBackgrounds, authBackgrounds } from '@/lib/images';

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
  const [fontsLoaded] = useFonts({
    PlayfairDisplay_600SemiBold,
    PlayfairDisplay_700Bold,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
  });

  // Masque le splash natif des que le JS est pret : l'ecran anime
  // /(auth)/splash prend le relais immediatement. On ne bloque PLUS
  // sur les polices ni sur la persistance SQLite (chargees en fond),
  // sinon l'APK autonome reste fige plusieurs secondes sur l'image
  // statique pendant qu'Expo Go (Metro, cache chaud) parait instantane.
  useEffect(() => {
    hideAsync().catch(() => {
      /* le splash natif est deja masque */
    });
  }, []);

  // Persistance TanStack Query en arriere-plan (non bloquant).
  useEffect(() => {
    initQueryClientPersistence().catch((err) => {
      logger.debug('[RootLayout] init error:', err);
    });
  }, []);

  useEffect(() => {
    Asset.loadAsync([...Object.values(authBackgrounds), ...Object.values(clientBackgrounds)]).catch(() => {});
  }, []);

  void fontsLoaded;

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
