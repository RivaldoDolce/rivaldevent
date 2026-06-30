/**
 * Hook d'authentification.
 *
 * Wrapper autour de Supabase Auth avec :
 * - Session reactive (se met a jour automatiquement)
 * - Listener onChange (token refresh, logout)
 * - Profil utilisateur (depuis la table profiles)
 * - Synchronisation avec le store app-mode (Zustand)
 *
 * Le state auth est gere via Supabase Auth listener.
 * Le mode (acheteur/vendeur) est synchronise dans le store Zustand.
 */

import { useState, useEffect, useCallback } from 'react';
import type { Session } from '@supabase/supabase-js';

import { supabase } from '@/lib/supabase';
import { logger } from '@/lib/logger';
import { useAppMode } from '@/stores/app-mode';
import type { Profile } from '@/types';

interface UseAuthReturn {
  readonly session: Session | null;
  readonly user: Session['user'] | null;
  readonly profile: Profile | null;
  readonly isLoading: boolean;
  readonly isAuthenticated: boolean;
  readonly refreshProfile: () => Promise<void>;
}

export function useAuth(): UseAuthReturn {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const initializeFromProfile = useAppMode((state: { initializeFromProfile: (v: boolean) => void }) => state.initializeFromProfile);

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

      const p = (data as unknown as Profile) ?? null;
      return p;
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

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      try {
        const { data: { session: existingSession } } = await supabase.auth.getSession();
        if (!mounted) return;

        setSession(existingSession);

        if (existingSession?.user?.id) {
          const p = await loadProfile(existingSession.user.id);
          if (mounted) {
            setProfile(p);
            if (p) {
              initializeFromProfile(p.is_seller);
            }
          }
        }
      } catch (err) {
        logger.error('[useAuth] init error:', err);
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    init();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, newSession) => {
        if (!mounted) return;
        setSession(newSession);

        if (newSession?.user?.id) {
          const p = await loadProfile(newSession.user.id);
          if (mounted) {
            setProfile(p);
            if (p) {
              initializeFromProfile(p.is_seller);
            }
          }
        } else {
          if (mounted) setProfile(null);
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [loadProfile, initializeFromProfile]);

  return {
    session,
    user: session?.user ?? null,
    profile,
    isLoading,
    isAuthenticated: !!session,
    refreshProfile,
  };
}