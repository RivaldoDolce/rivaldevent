/**
 * Adaptateur SecureStore pour Supabase Auth.
 *
 * Strategie hybride :
 * - Android/iOS : SecureStore avec chunking automatique si la valeur
 *   depasse 2000 caracteres (limite SecureStore ~2048).
 * - Web : AsyncStorage (SecureStore non disponible dans le navigateur).
 *
 * Les cles de chunks utilisent le separateur "_c" (valide pour SecureStore).
 * Ex: "rivaldevent.sb-auth-token" + "_cmeta", "_c0", "_c1", ...
 */

import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const KEY_PREFIX = 'rivaldevent.';
const MAX_CHUNK_SIZE = 2000;
const CHUNK_SEP = '_c';

const isWebSupported = Platform.OS === 'web' && typeof window !== 'undefined';

type AsyncStorageModule = typeof import('@react-native-async-storage/async-storage').default;

/**
 * Decoupe une valeur en chunks de MAX_CHUNK_SIZE caracteres.
 * Stocke le nombre de chunks dans une meta-cle.
 */
function chunkValue(value: string): Record<string, string> {
  const chunks: Record<string, string> = {};
  const count = Math.ceil(value.length / MAX_CHUNK_SIZE);

  chunks[CHUNK_SEP + 'meta'] = JSON.stringify({ count });

  for (let i = 0; i < count; i++) {
    chunks[CHUNK_SEP + String(i)] = value.slice(i * MAX_CHUNK_SIZE, (i + 1) * MAX_CHUNK_SIZE);
  }

  return chunks;
}

/**
 * Reconstruit une valeur depuis les chunks stockes.
 */
async function assembleChunks(
  getter: (key: string) => Promise<string | null>,
  baseKey: string,
): Promise<string | null> {
  const meta = await getter(baseKey + CHUNK_SEP + 'meta');
  if (!meta) return null;

  let parsed: { count: number };
  try {
    parsed = JSON.parse(meta);
  } catch {
    return null;
  }

  const parts: string[] = [];
  for (let i = 0; i < parsed.count; i++) {
    const part = await getter(baseKey + CHUNK_SEP + String(i));
    if (part === null) return null;
    parts.push(part);
  }

  return parts.join('');
}

/**
 * Supprime tous les chunks et la meta-cle.
 */
async function removeChunks(
  remover: (key: string) => Promise<void>,
  getter: (key: string) => Promise<string | null>,
  baseKey: string,
): Promise<void> {
  const meta = await getter(baseKey + CHUNK_SEP + 'meta');
  if (meta) {
    let parsed: { count: number };
    try {
      parsed = JSON.parse(meta);
    } catch {
      return;
    }
    for (let i = 0; i < parsed.count; i++) {
      await remover(baseKey + CHUNK_SEP + String(i));
    }
    await remover(baseKey + CHUNK_SEP + 'meta');
  }
}

/**
 * Adaptateur compatible avec l'interface `storage` de Supabase.
 */
export const SecureStoreAdapter = {
  async getItem(key: string): Promise<string | null> {
    const fullKey = KEY_PREFIX + key;
    try {
      if (isWebSupported) {
        const AsyncStorage: AsyncStorageModule = (await import('@react-native-async-storage/async-storage')).default;
        return await AsyncStorage.getItem(fullKey);
      }
      return await assembleChunks(
        (k) => SecureStore.getItemAsync(k),
        fullKey,
      );
    } catch (error) {
      console.error('[SecureStoreAdapter] getItem failed:', error);
      return null;
    }
  },

  async setItem(key: string, value: string): Promise<void> {
    const fullKey = KEY_PREFIX + key;
    try {
      if (isWebSupported) {
        const AsyncStorage: AsyncStorageModule = (await import('@react-native-async-storage/async-storage')).default;
        await AsyncStorage.setItem(fullKey, value);
        return;
      }

      // Supprimer les anciens chunks avant d'ecrire les nouveaux
      await removeChunks(
        (k) => SecureStore.deleteItemAsync(k),
        (k) => SecureStore.getItemAsync(k),
        fullKey,
      );

      // Decouper et stocker
      const chunks = chunkValue(value);
      for (const [suffix, data] of Object.entries(chunks)) {
        await SecureStore.setItemAsync(fullKey + suffix, data);
      }
    } catch (error) {
      console.error('[SecureStoreAdapter] setItem failed:', error);
      throw error;
    }
  },

  async removeItem(key: string): Promise<void> {
    const fullKey = KEY_PREFIX + key;
    try {
      if (isWebSupported) {
        const AsyncStorage: AsyncStorageModule = (await import('@react-native-async-storage/async-storage')).default;
        await AsyncStorage.removeItem(fullKey);
        return;
      }
      await removeChunks(
        (k) => SecureStore.deleteItemAsync(k),
        (k) => SecureStore.getItemAsync(k),
        fullKey,
      );
    } catch (error) {
      console.error('[SecureStoreAdapter] removeItem failed:', error);
    }
  },
};