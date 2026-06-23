/**
 * Types des requêtes et réponses API.
 *
 * Utilisé par les services (services/*.service.ts) pour typer les appels
 * Supabase et les Edge Functions.
 */

import type {
  PaymentMethod,
  Transaction,
  Ticket,
  Event,
  Venue,
  Profile,
} from './models';

// ============================================================
// RÉPONSES API GÉNÉRIQUES
// ============================================================

export interface ApiResponse<T> {
  readonly data: T | null;
  readonly error: ApiError | null;
}

export interface ApiError {
  readonly code: string;
  readonly message: string;
  readonly details?: Record<string, unknown>;
}

export interface PaginatedResponse<T> {
  readonly data: T[];
  readonly page: number;
  readonly pageSize: number;
  readonly total: number;
  readonly hasMore: boolean;
}

// ============================================================
// AUTH
// ============================================================

export interface AuthSession {
  readonly access_token: string;
  readonly refresh_token: string;
  readonly expires_at: number;
  readonly user: AuthUser;
}

export interface AuthUser {
  readonly id: string;
  readonly email: string;
  readonly phone?: string;
  readonly created_at: string;
}

export interface LoginRequest {
  readonly email: string;
  readonly password: string;
}

export interface RegisterRequest {
  readonly email: string;
  readonly password: string;
  readonly phone: string;
  readonly full_name: string;
}

export interface PhoneLoginRequest {
  readonly phone: string;
}

export interface OtpVerifyRequest {
  readonly phone: string;
  readonly token: string;
  readonly type: 'sms' | 'email';
}

// ============================================================
// PAIEMENT (Edge Functions)
// ============================================================

export interface PaymentInitiateRequest {
  readonly operator: PaymentMethod;
  readonly encrypted_phone: string;
  readonly amount: number;
  readonly event_id: string;
  readonly ticket_tiers: Array<{
    readonly tier_id: string;
    readonly quantity: number;
  }>;
  readonly idempotency_key: string;
}

export interface PaymentInitiateResponse {
  readonly transaction_id: string;
  readonly requires_ussd: boolean;
  readonly ussd_code?: string;
  readonly instructions?: string[];
  readonly status: 'pending' | 'processing';
}

export interface PaymentWebhookPayload {
  readonly transaction_id: string;
  readonly status: 'success' | 'failed';
  readonly provider_ref: string;
  readonly signature: string;
}

// ============================================================
// VALIDATION QR (Edge Function)
// ============================================================

export interface QrValidateRequest {
  readonly ticket_id: string;
  readonly hash: string;
  readonly scanned_by: string;
}

export interface QrValidateResponse {
  readonly valid: boolean;
  readonly reason?: 'already_scanned' | 'expired' | 'invalid_hash' | 'not_found';
  readonly ticket?: Ticket;
  readonly event?: Event;
  readonly buyer?: Pick<Profile, 'id' | 'full_name'>;
}

// ============================================================
// MUTATIONS
// ============================================================

export interface PurchaseTicketRequest {
  readonly event_id: string;
  readonly tier_id: string;
  readonly quantity: number;
  readonly payment_method: PaymentMethod;
  readonly total_price: number;
}

export interface PurchaseTicketResponse {
  readonly ticket: Ticket;
  readonly transaction: Transaction;
  readonly qr_code: string;
}

export interface CreateEventRequest {
  readonly title: string;
  readonly description?: string;
  readonly category?: string;
  readonly event_type?: string;
  readonly venue_id?: string;
  readonly address?: string;
  readonly city?: string;
  readonly start_date: string;
  readonly end_date?: string;
  readonly cover_image?: string;
  readonly images?: string[];
  readonly tiers: Array<{
    readonly name: string;
    readonly price: number;
    readonly quantity_total: number;
    readonly description?: string;
    readonly benefits?: string[];
  }>;
}

export interface CreateEventResponse {
  readonly event: Event;
}

export interface CreateVenueRequest {
  readonly name: string;
  readonly description?: string;
  readonly address?: string;
  readonly city?: string;
  readonly capacity_min?: number;
  readonly capacity_max?: number;
  readonly price_per_day?: number;
  readonly images?: string[];
  readonly amenities?: string[];
  readonly event_types?: string[];
}

export interface CreateVenueResponse {
  readonly venue: Venue;
}

// ============================================================
// SYNC OFFLINE
// ============================================================

export interface SyncActionResult {
  readonly action_id: string;
  readonly success: boolean;
  readonly result?: unknown;
  readonly error?: string;
}

export interface SyncBatchRequest {
  readonly actions: Array<{
    readonly id: string;
    readonly type: string;
    readonly payload: Record<string, unknown>;
  }>;
}

export interface SyncBatchResponse {
  readonly results: SyncActionResult[];
  readonly synced_at: string;
}

// ============================================================
// STORAGE
// ============================================================

export interface UploadImageRequest {
  readonly bucket: 'event-images' | 'venue-images' | 'avatars';
  readonly file_path: string;
  readonly file_type: 'image/jpeg' | 'image/png' | 'image/webp';
  readonly base64: string;
}

export interface UploadImageResponse {
  readonly path: string;
  readonly public_url: string;
  readonly signed_url: string;
}