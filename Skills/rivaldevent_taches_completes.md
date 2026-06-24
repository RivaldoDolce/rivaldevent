# RIVALD'EVENT — Liste des Tâches à Réaliser (Ordre Chronologique)

> **Version** : 1.0  
> **Date** : Juin 2026  
> **Durée totale estimée** : 8 semaines (~40 jours ouvrés)  
> **Objectif** : App React Native offline-first, billetterie + marketplace de lieux, identité Camerounaise

---

## 📋 TABLE DES MATIÈRES

1. [Phase 0 : Préparation (J1-J3)](#phase-0--préparation-j1-j3)
2. [Phase 1 : Design System + Navigation (J4-J8)](#phase-1--design-system--navigation-j4-j8)
3. [Phase 2 : Authentification (J9-J12)](#phase-2--authentification-j9-j12)
4. [Phase 3 : Espace Client — Découverte (J13-J17)](#phase-3--espace-client--découverte-j13-j17)
5. [Phase 4 : Espace Client — Achat (J18-J23)](#phase-4--espace-client--achat-j18-j23)
6. [Phase 5 : Espace Vendeur — Création (J24-J28)](#phase-5--espace-vendeur--création-j24-j28)
7. [Phase 6 : Espace Vendeur — Monétisation (J29-J32)](#phase-6--espace-vendeur--monétisation-j29-j32)
8. [Phase 7 : Offline-First + Polish (J33-J37)](#phase-7--offline-first--polish-j33-j37)
9. [Phase 8 : Production (J38-J40)](#phase-8--production-j38-j40)
10. [Annexe : Checklist Supabase](#annexe--checklist-supabase)

---

## PHASE 0 : PRÉPARATION (J1-J3)

### Objectif
Tout est prêt pour coder. Pas une ligne de code métier.

| # | Tâche | Livrable | Outils / Commandes |
|---|-------|----------|-------------------|
| 0.1 | Créer le projet Expo | `rivaldevent/` initialisé | `npx create-expo-app rivaldevent --template blank-typescript` |
| 0.2 | Installer toutes les dépendances | `package.json` complet | Voir liste dans `skill_architecture.md` |
| 0.3 | Configurer NativeWind | `tailwind.config.js`, `babel.config.js` | Docs NativeWind v4 |
| 0.4 | Configurer TypeScript strict | `tsconfig.json` strict | `strict: true`, `noImplicitAny: true` |
| 0.5 | Configurer ESLint + Prettier | `.eslintrc`, `.prettierrc` | `lint-staged` + `husky` |
| 0.6 | Créer le projet Supabase | Base vide, auth activé | [supabase.com](https://supabase.com) |
| 0.7 | Générer les types DB | `types/database.ts` | `supabase gen types --lang=typescript` |
| 0.8 | Créer les tables (schema SQL) | Tables vides avec RLS | Supabase SQL Editor |
| 0.9 | Configurer les fonts | Playfair Display + Inter | `expo-font`, `useFonts` |
| 0.10 | Créer les constantes design | `lib/constants.ts` | Palette, spacing, typography |
| 0.11 | Générer les écrans avec Stitch | 29 images PNG | Google Stitch |
| 0.12 | Organiser les assets | Images, icônes, animations | Dossier `assets/` |

### Checklist Phase 0
- [ ] `npx expo start` compile sans erreur
- [ ] Écran blanc avec "Rivald'event" en Playfair Display s'affiche
- [ ] Supabase console accessible
- [ ] Types TypeScript générés et importables
- [ ] 29 écrans Stitch exportés en PNG

---

## PHASE 1 : DESIGN SYSTEM + NAVIGATION (J4-J8)

### Objectif
App navigable avec design system fonctionnel et transitions fluides.

| # | Tâche | Livrable | Priorité |
|---|-------|----------|----------|
| 1.1 | Composant Button | Variantes primary/secondary/outline/ghost + haptics | 🔴 Haute |
| 1.2 | Composant Input | RHF wrapper + Zod + error states + icons | 🔴 Haute |
| 1.3 | Composant Card | Variantes default/elevated/outlined/featured | 🔴 Haute |
| 1.4 | Composant Badge | Pro / Particulier / Sponsorisé / Premium / Status | 🔴 Haute |
| 1.5 | Composant Avatar | expo-image + fallback initiales + border | 🔴 Haute |
| 1.6 | Composant Skeleton | Shimmer Reanimated | 🟡 Moyenne |
| 1.7 | Composant TabBar custom | 4 onglets client / 5 onglets vendeur + Reanimated | 🔴 Haute |
| 1.8 | Composant BottomSheet | Wrapper @gorhom/bottom-sheet | 🟡 Moyenne |
| 1.9 | Layout racine | `app/_layout.tsx` avec providers | 🔴 Haute |
| 1.10 | Layout auth | `app/(auth)/_layout.tsx` — Stack no-header | 🔴 Haute |
| 1.11 | Layout client | `app/(client)/_layout.tsx` — 4 tabs | 🔴 Haute |
| 1.12 | Layout vendeur | `app/(seller)/_layout.tsx` — 5 tabs | 🔴 Haute |
| 1.13 | Layout purchase | `app/(purchase)/_layout.tsx` — Stack modal | 🔴 Haute |
| 1.14 | Navigation entre groupes | Auth → Client → Vendeur → Purchase | 🔴 Haute |

### Checklist Phase 1
- [ ] App compile, navigation entre les 4 groupes fonctionne
- [ ] TabBar change de 4 à 5 onglets quand on active le mode vendeur
- [ ] Chaque composant UI est testable dans un écran isolé
- [ ] Haptics fonctionnent sur les boutons
- [ ] Animations Reanimated fluides (60fps)

---

## PHASE 2 : AUTHENTIFICATION (J9-J12)

### Objectif
Création de compte, connexion, OTP, profil créé.

| # | Tâche | Livrable | Priorité |
|---|-------|----------|----------|
| 2.1 | Client Supabase | `lib/supabase.ts` singleton + auth listener | 🔴 Haute |
| 2.2 | Hook useAuth | `hooks/useAuth.ts` — état auth, user, loading | 🔴 Haute |
| 2.3 | Écran Splash | Animation Reanimated, logo, transition | 🔴 Haute |
| 2.4 | Écran Onboarding | 3 slides avec Reanimated, pagination, "Passer" | 🔴 Haute |
| 2.5 | Écran Login | Email/pass + Google + téléphone, validation Zod | 🔴 Haute |
| 2.6 | Écran Register | Création compte avec profil initial | 🔴 Haute |
| 2.7 | Écran OTP | 6 champs staggered, timer resend, validation | 🔴 Haute |
| 2.8 | Création profil | Insert dans `profiles` après auth | 🔴 Haute |
| 2.9 | JWT storage sécurisé | `expo-secure-store`, JAMAIS AsyncStorage | 🔴 Haute |
| 2.10 | Auth guard | Redirection auto vers login si non auth | 🔴 Haute |

### Checklist Phase 2
- [ ] Création de compte fonctionne (email + OTP)
- [ ] Connexion fonctionne
- [ ] Profil créé dans Supabase avec rôle "client"
- [ ] JWT stocké dans SecureStore
- [ ] Redirection automatique selon l'état auth
- [ ] Déconnexion fonctionne et nettoie tout

---

## PHASE 3 : ESPACE CLIENT — DÉCOUVERTE (J13-J17)

### Objectif
Voir des événements, filtrer, consulter les détails.

| # | Tâche | Livrable | Priorité |
|---|-------|----------|----------|
| 3.1 | Seed data | 10-15 événements fictifs + 5 lieux | 🔴 Haute |
| 3.2 | Service events | `services/event.service.ts` — getAll, getById, search | 🔴 Haute |
| 3.3 | Service venues | `services/venue.service.ts` — getAll, getById, featured | 🔴 Haute |
| 3.4 | Hook useEvents | TanStack Query pour cache + offline | 🔴 Haute |
| 3.5 | Hook useVenues | TanStack Query pour cache + offline | 🔴 Haute |
| 3.6 | Écran Home | Feed FlashList, catégories, "À la une" | 🔴 Haute |
| 3.7 | Écran Home + Lieux | Carrousel horizontal "Lieux à découvrir" | 🔴 Haute |
| 3.8 | Écran Explore | Recherche + filtres (ville, date, prix, type) | 🔴 Haute |
| 3.9 | Écran Explore Lieux | Grille de lieux filtrable | 🟡 Moyenne |
| 3.10 | Écran Détails Événement | Hero parallax, infos, organisateur, lieu, CTA | 🔴 Haute |
| 3.11 | Écran Détails Lieu | Galerie photos, capacité, équipements, CTA | 🟡 Moyenne |
| 3.12 | Cache offline | SQLite pour events + venues | 🔴 Haute |

### Checklist Phase 3
- [ ] Home affiche des événements réels depuis Supabase
- [ ] Scroll fluide à 60fps (FlashList)
- [ ] Images chargées avec expo-image + placeholders
- [ ] Filtres fonctionnent
- [ ] Détails événement s'ouvrent avec parallax
- [ ] Mode offline : événements visibles sans connexion
- [ ] Pull-to-refresh fonctionne

---

## PHASE 4 : ESPACE CLIENT — ACHAT (J18-J23)

### Objectif
Acheter un billet, payer par Mobile Money, recevoir un QR code.

| # | Tâche | Livrable | Priorité |
|---|-------|----------|----------|
| 4.1 | Service tickets | `services/ticket.service.ts` — création, validation | 🔴 Haute |
| 4.2 | Écran Sélection Billets | Tiers Standard/VIP/VVIP, steppers, calcul total | 🔴 Haute |
| 4.3 | Écran Paiement Opérateur | Choix MTN/Orange/Moov avec cards stepped | 🔴 Haute |
| 4.4 | Écran Paiement MTN | Formulaire, instructions USSD, overlay | 🔴 Haute |
| 4.5 | Écran Paiement Orange | Formulaire, instructions USSD, overlay | 🔴 Haute |
| 4.6 | Écran Paiement Moov | Formulaire, instructions USSD, overlay | 🟡 Moyenne |
| 4.7 | Edge Function payment-initiate | Validation, idempotency, appel API opérateur | 🔴 Haute |
| 4.8 | Edge Function payment-webhook | Callback opérateur, création billet | 🔴 Haute |
| 4.9 | Écran Confirmation | Animation succès (Lottie/Reanimated), récap | 🔴 Haute |
| 4.10 | Génération QR Code | Hash HMAC-SHA256, données minimales, expiration | 🔴 Haute |
| 4.11 | Écran Mes Billets | Liste statuts, FlashList, filtres | 🔴 Haute |
| 4.12 | Écran Billet QR | QR plein écran, infos clés, partage | 🔴 Haute |
| 4.13 | Haptics paiement | Feedback sur chaque étape | 🟡 Moyenne |

### Checklist Phase 4
- [ ] Sélection de billets avec calcul du total
- [ ] Paiement simulé fonctionne (mock opérateur en dev)
- [ ] QR code généré avec hash sécurisé
- [ ] Billet visible dans "Mes Billets"
- [ ] Mode offline : blocage du paiement avec message clair
- [ ] Timeout de 10 min, retry 3x

---

## PHASE 5 : ESPACE VENDEUR — CRÉATION (J24-J28)

### Objectif
Passer en mode vendeur, créer un événement, scanner des QR.

| # | Tâche | Livrable | Priorité |
|---|-------|----------|----------|
| 5.1 | Switch vendeur | Toggle profil, tab bar 4→5 | 🔴 Haute |
| 5.2 | Écran Dashboard Vendeur | Stats (ventes, revenus, scannés), actions | 🔴 Haute |
| 5.3 | Wizard Étape 1 | Choix type vendeur (Particulier/Prestataire) | 🔴 Haute |
| 5.4 | Wizard Étape 2 | Choix lieu : mon lieu / recommandations / adresse | 🔴 Haute |
| 5.5 | Wizard Étape 3 | Création tiers de billets (Standard/VIP/VVIP) | 🔴 Haute |
| 5.6 | Service event creation | `services/event.service.ts` — create avec offline queue | 🔴 Haute |
| 5.7 | Upload images | Supabase Storage, bucket privé, signed URLs | 🔴 Haute |
| 5.8 | Écran Gestion Ventes | Liste participants, statuts, export CSV | 🟡 Moyenne |
| 5.9 | Écran Scanner QR | Expo Camera, frame asymétrique, validation temps réel | 🔴 Haute |
| 5.10 | Validation QR serveur | Vérification hash, scan unique, expiration | 🔴 Haute |

### Checklist Phase 5
- [ ] Switch vendeur fonctionne, tab bar change
- [ ] Wizard 3 étapes complet avec validation
- [ ] Événement créé dans Supabase (online) ou en queue (offline)
- [ ] Upload d'affiche fonctionne
- [ ] Scanner QR valide un billet en temps réel
- [ ] Feedback vert/rouge + haptic au scan

---

## PHASE 6 : ESPACE VENDEUR — MONÉTISATION (J29-J32)

### Objectif
Créer une fiche lieu, payer pour la visibilité, portefeuille actif.

| # | Tâche | Livrable | Priorité |
|---|-------|----------|----------|
| 6.1 | Écran Créer Fiche Lieu | Formulaire complet (nom, description, photos, capacité, équipements) | 🟡 Moyenne |
| 6.2 | Service venues CRUD | CRUD fiche lieu avec offline queue | 🟡 Moyenne |
| 6.3 | Écran Promouvoir Lieu | Forfaits Basique/Premium/VIP, preview, paiement | 🟡 Moyenne |
| 6.4 | Edge Function promotion | Création promotion, paiement, stats | 🟡 Moyenne |
| 6.5 | Écran Portefeuille | Solde, historique revenus (billets + pub), retraits | 🔴 Haute |
| 6.6 | Service transactions | Historique, retraits, statuts | 🔴 Haute |
| 6.7 | Écran Demande Retrait | Montant, méthode, confirmation | 🟡 Moyenne |

### Checklist Phase 6
- [ ] Fiche lieu créée avec photos
- [ ] Forfait de promotion choisi et payé
- [ ] Lieu sponsorisé apparaît dans "Lieux à découvrir"
- [ ] Portefeuille affiche solde et historique
- [ ] Demande de retrait enregistrée

---

## PHASE 7 : OFFLINE-FIRST + POLISH (J33-J37)

### Objectif
App parfaitement fonctionnelle hors ligne, avec sync transparente.

| # | Tâche | Livrable | Priorité |
|---|-------|----------|----------|
| 7.1 | SQLite cache complet | Toutes les lectures depuis le local d'abord | 🔴 Haute |
| 7.2 | Queue Zustand | Création événement, achat, modification en offline | 🔴 Haute |
| 7.3 | Sync automatique | Dès retour online, batch sync | 🔴 Haute |
| 7.4 | Indicateur de sync | Badge "En attente" visible, compteur d'actions | 🔴 Haute |
| 7.5 | Gestion conflits | Last-write-wins + notification utilisateur | 🟡 Moyenne |
| 7.6 | Réduction animations | `prefers-reduced-motion` supporté | 🟢 Basse |
| 7.7 | Accessibilité | Labels screen reader, contrastes, touch targets 44dp | 🟡 Moyenne |
| 7.8 | Performance audit | Bundle < 2Mo, démarrage < 2s, scroll 60fps | 🔴 Haute |
| 7.9 | Tests unitaires | Services, hooks, composants critiques | 🟡 Moyenne |
| 7.10 | Tests E2E | Flow complet : login → achat → QR (Maestro) | 🟡 Moyenne |

### Checklist Phase 7
- [ ] App fonctionne en mode avion (lecture, navigation)
- [ ] Actions en attente visibles avec compteur
- [ ] Sync automatique au retour online
- [ ] Bundle analysé avec `npx bundle-visualizer`
- [ ] Tests E2E passent sur le flow principal

---

## PHASE 8 : PRODUCTION (J38-J40)

### Objectif
App prête pour les stores.

| # | Tâche | Livrable | Priorité |
|---|-------|----------|----------|
| 8.1 | Configuration EAS | `eas.json`, profiles build | 🔴 Haute |
| 8.2 | Build iOS | `.ipa` via EAS Build | 🔴 Haute |
| 8.3 | Build Android | `.aab` via EAS Build | 🔴 Haute |
| 8.4 | OTA Updates | `eas update` configuré | 🔴 Haute |
| 8.5 | App Store Connect | Screenshots, description, soumission | 🔴 Haute |
| 8.6 | Google Play Console | Screenshots, description, soumission | 🔴 Haute |
| 8.7 | Analytics | Expo Analytics ou Amplitude intégré | 🟡 Moyenne |
| 8.8 | Crash reporting | Sentry ou Expo Crash Reporting | 🟡 Moyenne |
| 8.9 | Documentation | README, API docs, onboarding dev | 🟢 Basse |

### Checklist Phase 8
- [ ] Build iOS réussi
- [ ] Build Android réussi
- [ ] OTA Update testé
- [ ] App soumise aux deux stores

---

## 📊 RÉCAPITULATIF GLOBAL

| Phase | Durée | Livrable testable | Jour cumulé |
|-------|-------|-------------------|-------------|
| 0 — Préparation | 2-3j | App compile, design prêt | J3 |
| 1 — Design System + Nav | 4-5j | App navigable, composants UI | J8 |
| 2 — Auth | 3-4j | Connexion/inscription fonctionnelle | J12 |
| 3 — Client Découverte | 4-5j | Events visibles, détails consultables | J17 |
| 4 — Client Achat | 5-6j | Achat complet, QR code généré | J23 |
| 5 — Vendeur Création | 4-5j | Événement créable, QR scannable | J28 |
| 6 — Vendeur Monétisation | 3-4j | Lieu promotable, portefeuille actif | J32 |
| 7 — Offline + Polish | 4-5j | App fluide hors ligne, tests passent | J37 |
| 8 — Production | 2-3j | Builds stores, soumission | J40 |

**Total : ~8 semaines**

---

## 🚀 PROCHAINES ACTIONS IMMÉDIATES

Si tu commences **aujourd'hui** :

1. **Générer les 29 écrans avec Stitch** (en parallèle)
2. **Initialiser le projet Expo** : `npx create-expo-app rivaldevent --template blank-typescript`
3. **Créer le projet Supabase** et exécuter le schema SQL

Puis suivre les phases dans l'ordre.
