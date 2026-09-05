// @ts-nocheck
import { useCallback } from 'react';
import { useSignIn, useSignUp, useClerk, useUser } from '@clerk/expo';
import * as Crypto from 'expo-crypto';

import { supabase } from '@/lib/supabase';
import { logger } from '@/lib/logger';
import type { ApiResponse, ApiError, RegisterRequest, Profile } from '@/types';

export interface AuthServiceData {
  readonly access_token?: string | null;
  readonly user?: { readonly id: string } | null;
  readonly messageId?: string | null;
  readonly requiresEmailVerification?: boolean;
}

type AuthResult = ApiResponse<AuthServiceData>;

const GENERIC_ERROR: ApiError = {
  code: 'unknown',
  message: 'Une erreur est survenue. Veuillez réessayer.',
};

const PASSWORD_MIN_LENGTH = 8;

const FRENCH_ERRORS: Readonly<Record<string, string>> = {
  form_identifier_not_found: 'Aucun compte ne correspond à cette adresse email.',
  form_password_incorrect: 'Email ou mot de passe incorrect.',
  form_identifier_password_mismatch: 'Email ou mot de passe incorrect.',
  form_password_length_too_short: `Mot de passe trop court (${PASSWORD_MIN_LENGTH} caractères minimum).`,
  form_password_validation_failed: `Le mot de passe doit contenir au moins ${PASSWORD_MIN_LENGTH} caractères.`,
  form_password_pwned: 'Ce mot de passe a été compromis, choisissez-en un autre.',
  form_password_not_allowed_to_use_common: 'Mot de passe trop commun, choisissez-en un autre.',
  network_error: 'Connexion Internet indisponible. Vérifiez votre réseau et réessayez.',
  form_identifier_exists: 'Un compte existe déjà avec cette adresse email.',
  form_email_address_exists: 'Un compte existe déjà avec cette adresse email.',
  form_email_address_invalid: 'Adresse email invalide.',
  form_phone_number_invalid: 'Numéro de téléphone invalide.',
  form_code_incorrect: 'Code incorrect ou expiré.',
  form_code_expired: 'Code expiré. Demandez-en un nouveau.',
  session_exists: 'Vous êtes déjà connecté.',
  form_param_format_invalid: 'Format invalide, vérifiez vos informations.',
  too_many_requests: 'Trop de tentatives. Réessayez dans quelques minutes.',
  verification_failed: 'Vérification échouée. Réessayez.',
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

async function secureRandomString(length: number, charset: string): Promise<string> {
  const bytes = await Crypto.getRandomBytesAsync(length);
  let out = '';
  for (let i = 0; i < length; i++) out += charset[bytes[i] % charset.length];
  return out;
}

async function generateStrongPassword(): Promise<string> {
  const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const lower = 'abcdefghijkmnpqrstuvwxyz';
  const digits = '23456789';
  const special = '!@#$%^&*';
  const pool = upper + lower + digits + special;
  const rand = (c: string) => secureRandomString(1, c);
  const core = (await Promise.all([rand(upper), rand(lower), rand(digits), rand(special)])).join('');
  const rest = await secureRandomString(12, pool);
  const raw = (core + rest).split('');
  const rnd = await Crypto.getRandomBytesAsync(raw.length);
  return raw
    .map((_, i) => ({ c: raw[i], r: rnd[i] }))
    .sort((a, b) => a.r - b.r)
    .map((x) => x.c)
    .join('');
}

async function ensureSupabaseProfile(params: {
  id: string;
  fullName: string | null;
  imageUrl: string | null;
  phone?: string | null;
  isSeller?: boolean;
}): Promise<void> {
  try {
    const { data: existing } = await supabase.from('profiles').select('id').eq('clerk_user_id', params.id).maybeSingle();
    if (existing) return;
    const { error } = await supabase.from('profiles').insert({
      clerk_user_id: params.id,
      full_name: params.fullName,
      avatar_url: params.imageUrl,
      phone: params.phone ?? null,
      is_seller: params.isSeller ?? false,
      role: 'client',
    });
    if (error) logger.debug('ensureSupabaseProfile insert error:', error.message);
  } catch (err) {
    logger.debug('ensureSupabaseProfile exception:', err);
  }
}

export function useAuthService() {
  const { signIn, setActive: setActiveSignIn } = useSignIn();
  const { signUp, setActive: setActiveSignUp } = useSignUp();
  const { signOut: clerkSignOut } = useClerk();
  const { user } = useUser();

  const signInWithEmail = useCallback(
    async (email: string, password: string): Promise<AuthResult> => {
      if (!signIn) return { data: null, error: GENERIC_ERROR };
      if (signIn.status === 'complete') {
        try {
          await signIn.create({ identifier: email });
        } catch {
          return { data: null, error: GENERIC_ERROR };
        }
      }
      const res = await signIn.create({ identifier: email, password });
      if (res.status === 'complete' && res.createdSessionId) {
        await setActiveSignIn?.({ session: res.createdSessionId });
        try {
          const clerkUserId = res.createdSessionId ? (signIn as unknown as { createdSessionId?: string }) : null;
          void clerkUserId;
        } catch {}
        return { data: { access_token: res.createdSessionId, user: { id: res.createdSessionId } }, error: null };
      }
      const err = (res as unknown as { error?: { code?: string; message?: string } }).error;
      if (err) return mapError(err);
      return { data: null, error: GENERIC_ERROR };
    },
    [signIn, setActiveSignIn]
  );

  const signUpWithEmail = useCallback(
    async (payload: RegisterRequest): Promise<AuthResult> => {
      if (!signUp) return { data: null, error: GENERIC_ERROR };
      const { firstName, lastName } = splitFullName(payload.full_name);
      try {
        if (signUp.status === 'complete') {
          try {
            await signUp.create({});
          } catch {}
        }
        const created = await signUp.create({
          emailAddress: payload.email,
          password: payload.password,
          firstName,
          lastName,
          unsafeMetadata: { phone: payload.phone, is_seller: payload.is_seller === true },
        } as Parameters<typeof signUp.create>[0]);

        const clerkError = (created as unknown as { error?: { code?: string; message?: string } }).error;
        if (clerkError) return mapError(clerkError);

        if (created.status === 'complete' && created.createdSessionId) {
          await setActiveSignUp?.({ session: created.createdSessionId });
          await ensureSupabaseProfile({
            id: (created as unknown as { createdUserId?: string }).createdUserId ?? created.createdSessionId,
            fullName: payload.full_name,
            imageUrl: null,
            phone: payload.phone,
            isSeller: payload.is_seller === true,
          });
          return { data: { access_token: created.createdSessionId, user: { id: created.createdSessionId } }, error: null };
        }

        // Verification email requise : l'envoi du code DOIT reussir avant
        // de rediriger vers l'ecran OTP, sinon l'utilisateur attend un code
        // qui n'est jamais parti.
        try {
          await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
        } catch (e) {
          const er = e as { errors?: Array<{ code: string; message: string }> };
          if (er.errors?.[0]) return mapError(er.errors[0]);
          return mapError({ code: 'network_error', message: (e as Error)?.message });
        }
        return { data: { user: null, requiresEmailVerification: true }, error: null };
      } catch (e) {
        const er = e as { errors?: Array<{ code: string; message: string }> };
        if (er.errors?.[0]) return mapError(er.errors[0]);
        return mapError({ code: 'unknown', message: (e as Error)?.message });
      }
    },
    [signUp, setActiveSignUp]
  );

  const signInWithPhone = useCallback(
    async (phone: string): Promise<AuthResult> => {
      if (!signIn) return { data: null, error: GENERIC_ERROR };
      if (signIn.status === 'complete') {
        try {
          await signIn.create({});
        } catch {}
      }
      const phoneNumber = `+237${phone}`;
      const created = await signIn.create({ identifier: phoneNumber });
      const createErr = (created as unknown as { error?: { code?: string; message?: string } }).error;
      if (createErr) return mapError(createErr);
      try {
        const firstFactor = (created.supportedFirstFactors as Array<{ strategy: string; phoneNumberId?: string }> | undefined)?.find(
          (f) => f.strategy === 'phone_code'
        );
        await signIn.prepareFirstFactor({ strategy: 'phone_code', phoneNumberId: firstFactor?.phoneNumberId ?? phoneNumber } as never);
      } catch (e) {
        const er = e as { errors?: Array<{ code: string; message: string }> };
        if (er.errors?.[0]) return mapError(er.errors[0]);
        return mapError({ code: 'unknown', message: (e as Error).message });
      }
      return { data: { user: null, messageId: null }, error: null };
    },
    [signIn]
  );

  const verifyOtp = useCallback(
    async (params: { phone?: string; email?: string; token: string; type: 'sms' | 'email' }): Promise<AuthResult> => {
      if (params.type === 'sms') {
        if (!signIn) return { data: null, error: GENERIC_ERROR };
        try {
          const res = await signIn.attemptFirstFactor({ strategy: 'phone_code', code: params.token } as never);
          const err = (res as unknown as { error?: { code?: string; message?: string } }).error;
          if (err) return mapError(err);
          if (res.status !== 'complete' || !res.createdSessionId) {
            return { data: null, error: { code: 'form_code_incorrect', message: FRENCH_ERRORS.form_code_incorrect } };
          }
          await setActiveSignIn?.({ session: res.createdSessionId });
          return { data: { access_token: res.createdSessionId, user: { id: res.createdSessionId } }, error: null };
        } catch (e) {
          const er = e as { errors?: Array<{ code: string; message: string }> };
          if (er.errors?.[0]) return mapError(er.errors[0]);
          return mapError({ code: 'unknown', message: (e as Error)?.message });
        }
      }
      if (!signUp) return { data: null, error: GENERIC_ERROR };
      try {
        const res = await signUp.attemptEmailAddressVerification({ code: params.token });
        const err = (res as unknown as { error?: { code?: string; message?: string } }).error;
        if (err) return mapError(err);
        if (res.status !== 'complete' || !res.createdSessionId) {
          return { data: null, error: { code: 'form_code_incorrect', message: FRENCH_ERRORS.form_code_incorrect } };
        }
        await setActiveSignUp?.({ session: res.createdSessionId });
        const uid = (res as unknown as { createdUserId?: string }).createdUserId ?? res.createdSessionId;
        await ensureSupabaseProfile({ id: uid, fullName: null, imageUrl: null });
        return { data: { access_token: res.createdSessionId, user: { id: res.createdSessionId } }, error: null };
      } catch (e) {
        const er = e as { errors?: Array<{ code: string; message: string }> };
        if (er.errors?.[0]) return mapError(er.errors[0]);
        return mapError({ code: 'unknown', message: (e as Error)?.message });
      }
    },
    [signIn, signUp, setActiveSignIn, setActiveSignUp]
  );

  const resendOtp = useCallback(
    async (phone?: string, email?: string): Promise<AuthResult> => {
      if (phone && signIn) {
        try {
          const firstFactor = (signIn.supportedFirstFactors as Array<{ strategy: string; phoneNumberId?: string }> | undefined)?.find(
            (f) => f.strategy === 'phone_code'
          );
          await signIn.prepareFirstFactor({
            strategy: 'phone_code',
            phoneNumberId: firstFactor?.phoneNumberId ?? `+237${phone}`,
          } as never);
          return { data: { user: null, messageId: null }, error: null };
        } catch (e) {
          const er = e as { errors?: Array<{ code: string; message: string }> };
          if (er.errors?.[0]) return mapError(er.errors[0]);
          return mapError({ message: (e as Error).message });
        }
      }
      if (email && signUp) {
        try {
          await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
          return { data: { user: null, messageId: null }, error: null };
        } catch (e) {
          const er = e as { errors?: Array<{ code: string; message: string }> };
          if (er.errors?.[0]) return mapError(er.errors[0]);
          return mapError({ message: (e as Error).message });
        }
      }
      return { data: null, error: GENERIC_ERROR };
    },
    [signIn, signUp]
  );

  const resetPassword = useCallback(
    async (email: string): Promise<AuthResult> => {
      if (!signIn) return { data: null, error: GENERIC_ERROR };
      if (signIn.status === 'complete') {
        try {
          await signIn.create({ identifier: email });
        } catch {}
      } else {
        const r = await signIn.create({ identifier: email });
        const err = (r as unknown as { error?: { code?: string; message?: string } }).error;
        if (err) return mapError(err);
      }
      try {
        await signIn.prepareFirstFactor({ strategy: 'reset_password_email_code' } as never);
        return { data: { user: null }, error: null };
      } catch (e) {
        const er = e as { errors?: Array<{ code: string; message: string }> };
        if (er.errors?.[0]) return mapError(er.errors[0]);
        return mapError({ message: (e as Error).message });
      }
    },
    [signIn]
  );

  const resetPasswordVerify = useCallback(
    async (code: string): Promise<AuthResult> => {
      if (!signIn) return { data: null, error: GENERIC_ERROR };
      const res = await signIn.attemptFirstFactor({ strategy: 'reset_password_email_code', code } as never);
      const err = (res as unknown as { error?: { code?: string; message?: string } }).error;
      if (err) return mapError(err);
      if (res.status === 'needs_new_password') return { data: { user: null }, error: null };
      if (res.status !== 'complete') return { data: null, error: { code: 'form_code_incorrect', message: FRENCH_ERRORS.form_code_incorrect } };
      return { data: { user: null }, error: null };
    },
    [signIn]
  );

  const resetPasswordSubmit = useCallback(
    async (password: string): Promise<AuthResult> => {
      if (!signIn) return { data: null, error: GENERIC_ERROR };
      if (password.length < PASSWORD_MIN_LENGTH) {
        return { data: null, error: { code: 'form_password_length_too_short', message: FRENCH_ERRORS.form_password_length_too_short } };
      }
      const res = await signIn.resetPassword({ password } as never);
      const err = (res as unknown as { error?: { code?: string; message?: string } }).error;
      if (err) return mapError(err);
      if (res.status === 'complete' && res.createdSessionId) {
        await setActiveSignIn?.({ session: res.createdSessionId });
        return { data: { access_token: res.createdSessionId, user: { id: res.createdSessionId } }, error: null };
      }
      return { data: null, error: { code: 'unknown', message: 'Réinitialisation incomplète.' } };
    },
    [signIn, setActiveSignIn]
  );

  const getUserMode = useCallback(
    async (_userId: string): Promise<{ isSeller: boolean } | null> => {
      if (!user) return null;
      try {
        const { data } = await supabase.from('profiles').select('is_seller').eq('clerk_user_id', user.id).maybeSingle();
        if (data) return { isSeller: data.is_seller ?? false };
      } catch {}
      return { isSeller: (user.unsafeMetadata?.is_seller as boolean | undefined) ?? false };
    },
    [user]
  );

  const toggleSellerMode = useCallback(
    async (_userId: string, isSeller: boolean): Promise<boolean> => {
      if (!user) return false;
      try {
        await supabase.from('profiles').update({ is_seller: isSeller }).eq('clerk_user_id', user.id);
        await user.update({ unsafeMetadata: { ...((user.unsafeMetadata as Record<string, unknown>) ?? {}), is_seller: isSeller } } as never);
        return true;
      } catch (err) {
        logger.debug('toggleSellerMode error:', err);
        return false;
      }
    },
    [user]
  );

  const updateProfile = useCallback(
    async (_userId: string, payload: { readonly full_name: string; readonly phone?: string | null }): Promise<ApiResponse<Profile>> => {
      if (!user) return { data: null, error: { code: 'no_session', message: 'Connectez-vous pour modifier votre profil.' } };
      try {
        const { firstName, lastName } = splitFullName(payload.full_name);
        await user.update({ firstName, lastName } as never);
        const phoneNorm = payload.phone && payload.phone.length > 0 ? payload.phone : null;
        await user.update({ unsafeMetadata: { ...((user.unsafeMetadata as Record<string, unknown>) ?? {}), phone: phoneNorm } } as never);
        const { error } = await supabase.from('profiles').update({ full_name: payload.full_name, phone: phoneNorm }).eq('clerk_user_id', user.id);
        if (error) logger.debug('updateProfile supabase error:', error.message);
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
      if (!user) return { data: null, error: { code: 'no_session', message: 'Connectez-vous pour changer votre photo.' } };
      try {
        const res = await fetch(dataUri);
        const blob = await res.blob();
        await user.setProfileImage({ file: blob });
        const url = user.imageUrl;
        await supabase.from('profiles').update({ avatar_url: url }).eq('clerk_user_id', user.id);
        return { data: { publicUrl: url }, error: null };
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
