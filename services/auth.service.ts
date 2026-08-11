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

import { logger } from '@/lib/logger';
import type { ApiResponse, ApiError, RegisterRequest, Profile } from '@/types';

export interface AuthServiceData {
  readonly access_token?: string | null;
  readonly user?: { readonly id: string } | null;
  readonly messageId?: string | null;
}

type AuthResult = ApiResponse<AuthServiceData>;

const GENERIC_ERROR: ApiError = {
  code: 'unknown',
  message: 'Une erreur est survenue. Veuillez réessayer.',
};

function mapError(error: { readonly code?: string; readonly message?: string }): AuthResult {
  const message = error.message || GENERIC_ERROR.message;
  logger.debug('Clerk error:', message);
  return { data: null, error: { code: error.code || 'unknown', message } };
}

function splitFullName(fullName: string): { firstName: string; lastName: string } {
  const parts = fullName.trim().split(/\s+/);
  const firstName = parts.shift() ?? '';
  return { firstName, lastName: parts.join(' ') };
}

export function useAuthService() {
  const { signIn } = useSignIn();
  const { signUp } = useSignUp();
  const { signOut: clerkSignOut } = useClerk();
  const { user } = useUser();

  const signInWithEmail = useCallback(
    async (email: string, password: string): Promise<AuthResult> => {
      if (!signIn) return { data: null, error: GENERIC_ERROR };

      const { error } = await signIn.password({ emailAddress: email, password });
      if (error) return mapError(error);

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
    },
    [signIn]
  );

  const signUpWithEmail = useCallback(
    async (payload: RegisterRequest): Promise<AuthResult> => {
      if (!signUp) return { data: null, error: GENERIC_ERROR };

      const { firstName, lastName } = splitFullName(payload.full_name);
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
    async (phone: string): Promise<AuthResult> => {
      if (!signIn) return { data: null, error: GENERIC_ERROR };
      const { error } = await signIn.phoneCode.sendCode({ phoneNumber: `+237${phone}` });
      if (error) return mapError(error);
      return { data: { user: null, messageId: null }, error: null };
    },
    [signIn]
  );

  const resetPassword = useCallback(
    async (email: string): Promise<AuthResult> => {
      if (!signIn) return { data: null, error: GENERIC_ERROR };

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
