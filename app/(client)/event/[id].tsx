/**
 * Page detail partagee d'un evenement.
 *
 * Route independante des onglets (ni Home, ni Explore).
 * Permet de voir le detail d'un evenement SANS switcher d'onglet
 * lorsque l'utilisateur clique depuis Explorer ou l'Accueil.
 *
 * Cette page reutilise le meme composant que home/[id].tsx
 * mais elle est enregistree comme route cachee dans le layout
 * des onglets (HIDDEN_TAB_ROUTES), ce qui signifie que
 * la barre d'onglets reste sur l'onglet actuel.
 *
 * Conventions :
 * - Meme design que home/[id].tsx
 * - Design tokens depuis lib/constants.ts
 * - Commentaires en francais
 */

// Re-export du composant detail existant
// La seule difference est la route : /(client)/event/[id]
// au lieu de /(client)/home/[id], ce qui evite le switch d'onglet
export { default } from '../home/[id]';