/**
 * Layout groupe achat (flux immersif, pas de tab bar).
 *
 * Stack modal plein ecran pour le tunnel d'achat :
 * - event/[id]/tickets : selection des billets
 * - payment/index      : selection operateur
 * - payment/mtn        : paiement MTN
 * - payment/orange     : paiement Orange
 * - payment/moov       : paiement Moov
 * - confirmation/[id]  : confirmation + QR code
 */

import { Stack } from 'expo-router';

import { colors } from '@/lib/constants';

export default function PurchaseLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.sand },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="event/[id]/tickets" />
      <Stack.Screen name="payment/index" />
      <Stack.Screen name="payment/mtn" />
      <Stack.Screen name="payment/orange" />
      <Stack.Screen name="payment/moov" />
      <Stack.Screen name="confirmation/[ticketId]" />
    </Stack>
  );
}