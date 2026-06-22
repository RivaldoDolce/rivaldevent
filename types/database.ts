/**
 * ⚠️ STUB TEMPORAIRE — à remplacer par les types générés par Supabase CLI.
 *
 * Commande pour générer les vrais types :
 *   npx supabase gen types typescript \
 *     --project-id VOTRE-PROJECT-REF \
 *     --schema public \
 *     > types/database.ts
 *
 * Une fois généré, SUPPRIME ce stub et remplace-le par le fichier généré.
 */

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string | null;
          avatar_url: string | null;
          phone: string | null;
          role: 'client' | 'particulier' | 'prestataire';
          is_seller: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          full_name?: string | null;
          avatar_url?: string | null;
          phone?: string | null;
          role?: 'client' | 'particulier' | 'prestataire';
          is_seller?: boolean;
        };
        Update: {
          full_name?: string | null;
          avatar_url?: string | null;
          phone?: string | null;
          role?: 'client' | 'particulier' | 'prestataire';
          is_seller?: boolean;
        };
      };
      venues: {
        Row: {
          id: string;
          owner_id: string | null;
          name: string;
          description: string | null;
          address: string | null;
          city: string | null;
          country: string | null;
          capacity_min: number | null;
          capacity_max: number | null;
          price_per_day: number | null;
          images: string[];
          amenities: string[];
          event_types: string[];
          is_premium: boolean;
          promotion_tier: 'basique' | 'premium' | 'vip' | null;
          lat: number | null;
          lng: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database['public']['Tables']['venues']['Row']> & {
          name: string;
        };
        Update: Partial<Database['public']['Tables']['venues']['Row']>;
      };
      events: {
        Row: {
          id: string;
          organizer_id: string | null;
          venue_id: string | null;
          title: string;
          description: string | null;
          category: string | null;
          event_type: string | null;
          start_date: string;
          end_date: string | null;
          address: string | null;
          city: string | null;
          cover_image: string | null;
          images: string[];
          status: 'draft' | 'published' | 'cancelled' | 'completed';
          is_featured: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database['public']['Tables']['events']['Row']> & {
          title: string;
          start_date: string;
        };
        Update: Partial<Database['public']['Tables']['events']['Row']>;
      };
      ticket_tiers: {
        Row: {
          id: string;
          event_id: string;
          name: string;
          price: number;
          quantity_total: number;
          quantity_sold: number;
          description: string | null;
          benefits: string[];
          created_at: string;
        };
        Insert: Partial<Database['public']['Tables']['ticket_tiers']['Row']> & {
          event_id: string;
          name: string;
          price: number;
          quantity_total: number;
        };
        Update: Partial<Database['public']['Tables']['ticket_tiers']['Row']>;
      };
      tickets: {
        Row: {
          id: string;
          event_id: string | null;
          tier_id: string | null;
          buyer_id: string | null;
          quantity: number;
          total_price: number | null;
          payment_method: 'mtn' | 'orange' | 'moov' | null;
          payment_status: 'pending' | 'completed' | 'failed' | 'refunded';
          qr_code: string | null;
          qr_secret: string | null;
          is_scanned: boolean;
          scanned_at: string | null;
          expires_at: string | null;
          created_at: string;
        };
        Insert: Partial<Database['public']['Tables']['tickets']['Row']>;
        Update: Partial<Database['public']['Tables']['tickets']['Row']>;
      };
      transactions: {
        Row: {
          id: string;
          user_id: string | null;
          type: 'ticket_sale' | 'venue_promo' | 'withdrawal';
          amount: number;
          currency: string;
          status: 'pending' | 'completed' | 'failed';
          provider: string | null;
          provider_ref: string | null;
          idempotency_key: string | null;
          metadata: Record<string, unknown>;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database['public']['Tables']['transactions']['Row']> & {
          amount: number;
        };
        Update: Partial<Database['public']['Tables']['transactions']['Row']>;
      };
      venue_promotions: {
        Row: {
          id: string;
          venue_id: string;
          tier: 'basique' | 'premium' | 'vip' | null;
          start_date: string | null;
          end_date: string | null;
          amount_paid: number | null;
          impressions: number;
          clicks: number;
          is_active: boolean;
          created_at: string;
        };
        Insert: Partial<Database['public']['Tables']['venue_promotions']['Row']> & {
          venue_id: string;
        };
        Update: Partial<Database['public']['Tables']['venue_promotions']['Row']>;
      };
    };
    Views: Record<string, never>;
    Functions: {
      release_tickets: {
        Args: { transaction_id: string };
        Returns: undefined;
      };
    };
    Enums: {
      profile_role: 'client' | 'particulier' | 'prestataire';
      event_status: 'draft' | 'published' | 'cancelled' | 'completed';
      payment_method: 'mtn' | 'orange' | 'moov';
      payment_status: 'pending' | 'completed' | 'failed' | 'refunded';
      transaction_status: 'pending' | 'completed' | 'failed';
      transaction_type: 'ticket_sale' | 'venue_promo' | 'withdrawal';
      promotion_tier: 'basique' | 'premium' | 'vip';
    };
  };
};