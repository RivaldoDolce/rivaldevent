/**
 * Layout de la pile "Mes billets" - Espace client.
 * Fond noir profond pour toute la pile tickets.
 */

import { Stack } from 'expo-router';

import { colors } from '@/lib/constants';
import { useRouteTransitionScreenListeners } from '@/components/ui/RouteTransitionLoader';

export default function TicketsStackLayout() {
  const routeTransitionScreenListeners = useRouteTransitionScreenListeners();

  return (
    <Stack
      screenListeners={routeTransitionScreenListeners}
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
