/**
 * Store local des avatars uploades.
 *
 * Source de verite temporaire pour la photo de profil tant que
 * Supabase Storage n'est pas branché :
 * - L'avatar choisi est enregistre ici (persiste AsyncStorage)
 * - Il prime sur profile.avatar_url cote UI (voir hooks/useAvatarUrl)
 * - Au moment du branchement Supabase, l'upload serveur prend le relais
 *
 * Persistence : AsyncStorage via zustand/middleware persist.
 */

import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface AvatarRecord {
  readonly uri: string;
  readonly updatedAt: number;
}

interface AvatarStoreState {
  readonly avatars: Record<string, AvatarRecord>;
  setAvatar: (userId: string, uri: string) => void;
}

export const useAvatarStore = create<AvatarStoreState>()(
  persist(
    (set) => ({
      avatars: {},

      setAvatar: (userId, uri) =>
        set((state) => ({
          avatars: {
            ...state.avatars,
            [userId]: { uri, updatedAt: Date.now() },
          },
        })),
    }),
    {
      name: 'rivaldevent-avatars',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
