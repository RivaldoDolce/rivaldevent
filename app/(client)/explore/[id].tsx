/**
 * Page detail d'un evenement, accessible depuis l'onglet Explorer.
 *
 * Route dediee dans le dossier explore/ pour que la navigation
 * pousse cet ecran sur la stack de l'onglet Explorer (pas Home).
 * Ainsi, router.back() retourne naturellement a la page Explorer.
 *
 * Re-exporte le meme composant que home/[id].tsx.
 * La seule difference est la route : /(client)/explore/[id]
 * au lieu de /(client)/home/[id] ou /(client)/event/[id].
 *
 * Conventions :
 * - Meme design que home/[id].tsx
 * - Design tokens depuis lib/constants.ts
 * - Commentaires en francais
 */

// Re-export du composant detail existant
export { default } from '../home/[id]';
