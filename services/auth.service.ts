/**
 * Service d'authentification Clerk (Core 3).
 *
 * Expose sous forme de HOOK (`useAuthService`) car les APIs Clerk
 * (useSignIn, useSignUp, useClerk, useUser) sont des hooks React.
 *
 * Methodes (meme surface que l'ancien service Supabase) :
 * - signInWithEmail : connexion email + password (signIn.password + finalize)
 * - signUpWithEmail : inscription email + password (+ verification email)
 * - signInWithPhone : envoi OTP SMS (signIn.create + phoneCode.sendCode)
 * - verifyOtp : verifie le code (SMS via signIn, email via signUp)
 * - resendOtp : renvoie l'OTP SMS
 * - resetPassword : envoie le code de reset (etape 1 du flow oublie)
 * - resetPasswordVerify : verifie le code (etape 2)
 * - resetPasswordSubmit : enregistre le nouveau mot de passe (etape 3)
 * - getUserMode : mode (buyer/seller) depuis unsafeMetadata
 * - toggleSellerMode : bascule du mode dans unsafeMetadata
 * - updateProfile : nom + telephone (unsafeMetadata.phone)
 * - uploadAvatar : photo de profil Clerk (user.setProfileImage)
 * - signOut : deconnexion + clear storage
 *
 * Notes :
 * - Les erreurs Clerk (ClerkError) sont mappees en ApiError.
 * - is_seller et phone vivent dans unsafeMetadata (seule metadata
 *   modifiable cote client, deep-merge via updateMetadata).
 */

import { useCallback } from 'react';
import { useSignIn, useSignUp, useClerk, useUser } from '@clerk/expo';

import { supabase } from '@/lib/supabase';
import { logger } from '@/lib/logger';
import type { ApiResponse, ApiError, RegisterRequest, Profile } from '@/types';

export interface AuthServiceData {
  readonly access_token?: string | null;
  readonly user?: { readonly id: string } | null;
  readonly messageId?: string | null;
  /** Vrai quand un ancien compte Supabase a ete migre vers Clerk. */
  readonly migrated?: boolean;
  /** Vrai quand une verification email (code) est requise avant finalisation. */
  readonly requiresEmailVerification?: boolean;
  /** Vrai quand le mot de passe Supabase ne respectait pas la politique Clerk. */
  readonly passwordChanged?: boolean;
}

type AuthResult = ApiResponse<AuthServiceData>;

const GENERIC_ERROR: ApiError = {
  code: 'unknown',
  message: 'Une erreur est survenue. Veuillez réessayer.',
};

// Politique mot de passe Clerk (instances sans reglage custom).
const PASSWORD_MIN_LENGTH = 15;
const PASSWORD_PATTERN = /^(?=.*[A-Z])(?=.*[0-9])(?=.*[^A-Za-z0-9]).{15,}$/;

/**
 * Traduction des erreurs Clerk vers des messages francais.
 * Fallback : message Clerk original (evite de perdre l'information).
 */
const FRENCH_ERRORS: Readonly<Record<string, string>> = {
  form_identifier_not_found: 'Aucun compte ne correspond à cette adresse email.',
  form_password_incorrect: 'Email ou mot de passe incorrect.',
  form_identifier_password_mismatch: 'Email ou mot de passe incorrect.',
  form_password_length_too_short: `Mot de passe trop court (${PASSWORD_MIN_LENGTH} caractères minimum).`,
  form_password_validation_failed: `Le mot de passe doit contenir au moins ${PASSWORD_MIN_LENGTH} caractères, une majuscule, un chiffre et un caractère spécial.`,
  form_identifier_exists: 'Un compte existe déjà avec cette adresse email.',
  form_email_address_exists: 'Un compte existe déjà avec cette adresse email.',
  form_email_address_invalid: 'Adresse email invalide.',
  form_phone_number_invalid: 'Numéro de téléphone invalide.',
  form_code_incorrect: 'Code incorrect ou expiré.',
  form_code_expired: 'Code expiré. Demandez-en un nouveau.',
  form_code_too_often: 'Trop de demandes de code. Réessayez dans quelques minutes.',
  form_param_format_invalid: 'Format invalide, vérifiez vos informations.',
  too_many_requests: 'Trop de tentatives. Réessayez dans quelques minutes.',
  insufficient_permissions: 'Action non autorisée. Connectez-vous à nouveau.',
  form_password_pwned: 'Ce mot de passe a été compromis, choisissez-en un autre.',
};

