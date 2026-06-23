/**
 * Layout groupe authentification.
 *
 * Stack sans header, transitions slide horizontal.
 * Aucune tab bar (flux immersif).
 *
 * Routes :
 * - splash       : ecran de demarrage
 * - onboarding   : 3 slides de presentation
 * - login        : connexion email/phone/google
 * - register     : inscription
 * - otp          : verification OTP SMS/email
 */

import { Stack } from 'expo-router';

import { colors } from '@/lib/constants';

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.sand },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="splash" />
      <Stack.Screen name="onboarding" />
      <Stack.Screen name="login" />
      <Stack.Screen name="register" />
      <Stack.Screen name="otp" />
    </Stack>
  );
}