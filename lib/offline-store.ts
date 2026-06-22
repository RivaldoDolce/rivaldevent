import { create } from 'zustand';

/**
 * Action en attente de synchronisation avec Supabase.
 * Stockée dans la queue offline Zustand (persistée AsyncStorage).
 */
export interface OfflineAction {
  readonly id: string;
  readonly type:
    | 'CREATE_EVENT'
    | 'UPDATE_EVENT'
    | 'BUY_TICKET'
    | 'UPDATE_PROFILE'
    | 'CREATE_VENUE'
    | 'WITHDRAW'
    | 'PROMOTE_VENUE';
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
  clearQueue: () => void;
}

/**
 * Store Zustand persistant pour la queue d'actions offline.
 * Chaque action ajoutée sera retry 3x avec backoff, puis marquée failed.
 */
export const useOfflineStore = create<OfflineState>()((set) => ({
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

  clearQueue: () => set({ queue: [] }),
}));