/**
 * Export centralisé de tous les types.
 *
 * Usage : `import type { Profile, Event, PaymentMethod } from '@/types';`
 * Au lieu de : `import type { Profile } from '@/types/models';`
 */

// ============================================================
// MODÈLES MÉTIER (réexport)
// ============================================================

export type {
  // Types racines
  Profile,
  Venue,
  Event,
  TicketTier,
  Ticket,
  Transaction,
  VenuePromotion,
  // Avec relations
  ProfileWithStats,
  EventWithOrganizer,
  EventWithVenue,
  EventWithTiers,
  EventListItem,
  TicketWithEvent,
  TicketWithBuyer,
  VenueWithOwner,
  VenueWithPromotion,
  TransactionWithEvent,
  TicketTierWithAvailability,
  EventWithAvailability,
  // Dashboard
  SellerStats,
  RecentSale,
  // Filtres
  EventFilters,
  VenueFilters,
  // Enums
  UserRole,
  EventStatus,
  PaymentMethod,
  PaymentStatus,
  TransactionStatus,
  TransactionType,
  PromotionTier,
} from './models';

// Type guards
export {
  isEventStatus,
  isPaymentMethod,
  isPaymentStatus,
  isUserRole,
} from './models';

// ============================================================
// NAVIGATION (réexport)
// ============================================================

export type {
  RootStackParamList,
  ScreenName,
  ScreenParams,
  TabName,
  TabConfig,
  DeepLinkParams,
} from './navigation';

// ============================================================
// FORMULAIRES (réexport)
// ============================================================

export type {
  LoginFormData,
  RegisterFormData,
  OtpFormData,
  PhoneLoginFormData,
  ProfileUpdateFormData,
  EventStep1FormData,
  EventStep2FormData,
  EventStep3FormData,
  CreateEventFormData,
  CreateVenueFormData,
  TicketSelectionFormData,
  PaymentFormData,
  WithdrawalFormData,
  PromoteVenueFormData,
} from './forms';

// ============================================================
// API (réexport)
// ============================================================

export type {
  ApiResponse,
  ApiError,
  PaginatedResponse,
  AuthSession,
  AuthUser,
  LoginRequest,
  RegisterRequest,
  PhoneLoginRequest,
  OtpVerifyRequest,
  PaymentInitiateRequest,
  PaymentInitiateResponse,
  PaymentWebhookPayload,
  QrValidateRequest,
  QrValidateResponse,
  PurchaseTicketRequest,
  PurchaseTicketResponse,
  CreateEventRequest,
  CreateEventResponse,
  CreateVenueRequest,
  CreateVenueResponse,
  SyncActionResult,
  SyncBatchRequest,
  SyncBatchResponse,
  UploadImageRequest,
  UploadImageResponse,
} from './api';

// ============================================================
// DATABASE (réexport pour les cas avancés)
// ============================================================

export type { Database } from './database';