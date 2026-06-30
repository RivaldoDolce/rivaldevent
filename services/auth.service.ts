/**
 * Service d'authentification Supabase.
 *
 * Methodes :
 * - signInWithEmail : connexion email + password
 * - signUpWithEmail : inscription (cree user + profile via trigger)
 * - signInWithPhone : envoie OTP SMS
 * - verifyOtp : verifie le code OTP (SMS ou email)
 * - signOut : deconnexion + clear storage
 * - resetPassword : email de reset
 * - resendOtp : renvoi OTP avec rate limiting
 * - getUserMode : recupere is_seller du profil (pour redirect apres login)
 * - toggleSellerMode : change is_seller dans le profil (switch acheteur/vendeur)
 *
 * Securite :
 * - JWT dans SecureStore (via lib/supabase.ts)
 * - Rate limiting OTP cote UI (3 tentatives max, lock 15 min)
 * - Pas de logs sensibles (logger.sensitive)
 *
 * UX :
 * - Toutes les erreurs retournees au client sont en francais
 * - Les erreurs attendues sont loguees en debug (pas d'overlay Expo Go)
 */

import { supabase } from '@/lib/supabase';
import { logger } from '@/lib/logger';
import { APP_CONFIG } from '@/lib/constants';
import type { RegisterRequest, ApiResponse } from '@/types';
import type { Session } from '@supabase/supabase-js';

interface OtpDeliveryResult {
  readonly user: null;
  readonly session: null;
  readonly messageId?: string | null;
}

type AuthResult = ApiResponse<Session | OtpDeliveryResult>;

const MAX_OTP_ATTEMPTS = APP_CONFIG.OTP_MAX_ATTEMPTS;
const LOCK_DURATION_MS = APP_CONFIG.OTP_LOCK_MINUTES * 60 * 1000;

let otpAttempts = 0;
let otpLockedUntil: number | null = null;

// ============================================================
// Mapping erreurs Supabase -> messages utilisateurs (francais)
// ============================================================

const AUTH_ERROR_MAP: Record<string, string> = {
  'Invalid login credentials': 'Email ou mot de passe incorrect',
  'Invalid email or password': 'Email ou mot de passe incorrect',
  'Email not confirmed': 'Veuillez confirmer votre email avant de vous connecter',
  'User already registered': 'Cet email est deja utilise. Connectez-vous ou utilisez un autre email.',
  'To signup, please provide your email': 'Veuillez saisir une adresse email valide',
  'Network request failed': 'Verifiez votre connexion internet et reessayez',
  'Failed to fetch': 'Verifiez votre connexion internet et reessayez',
  'NetworkError': 'Verifiez votre connexion internet et reessayez',
  'Timeout': 'La connexion a pris trop de temps. Reessayez.',
  'Token has expired or is invalid': 'Le code a expire. Demandez un nouveau code.',
  'Invalid OTP': 'Code invalide. Verifiez et reessayez.',
  'OTP has expired': 'Le code a expire. Demandez un nouveau code.',
  'Password should be at least 6 characters.': 'Le mot de passe doit contenir au moins 6 caracteres',
  'Password is too short': 'Le mot de passe est trop court (minimum 6 caracteres)',
  'Unable to validate email address: invalid format': 'Adresse email invalide',
  'Invalid email': 'Adresse email invalide',
  'Rate limit exceeded': 'Trop de tentatives. Reessayez dans quelques instants.',
  'For security purposes, you can only request this once every': 'Trop de demandes. Patientez avant de reessayer.',
  'Phone verification is required': 'La verification par telephone est requise',
  'Invalid phone number': 'Numero de telephone invalide',
};

function toFriendlyMessage(rawMessage: string): string {
  if (AUTH_ERROR_MAP[rawMessage]) {
    return AUTH_ERROR_MAP[rawMessage];
  }
  for (const [pattern, friendly] of Object.entries(AUTH_ERROR_MAP)) {
    if (rawMessage.toLowerCase().includes(pattern.toLowerCase())) {
      return friendly;
    }
  }
  return 'Une erreur est survenue. Veuillez reessayer.';
}

