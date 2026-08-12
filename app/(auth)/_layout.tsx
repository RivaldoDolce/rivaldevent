/**
 * Layout de la zone authentification — design « Noir & Or ».
 *
 * Pile de navigation sans header natif, transitions latérales
 * et fond noir profond pour éviter tout flash blanc au changement d'écran.
 */

import { Stack } from 'expo-router';

import { colors } from '@/lib/constants';

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="splash" />
      <Stack.Screen name="onboarding" />
      <Stack.Screen name="login" />
      <Stack.Screen name="register" />
      <Stack.Screen name="phone" />
      <Stack.Screen name="otp" />
    </Stack>
  );
}