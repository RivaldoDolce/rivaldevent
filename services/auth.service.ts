/**
 * Service d'authentification Supabase.
 *
 * Methodes :
 * - signInWithEmail : connexion email + password
 * - signUpWithEmail : inscription (cree user + profile via trigger)
 * - signInWithPhone : envoie OTP SMS
 * - verifyOtp : verifie le code OTP (SMS ou email)
 * - signInWithGoogle : OAuth Google
 * - signOut : deconnexion + clear storage
 * - resetPassword : email de reset
 * - resendOtp : renvoi OTP avec rate limiting
 *
 * Securite :
 * - JWT dans SecureStore (via lib/supabase.ts)
 * - Rate limiting OTP cote UI (3 tentatives max, lock 15 min)
 * - Pas de logs sensibles (logger.sensitive)
 * - Messages d'erreur conviviaux pour le client
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

// Etat du rate limiting OTP (en memoire, non persistant)
let otpAttempts = 0;
let otpLockedUntil: number | null = null;

// ============================================================
// Mapping des erreurs techniques vers des messages conviviaux
// ============================================================

const FRIENDLY_ERRORS: Record<string, string> = {
  'Invalid login credentials': 'Email ou mot de passe incorrect.',
  'User already registered': 'Cet email est deja utilise. Connectez-vous plutot.',
  'Email not confirmed': 'Veuillez confirmer votre email avant de vous connecter.',
  'Too many requests': 'Trop de tentatives. Patientez quelques instants.',
  'Password should be at least 8 characters.': 'Le mot de passe doit contenir au moins 8 caracteres.',
  'Unable to validate email address: invalid format': 'Format d\'email invalide.',
  'Network request failed': 'Pas de connexion internet. Verifiez votre reseau.',
  'Invalid credentials': 'Email ou mot de passe incorrect.',
  'Signup requires a valid password': 'Le mot de passe ne respecte pas les regles requises.',
};

function toFriendlyError(error: { name?: string; message: string }): string {
  // 1. Chercher une correspondance exacte sur le message
  if (FRIENDLY_ERRORS[error.message]) {
    return FRIENDLY_ERRORS[error.message];
  }

  // 2. Chercher par mot-cle
  const msg = error.message.toLowerCase();
  if (msg.includes('network') || msg.includes('connection') || msg.includes('timeout')) {
    return 'Pas de connexion internet. Verifiez votre reseau.';
  }
  if (msg.includes('already registered') || msg.includes('already exists')) {
    return 'Cet email est deja utilise. Connectez-vous plutot.';
  }
  if (msg.includes('invalid') && msg.includes('email')) {
    return 'Format d\'email invalide.';
  }
  if (msg.includes('invalid') && msg.includes('password')) {
    return 'Email ou mot de passe incorrect.';
  }
  if (msg.includes('rate limit') || msg.includes('too many')) {
    return 'Trop de tentatives. Patientez quelques instants.';
  }
  if (msg.includes('securestore') || msg.includes('storage')) {
    return 'Une erreur de stockage est survenue. Redemarrez l\'application.';
  }

  // 3. Fallback generique
  return 'Une erreur est survenue. Veuillez reessayer.';
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
        logger.warn('signInWithEmail failed:', error.message);
        return { data: null, error: { code: error.name, message: toFriendlyError(error) } };
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
   * Inscription avec email + mot de passe + metadonnees (full_name, phone).
   * Le trigger handle_new_user cree automatiquement le profil.
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
        logger.warn('signUpWithEmail failed:', error.message);
        return { data: null, error: { code: error.name, message: toFriendlyError(error) } };
      }

      logger.debug('signUpWithEmail success');
      return { data: data.session, error: null };
    } catch (err) {
      logger.error('signUpWithEmail exception:', err);
      return {
        data: null,
        error: { code: 'unknown', message: 'Une erreur est survenue lors de l\'inscription.' },
      };
    }
  },

  /**
   * Envoie un OTP SMS au numero de telephone.
   * Format : 6XXXXXXXX (sans +237, on l'ajoute).
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
        logger.warn('signInWithPhone failed:', error.message);
        return { data: null, error: { code: error.name, message: toFriendlyError(error) } };
      }

      resetOtpAttempts();
      logger.debug('signInWithPhone OTP sent');
      return { data, error: null };
    } catch (err) {
      logger.error('signInWithPhone exception:', err);
      return {
        data: null,
        error: { code: 'unknown', message: 'Impossible d\'envoyer le code. Verifiez votre numero.' },
      };
    }
  },

  /**
   * Verifie un code OTP (SMS ou email).
   * Applique le rate limiting : 3 tentatives max, puis lock 15 min.
   */
  async verifyOtp(
    params: { phone?: string; email?: string; token: string; type: 'sms' | 'email' },
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
        logger.warn('verifyOtp failed:', error.message, `attempts=${otpAttempts}`);

        if (otpAttempts >= MAX_OTP_ATTEMPTS) {
          lockOtp();
        }

        return { data: null, error: { code: error.name, message: toFriendlyError(error) } };
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

  /**
   * Renvoie l'OTP (apres rate limiting).
   */
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

  /**
   * Deconnexion + clear storage.
   */
  async signOut(): Promise<void> {
    try {
      await supabase.auth.signOut();
      logger.debug('signOut success');
    } catch (err) {
      logger.error('signOut exception:', err);
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
        logger.warn('resetPassword failed:', error.message);
        return { data: null, error: { code: error.name, message: toFriendlyError(error) } };
      }

      logger.debug('resetPassword email sent');
      return { data: null, error: null };
    } catch (err) {
      logger.error('resetPassword exception:', err);
      return {
        data: null,
        error: { code: 'unknown', message: 'Impossible d\'envoyer l\'email. Reessayez.' },
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
  logger.warn(`OTP locked for ${APP_CONFIG.OTP_LOCK_MINUTES} minutes`);
}

function resetOtpAttempts(): void {
  otpAttempts = 0;
  otpLockedUntil = null;
}