export const authService = {
  /**
   * Connexion avec email + mot de passe.
   */
  async signInWithEmail(email: string, password: string): Promise<AuthResult> {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        logger.debug('signInWithEmail failed:', error.message);
        return {
          data: null,
          error: { code: error.name, message: toFriendlyMessage(error.message) },
        };
      }

      logger.debug('signInWithEmail success');
      return { data: data.session, error: null };
    } catch (err) {
      logger.error('signInWithEmail exception:', err);
      return {
        data: null,
        error: { code: 'unknown', message: 'Une erreur est survenue. Veuillez reessayer.' },
      };
    }
  },

  /**
   * Inscription avec email + mot de passe + metadonnees.
   * Le trigger handle_new_user cree automatiquement le profil.
   * is_seller est passe dans les metadata pour initialiser le mode.
   */
  async signUpWithEmail(payload: RegisterRequest): Promise<AuthResult> {
    try {
      const { data, error } = await supabase.auth.signUp({
        email: payload.email,
        password: payload.password,
        phone: `+237${payload.phone}`,
        options: {
          data: {
            full_name: payload.full_name,
            phone: payload.phone,
            is_seller: payload.is_seller ?? false,
          },
        },
      });

      if (error) {
        logger.debug('signUpWithEmail failed:', error.message);
        return {
          data: null,
          error: { code: error.name, message: toFriendlyMessage(error.message) },
        };
      }

      logger.debug('signUpWithEmail success');
      return { data: data.session, error: null };
    } catch (err) {
      logger.error('signUpWithEmail exception:', err);
      return {
        data: null,
        error: { code: 'unknown', message: 'Une erreur est survenue. Veuillez reessayer.' },
      };
    }
  },

  /**
   * Envoie un OTP SMS au numero de telephone.
   */
  async signInWithPhone(phone: string): Promise<AuthResult> {
    if (isOtpLocked()) {
      return {
        data: null,
        error: {
          code: 'locked',
          message: `Trop de tentatives. Reessayez dans ${APP_CONFIG.OTP_LOCK_MINUTES} minutes.`,
        },
      };
    }

    try {
      const { data, error } = await supabase.auth.signInWithOtp({
        phone: `+237${phone}`,
      });

      if (error) {
        logger.debug('signInWithPhone failed:', error.message);
        return {
          data: null,
          error: { code: error.name, message: toFriendlyMessage(error.message) },
        };
      }

      resetOtpAttempts();
      logger.debug('signInWithPhone OTP sent');
      return { data, error: null };
    } catch (err) {
      logger.error('signInWithPhone exception:', err);
      return {
        data: null,
        error: { code: 'unknown', message: 'Une erreur est survenue. Veuillez reessayer.' },
      };
    }
  },

  /**
   * Verifie un code OTP (SMS ou email).
   */
  async verifyOtp(
    params: { phone?: string; email?: string; token: string; type: 'sms' | 'email' }
  ): Promise<AuthResult> {
    if (isOtpLocked()) {
      return {
        data: null,
        error: {
          code: 'locked',
          message: `Trop de tentatives. Reessayez dans ${APP_CONFIG.OTP_LOCK_MINUTES} minutes.`,
        },
      };
    }

    try {
      let verificationParams:
        | { readonly phone: string; readonly token: string; readonly type: 'sms' }
        | { readonly email: string; readonly token: string; readonly type: 'email' };

      if (params.type === 'sms') {
        if (!params.phone) {
          return {
            data: null,
            error: { code: 'missing_identifier', message: 'Numero requis' },
          };
        }
        verificationParams = { phone: `+237${params.phone}`, token: params.token, type: 'sms' };
      } else {
        if (!params.email) {
          return {
            data: null,
            error: { code: 'missing_identifier', message: 'Email requis' },
          };
        }
        verificationParams = { email: params.email, token: params.token, type: 'email' };
      }

      const { data, error } = await supabase.auth.verifyOtp(verificationParams);

      if (error) {
        incrementOtpAttempts();
        logger.debug('verifyOtp failed:', error.message, `attempts=${otpAttempts}`);

        if (otpAttempts >= MAX_OTP_ATTEMPTS) {
          lockOtp();
        }

        return {
          data: null,
          error: { code: error.name, message: toFriendlyMessage(error.message) },
        };
      }

      resetOtpAttempts();
      logger.debug('verifyOtp success');
      return { data: data.session, error: null };
    } catch (err) {
      logger.error('verifyOtp exception:', err);
      return {
        data: null,
        error: { code: 'unknown', message: 'Une erreur est survenue. Veuillez reessayer.' },
      };
    }
  },

  async resendOtp(phone: string): Promise<AuthResult> {
    if (isOtpLocked()) {
      return {
        data: null,
        error: {
          code: 'locked',
          message: `Trop de tentatives. Reessayez dans ${APP_CONFIG.OTP_LOCK_MINUTES} minutes.`,
        },
      };
    }
    return this.signInWithPhone(phone);
  },

  async signOut(): Promise<void> {
    try {
      await supabase.auth.signOut();
      logger.debug('signOut success');
    } catch (err) {
      logger.error('signOut exception:', err);
    }
  },

  async resetPassword(email: string): Promise<AuthResult> {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: 'rivaldevent://reset-password',
      });

      if (error) {
        logger.debug('resetPassword failed:', error.message);
        return {
          data: null,
          error: { code: error.name, message: toFriendlyMessage(error.message) },
        };
      }

      logger.debug('resetPassword email sent');
      return { data: null, error: null };
    } catch (err) {
      logger.error('resetPassword exception:', err);
      return {
        data: null,
        error: { code: 'unknown', message: 'Une erreur est survenue. Veuillez reessayer.' },
      };
    }
  },

  getOtpStatus(): { attempts: number; locked: boolean; lockedUntil: number | null } {
    return {
      attempts: otpAttempts,
      locked: isOtpLocked(),
      lockedUntil: otpLockedUntil,
    };
  },

  // ============================================================
  // MODE VENDEUR / ACHETEUR
  // ============================================================

  /**
   * Recupere le mode (is_seller) d'un utilisateur.
   * Utilise apres le login pour rediriger vers le bon layout.
   */
  async getUserMode(userId: string): Promise<{ isSeller: boolean } | null> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        logger.debug('getUserMode failed:', error.message);
        return null;
      }

      const row = data as Record<string, unknown> | null;
      return { isSeller: (row?.is_seller as boolean) ?? false };
    } catch (err) {
      logger.error('getUserMode exception:', err);
      return null;
    }
  },

  /**
   * Bascule le mode acheteur/vendeur dans le profil.
   * Appele par le segmented control du profil.
   */
  async toggleSellerMode(userId: string, isSeller: boolean): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_seller: isSeller } as never)
        .eq('id', userId);

      if (error) {
        logger.debug('toggleSellerMode failed:', error.message);
        return false;
      }

      logger.debug('toggleSellerMode success:', isSeller ? 'seller' : 'buyer');
      return true;
    } catch (err) {
      logger.error('toggleSellerMode exception:', err);
      return false;
    }
  },
};

// ============================================================
// Helpers internes (rate limiting)
// ============================================================

function isOtpLocked(): boolean {
  if (otpLockedUntil === null) return false;
  if (Date.now() > otpLockedUntil) {
    otpLockedUntil = null;
    otpAttempts = 0;
    return false;
  }
  return true;
}

function incrementOtpAttempts(): void {
  otpAttempts += 1;
}

function lockOtp(): void {
  otpLockedUntil = Date.now() + LOCK_DURATION_MS;
  logger.debug(`OTP locked for ${APP_CONFIG.OTP_LOCK_MINUTES} minutes`);
}

function resetOtpAttempts(): void {
  otpAttempts = 0;
  otpLockedUntil = null;
}