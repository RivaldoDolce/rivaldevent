/**
 * Adaptateur SecureStore pour Supabase Auth.
 *
 * ⚠️ CRITIQUE : Supabase stocke le JWT dans `storage`. Par défaut, AsyncStorage
 * est utilisé — mais AsyncStorage N'EST PAS SÉCURISÉ (fichier JSON en clair).
 *
 * Cet adaptateur redirige le stockage vers expo-secure-store (Keychain iOS /
 * Keystore Android) pour respecter la règle de sécurité :
 *   "JWT stocké dans SecureStore, JAMAIS AsyncStorage"
 */

import * as SecureStore from 'expo-secure-store';

/**
 * Préfixe pour éviter les collisions avec d'autres apps sur le Keychain.
 */
const KEY_PREFIX = 'rivaldevent.';

/**
 * Adaptateur compatible avec l'interface `storage` de Supabase.
 * Stocke les valeurs dans SecureStore (chiffré, OS-level).
 */
export const SecureStoreAdapter = {
  /**
   * Récupère un item depuis SecureStore.
   * @returns La valeur stockée, ou null si inexistante.
   */
  async getItem(key: string): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(KEY_PREFIX + key);
    } catch (error) {
      console.error('[SecureStoreAdapter] getItem failed:', error);
      return null;
    }
  },

  /**
   * Stocke un item dans SecureStore.
   * @throws si la valeur dépasse 2KB (limite SecureStore)
   */
  async setItem(key: string, value: string): Promise<void> {
    try {
      // SecureStore a une limite de ~2KB par item.
      // Les JWT Supabase font généralement ~1KB, donc on est large.
      if (value.length > 2048) {
        throw new Error(
          `[SecureStoreAdapter] Value too large for SecureStore (${value.length} chars, max 2048). ` +
            'Consider splitting the value or using a different storage strategy.'
        );
      }
      await SecureStore.setItemAsync(KEY_PREFIX + key, value);
    } catch (error) {
      console.error('[SecureStoreAdapter] setItem failed:', error);
      throw error;
    }
  },

  /**
   * Supprime un item de SecureStore.
   */
  async removeItem(key: string): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(KEY_PREFIX + key);
    } catch (error) {
      console.error('[SecureStoreAdapter] removeItem failed:', error);
    }
  },
};