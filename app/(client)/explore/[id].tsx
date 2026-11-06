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
 * Design premium « Noir & Or » (meme composant que home/[id].tsx) :
 * - Image hero avec dégradé sombre + filet or
 * - Retour/favori/partage en pastilles verre fumé
 * - Titre Playfair Display, cartes info verre, barre collante « Reserver »
 *
 * Conventions :
 * - Design tokens depuis lib/constants.ts
 * - Commentaires en francais
 */

// Re-export du composant detail existant (déjà refondu « Noir & Or »)
export { default } from '../home/[id]';