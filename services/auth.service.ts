/**
 * Service d'authentification Supabase.
 *
 * Methodes :
 * - signInWithEmail : connexion email + password
 * - signUpWithEmail : inscription (cree user + profile via trigger)
 * - signInWithPhone : envoie OTP SMS
 * - verifyOtp : verifie le code OTP (SMS ou email)
 * - getUserMode : recupere le mode (buyer/seller) depuis le profil
 * - toggleSellerMode : bascule le mode vendeur
 * - signOut : deconnexion + clear storage
 * - resetPassword : email de reset
 * - resendOtp : renvoi OTP avec rate limiting
 *
 * Securite :
 * - JWT dans SecureStore (via lib/supabase.ts)
 * - Rate limiting OTP cote UI (3 tentatives max, lock 15 min)
 * - Pas de logs sensibles (logger.sensitive)
 */

import { supabase } from '@/lib/supabase';
import { logger } from '@/lib/logger';
import { APP_CONFIG } from '@/lib/constants';
import type { RegisterRequest, ApiResponse, Profile } from '@/types';
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
// Helpers
// ============================================================

function isOfflineError(error: { message?: string; name?: string }): boolean {
  return (
    error.message?.includes('Network request failed') === true ||
    error.name === 'AuthRetryableFetchError'
  );
}

function offlineError(): { readonly code: string; readonly message: string } {
  return {
    code: 'network',
    message: 'Pas de connexion internet. Vérifiez votre connexion et réessayez.',
  };
}

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

