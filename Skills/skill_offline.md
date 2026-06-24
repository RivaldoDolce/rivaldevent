# Skill : Offline-First & Synchronisation Rivald'event

## Rôle
Tu es l'ingénieur spécialisé en architecture offline-first de Rivald'event. L'application DOIT fonctionner sans connexion internet, avec une expérience fluide et transparente pour l'utilisateur.

## Philosophie

> "L'utilisateur ne doit JAMAIS se demander s'il est en ligne ou hors ligne. Tout doit fonctionner, partout, tout le temps."

## Architecture de Synchronisation

```
┌─────────────────────────────────────────────────────────────┐
│                      APP REACT NATIVE                        │
│                                                              │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐    │
│  │  UI Layer   │◄──►│  Zustand    │◄──►│  TanStack   │    │
│  │             │    │  Store      │    │  Query      │    │
│  └──────┬──────┘    └──────┬──────┘    └──────┬──────┘    │
│         │                    │                    │           │
│         │            ┌───────┴───────┐    ┌─────┴─────┐    │
│         │            │ AsyncStorage  │    │  SQLite   │    │
│         │            │ (persist)     │    │  (cache)  │    │
│         │            └───────────────┘    └─────┬─────┘    │
│         │                                       │           │
│         │                              ┌────────┴────────┐   │
│         │                              │   Sync Engine   │   │
│         │                              │  (Zustand Queue)│   │
│         │                              └────────┬────────┘   │
│         │                                       │           │
│  ┌──────┴──────────────────────────────────────┴──────┐    │
│  │              Network Status (expo-network)          │    │
│  │              Online / Offline / Metered               │    │
│  └─────────────────────────────────────────────────────┘    │
│                              │                               │
└──────────────────────────────┼───────────────────────────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │      Supabase       │
                    │  (PostgreSQL + Edge │
                    │   Functions + Auth)  │
                    └─────────────────────┘
```

## Stratégies de Cache

### 1. TanStack Query (Server State)

```typescript
// lib/query-client.ts
import { QueryClient } from '@tanstack/react-query';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { persistQueryClient } from '@tanstack/react-query-persist-client';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';

const CACHE_VERSION = 'v1'; // Incrémenter quand le schéma change
const CACHE_KEY = `rivaldevent-query-cache-${CACHE_VERSION}`;

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,      // 5 minutes
      gcTime: 1000 * 60 * 60 * 24,   // 24h en cache
      retry: 3,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      networkMode: 'offlineFirst',     // ⭐ CLÉ
      refetchOnWindowFocus: false,   // Pas pertinent sur mobile
      refetchOnReconnect: true,      // Sync au retour online
    },
    mutations: {
      retry: 3,
      networkMode: 'offlineFirst',
    },
  },
});

const asyncStoragePersister = createAsyncStoragePersister({
  storage: AsyncStorage,
  key: CACHE_KEY,
});

persistQueryClient({
  queryClient,
  persister: asyncStoragePersister,
  maxAge: 1000 * 60 * 60 * 24 * 7, // 7 jours max
  buster: CACHE_VERSION, // Invalide le cache si version change
});
```

### 2. SQLite (Structured Data Cache)

