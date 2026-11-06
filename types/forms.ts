/**
 * Types des formulaires (React Hook Form + Zod).
 *
 * Chaque formulaire a :
 * - Un type de données (FormInput / FormValues)
 * - Un schéma Zod correspondant
 *
 * ⚠️ Les schémas Zod doivent être définis dans lib/validation.ts (à créer).
 * Ce fichier ne contient que les TYPES.
 */

// ============================================================
// AUTH
// ============================================================

export interface LoginFormData {
  readonly email: string;
  readonly password: string;
}

export interface RegisterFormData {
  readonly full_name: string;
  readonly email: string;
  readonly phone: string;
  readonly password: string;
  readonly confirm_password: string;
}

export interface OtpFormData {
  readonly code: string;
}

export interface PhoneLoginFormData {
  readonly phone: string;
}

// ============================================================
// PROFIL
// ============================================================

export interface ProfileUpdateFormData {
  readonly full_name: string;
  readonly phone?: string;
  readonly avatar_url?: string;
}

// ============================================================
// CRÉATION D'ÉVÉNEMENT (wizard 3 étapes)
// ============================================================

export interface EventStep1FormData {
  readonly title: string;
  readonly description: string;
  readonly category: string;
  readonly event_type: string;
}

export interface EventStep2FormData {
  readonly venue_id?: string;
  readonly address: string;
  readonly city: string;
  readonly start_date: string; // ISO string
  readonly end_date?: string;
  readonly cover_image?: string;
}

export interface EventStep3FormData {
  readonly tiers: Array<{
    readonly name: string;
    readonly price: number;
    readonly quantity_total: number;
    readonly description?: string;
    readonly benefits?: string[];
  }>;
}

export interface CreateEventFormData
  extends EventStep1FormData,
    EventStep2FormData,
    EventStep3FormData {}

// ============================================================
// CRÉATION DE LIEU
// ============================================================

export interface CreateVenueFormData {
  readonly name: string;
  readonly description: string;
  readonly address: string;
  readonly city: string;
  readonly capacity_min?: number;
  readonly capacity_max?: number;
  readonly price_per_day?: number;
  readonly amenities: string[];
  readonly event_types: string[];
  readonly images: string[];
}

// ============================================================
// ACHAT DE BILLET
// ============================================================

export interface TicketSelectionFormData {
  readonly tiers: Array<{
    readonly tierId: string;
    readonly quantity: number;
  }>;
}

// ============================================================
// PAIEMENT MOBILE MONEY
// ============================================================

export interface PaymentFormData {
  readonly phoneNumber: string;
  readonly confirmPhone: string;
}

// ============================================================
// RETRAIT (vendeur)
// ============================================================

export interface WithdrawalFormData {
  readonly amount: number;
  readonly payment_method: 'mtn' | 'orange' | 'moov';
  readonly phone_number: string;
}

// ============================================================
// PROMOTION DE LIEU
// ============================================================

export interface PromoteVenueFormData {
  readonly tier: 'basique' | 'premium' | 'vip';
  readonly duration_days: number;
}