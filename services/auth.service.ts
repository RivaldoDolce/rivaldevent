// @ts-nocheck
/**
 * Service d'authentification — Supabase en priorite, Clerk reserve a Apple.
 *
 * - Email/password, Google OAuth, OTP email/SMS, reset password : Supabase Auth.
 * - Apple : Clerk SSO (useSSO `oauth_apple`, voir login/register).
 * - Chaque methode retourne `{ data, error }` et ne leve JAMAIS
 *   (les ecrans n'ont pas de try/catch global : un throw = spinner infini).
 */

import { useCallback } from 'react';
import { Platform } from 'react-native';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { useClerk, useUser as useClerkUser } from '@clerk/expo';

import { supabase, setSupabaseClerkToken } from '@/lib/supabase';
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
  invalid_credentials: 'Email ou mot de passe incorrect.',
  invalid_login_credentials: 'Email ou mot de passe incorrect.',
  email_not_confirmed: 'Vérifiez votre email : un code de confirmation vous a été envoyé.',
  user_already_exists: 'Un compte existe déjà avec cette adresse email.',
  user_already_registered: 'Un compte existe déjà avec cette adresse email.',
  email_exists: 'Un compte existe déjà avec cette adresse email.',
  otp_expired: 'Code expiré. Demandez-en un nouveau.',
  otp_disabled: 'Vérification par code indisponible. Réessayez.',
  over_email_send_rate_limit: 'Trop de tentatives. Réessayez dans quelques minutes.',
  over_request_rate_limit: 'Trop de tentatives. Réessayez dans quelques minutes.',
  over_sms_send_rate_limit: 'Trop de SMS envoyés. Réessayez dans quelques minutes.',
  phone_exists: 'Un compte existe déjà avec ce numéro.',
  validation_failed: 'Vérifiez vos informations et réessayez.',
  weak_password: `Le mot de passe doit contenir au moins ${PASSWORD_MIN_LENGTH} caractères.`,
  same_password: 'Choisissez un mot de passe différent de l’ancien.',
  network_error: 'Connexion Internet indisponible. Vérifiez votre réseau et réessayez.',
  session_exists: 'Vous êtes déjà connecté.',
  too_many_requests: 'Trop de tentatives. Réessayez dans quelques minutes.',
};

function mapSupabaseError(err: unknown): AuthResult {
  if (!err || typeof err !== 'object') return { data: null, error: GENERIC_ERROR };
  const maybe = err as { readonly code?: string; readonly message?: string; readonly status?: number };
  const rawCode = (maybe.code ?? '').toLowerCase().replace(/-/g, '_');
  const rawMessage = (maybe.message ?? '').toLowerCase();
  let code = rawCode || 'unknown';
  if (rawMessage.includes('invalid login credentials') || rawMessage.includes('invalid credentials')) {
    code = 'invalid_credentials';
  } else if (rawMessage.includes('email not confirmed')) {
    code = 'email_not_confirmed';
  } else if (rawMessage.includes('user already registered') || rawMessage.includes('already exists')) {
    code = 'user_already_exists';
  } else if (rawMessage.includes('otp') && rawMessage.includes('expired')) {
    code = 'otp_expired';
  } else if (rawMessage.includes('rate limit') || rawMessage.includes('too many')) {
    code = 'too_many_requests';
  }
  const message = FRENCH_ERRORS[code] ?? maybe.message ?? GENERIC_ERROR.message;
  logger.debug('Supabase auth error:', code, maybe.message);
  return { data: null, error: { code, message } };
}

function toE164Cameroon(phone: string): string {
  const digits = phone.replace(/[^0-9]/g, '');
  if (digits.startsWith('237')) return `+${digits}`;
  return `+237${digits}`;
}