function mapError(error: { readonly code?: string; readonly message?: string }): AuthResult {
  const code = error.code ?? 'unknown';
  const message = FRENCH_ERRORS[code] ?? error.message ?? GENERIC_ERROR.message;
  logger.debug('Clerk error:', code, error.message);
  return { data: null, error: { code, message } };
}

function splitFullName(fullName: string): { firstName: string; lastName: string } {
  const parts = fullName.trim().split(/\s+/);
  const firstName = parts.shift() ?? '';
  return { firstName, lastName: parts.join(' ') };
}

function matchesPasswordPolicy(password: string): boolean {
  return password.length >= PASSWORD_MIN_LENGTH && PASSWORD_PATTERN.test(password);
}

/**
 * Genere un mot de passe fort conforme a la politique Clerk
 * (utilise uniquement pour migrer un compte Supabase dont l'ancien
 * mot de passe ne respecte pas les exigences).
 */
function generateStrongPassword(): string {
  const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const lower = 'abcdefghijkmnpqrstuvwxyz';
  const digits = '23456789';
  const special = '!@#$%^&*';
  const pool = upper + lower + digits + special;
  const rand = (chars: string) => chars[Math.floor(Math.random() * chars.length)];
  const password =
    rand(upper) + rand(lower) + rand(digits) + rand(special) + Array.from({ length: 12 }, () => rand(pool)).join('');
  return password
    .split('')
    .sort(() => Math.random() - 0.5)
    .join('');
}

