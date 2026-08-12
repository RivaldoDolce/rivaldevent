/**
 * Hook d'acces a l'URL d'avatar.
 *
 * L'avatar local (upload local, store persisté) prime sur l'URL
 * serveur du profil tant que Supabase Storage n'est pas branché.
 *
 * Usage :
 *   const avatarUrl = useAvatarUrl(user?.id, profile?.avatar_url);
 *   <Avatar source={avatarUrl} fallback={name} />
 */

import { useAvatarStore } from '@/stores/avatar-store';

export function useAvatarUrl(
  userId: string | undefined,
  profileUrl: string | null | undefined
): string | null {
  const localUri = useAvatarStore((state) =>
    userId ? state.avatars[userId]?.uri ?? null : null
  );
  return localUri ?? profileUrl ?? null;
}
