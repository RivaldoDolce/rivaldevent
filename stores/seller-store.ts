/**
 * Store de l'espace vendeur - Zustand v5.
 *
 * Source de verite cote client pour :
 * - Le portefeuille d'evenements organises
 * - Les ventes de billets
 * - Le solde disponible (wallet)
 *
 * Seede depuis data/mock/seller.ts en attendant le branchement Supabase.
 * Les actions permettent a l'ecran "Vendre" d'ajouter un evenement qui
 * apparait immediatement dans le dashboard et "Mes evenements".
 *
 * Conventions :
 * - Zustand v5 avec create
 * - Pas de type any, imports @/
 */

import { create } from 'zustand';
import {
  MOCK_SELLER_EVENTS,
  MOCK_SELLER_SALES,
  MOCK_SELLER_WALLET,
} from '@/data/mock';
import type { MockSellerEvent, MockSellerSale } from '@/data/mock';

// ============================================================
// Types
// ============================================================

export interface NewSellerEventInput {
  readonly title: string;
  readonly category: string;
  readonly event_type: string;
  readonly description: string;
  readonly image: string;
  readonly start_date: string;
  readonly city: string;
  readonly venue: string;
  readonly tiers: readonly {
    readonly name: string;
    readonly price: number;
    readonly quantity: number;
  }[];
}

interface SellerState {
  readonly events: readonly MockSellerEvent[];
  readonly sales: readonly MockSellerSale[];
  readonly availableBalance: number;
  readonly pendingWithdrawals: number;

  addEvent: (input: NewSellerEventInput) => void;
  markSaleScanned: (saleId: string) => void;
}

const DEFAULT_EVENT_IMAGE =
  'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800';

// ============================================================
// Store
// ============================================================

export const useSellerStore = create<SellerState>((set) => ({
  events: MOCK_SELLER_EVENTS,
  sales: MOCK_SELLER_SALES,
  availableBalance: MOCK_SELLER_WALLET.available_balance,
  pendingWithdrawals: MOCK_SELLER_WALLET.pending_withdrawals,

  addEvent: (input) =>
    set((state) => {
      const newEvent: MockSellerEvent = {
        id: `evt-${Date.now()}`,
        title: input.title.trim(),
        image: input.image.trim() || DEFAULT_EVENT_IMAGE,
        start_date: new Date(`${input.start_date}T19:00:00`).toISOString(),
        city: input.city.trim() || 'A definir',
        venue: input.venue.trim() || 'A definir',
        category: input.category,
        status: 'published',
        capacity: input.tiers.reduce((sum, tier) => sum + tier.quantity, 0),
        tickets_sold: 0,
        revenue: 0,
      };
      return { events: [newEvent, ...state.events] };
    }),

  markSaleScanned: (saleId) =>
    set((state) => ({
      sales: state.sales.map((sale) =>
        sale.id === saleId ? { ...sale, is_scanned: true } : sale
      ),
    })),
}));

// ============================================================
// Selecteurs derives
// ============================================================

export const useSellerTotals = (): {
  readonly totalEvents: number;
  readonly publishedEvents: number;
  readonly totalSales: number;
  readonly ticketsSold: number;
  readonly totalRevenue: number;
  readonly averageFillRate: number;
} => {
  const events = useSellerStore((state) => state.events);
  const sales = useSellerStore((state) => state.sales);

  const ticketsSold = events.reduce((sum, event) => sum + event.tickets_sold, 0);
  const totalRevenue = events.reduce((sum, event) => sum + event.revenue, 0);
  const totalCapacity = events.reduce((sum, event) => sum + event.capacity, 0);
  const fillRate =
    totalCapacity > 0 ? Math.round((ticketsSold / totalCapacity) * 100) : 0;

  return {
    totalEvents: events.length,
    publishedEvents: events.filter((event) => event.status === 'published').length,
    totalSales: sales.length,
    ticketsSold,
    totalRevenue,
    averageFillRate: Math.min(fillRate, 100),
  };
};