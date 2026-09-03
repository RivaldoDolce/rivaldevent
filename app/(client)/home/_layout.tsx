import { Stack } from 'expo-router';

import { colors } from '@/lib/constants';
import { useRouteTransitionScreenListeners } from '@/components/ui/RouteTransitionLoader';

export default function HomeStackLayout() {
  const routeTransitionScreenListeners = useRouteTransitionScreenListeners();

  return (
    <Stack
      screenListeners={routeTransitionScreenListeners}
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="[id]" />
      <Stack.Screen name="venues/[id]" />
    </Stack>
  );
}
