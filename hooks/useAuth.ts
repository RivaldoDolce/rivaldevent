// @ts-nocheck
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth as useClerkAuth, useUser } from '@clerk/expo';

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
  readonly refreshProfile: () => Promise<void>;
}

export function useAuth(): UseAuthReturn {
  const { isLoaded, isSignedIn, userId, getToken } = useClerkAuth();
  const { user } = useUser();
  const initializeFromProfile = useAppMode((s) => s.initializeFromProfile);
  const [dbProfile, setDbProfile] = useState<Profile | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);

  const isAuthenticated = useMemo(() => isLoaded && isSignedIn && !!userId && !!user, [isLoaded, isSignedIn, userId, user]);

  useEffect(() => {
    let active = true;
    async function syncToken() {
      if (!isAuthenticated || !getToken) {
        setSupabaseClerkToken(null);
        return;
      }
      try {
        const token = await getToken({ template: 'supabase' });
        if (active) setSupabaseClerkToken(token);
      } catch {
        setSupabaseClerkToken(null);
      }
    }
    syncToken();
    return () => {
      active = false;
    };
  }, [isAuthenticated, getToken, userId]);

  const session: CompatSession | null = useMemo(
    () =>
      isAuthenticated
        ? {
            user: {
              id: user!.id,
              email: user!.primaryEmailAddress?.emailAddress ?? null,
              user_metadata: { full_name: user!.fullName },
            },
          }
        : null,
    [isAuthenticated, user]
  );

  const fallbackProfile: Profile | null = useMemo(() => {
    if (!isAuthenticated || !user) return null;
    const now = new Date().toISOString();
    return {
      id: user.id,
      clerk_user_id: user.id,
      full_name: user.fullName,
      avatar_url: user.imageUrl,
      phone: (user.unsafeMetadata?.phone as string | undefined) ?? null,
      role: 'client',
      is_seller: (user.unsafeMetadata?.is_seller as boolean | undefined) ?? false,
      created_at: user.createdAt?.toISOString() ?? now,
      updated_at: now,
    };
  }, [isAuthenticated, user]);

  const profile = dbProfile ?? fallbackProfile;

  const fetchProfile = useCallback(async () => {
    if (!user) {
      setDbProfile(null);
      return;
    }
    setProfileLoading(true);
    try {
      const { data } = await supabase.from('profiles').select('*').eq('clerk_user_id', user.id).maybeSingle();
      if (data) setDbProfile(data as Profile);
      else setDbProfile(null);
    } finally {
      setProfileLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (isAuthenticated) fetchProfile();
    else setDbProfile(null);
  }, [isAuthenticated, fetchProfile]);

  useEffect(() => {
    if (profile) initializeFromProfile(profile.is_seller ?? false);
  }, [profile?.is_seller, initializeFromProfile]);

  const refreshProfile = useCallback(async () => {
    try {
      await user?.reload();
    } catch {}
    await fetchProfile();
  }, [user, fetchProfile]);

  return useMemo(
    () => ({
      session,
      user: session?.user ?? null,
      profile,
      isLoading: !isLoaded || (isAuthenticated && profileLoading && !dbProfile && !fallbackProfile),
      isAuthenticated,
      refreshProfile,
    }),
    [session, profile, isLoaded, isAuthenticated, refreshProfile, profileLoading, dbProfile, fallbackProfile]
  );
}
