/**
 * Service des billets — opérations CRUD sur la table `tickets`.
 * Placeholder partiel — sera complété au Jalon 7 (feature/tickets).
 */

import { supabase } from '@/lib/supabase';
import type { Ticket, TicketWithEvent } from '@/types';

export const ticketService = {
  /**
   * Récupère les billets d'un acheteur (client).
   */
  async getByBuyer(buyerId: string): Promise<TicketWithEvent[]> {
    const { data, error } = await supabase
      .from('tickets')
      .select(
        `
        *,
        event:id (
          id,
          title,
          cover_image,
          start_date,
          city
        ),
        tier:tier_id (
          id,
          name,
          price
        )
      `
      )
      .eq('buyer_id', buyerId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data ?? []) as unknown as TicketWithEvent[];
  },

  /**
   * Récupère les billets d'un événement (côté vendeur).
   */
  async getByEvent(eventId: string): Promise<Ticket[]> {
    const { data, error } = await supabase
      .from('tickets')
      .select('*')
      .eq('event_id', eventId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data ?? [];
  },
};