```typescript
// lib/sqlite.ts
import * as SQLite from 'expo-sqlite';

const db = SQLite.openDatabaseSync('rivaldevent.db');

// Initialisation
export async function initDatabase() {
  db.execSync(`
    CREATE TABLE IF NOT EXISTS events (
      id TEXT PRIMARY KEY,
      data TEXT NOT NULL,
      cached_at INTEGER NOT NULL,
      expires_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS venues (
      id TEXT PRIMARY KEY,
      data TEXT NOT NULL,
      cached_at INTEGER NOT NULL,
      expires_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS tickets (
      id TEXT PRIMARY KEY,
      data TEXT NOT NULL,
      cached_at INTEGER NOT NULL,
      expires_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS profiles (
      id TEXT PRIMARY KEY,
      data TEXT NOT NULL,
      cached_at INTEGER NOT NULL
    );
  `);
}

export async function cacheEvent(id: string, data: object) {
  const stmt = db.prepareSync(
    'INSERT OR REPLACE INTO events (id, data, cached_at, expires_at) VALUES (?, ?, ?, ?)'
  );
  stmt.executeSync([
    id,
    JSON.stringify(data),
    Date.now(),
    Date.now() + 1000 * 60 * 60 * 24, // 24h
  ]);
  stmt.finalizeSync();
}

export async function getCachedEvent(id: string) {
  const stmt = db.prepareSync('SELECT data FROM events WHERE id = ? AND expires_at > ?');
  const result = stmt.executeSync([id, Date.now()]);
  const row = result.getFirstSync();
  stmt.finalizeSync();
  return row ? JSON.parse(row.data) : null;
}
```

### 3. Zustand Queue (Offline Actions)

```typescript
// lib/offline-store.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type OfflineActionType = 
  | 'CREATE_EVENT'
  | 'UPDATE_EVENT'
  | 'BUY_TICKET'
  | 'UPDATE_PROFILE'
  | 'CREATE_VENUE'
  | 'WITHDRAW'
  | 'PROMOTE_VENUE';

export interface OfflineAction {
  id: string;
  type: OfflineActionType;
  payload: Record<string, unknown>;
  timestamp: number;
  retryCount: number;
  status: 'pending' | 'processing' | 'failed';
  error?: string;
}

interface OfflineState {
  isOnline: boolean;
  queue: OfflineAction[];
  pendingSync: boolean;
  lastSync: number | null;

  setOnline: (status: boolean) => void;
  addToQueue: (action: Omit<OfflineAction, 'id' | 'timestamp' | 'retryCount' | 'status'>) => void;
  removeFromQueue: (id: string) => void;
  updateActionStatus: (id: string, status: OfflineAction['status'], error?: string) => void;
  processQueue: () => Promise<void>;
  retryFailed: () => void;
  clearQueue: () => void;
}

export const useOfflineStore = create<OfflineState>()(
  persist(
    (set, get) => ({
      isOnline: true,
      queue: [],
      pendingSync: false,
      lastSync: null,

      setOnline: (status) => {
        set({ isOnline: status });
        if (status) {
          get().processQueue();
        }
      },

      addToQueue: (action) => {
        const queueItem: OfflineAction = {
          ...action,
          id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          timestamp: Date.now(),
          retryCount: 0,
          status: 'pending',
        };
        set((state) => ({ queue: [...state.queue, queueItem] }));
      },

      removeFromQueue: (id) => {
        set((state) => ({ 
          queue: state.queue.filter((item) => item.id !== id) 
        }));
      },

      updateActionStatus: (id, status, error) => {
        set((state) => ({
          queue: state.queue.map((item) =>
            item.id === id ? { ...item, status, error, retryCount: item.retryCount + 1 } : item
          ),
        }));
      },

      processQueue: async () => {
        const { queue, isOnline, pendingSync } = get();
        if (!isOnline || pendingSync || queue.length === 0) return;

        const pendingActions = queue.filter((a) => a.status === 'pending');
        if (pendingActions.length === 0) return;

        set({ pendingSync: true });

        for (const action of pendingActions) {
          try {
            await processAction(action);
            get().removeFromQueue(action.id);
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            if (action.retryCount >= 3) {
              get().updateActionStatus(action.id, 'failed', errorMessage);
            } else {
              get().updateActionStatus(action.id, 'pending', errorMessage);
            }
          }
        }

        set({ pendingSync: false, lastSync: Date.now() });
      },

      retryFailed: () => {
        set((state) => ({
          queue: state.queue.map((item) =>
            item.status === 'failed' ? { ...item, status: 'pending', retryCount: 0 } : item
          ),
        }));
        get().processQueue();
      },

      clearQueue: () => set({ queue: [] }),
    }),
    {
      name: 'offline-queue',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

// Hook de sync automatique
export function useAutoSync() {
  const { isOnline, processQueue, pendingSync } = useOfflineStore();

  useEffect(() => {
    if (isOnline && !pendingSync) {
      processQueue();
    }
  }, [isOnline, pendingSync, processQueue]);

  // Écoute les changements de réseau
  useEffect(() => {
    const subscription = Network.addNetworkStateListener((state) => {
      useOfflineStore.getState().setOnline(state.isConnected && !state.isInternetReachable === false);
    });

    return () => subscription.remove();
  }, []);
}

// Processus d'action
async function processAction(action: OfflineAction) {
  switch (action.type) {
    case 'CREATE_EVENT':
      return eventService.create(action.payload as CreateEventPayload);
    case 'BUY_TICKET':
      return ticketService.purchase(action.payload as PurchasePayload);
    case 'UPDATE_PROFILE':
      return authService.updateProfile(action.payload as ProfileUpdatePayload);
    // ... autres cas
    default:
      throw new Error(`Unknown action type: ${action.type}`);
  }
}
```

## Comportements par Feature

### Événements (Lecture)

```typescript
// services/event.service.ts
export const eventService = {
  async getAll(): Promise<Event[]> {
    // 1. Lire depuis SQLite d'abord (instantané)
    const cached = await sqlite.getAllCachedEvents();

    // 2. Si online, fetch depuis Supabase en background
    if (isOnline()) {
      queryClient.fetchQuery({
        queryKey: ['events'],
        queryFn: async () => {
          const { data } = await supabase.from('events').select('*').eq('status', 'published');
          // Mettre à jour le cache SQLite
          data?.forEach((event) => sqlite.cacheEvent(event.id, event));
          return data;
        },
      });
    }

    return cached;
  },

  async getById(id: string): Promise<Event | null> {
    // 1. Cache local d'abord
    const cached = await sqlite.getCachedEvent(id);
    if (cached) return cached;

    // 2. Fetch si online
    if (isOnline()) {
      const { data } = await supabase.from('events').select('*').eq('id', id).single();
      if (data) await sqlite.cacheEvent(id, data);
      return data;
    }

    return null;
  },
};
```

### Achat de Billet (Écriture)

```typescript
// services/ticket.service.ts
export const ticketService = {
  async purchase(payload: PurchasePayload): Promise<Ticket> {
    if (!isOnline()) {
      // Mode offline : ajouter à la queue
      useOfflineStore.getState().addToQueue({
        type: 'BUY_TICKET',
        payload,
      });

      // Retourner un ticket "optimiste" avec flag offline
      return generateOptimisticTicket(payload);
    }

    // Mode online : exécution directe
    const result = await supabase.from('tickets').insert(payload).select().single();

    // Mettre à jour les caches
    await sqlite.cacheTicket(result.data.id, result.data);
    queryClient.invalidateQueries({ queryKey: ['tickets'] });

    return result.data;
  },
};
```

### Création d'Événement (Écriture complexe)

```typescript
// services/event.service.ts
export const eventService = {
  async create(payload: CreateEventPayload): Promise<Event> {
    if (!isOnline()) {
      // Stocker en queue avec ID local
      const localId = `local-${Date.now()}`;
      useOfflineStore.getState().addToQueue({
        type: 'CREATE_EVENT',
        payload: { ...payload, localId },
      });

      // Afficher dans l'UI avec flag "pending sync"
      return { ...payload, id: localId, status: 'draft', _syncStatus: 'pending' };
    }

    // Upload images d'abord si présentes
    const imageUrls = payload.images?.length 
      ? await uploadImages(payload.images) 
      : [];

    const result = await supabase
      .from('events')
      .insert({ ...payload, images: imageUrls })
      .select()
      .single();

    return result.data;
  },
};
```

## UI Offline

### Indicateur de Sync

```typescript
// components/shared/SyncIndicator.tsx
export function SyncIndicator() {
  const { queue, pendingSync, isOnline } = useOfflineStore();
  const pendingCount = queue.filter((a) => a.status === 'pending').length;

  if (pendingCount === 0 && isOnline) return null;

  return (
    <View className="absolute top-0 left-0 right-0 bg-terracotta/90 px-4 py-2">
      <Text className="text-white text-sm text-center">
        {!isOnline 
          ? `Hors ligne · ${pendingCount} action(s) en attente` 
          : pendingSync 
            ? `Synchronisation en cours... (${pendingCount})`
            : `${pendingCount} action(s) en attente · Appuyez pour sync`
        }
      </Text>
    </View>
  );
}
```

### Badge Offline sur les Items

```typescript
// components/events/EventCard.tsx
export function EventCard({ event }: { event: Event }) {
  const isLocal = event.id.startsWith('local-');

  return (
    <Card>
      {/* ... contenu ... */}
      {isLocal && (
        <Badge variant="status" className="absolute top-2 right-2">
          En attente
        </Badge>
      )}
    </Card>
  );
}
```

## Gestion des Conflits

### Stratégie : Last-Write-Wins + Notification

```typescript
// lib/conflict-resolution.ts
export async function resolveConflict(
  localData: unknown,
  serverData: unknown,
  lastSyncedAt: number
): Promise<unknown> {
  const localTimestamp = (localData as any)._updatedAt || 0;
  const serverTimestamp = (serverData as any).updated_at || 0;

  // Si server plus récent, prendre server
  if (serverTimestamp > localTimestamp) {
    return serverData;
  }

  // Si local plus récent, prendre local mais notifier
  if (localTimestamp > serverTimestamp) {
    // Notifier l'utilisateur du conflit
    showConflictNotification(localData, serverData);
    return localData;
  }

  // Égalité : merge intelligent (pour les objets simples)
  return mergeObjects(localData, serverData);
}
```

## Checklist Offline par Feature

| Feature | Cache lecture | Queue écriture | Sync auto | Conflits |
|---------|-------------|----------------|-----------|----------|
| Events | SQLite + Query | Oui | Oui | Last-write-wins |
| Venues | SQLite + Query | Oui | Oui | Last-write-wins |
| Tickets | SQLite + Query | Oui | Oui | Server wins |
| Profile | SQLite | Oui | Oui | Merge |
| Paiements | — | Non (bloque si offline) | — | — |
| Scan QR | — | Non (bloque si offline) | — | — |

## Règles d'Or

1. **TOUTE lecture** passe par le cache local d'abord
2. **TOUTE écriture** hors ligne va dans la queue Zustand
3. **JAMAIS** bloquer l'UI pendant la sync
4. **TOUJOURS** montrer l'état de sync à l'utilisateur
5. **Retry** avec backoff exponentiel : 1s, 2s, 4s, 8s max
6. **Max 3 retries** puis marquer comme failed
7. **Batch** les syncs quand possible (pas une requête par action)
8. **Invalider** le cache TanStack Query après une sync réussie
