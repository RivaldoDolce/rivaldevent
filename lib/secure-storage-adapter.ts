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

 * JWT stocké dans expo-secure-store (Keychain iOS / Keystore Android).
 * Les erreurs sont silencieuses (operations internes, pas déclenchées par l'utilisateur).
 */

import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const KEY_PREFIX = 'rivaldevent.';
const CHUNK_SIZE = 2000;

const isWebSupported = Platform.OS === 'web' && typeof window !== 'undefined';

type AsyncStorageModule = typeof import('@react-native-async-storage/async-storage').default;

function webStorage(): AsyncStorageModule | null {
  if (!isWebSupported) return null;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require('@react-native-async-storage/async-storage').default;
  } catch {
    return null;
  }
}

export const SecureStoreAdapter = {
  async getItem(key: string): Promise<string | null> {
    try {
      const raw = await this._read(KEY_PREFIX + key);
      if (raw === null) return null;

      // Valeur chunkée : réassembler
      if (raw.startsWith('chunked:')) {
        const count = parseInt(raw.split(':')[1], 10);
        if (Number.isNaN(count) || count < 1) return null;

        const chunks: string[] = [];
        for (let i = 0; i < count; i++) {
          const chunk = await this._read(`${KEY_PREFIX}${key}.chunk.${i}`);
          if (chunk === null) return null;
          chunks.push(chunk);
        }
        return chunks.join('');
      }

      return raw;
    } catch {
      return null;
    }
  },

  async setItem(key: string, value: string): Promise<void> {
    if (value.length <= CHUNK_SIZE) {
      await this._write(KEY_PREFIX + key, value);
      return;
    }

    // Découper en chunks
    const chunks: string[] = [];
    for (let i = 0; i < value.length; i += CHUNK_SIZE) {
      chunks.push(value.slice(i, i + CHUNK_SIZE));
    }

    // Stocker le marqueur + chaque chunk
    await this._write(KEY_PREFIX + key, `chunked:${chunks.length}`);
    for (let i = 0; i < chunks.length; i++) {
      await this._write(`${KEY_PREFIX}${key}.chunk.${i}`, chunks[i]);
    }
  },

  async removeItem(key: string): Promise<void> {
    try {
      const raw = await this._read(KEY_PREFIX + key);
      if (raw?.startsWith('chunked:')) {
        const count = parseInt(raw.split(':')[1], 10);
        if (!Number.isNaN(count) && count > 0) {
          for (let i = 0; i < count; i++) {
            await this._delete(`${KEY_PREFIX}${key}.chunk.${i}`);
          }
        }
      }
      await this._delete(KEY_PREFIX + key);
    } catch {
      // Silencieux : operation interne
    }
  },

  // --- Primitives ---

  async _read(key: string): Promise<string | null> {
    const web = webStorage();
    if (web) return web.getItem(key);
    return SecureStore.getItemAsync(key);
  },

  async _write(key: string, value: string): Promise<void> {
    const web = webStorage();
    if (web) { await web.setItem(key, value); return; }
    await SecureStore.setItemAsync(key, value);
  },

  async _delete(key: string): Promise<void> {
    const web = webStorage();
    if (web) { await web.removeItem(key); return; }
    await SecureStore.deleteItemAsync(key);
  },
};