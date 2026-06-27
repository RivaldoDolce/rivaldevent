/**
 * Adaptateur SecureStore pour Supabase Auth.
 *
 * Probleme : SecureStore a une limite de ~2048 caracteres par item.
 * Les JWT Supabase peuvent depasser cette limite (ex: 2314 chars).
 *
 * Solution : systeme de chunking transparent.
 * - Si valeur <= CHUNK_SIZE → stockage direct (cle seule)
 * - Si valeur > CHUNK_SIZE → decoupe en N chunks + metadata
 *
 * Format des cles (separateur '.' car SecureStore n'accepte que alphanum, '.', '-', '_'):
 *   Cle directe          : rivaldevent.auth-token
 *   Metadata chunks      : rivaldevent.auth-token.chunkmeta  → '{"c":2,"l":2314}'
 *   Chunk 0              : rivaldevent.auth-token.chunk0
 *   Chunk 1              : rivaldevent.auth-token.chunk1
 *
 * Backward compatible : si la cle directe existe (non-chunkee), on la lit directement.
 */

import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { logger } from '@/lib/logger';

const KEY_PREFIX = 'rivaldevent.';
const CHUNK_SIZE = 2000; // Marge de securite sous la limite 2048

const isWebSupported = Platform.OS === 'web' && typeof window !== 'undefined';

type AsyncStorageModule = typeof import('@react-native-async-storage/async-storage').default;

// ============================================================
// Operations de bas niveau (web vs natif)
// ============================================================

async function rawGet(key: string): Promise<string | null> {
  if (isWebSupported) {
    const AsyncStorage: AsyncStorageModule = (await import('@react-native-async-storage/async-storage')).default;
    return await AsyncStorage.getItem(key);
  }
  return await SecureStore.getItemAsync(key);
}

async function rawSet(key: string, value: string): Promise<void> {
  if (isWebSupported) {
    const AsyncStorage: AsyncStorageModule = (await import('@react-native-async-storage/async-storage')).default;
    await AsyncStorage.setItem(key, value);
  } else {
    await SecureStore.setItemAsync(key, value);
  }
}

async function rawDelete(key: string): Promise<void> {
  if (isWebSupported) {
    const AsyncStorage: AsyncStorageModule = (await import('@react-native-async-storage/async-storage')).default;
    await AsyncStorage.removeItem(key);
  } else {
    await SecureStore.deleteItemAsync(key);
  }
}

// ============================================================
// Nettoyage des chunks existants pour une cle donnee
// ============================================================

async function cleanupChunks(baseKey: string): Promise<void> {
  try {
    const metaStr = await rawGet(`${KEY_PREFIX}${baseKey}.chunkmeta`);
    if (metaStr) {
      const meta = JSON.parse(metaStr) as { c: number };
      for (let i = 0; i < meta.c; i++) {
        await rawDelete(`${KEY_PREFIX}${baseKey}.chunk${i}`);
      }
      await rawDelete(`${KEY_PREFIX}${baseKey}.chunkmeta`);
    }
  } catch {
    // Silencieux : le nettoyage est best-effort
  }
}

// ============================================================
// Adaptateur public (interface Supabase storage)
// ============================================================

export const SecureStoreAdapter = {
  /**
   * Recupere un item.
   * Essai la cle directe d'abord, puis le format chunke.
   */
  async getItem(key: string): Promise<string | null> {
    try {
      // 1) Essai cle directe (valeur non-chunkee ou ancien format)
      const directValue = await rawGet(KEY_PREFIX + key);
      if (directValue !== null) {
        return directValue;
      }

      // 2) Essai format chunke
      const fullKey = KEY_PREFIX + key;
      const metaStr = await rawGet(`${fullKey}.chunkmeta`);
      if (!metaStr) {
        return null;
      }

      const meta = JSON.parse(metaStr) as { c: number };
      const chunks: string[] = [];

      for (let i = 0; i < meta.c; i++) {
        const chunk = await rawGet(`${fullKey}.chunk${i}`);
        if (chunk === null) {
          // Corruption : un chunk manque → nettoyer et retourner null
          logger.debug('[SecureStoreAdapter] Corrupted chunk detected, cleaning up');
          await cleanupChunks(key);
          return null;
        }
        chunks.push(chunk);
      }

      return chunks.join('');
    } catch (error) {
      logger.error('[SecureStoreAdapter] getItem failed:', error);
      return null;
    }
  },

  /**
   * Stocke un item.
   * Si la valeur depasse CHUNK_SIZE, la decoupe en chunks + metadata.
   */
  async setItem(key: string, value: string): Promise<void> {
    try {
      const fullKey = KEY_PREFIX + key;

      // Nettoyer les anciens chunks si ils existent
      await cleanupChunks(key);

      if (value.length <= CHUNK_SIZE) {
        // Stockage direct : pas de chunking necessaire
        await rawSet(fullKey, value);
        return;
      }

      // Chunking : decouper la valeur
      const chunks: string[] = [];
      for (let i = 0; i < value.length; i += CHUNK_SIZE) {
        chunks.push(value.slice(i, i + CHUNK_SIZE));
      }

      // Stocker la metadata (nombre de chunks)
      await rawSet(`${fullKey}.chunkmeta`, JSON.stringify({ c: chunks.length }));

      // Stocker chaque chunk
      for (let i = 0; i < chunks.length; i++) {
        await rawSet(`${fullKey}.chunk${i}`, chunks[i]);
      }
    } catch (error) {
      logger.error('[SecureStoreAdapter] setItem failed:', error);
      throw error;
    }
  },

  /**
   * Supprime un item (cle directe + chunks si existants).
   */
  async removeItem(key: string): Promise<void> {
    try {
      // Supprimer la cle directe
      await rawDelete(KEY_PREFIX + key);
      // Supprimer les chunks si ils existent
      await cleanupChunks(key);
    } catch (error) {
      logger.error('[SecureStoreAdapter] removeItem failed:', error);
    }
  },
};