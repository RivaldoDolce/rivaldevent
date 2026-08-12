import { Stack } from 'expo-router';

import { colors } from '@/lib/constants';

export default function VenuesStackLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="[id]" />
      <Stack.Screen name="reserve/[id]" />
    </Stack>
  );
}