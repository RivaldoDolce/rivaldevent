/**
 * Layout groupe modales globales.
 *
 * Stack modal pour :
 * - filters        : filtres avances (bottom sheet)
 * - qr-fullscreen  : QR code plein ecran
 */

import { Stack } from 'expo-router';

import { colors } from '@/lib/constants';

export default function ModalLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        presentation: 'modal',
        contentStyle: { backgroundColor: colors.sand },
        animation: 'slide_from_bottom',
      }}
    >
      <Stack.Screen name="filters" />
      <Stack.Screen name="qr-fullscreen" />
    </Stack>
  );
}