/**
 * Hook d'authentification.
 *
 * Wrapper autour de Supabase Auth avec :
 * - Session reactive (se met a jour automatiquement)
 * - Listener onChange (token refresh, logout)
 * - Methodes login, register, logout, verifyOtp
 * - Profil utilisateur (depuis la table profiles)
 *
 * Le state est gere via Supabase Auth listener (pas de Zustand) car
 * Supabase maintient deja le state en interne + SecureStore.
 */

import { useState, useEffect, useCallback } from 'react';
import type { Session, User } from '@supabase/supabase-js';

import { supabase } from '@/lib/supabase';
import { logger } from '@/lib/logger';
import type { Profile } from '@/types';

interface UseAuthReturn {
  readonly session: Session | null;
  readonly user: User | null;
  readonly profile: Profile | null;
  readonly isLoading: boolean;
  readonly isAuthenticated: boolean;
  readonly refreshProfile: () => Promise<void>;
}

export function useAuth(): UseAuthReturn {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Charger le profil depuis la table profiles
    const loadProfile = useCallback(async (userId: string): Promise<Profile | null> => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        logger.error('[useAuth] loadProfile error:', error.message);
        return null;
      }
      return (data as unknown as Profile) ?? null;
    } catch (err) {
      logger.error('[useAuth] loadProfile exception:', err);
      return null;
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    if (!session?.user?.id) return;
    const p = await loadProfile(session.user.id);
    setProfile(p);
  }, [session, loadProfile]);

  // Init : recuperer la session existante + listener
  useEffect(() => {
    let mounted = true;

    const init = async () => {
      try {
        const { data: { session: existingSession } } = await supabase.auth.getSession();
        if (!mounted) return;

        setSession(existingSession);

        if (existingSession?.user?.id) {
          const p = await loadProfile(existingSession.user.id);
          if (mounted) setProfile(p);
        }
      } catch (err) {
        logger.error('[useAuth] init error:', err);
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    init();

    // Listener pour les changements de session (login, logout, refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, newSession) => {
        if (!mounted) return;
        setSession(newSession);

        if (newSession?.user?.id) {
          const p = await loadProfile(newSession.user.id);
          if (mounted) setProfile(p);
        } else {
          if (mounted) setProfile(null);
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [loadProfile]);

  return {
    session,
    user: session?.user ?? null,
    profile,
    isLoading,
    isAuthenticated: !!session,
    refreshProfile,
  };
}