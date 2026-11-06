/**
 * Service de synchronisation offline → Supabase.
 * Placeholder — sera implémenté au Jalon 6 (feature/offline).
 */

export const syncService = {
  /**
   * Traite la queue offline en envoyant les actions vers Supabase.
   * Sera appelé automatiquement au retour du réseau.
   */
  async processQueue(): Promise<void> {
    // TODO: implémenter au Jalon 6
  },

  /**
   * Retry des actions échouées.
   */
  async retryFailed(): Promise<void> {
    // TODO: implémenter au Jalon 6
  },
};