// @ts-nocheck
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth as useClerkAuth, useUser as useClerkUser } from '@clerk/expo';
import type { User } from '@supabase/supabase-js';

import { supabase, setSupabaseClerkToken } from '@/lib/supabase';
import { useAppMode } from '@/stores/app-mode';
import type { Profile } from '@/types';

export interface CompatSessionUser {
  readonly id: string;
  readonly email: string | null;
  readonly user_metadata: { readonly full_name?: string | null };
}

export interface CompatSession {
  readonly user: CompatSessionUser;
}

interface UseAuthReturn {
  readonly session: CompatSession | null;
  readonly user: CompatSessionUser | null;
  readonly profile: Profile | null;
  readonly isLoading: boolean;
  readonly isAuthenticated: boolean;
  readonly authSource: 'supabase' | 'clerk-apple' | null;
  readonly refreshProfile: () => Promise<void>;
}

export function useAuth(): UseAuthReturn {
  const { isLoaded: clerkLoaded, isSignedIn: clerkSignedIn, userId: clerkUserId, getToken } = useClerkAuth();
  const { user: clerkUser } = useClerkUser();
  const initializeFromProfile = useAppMode((s) => s.initializeFromProfile);

  const [supabaseUser, setSupabaseUser] = useState<User | null>(null);
  const [supabaseReady, setSupabaseReady] = useState(false);
  const [dbProfile, setDbProfile] = useState<Profile | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);

  useEffect(() => {
    let active = true;
    supabase.auth
      .getSession()
      .then(({ data }) => {
        if (active) setSupabaseUser(data.session?.user ?? null);
      })
      .finally(() => {
        if (active) setSupabaseReady(true);
      });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (active) {
        setSupabaseUser(session?.user ?? null);
        setSupabaseReady(true);
      }
    });
    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  const useClerkApple = useMemo(
    () => !supabaseUser && !!clerkLoaded && !!clerkSignedIn && !!clerkUserId && !!clerkUser,
    [supabaseUser, clerkLoaded, clerkSignedIn, clerkUserId, clerkUser]
  );

  useEffect(() => {
    let active = true;
    async function syncAppleToken() {
      if (!useClerkApple || !getToken) {
        setSupabaseClerkToken(null);
        return;
      }
      try {
        const token = await getToken({ template: 'supabase' });
        if (active) setSupabaseClerkToken(token);
      } catch {
        if (active) setSupabaseClerkToken(null);
      }
    }
    syncAppleToken();
    return () => {
      active = false;
    };
  }, [useClerkApple, getToken, clerkUserId]);

  const isAuthenticated = useMemo(
    () => !!supabaseUser || useClerkApple,
    [supabaseUser, useClerkApple]
  );

  const authSource: 'supabase' | 'clerk-apple' | null = supabaseUser
    ? 'supabase'
    : useClerkApple
      ? 'clerk-apple'
      : null;

  const session: CompatSession | null = useMemo(() => {
    if (supabaseUser) {
      const meta = supabaseUser.user_metadata as { full_name?: string | null; fullName?: string | null } | undefined;
      return {
        user: {
          id: supabaseUser.id,
          email: supabaseUser.email ?? null,
          user_metadata: { full_name: meta?.full_name ?? meta?.fullName ?? null },
        },
      };
    }
    if (useClerkApple && clerkUser) {
      return {
        user: {
          id: clerkUser.id,
          email: clerkUser.primaryEmailAddress?.emailAddress ?? null,
          user_metadata: { full_name: clerkUser.fullName },
        },
      };
    }
    return null;
  }, [supabaseUser, useClerkApple, clerkUser]);

  const fallbackProfile: Profile | null = useMemo(() => {
    if (supabaseUser) {
      const meta = supabaseUser.user_metadata as {
        full_name?: string | null;
        phone?: string | null;
        is_seller?: boolean | null;
      } | undefined;
      const now = new Date().toISOString();
      return {
        id: supabaseUser.id,
        clerk_user_id: null,
        full_name: meta?.full_name ?? null,
        avatar_url: (supabaseUser.user_metadata as { avatar_url?: string } | undefined)?.avatar_url ?? null,
        phone: meta?.phone ?? null,
        role: 'client',
        is_seller: meta?.is_seller ?? false,
        created_at: supabaseUser.created_at ?? now,
        updated_at: now,
      };
    }
    if (useClerkApple && clerkUser) {
      const now = new Date().toISOString();
      return {
        id: clerkUser.id,
        clerk_user_id: clerkUser.id,
        full_name: clerkUser.fullName,
        avatar_url: clerkUser.imageUrl,
        phone: (clerkUser.unsafeMetadata?.phone as string | undefined) ?? null,
        role: 'client',
        is_seller: (clerkUser.unsafeMetadata?.is_seller as boolean | undefined) ?? false,
        created_at: clerkUser.createdAt?.toISOString() ?? now,
        updated_at: now,
      };
    }
    return null;
  }, [supabaseUser, useClerkApple, clerkUser]);

  const profile = dbProfile ?? fallbackProfile;

  const fetchProfile = useCallback(async () => {
    if (supabaseUser) {
      setProfileLoading(true);
      try {
        const { data } = await supabase.from('profiles').select('*').eq('id', supabaseUser.id).maybeSingle();
        if (data) setDbProfile(data as Profile);
        else setDbProfile(null);
      } finally {
        setProfileLoading(false);
      }
      return;
    }
    if (useClerkApple && clerkUser) {
      setProfileLoading(true);
      try {
        const { data } = await supabase.from('profiles').select('*').eq('clerk_user_id', clerkUser.id).maybeSingle();
        if (data) setDbProfile(data as Profile);
        else setDbProfile(null);
      } finally {
        setProfileLoading(false);
      }
      return;
    }
    setDbProfile(null);
  }, [supabaseUser, useClerkApple, clerkUser]);

  useEffect(() => {
    if (isAuthenticated) fetchProfile();
    else setDbProfile(null);
  }, [isAuthenticated, fetchProfile]);

  useEffect(() => {
    if (profile) initializeFromProfile(profile.is_seller ?? false);
  }, [profile?.is_seller, initializeFromProfile]);

  const refreshProfile = useCallback(async () => {
    try {
      await clerkUser?.reload?.();
    } catch {}
    await fetchProfile();
  }, [clerkUser, fetchProfile]);

  const isLoading = !supabaseReady || (isAuthenticated && profileLoading && !dbProfile && !fallbackProfile);

  return useMemo(
    () => ({
      session,
      user: session?.user ?? null,
      profile,
      isLoading,
      isAuthenticated,
      authSource,
      refreshProfile,
    }),
    [session, profile, isLoading, isAuthenticated, authSource, refreshProfile]
  );
}
