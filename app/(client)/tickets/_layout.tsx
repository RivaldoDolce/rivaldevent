/**
 * Layout de la pile "Mes billets" - Espace client.
 * Fond noir profond pour toute la pile tickets.
 */

import { Stack } from 'expo-router';

import { colors } from '@/lib/constants';

export default function TicketsStackLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="[id]" />
      <Stack.Screen name="event/[eventId]" />
    </Stack>
  );
}