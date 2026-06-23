/**
 * Store Zustand persistant pour la queue d'actions offline.
 *
 * Chaque action ajoutée sera retry 3x avec backoff, puis marquée failed.
 * La sync automatique se déclenche au retour du réseau.
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ============================================================
// Types
// ============================================================

export type OfflineActionType =
  | 'CREATE_EVENT'
  | 'UPDATE_EVENT'
  | 'BUY_TICKET'
  | 'UPDATE_PROFILE'
  | 'CREATE_VENUE'
  | 'WITHDRAW'
  | 'PROMOTE_VENUE';

export interface OfflineAction {
  readonly id: string;
  readonly type: OfflineActionType;
  readonly payload: Record<string, unknown>;
  readonly timestamp: number;
  readonly retryCount: number;
  readonly status: 'pending' | 'processing' | 'failed';
  readonly error?: string;
}

interface OfflineState {
  readonly queue: OfflineAction[];
  readonly isOnline: boolean;
  readonly pendingSync: boolean;
  readonly lastSync: number | null;

  // Actions
  addToQueue: (
    action: Omit<OfflineAction, 'id' | 'timestamp' | 'retryCount' | 'status'>
  ) => void;
  removeFromQueue: (id: string) => void;
  updateActionStatus: (
    id: string,
    status: OfflineAction['status'],
    error?: string
  ) => void;
  setOnline: (status: boolean) => void;
  setPendingSync: (pending: boolean) => void;
  setLastSync: (timestamp: number) => void;
  clearQueue: () => void;
  retryFailed: () => void;
}

// ============================================================
// Store Zustand avec persistance AsyncStorage
// ============================================================

export const useOfflineStore = create<OfflineState>()(
  persist(
    (set) => ({
      queue: [],
      isOnline: true,
      pendingSync: false,
      lastSync: null,

      addToQueue: (action) =>
        set((state) => ({
          queue: [
            ...state.queue,
            {
              ...action,
              id: `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
              timestamp: Date.now(),
              retryCount: 0,
              status: 'pending' as const,
            },
          ],
        })),

      removeFromQueue: (id) =>
        set((state) => ({
          queue: state.queue.filter((item) => item.id !== id),
        })),

      updateActionStatus: (id, status, error) =>
        set((state) => ({
          queue: state.queue.map((item) =>
            item.id === id
              ? {
                  ...item,
                  status,
                  error,
                  retryCount: item.retryCount + 1,
                }
              : item
          ),
        })),

      setOnline: (status) => set({ isOnline: status }),
      setPendingSync: (pending) => set({ pendingSync: pending }),
      setLastSync: (timestamp) => set({ lastSync: timestamp }),

      clearQueue: () => set({ queue: [] }),

      retryFailed: () =>
        set((state) => ({
          queue: state.queue.map((item) =>
            item.status === 'failed'
              ? { ...item, status: 'pending' as const, retryCount: 0, error: undefined }
              : item
          ),
        })),
    }),
    {
      name: 'rivaldevent-offline-queue',
      storage: createJSONStorage(() => AsyncStorage),
      // Ne persister que la queue, pas les flags transitoires
      partialize: (state) => ({ queue: state.queue }),
    }
  )
);

// ============================================================
// Sélecteurs typés (pour éviter les re-renders inutiles)
// ============================================================

export const usePendingActionsCount = (): number =>
  useOfflineStore((state) => state.queue.filter((a) => a.status === 'pending').length);

export const useFailedActionsCount = (): number =>
  useOfflineStore((state) => state.queue.filter((a) => a.status === 'failed').length);

export const useIsOnline = (): boolean => useOfflineStore((state) => state.isOnline);

export const usePendingSync = (): boolean =>
  useOfflineStore((state) => state.pendingSync);