// ============================================================
// Service
// ============================================================

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
        if (isOfflineError(error)) {
          return { data: null, error: offlineError() };
        }
        logger.debug('signInWithEmail failed:', error.message);
        return { data: null, error: { code: error.name, message: error.message } };
      }

      logger.debug('signInWithEmail success');
      return { data: data.session, error: null };
    } catch (err) {
      const errMsg = err instanceof Error ? err : null;
      if (errMsg && isOfflineError(errMsg)) {
        return { data: null, error: offlineError() };
      }
      logger.debug('signInWithEmail exception:', err);
      return {
        data: null,
        error: { code: 'unknown', message: 'Une erreur est survenue. Veuillez réessayer.' },
      };
    }
  },

  /**
   * Inscription avec email + mot de passe + metadonnees.
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
          },
        },
      });

      if (error) {
        if (isOfflineError(error)) {
          return { data: null, error: offlineError() };
        }
        logger.debug('signUpWithEmail failed:', error.message);
        return { data: null, error: { code: error.name, message: error.message } };
      }

      logger.debug('signUpWithEmail success');
      return { data: data.session, error: null };
    } catch (err) {
      const errMsg = err instanceof Error ? err : null;
      if (errMsg && isOfflineError(errMsg)) {
        return { data: null, error: offlineError() };
      }
      logger.debug('signUpWithEmail exception:', err);
      return {
        data: null,
        error: { code: 'unknown', message: 'Une erreur est survenue. Veuillez réessayer.' },
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
          message: `Trop de tentatives. Réessayez dans ${APP_CONFIG.OTP_LOCK_MINUTES} minutes.`,
        },
      };
    }

    try {
      const { data, error } = await supabase.auth.signInWithOtp({
        phone: `+237${phone}`,
      });

      if (error) {
        if (isOfflineError(error)) {
          return { data: null, error: offlineError() };
        }
        logger.debug('signInWithPhone failed:', error.message);
        return { data: null, error: { code: error.name, message: error.message } };
      }

      resetOtpAttempts();
      logger.debug('signInWithPhone OTP sent');
      return { data, error: null };
    } catch (err) {
      const errMsg = err instanceof Error ? err : null;
      if (errMsg && isOfflineError(errMsg)) {
        return { data: null, error: offlineError() };
      }
      logger.debug('signInWithPhone exception:', err);
      return {
        data: null,
        error: { code: 'unknown', message: 'Une erreur est survenue. Veuillez réessayer.' },
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
          message: `Trop de tentatives. Réessayez dans ${APP_CONFIG.OTP_LOCK_MINUTES} minutes.`,
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

        verificationParams = {
          phone: `+237${params.phone}`,
          token: params.token,
          type: 'sms',
        };
      } else {
        if (!params.email) {
          return {
            data: null,
            error: { code: 'missing_identifier', message: 'Email requis' },
          };
        }

        verificationParams = {
          email: params.email,
          token: params.token,
          type: 'email',
        };
      }

      const { data, error } = await supabase.auth.verifyOtp(verificationParams);

      if (error) {
        incrementOtpAttempts();
        if (isOfflineError(error)) {
          return { data: null, error: offlineError() };
        }
        logger.debug('verifyOtp failed:', error.message, `attempts=${otpAttempts}`);

        if (otpAttempts >= MAX_OTP_ATTEMPTS) {
          lockOtp();
        }

        return { data: null, error: { code: error.name, message: error.message } };
      }

      resetOtpAttempts();
      logger.debug('verifyOtp success');
      return { data: data.session, error: null };
    } catch (err) {
      const errMsg = err instanceof Error ? err : null;
      if (errMsg && isOfflineError(errMsg)) {
        return { data: null, error: offlineError() };
      }
      logger.debug('verifyOtp exception:', err);
      return {
        data: null,
        error: { code: 'unknown', message: 'Une erreur est survenue. Veuillez réessayer.' },
      };
    }
  },

  /**
   * Recupere le mode (buyer/seller) depuis le profil utilisateur.
   * Utilise .select('*') pour eviter le type 'never' de Supabase.
   */
  async getUserMode(userId: string): Promise<{ isSeller: boolean } | null> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error || !data) {
        logger.debug('getUserMode: profile not found');
        return null;
      }

      const profile = data as Record<string, unknown>;
      return { isSeller: (profile.is_seller as boolean) ?? false };
    } catch (err) {
      logger.debug('getUserMode error:', err);
      return null;
    }
  },

  /**
   * Bascule le mode vendeur dans le profil.
   * Utilise 'as never' car le type Database stub a Views: Record<string, never>.
   * Retourne true si succes, false si erreur.
   */
  async toggleSellerMode(userId: string, isSeller: boolean): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_seller: isSeller } as never)
        .eq('id', userId);
      
      if (error) {
        logger.debug('toggleSellerMode error:', error);
        return false;
      }
      
      logger.debug('toggleSellerMode success');
      return true;
    } catch (err) {
      logger.debug('toggleSellerMode error:', err);
      return false;
    }
  },

  /**
   * Met a jour les informations du profil (nom complet, telephone).
   */
  async updateProfile(
    userId: string,
    payload: { readonly full_name: string; readonly phone?: string | null }
  ): Promise<ApiResponse<Profile>> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update({
          full_name: payload.full_name.trim(),
          phone: payload.phone && payload.phone.length > 0 ? payload.phone : null,
          updated_at: new Date().toISOString(),
        } as never)
        .eq('id', userId)
        .select('*')
        .single();

      if (error) {
        logger.debug('updateProfile error:', error.message);
        return { data: null, error: { code: error.name, message: error.message } };
      }

      logger.debug('updateProfile success');
      return { data: data as unknown as Profile, error: null };
    } catch (err) {
      logger.debug('updateProfile exception:', err);
      return {
        data: null,
        error: { code: 'unknown', message: 'Une erreur est survenue. Veuillez réessayer.' },
      };
    }
  },

  /**
   * Renvoie l'OTP (apres rate limiting).
   */
  async resendOtp(phone: string): Promise<AuthResult> {
    if (isOtpLocked()) {
      return {
        data: null,
        error: {
          code: 'locked',
          message: `Trop de tentatives. Réessayez dans ${APP_CONFIG.OTP_LOCK_MINUTES} minutes.`,
        },
      };
    }

    return this.signInWithPhone(phone);
  },

  /**
   * Deconnexion + clear storage.
   */
  async signOut(): Promise<void> {
    try {
      await supabase.auth.signOut();
      logger.debug('signOut success');
    } catch (err) {
      logger.debug('signOut exception:', err);
    }
  },

  /**
   * Envoie un email de reinitialisation de mot de passe.
   */
  async resetPassword(email: string): Promise<AuthResult> {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: 'rivaldevent://reset-password',
      });

      if (error) {
        if (isOfflineError(error)) {
          return { data: null, error: offlineError() };
        }
        logger.debug('resetPassword failed:', error.message);
        return { data: null, error: { code: error.name, message: error.message } };
      }

      logger.debug('resetPassword email sent');
      return { data: null, error: null };
    } catch (err) {
      const errMsg = err instanceof Error ? err : null;
      if (errMsg && isOfflineError(errMsg)) {
        return { data: null, error: offlineError() };
      }
      logger.debug('resetPassword exception:', err);
      return {
        data: null,
        error: { code: 'unknown', message: 'Une erreur est survenue. Veuillez réessayer.' },
      };
    }
  },

  /**
   * Retourne l'etat du rate limiting OTP (pour l'UI).
   */
  getOtpStatus(): { attempts: number; locked: boolean; lockedUntil: number | null } {
    return {
      attempts: otpAttempts,
      locked: isOtpLocked(),
      lockedUntil: otpLockedUntil,
    };
  },
};