async function ensureSupabaseProfile(params: {
  id: string;
  fullName: string | null;
  imageUrl: string | null;
  phone?: string | null;
  isSeller?: boolean;
}): Promise<void> {
  try {
    const { data: existing } = await supabase.from('profiles').select('id').eq('id', params.id).maybeSingle();
    if (existing) return;
    const { error } = await supabase.from('profiles').insert({
      id: params.id,
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

function extractOAuthCode(callbackUrl: string): string | null {
  try {
    const url = new URL(callbackUrl);
    const fromSearch = url.searchParams.get('code');
    if (fromSearch) return fromSearch;
    const hash = url.hash.startsWith('#') ? url.hash.slice(1) : url.hash;
    if (hash) {
      const hParams = new URLSearchParams(hash);
      const c = hParams.get('code');
      if (c) return c;
    }
    if (callbackUrl.includes('code=')) {
      const m = callbackUrl.match(/[?&#]code=([^&#]+)/);
      if (m?.[1]) return decodeURIComponent(m[1]);
    }
    return null;
  } catch {
    const m = callbackUrl.match(/[?&#]code=([^&#]+)/);
    return m?.[1] ? decodeURIComponent(m[1]) : null;
  }
}

const lastCallAt = new Map<string, number>();
function rateLimitOk(key: string, minMs: number): boolean {
  const now = Date.now();
  const last = lastCallAt.get(key) ?? 0;
  if (now - last < minMs) return false;
  lastCallAt.set(key, now);
  return true;
}

const MAX_AVATAR_BYTES = 5 * 1024 * 1024;
const ALLOWED_AVATAR_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/jpg']);

export function useAuthService() {
  const { signOut: clerkSignOut } = useClerk();
  const { user: clerkUser } = useClerkUser();

  const signInWithEmail = useCallback(async (email: string, password: string): Promise<AuthResult> => {
    if (!rateLimitOk(`signin:${email.trim().toLowerCase()}`, 1500)) {
      return { data: null, error: { code: 'too_many_requests', message: FRENCH_ERRORS.too_many_requests } };
    }
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (error) {
        const mapped = mapSupabaseError(error);
        if (mapped.error?.code === 'email_not_confirmed') {
          try {
            await supabase.auth.resend({ type: 'signup', email: email.trim() });
          } catch {}
          return { data: { user: null, requiresEmailVerification: true }, error: null };
        }
        return mapped;
      }
      if (!data.session || !data.user) {
        return { data: null, error: GENERIC_ERROR };
      }
      setSupabaseClerkToken(null);
      await ensureSupabaseProfile({
        id: data.user.id,
        fullName:
          (data.user.user_metadata as { full_name?: string } | undefined)?.full_name ??
          data.user.email ??
          null,
        imageUrl: null,
      });
      return {
        data: { access_token: data.session.access_token, user: { id: data.user.id } },
        error: null,
      };
    } catch (e) {
      return mapSupabaseError(e);
    }
  }, []);

  const signUpWithEmail = useCallback(
    async (payload: RegisterRequest & { birth_date?: string }): Promise<AuthResult> => {
      if (!rateLimitOk(`signup:${payload.email.trim().toLowerCase()}`, 2000)) {
        return { data: null, error: { code: 'too_many_requests', message: FRENCH_ERRORS.too_many_requests } };
      }
      try {
        const { data, error } = await supabase.auth.signUp({
          email: payload.email.trim(),
          password: payload.password,
          options: {
            data: {
              full_name: payload.full_name,
              phone: payload.phone,
              birth_date: payload.birth_date ?? null,
              is_seller: payload.is_seller === true,
            },
          },
        });
        if (error) return mapSupabaseError(error);
        if (data.session && data.user) {
          setSupabaseClerkToken(null);
          await ensureSupabaseProfile({
            id: data.user.id,
            fullName: payload.full_name,
            imageUrl: null,
            phone: payload.phone,
            isSeller: payload.is_seller === true,
          });
          return {
            data: { access_token: data.session.access_token, user: { id: data.user.id } },
            error: null,
          };
        }
        return { data: { user: null, requiresEmailVerification: true }, error: null };
      } catch (e) {
        return mapSupabaseError(e);
      }
    },
    []
  );

  const verifyEmailOtp = useCallback(async (email: string, token: string): Promise<AuthResult> => {
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email: email.trim(),
        token: token.trim(),
        type: 'signup',
      });
      if (error) return mapSupabaseError(error);
      if (!data.session || !data.user) {
        return { data: null, error: { code: 'form_code_incorrect', message: 'Code incorrect ou expiré.' } };
      }
      setSupabaseClerkToken(null);
      await ensureSupabaseProfile({
        id: data.user.id,
        fullName:
          (data.user.user_metadata as { full_name?: string } | undefined)?.full_name ??
          data.user.email ??
          null,
        imageUrl: null,
        phone: (data.user.user_metadata as { phone?: string } | undefined)?.phone ?? null,
        isSeller: (data.user.user_metadata as { is_seller?: boolean } | undefined)?.is_seller ?? false,
      });
      return {
        data: { access_token: data.session.access_token, user: { id: data.user.id } },
        error: null,
      };
    } catch (e) {
      return mapSupabaseError(e);
    }
  }, []);

  const resendEmailOtp = useCallback(async (email: string): Promise<AuthResult> => {
    try {
      const { error } = await supabase.auth.resend({ type: 'signup', email: email.trim() });
      if (error) return mapSupabaseError(error);
      return { data: { user: null, messageId: null }, error: null };
    } catch (e) {
      return mapSupabaseError(e);
    }
  }, []);

  const signInWithPhone = useCallback(async (phone: string): Promise<AuthResult> => {
    if (!rateLimitOk(`phone:${toE164Cameroon(phone)}`, 30000)) {
      return { data: null, error: { code: 'too_many_requests', message: FRENCH_ERRORS.too_many_requests } };
    }
    try {
      const { error } = await supabase.auth.signInWithOtp({ phone: toE164Cameroon(phone) });
      if (error) return mapSupabaseError(error);
      return { data: { user: null, messageId: null }, error: null };
    } catch (e) {
      return mapSupabaseError(e);
    }
  }, []);

  const verifyPhoneOtp = useCallback(async (phone: string, token: string): Promise<AuthResult> => {
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        phone: toE164Cameroon(phone),
        token: token.trim(),
        type: 'sms',
      });
      if (error) return mapSupabaseError(error);
      if (!data.session || !data.user) {
        return { data: null, error: { code: 'form_code_incorrect', message: 'Code incorrect ou expiré.' } };
      }
      setSupabaseClerkToken(null);
      await ensureSupabaseProfile({ id: data.user.id, fullName: null, imageUrl: null, phone });
      return {
        data: { access_token: data.session.access_token, user: { id: data.user.id } },
        error: null,
      };
    } catch (e) {
      return mapSupabaseError(e);
    }
  }, []);

  const verifyOtp = useCallback(
    async (params: { phone?: string; email?: string; token: string; type: 'sms' | 'email' }): Promise<AuthResult> => {
      if (params.type === 'sms' || params.phone) {
        if (!params.phone) return { data: null, error: GENERIC_ERROR };
        return verifyPhoneOtp(params.phone, params.token);
      }
      if (!params.email) return { data: null, error: GENERIC_ERROR };
      return verifyEmailOtp(params.email, params.token);
    },
    [verifyEmailOtp, verifyPhoneOtp]
  );

  const resendOtp = useCallback(
    async (phone?: string, email?: string): Promise<AuthResult> => {
      try {
        if (phone) {
          const { error } = await supabase.auth.signInWithOtp({ phone: toE164Cameroon(phone) });
          if (error) return mapSupabaseError(error);
          return { data: { user: null, messageId: null }, error: null };
        }
        if (email) return resendEmailOtp(email);
        return { data: null, error: GENERIC_ERROR };
      } catch (e) {
        return mapSupabaseError(e);
      }
    },
    [resendEmailOtp]
  );

  const signInWithGoogle = useCallback(async (): Promise<AuthResult> => {
    try {
      if (Platform.OS === 'android') {
        try {
          await WebBrowser.warmUpAsync();
        } catch {}
      }
      const redirectTo = AuthSession.makeRedirectUri({ scheme: 'rivaldevent', path: 'oauth-callback' });
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo,
          skipBrowserRedirect: true,
          queryParams: { access_type: 'offline', prompt: 'consent' },
        },
      });
      if (error) return mapSupabaseError(error);
      if (!data?.url) return { data: null, error: GENERIC_ERROR };
      const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
      if (result.type !== 'success' || !('url' in result)) {
        return { data: null, error: { code: 'cancelled', message: 'Connexion annulée.' } };
      }
      const code = extractOAuthCode(result.url);
      if (!code) {
        logger.debug('Google OAuth: aucun code dans le callback');
        return { data: null, error: { code: 'unknown', message: 'Connexion incomplète. Réessayez.' } };
      }
      const { data: exchanged, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
      if (exchangeError) return mapSupabaseError(exchangeError);
      if (!exchanged.session || !exchanged.user) {
        return { data: null, error: GENERIC_ERROR };
      }
      setSupabaseClerkToken(null);
      await ensureSupabaseProfile({
        id: exchanged.user.id,
        fullName:
          (exchanged.user.user_metadata as { full_name?: string; name?: string } | undefined)?.full_name ??
          (exchanged.user.user_metadata as { name?: string } | undefined)?.name ??
          exchanged.user.email ??
          null,
        imageUrl:
          (exchanged.user.user_metadata as { avatar_url?: string; picture?: string } | undefined)?.avatar_url ??
          (exchanged.user.user_metadata as { picture?: string } | undefined)?.picture ??
          null,
      });
      return {
        data: { access_token: exchanged.session.access_token, user: { id: exchanged.user.id } },
        error: null,
      };
    } catch (e) {
      logger.debug('Google login error:', e);
      return mapSupabaseError(e);
    } finally {
      try {
        if (Platform.OS === 'android') await WebBrowser.coolDownAsync();
      } catch {}
    }
  }, []);

  const resetPassword = useCallback(async (email: string): Promise<AuthResult> => {
    try {
      const redirectTo = AuthSession.makeRedirectUri({ scheme: 'rivaldevent', path: 'oauth-callback' });
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo });
      if (error) return mapSupabaseError(error);
      return { data: { user: null }, error: null };
    } catch (e) {
      return mapSupabaseError(e);
    }
  }, []);

  const resetPasswordVerify = useCallback(async (code: string, email?: string): Promise<AuthResult> => {
    if (!email) {
      return { data: null, error: { code: 'unknown', message: 'Adresse email manquante. Recommencez.' } };
    }
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email: email.trim(),
        token: code.trim(),
        type: 'recovery',
      });
      if (error) return mapSupabaseError(error);
      if (!data.session) {
        return { data: null, error: { code: 'form_code_incorrect', message: 'Code incorrect ou expiré.' } };
      }
      return { data: { user: null }, error: null };
    } catch (e) {
      return mapSupabaseError(e);
    }
  }, []);

  const resetPasswordSubmit = useCallback(async (password: string): Promise<AuthResult> => {
    if (password.length < PASSWORD_MIN_LENGTH) {
      return {
        data: null,
        error: {
          code: 'weak_password',
          message: FRENCH_ERRORS.weak_password ?? GENERIC_ERROR.message,
        },
      };
    }
    try {
      const { data, error } = await supabase.auth.updateUser({ password });
      if (error) return mapSupabaseError(error);
      const user = data.user;
      if (!user) return { data: null, error: GENERIC_ERROR };
      const { data: sessionData } = await supabase.auth.getSession();
      return {
        data: { access_token: sessionData.session?.access_token ?? null, user: { id: user.id } },
        error: null,
      };
    } catch (e) {
      return mapSupabaseError(e);
    }
  }, []);

  const getUserMode = useCallback(
    async (_userId: string): Promise<{ isSeller: boolean } | null> => {
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const sbUser = sessionData.session?.user;
        if (sbUser) {
          const { data } = await supabase.from('profiles').select('is_seller').eq('id', sbUser.id).maybeSingle();
          if (data) return { isSeller: data.is_seller ?? false };
          return { isSeller: ((sbUser.user_metadata as { is_seller?: boolean } | undefined)?.is_seller ?? false) };
        }
      } catch {}
      if (!clerkUser) return null;
      try {
        const { data } = await supabase
          .from('profiles')
          .select('is_seller')
          .eq('clerk_user_id', clerkUser.id)
          .maybeSingle();
        if (data) return { isSeller: data.is_seller ?? false };
      } catch {}
      return { isSeller: (clerkUser.unsafeMetadata?.is_seller as boolean | undefined) ?? false };
    },
    [clerkUser]
  );

  const toggleSellerMode = useCallback(
    async (_userId: string, isSeller: boolean): Promise<boolean> => {
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const sbUser = sessionData.session?.user;
        if (sbUser) {
          const { error } = await supabase.from('profiles').update({ is_seller: isSeller }).eq('id', sbUser.id);
          if (error) {
            logger.debug('toggleSellerMode supabase error:', error.message);
            return false;
          }
          try {
            await supabase.auth.updateUser({ data: { is_seller: isSeller } });
          } catch {}
          return true;
        }
      } catch (err) {
        logger.debug('toggleSellerMode error:', err);
      }
      if (!clerkUser) return false;
      try {
        await supabase.from('profiles').update({ is_seller: isSeller }).eq('clerk_user_id', clerkUser.id);
        await clerkUser.update({
          unsafeMetadata: { ...((clerkUser.unsafeMetadata as Record<string, unknown>) ?? {}), is_seller: isSeller },
        } as never);
        return true;
      } catch (err) {
        logger.debug('toggleSellerMode clerk error:', err);
        return false;
      }
    },
    [clerkUser]
  );

  const updateProfile = useCallback(
    async (
      _userId: string,
      payload: { readonly full_name: string; readonly phone?: string | null }
    ): Promise<ApiResponse<Profile>> => {
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const sbUser = sessionData.session?.user;
        if (sbUser) {
          const phoneNorm = payload.phone && payload.phone.length > 0 ? payload.phone : null;
          try {
            await supabase.auth.updateUser({ data: { full_name: payload.full_name, phone: phoneNorm } });
          } catch {}
          const { error } = await supabase
            .from('profiles')
            .update({ full_name: payload.full_name, phone: phoneNorm })
            .eq('id', sbUser.id);
          if (error) logger.debug('updateProfile supabase error:', error.message);
          return { data: null, error: null };
        }
      } catch (err) {
        logger.debug('updateProfile error:', err);
      }
      if (!clerkUser) {
        return { data: null, error: { code: 'no_session', message: 'Connectez-vous pour modifier votre profil.' } };
      }
      try {
        const phoneNorm = payload.phone && payload.phone.length > 0 ? payload.phone : null;
        const { error } = await supabase
          .from('profiles')
          .update({ full_name: payload.full_name, phone: phoneNorm })
          .eq('clerk_user_id', clerkUser.id);
        if (error) logger.debug('updateProfile clerk supabase error:', error.message);
        return { data: null, error: null };
      } catch (err) {
        logger.debug('updateProfile clerk error:', err);
        return { data: null, error: GENERIC_ERROR };
      }
    },
    [clerkUser]
  );

  const uploadAvatar = useCallback(
    async (_userId: string, dataUri: string): Promise<ApiResponse<{ publicUrl: string }>> => {
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const sbUser = sessionData.session?.user;
        const ownerId = sbUser?.id ?? clerkUser?.id;
        if (!ownerId) {
          return { data: null, error: { code: 'no_session', message: 'Connectez-vous pour changer votre photo.' } };
        }
        try {
          const res = await fetch(dataUri);
          const blob = await res.blob();
          if (blob.size > MAX_AVATAR_BYTES) {
            return { data: null, error: { code: 'validation_failed', message: 'Image trop volumineuse (max 5 Mo).' } };
          }
          const contentType = blob.type || 'image/jpeg';
          if (!ALLOWED_AVATAR_TYPES.has(contentType)) {
            return { data: null, error: { code: 'validation_failed', message: 'Format non supporté (jpeg/png/webp).' } };
          }
          const ext = contentType === 'image/png' ? 'png' : contentType === 'image/webp' ? 'webp' : 'jpg';
          const path = `${ownerId}/${Date.now()}.${ext}`;
          const { error: uploadError } = await supabase.storage.from('avatars').upload(path, blob, {
            contentType,
            upsert: true,
          });
          if (uploadError) throw uploadError;
          const { data: publicData } = supabase.storage.from('avatars').getPublicUrl(path);
          const publicUrl = publicData.publicUrl;
          if (sbUser) {
            await supabase.from('profiles').update({ avatar_url: publicUrl }).eq('id', sbUser.id);
          } else if (clerkUser) {
            await supabase.from('profiles').update({ avatar_url: publicUrl }).eq('clerk_user_id', clerkUser.id);
          }
          return { data: { publicUrl }, error: null };
        } catch (storageErr) {
          const msg = storageErr instanceof Error ? storageErr.message : String(storageErr);
          if (msg.includes('Bucket not found') || msg.includes('not found')) {
            logger.debug('uploadAvatar bucket manquant, fallback local');
            return { data: { publicUrl: dataUri }, error: null };
          }
          throw storageErr;
        }
      } catch (err) {
        logger.debug('uploadAvatar error:', err);
        return { data: null, error: GENERIC_ERROR };
      }
    },
    [clerkUser]
  );

  const signOut = useCallback(async (): Promise<void> => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      logger.debug('signOut supabase exception:', err);
    }
    try {
      await clerkSignOut();
    } catch (err) {
      logger.debug('signOut clerk exception:', err);
    }
    setSupabaseClerkToken(null);
  }, [clerkSignOut]);

  return {
    signInWithEmail,
    signUpWithEmail,
    verifyEmailOtp,
    resendEmailOtp,
    signInWithPhone,
    verifyPhoneOtp,
    verifyOtp,
    resendOtp,
    signInWithGoogle,
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
