import { Stack } from 'expo-router';

import { colors } from '@/lib/constants';
import { useRouteTransitionScreenListeners } from '@/components/ui/RouteTransitionLoader';

export default function ProfileStackLayout() {
  const routeTransitionScreenListeners = useRouteTransitionScreenListeners();

  return (
    <Stack
      screenListeners={routeTransitionScreenListeners}
      screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="settings" />
    </Stack>
  );
}
