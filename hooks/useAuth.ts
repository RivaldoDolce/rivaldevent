/**
 * Hook d'authentification (Clerk).
 *
 * Wrapper autour de Clerk avec la meme surface que l'ancien useAuth
 * (Supabase) pour ne pas toucher aux ecrans :
 * - session : objet session simplifie (CompatSessionUser)
 * - user : identite Clerk mappee (id, email, user_metadata.full_name)
 * - profile : synthetise depuis Clerk (full_name, avatar_url, phone,
 *   is_seller via unsafeMetadata, meme forme que la table profiles)
 * - Synchronisation du mode (acheteur/vendeur) dans le store app-mode
 *
 * Le mode et le telephone vivent dans unsafeMetadata (seule metadata
 * modifiable cote client).
 */

import { useEffect } from 'react';
import { useAuth as useClerkAuth, useUser } from '@clerk/expo';

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

function buildProfile(
  id: string,
  fullName: string | null,
  imageUrl: string | null,
  unsafeMetadata: Record<string, unknown>
): Profile {
  const now = new Date().toISOString();
  return {
    id,
    full_name: fullName,
    avatar_url: imageUrl,
    phone: (unsafeMetadata.phone as string | undefined) ?? null,
    role: 'client',
    is_seller: (unsafeMetadata.is_seller as boolean | undefined) ?? false,
    created_at: now,
    updated_at: now,
  };
}

export function useAuth(): UseAuthReturn {
  const { isLoaded, isSignedIn, userId } = useClerkAuth();
  const { user } = useUser();
  const initializeFromProfile = useAppMode((state: { initializeFromProfile: (v: boolean) => void }) => state.initializeFromProfile);

  const isAuthenticated = isLoaded && isSignedIn && !!userId && !!user;

  const session: CompatSession | null = isAuthenticated
    ? {
        user: {
          id: user.id,
          email: user.primaryEmailAddress?.emailAddress ?? null,
          user_metadata: { full_name: user.fullName },
        },
      }
    : null;

  const profile: Profile | null = isAuthenticated
    ? buildProfile(user.id, user.fullName, user.imageUrl, user.unsafeMetadata)
    : null;

  // Synchronise le mode (acheteur/vendeur) dans le store app-mode
  useEffect(() => {
    if (!isAuthenticated) return;
    initializeFromProfile(profile?.is_seller ?? false);
  }, [isAuthenticated, profile?.is_seller, initializeFromProfile]);

  const refreshProfile = async (): Promise<void> => {
    try {
      await user?.reload();
    } catch {
      // Reload silencieux : l'etat se mettra a jour au prochain rendu
    }
  };

  return {
    session,
    user: session?.user ?? null,
    profile,
    isLoading: !isLoaded,
    isAuthenticated,
    refreshProfile,
  };
}