export function useAuthService() {
  const { signIn } = useSignIn();
  const { signUp } = useSignUp();
  const { signOut: clerkSignOut } = useClerk();
  const { user } = useUser();

  /**
   * Migration d'un ancien compte Supabase vers Clerk.
   * - Verifie les identifiants sur l'ancien projet Supabase.
   * - Recreer le compte chez Clerk (meme mot de passe si conforme,
   *   sinon mot de passe genere + notification a l'utilisateur).
   * - Si la verification email est requise, un code est envoye.
   */
  const migrateLegacyAccount = useCallback(
    async (email: string, password: string): Promise<AuthResult | null> => {
      const { data: legacy, error: legacyError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (legacyError || !legacy.user) return null;

      const meta = legacy.user.user_metadata ?? {};
      const fullName = typeof meta.full_name === 'string' ? meta.full_name : '';
      const phone = typeof meta.phone === 'string' ? meta.phone : null;
      const isSeller = meta.is_seller === true;
      const { firstName, lastName } = splitFullName(fullName || 'Ancien Utilisateur');

      const passwordChanged = !matchesPasswordPolicy(password);
      const clerkPassword = passwordChanged ? generateStrongPassword() : password;

      // Une tentative terminee bloque les nouvelles tentatives : reset.
      if (signUp.status === 'complete') {
        await signUp.create({});
      }

      const { error: signUpError } = await signUp.password({
        emailAddress: email,
        password: clerkPassword,
        firstName,
        lastName,
        unsafeMetadata: { phone, is_seller: isSeller },
      });
      if (signUpError) return mapError(signUpError);

      if (signUp.status === 'complete') {
        await signUp.finalize();
        return {
          data: {
            access_token: 'clerk-session',
            user: { id: signUp.createdSessionId ?? '' },
            migrated: true,
            passwordChanged,
          },
          error: null,
        };
      }

      const { error: sendError } = await signUp.verifications.sendEmailCode();
      if (sendError) return mapError(sendError);

      return {
        data: { user: null, migrated: true, requiresEmailVerification: true, passwordChanged },
        error: null,
      };
    },
    [signUp]
  );

  const signInWithEmail = useCallback(
    async (email: string, password: string): Promise<AuthResult> => {
      if (!signIn || !signUp) return { data: null, error: GENERIC_ERROR };

      // Une tentative terminee bloque les nouvelles tentatives : reset.
      if (signIn.status === 'complete') {
        await signIn.create({});
      }

      const { error } = await signIn.password({ emailAddress: email, password });
      if (!error) {
        if (signIn.status !== 'complete') {
          return {
            data: null,
            error: {
              code: signIn.status,
              message: 'Verification supplementaire requise pour ce compte.',
            },
          };
        }

        await signIn.finalize();
        return {
          data: {
            access_token: 'clerk-session',
            user: { id: signIn.createdSessionId ?? '' },
          },
          error: null,
        };
      }

      // Compte introuvable chez Clerk : tenter la migration d'un ancien
      // compte Supabase (meme email + meme mot de passe).
      if (error.code === 'form_identifier_not_found') {
        const migrated = await migrateLegacyAccount(email, password);
        if (migrated) return migrated;
      }

      return mapError(error);
    },
    [signIn, signUp]
  );

  const signUpWithEmail = useCallback(
    async (payload: RegisterRequest): Promise<AuthResult> => {
      if (!signUp) return { data: null, error: GENERIC_ERROR };

      const { firstName, lastName } = splitFullName(payload.full_name);
      if (signUp.status === 'complete') {
        await signUp.create({});
      }

      const { error } = await signUp.password({
        emailAddress: payload.email,
        password: payload.password,
        firstName,
        lastName,
        unsafeMetadata: {
          phone: payload.phone,
          is_seller: payload.is_seller === true,
        },
      });
      if (error) return mapError(error);

      if (signUp.status === 'complete') {
        await signUp.finalize();
        return { data: { access_token: 'clerk-session', user: { id: '' } }, error: null };
      }

      const { error: sendError } = await signUp.verifications.sendEmailCode();
      if (sendError) return mapError(sendError);

      return { data: { user: null }, error: null };
    },
    [signUp]
  );

  const signInWithPhone = useCallback(
    async (phone: string): Promise<AuthResult> => {
      if (!signIn) return { data: null, error: GENERIC_ERROR };

      if (signIn.status === 'complete') {
        await signIn.create({});
      }

      const phoneNumber = `+237${phone}`;
      const { error: createError } = await signIn.create({ identifier: phoneNumber });
      if (createError) return mapError(createError);

      const { error: sendError } = await signIn.phoneCode.sendCode({ phoneNumber });
      if (sendError) return mapError(sendError);

      return { data: { user: null, messageId: null }, error: null };
    },
    [signIn]
  );

  const verifyOtp = useCallback(
    async (params: { phone?: string; email?: string; token: string; type: 'sms' | 'email' }): Promise<AuthResult> => {
      if (params.type === 'sms') {
        if (!signIn) return { data: null, error: GENERIC_ERROR };
        const { error } = await signIn.phoneCode.verifyCode({ code: params.token });
        if (error) return mapError(error);

        if (signIn.status !== 'complete') {
          return { data: null, error: { code: 'incomplete', message: 'Code incorrect ou expire.' } };
        }

        await signIn.finalize();
        return {
          data: { access_token: 'clerk-session', user: { id: signIn.createdSessionId ?? '' } },
          error: null,
        };
      }

      if (!signUp) return { data: null, error: GENERIC_ERROR };
      const { error: verifyError } = await signUp.verifications.verifyEmailCode({ code: params.token });
      if (verifyError) return mapError(verifyError);

      if (signUp.status !== 'complete') {
        return { data: null, error: { code: 'incomplete', message: 'Code incorrect ou expire.' } };
      }

      await signUp.finalize();
      return { data: { access_token: 'clerk-session', user: { id: '' } }, error: null };
    },
    [signIn, signUp]
  );

  const resendOtp = useCallback(
    async (phone?: string, email?: string): Promise<AuthResult> => {
      if (phone && signIn) {
        const { error } = await signIn.phoneCode.sendCode({ phoneNumber: `+237${phone}` });
        if (error) return mapError(error);
        return { data: { user: null, messageId: null }, error: null };
      }

      if (email && signUp) {
        const { error } = await signUp.verifications.sendEmailCode();
        if (error) return mapError(error);
        return { data: { user: null, messageId: null }, error: null };
      }

      return { data: null, error: GENERIC_ERROR };
    },
    [signIn, signUp]
  );

  const resetPassword = useCallback(
    async (email: string): Promise<AuthResult> => {
      if (!signIn) return { data: null, error: GENERIC_ERROR };

      if (signIn.status === 'complete') {
        await signIn.create({});
      }

      const { error: createError } = await signIn.create({ identifier: email });
      if (createError) return mapError(createError);

      const { error: sendError } = await signIn.resetPasswordEmailCode.sendCode();
      if (sendError) return mapError(sendError);

      return { data: { user: null }, error: null };
    },
    [signIn]
  );

  const resetPasswordVerify = useCallback(
    async (code: string): Promise<AuthResult> => {
      if (!signIn) return { data: null, error: GENERIC_ERROR };
      const { error } = await signIn.resetPasswordEmailCode.verifyCode({ code });
      if (error) return mapError(error);
      return { data: { user: null }, error: null };
    },
    [signIn]
  );

  const resetPasswordSubmit = useCallback(
    async (password: string): Promise<AuthResult> => {
      if (!signIn) return { data: null, error: GENERIC_ERROR };
      const { error } = await signIn.resetPasswordEmailCode.submitPassword({ password });
      if (error) return mapError(error);

      if (signIn.status === 'complete') {
        await signIn.finalize();
        return { data: { access_token: 'clerk-session', user: { id: signIn.createdSessionId ?? '' } }, error: null };
      }

      return { data: null, error: { code: 'incomplete', message: 'Reinitialisation incomplete.' } };
    },
    [signIn]
  );

  const getUserMode = useCallback(
    async (_userId: string): Promise<{ isSeller: boolean } | null> => {
      if (!user) return null;
      return { isSeller: (user.unsafeMetadata?.is_seller as boolean | undefined) ?? false };
    },
    [user]
  );

  const toggleSellerMode = useCallback(
    async (_userId: string, isSeller: boolean): Promise<boolean> => {
      if (!user) return false;
      try {
        await user.updateMetadata({ unsafeMetadata: { is_seller: isSeller } });
        return true;
      } catch (err) {
        logger.debug('toggleSellerMode error:', err);
        return false;
      }
    },
    [user]
  );

  const updateProfile = useCallback(
    async (
      _userId: string,
      payload: { readonly full_name: string; readonly phone?: string | null }
    ): Promise<ApiResponse<Profile>> => {
      if (!user) {
        return { data: null, error: { code: 'no_session', message: 'Connectez-vous pour modifier votre profil.' } };
      }

      try {
        const { firstName, lastName } = splitFullName(payload.full_name);
        await user.update({ firstName, lastName });
        await user.updateMetadata({
          unsafeMetadata: {
            phone: payload.phone && payload.phone.length > 0 ? payload.phone : null,
          },
        });
        return { data: null, error: null };
      } catch (err) {
        logger.debug('updateProfile error:', err);
        return { data: null, error: GENERIC_ERROR };
      }
    },
    [user]
  );

  const uploadAvatar = useCallback(
    async (_userId: string, dataUri: string): Promise<ApiResponse<{ publicUrl: string }>> => {
      if (!user) {
        return { data: null, error: { code: 'no_session', message: 'Connectez-vous pour changer votre photo.' } };
      }
      try {
        const res = await fetch(dataUri);
        const blob = await res.blob();
        await user.setProfileImage({ file: blob });
        return { data: { publicUrl: user.imageUrl }, error: null };
      } catch (err) {
        logger.debug('uploadAvatar error:', err);
        return { data: null, error: GENERIC_ERROR };
      }
    },
    [user]
  );

  const signOut = useCallback(async (): Promise<void> => {
    try {
      await clerkSignOut();
      logger.debug('signOut success');
    } catch (err) {
      logger.debug('signOut exception:', err);
    }
  }, [clerkSignOut]);

  return {
    signInWithEmail,
    signUpWithEmail,
    signInWithPhone,
    verifyOtp,
    resendOtp,
    resetPassword,
    resetPasswordVerify,
    resetPasswordSubmit,
    getUserMode,
    toggleSellerMode,
    updateProfile,
    uploadAvatar,
    signOut,
  };
}
