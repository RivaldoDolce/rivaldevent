/**
 * Layout groupe modales globales.
 *
 * Stack modal pour :
 * - filters        : filtres avances (bottom sheet)
 * - venue-filters  : filtres lieux
 * - qr-fullscreen  : QR code plein ecran
 *
 * Design "Noir & Or" : fond profond colors.background pour toutes les modales.
 */

import { Stack } from 'expo-router';

import { colors } from '@/lib/constants';

export default function ModalLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        presentation: 'modal',
        contentStyle: { backgroundColor: colors.background },
        animation: 'slide_from_bottom',
      }}
    >
      <Stack.Screen name="filters" />
      <Stack.Screen name="venue-filters" />
      <Stack.Screen name="qr-fullscreen" />
    </Stack>
  );
}