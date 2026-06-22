/**
 * Types de navigation Expo Router.
 *
 * typedRoutes est activé dans app.json → les routes sont typées automatiquement.
 * Ce fichier contient les types des paramètres de routes dynamiques.
 */

import type { ParamList } from '@react-navigation/native';

// ============================================================
// PARAMÈTRES DES ROUTES DYNAMIQUES
// ============================================================

export type RootStackParamList = {
  '(auth)/splash': undefined;
  '(auth)/onboarding': undefined;
  '(auth)/login': undefined;
  '(auth)/register': undefined;
  '(auth)/otp': { phone?: string; email?: string };

  '(client)/home': undefined;
  '(client)/home/[id]': { id: string };

  '(client)/explore': undefined;
  '(client)/explore/venues': undefined;
  '(client)/explore/venues/[id]': { id: string };

  '(client)/tickets': undefined;
  '(client)/tickets/[id]': { id: string };

  '(client)/profile': undefined;
  '(client)/profile/switch-seller': undefined;

  '(seller)/sell': undefined;
  '(seller)/sell/create/step1': undefined;
  '(seller)/sell/create/step2': { eventDraftId: string };
  '(seller)/sell/create/step3': { eventDraftId: string; venueId?: string };
  '(seller)/sell/sales': { eventId?: string };
  '(seller)/sell/scanner': { eventId?: string };
  '(seller)/sell/wallet': undefined;
  '(seller)/sell/promote': { venueId?: string };

  '(purchase)/event/[id]/tickets': { id: string };
  '(purchase)/payment': {
    eventId: string;
    tiers: Array<{ tierId: string; quantity: number }>;
    totalAmount: number;
  };
  '(purchase)/payment/mtn': { transactionId: string };
  '(purchase)/payment/orange': { transactionId: string };
  '(purchase)/payment/moov': { transactionId: string };
  '(purchase)/confirmation/[ticketId]': { ticketId: string };

  '(modal)/filters': { type: 'events' | 'venues' };
  '(modal)/qr-fullscreen': { ticketId: string };
} & ParamList;

// ============================================================
// HELPERS
// ============================================================

export type ScreenName = keyof RootStackParamList;

export type ScreenParams<T extends ScreenName> = RootStackParamList[T];

export type TabName =
  | 'home'
  | 'explore'
  | 'tickets'
  | 'profile'
  | 'sell';

export interface TabConfig {
  readonly name: TabName;
  readonly label: string;
  readonly icon: string;
  readonly href: string;
}

// ============================================================
// DEEP LINKING
// ============================================================

export interface DeepLinkParams {
  readonly screen: ScreenName;
  readonly params?: Record<string, string>;
}