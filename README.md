# Rivald'event

> Billetterie et reservation de lieux premium au Cameroun.
> Design Noir & Or. Expo Router, Clerk, Supabase, TanStack Query.

<p align="center">
  <a href="https://expo.dev"><img src="https://img.shields.io/badge/Expo-54.0-black?style=flat-square&logo=expo" alt="Expo"/></a>
  <a href="https://clerk.com"><img src="https://img.shields.io/badge/Auth-Clerk-6C47FF?style=flat-square" alt="Clerk"/></a>
  <a href="https://supabase.com"><img src="https://img.shields.io/badge/DB-Supabase-3FCF8E?style=flat-square&logo=supabase" alt="Supabase"/></a>
  <img src="https://img.shields.io/badge/Platform-iOS%20%7C%20Android%20%7C%20Web-0A0908?style=flat-square" alt="Platform"/>
  <img src="https://img.shields.io/badge/License-Private-9A7528?style=flat-square" alt="License"/>
</p>

## Presentation

Rivald'event est une application mobile (iOS, Android, Web) qui connecte les organisateurs d'evenements et les proprietaires de lieux avec leur public. Elle couvre tout le cycle : decouverte, achat de billets, QR code, scan a l'entree, et gestion vendeur (tableau de bord, wallet, creation d'evenements). L'interface adopte une identite visuelle Noir & Or, pensee pour une experience premium et coherente sur l'ensemble des parcours.

## Fonctionnalites

### Cote client

- Decouverte d'evenements et de lieux (filtres, carrousels, pagination)
- Achat de billets multi-tiers, paiement Mobile Money (MTN, Orange, Moov)
- Billets avec QR code, consultation hors ligne
- Favoris, profil, edition du profil et avatar
- Mode hors ligne : cache persistant et banniere reseau

### Cote vendeur (organisateur)

- Creation et gestion d'evenements et de lieux
- Scan des billets (QR) a l'entree
- Tableau de bord et wallet (transactions)
- Promotion de lieux (tiers basique, premium, vip)

### Plateforme

- Authentification hybride : Supabase (email, Google, OTP SMS et email, reset) + Clerk (Apple SSO)
- Synchronisation de profil via webhook, RLS par utilisateur
- Demarrage rapide (splash anime, chargement en parallele)
- Design system centralise (couleurs, typographie, composants)

## Stack technique

| Couche | Technologies |
|---|---|
| Framework | Expo SDK 54, React Native 0.81 (New Architecture), Expo Router 6 |
| UI | NativeWind 4, Tailwind 3, Reanimated 4, FlashList 2 |
| Etat et donnees | TanStack Query (cache persistant SQLite), Zustand |
| Auth | Supabase Auth + Clerk (Apple SSO) |
| Base de donnees | Supabase (PostgreSQL, RLS, Storage) |
| Validation | Zod, React Hook Form |
| Typage | TypeScript strict |

## Architecture

```
app/
  (auth)/        splash, onboarding, login, register, phone, otp, forgot-password
  (client)/      home, explore, tickets, favorites, profile
  (seller)/      home, explore, sell, tickets, wallet, profile
  (purchase)/    tickets -> payment (mtn, orange, moov)
  (shared)/      edit-profile, help, privacy
  (modal)/       filters, qr-fullscreen
components/      ui, events, venues, tickets, auth, notifications, payment
hooks/           useAuth, useEvents, useVenues, ...
services/        auth, event, venue, ticket, payment, sync
lib/             supabase, query-client, constants, validation, images, logger
stores/          app-mode, favorites, purchase-flow, seller, tickets, avatar
supabase/        functions/clerk-webhook, migrations
types/           database (stub), models, api, forms, navigation
```

Flux d'authentification :

```
Clerk (user_xxx, Apple uniquement) --JWT template supabase--> Supabase (auth.jwt()->>sub)
        |
        +-- webhook user.created --> profiles.clerk_user_id --> RLS authenticated
Supabase Auth (email / Google / OTP / reset) --> profiles.id --> RLS authenticated
```

## Demarrage rapide

Prerequis : Node 18+, npm, Expo CLI, un projet Supabase, et (optionnel) un projet Clerk pour l'Apple SSO.

```
git clone https://github.com/RivaldoDolce/rivaldevent.git
cd rivaldevent
cp .env.example .env
# Renseigner EXPO_PUBLIC_SUPABASE_URL, EXPO_PUBLIC_SUPABASE_ANON_KEY
# et, si besoin, EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY
npm install
npm start
```

Commandes utiles :

- `npm run android` / `npm run ios` / `npm run web`
- `npm run lint` / `npm run typecheck`

Configuration Supabase (RLS, webhook, JWT template `supabase`) : voir `AUDIT_SECURITE.md`.

## Variables d'environnement

| Variable | Description |
|---|---|
| `EXPO_PUBLIC_SUPABASE_URL` | URL du projet Supabase |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Cle anon Supabase |
| `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY` | Cle publishable Clerk (Apple SSO uniquement) |
| `EXPO_PUBLIC_APP_ENV` | `development` par defaut |

## Securite

- Authentification hybride Clerk/Supabase avec injection du JWT Clerk cote Supabase.
- Row Level Security sur `profiles`, `events`, `venues`, `tickets`, `transactions`.
- Webhook Clerk verifie par Svix (`verify_jwt=false`).
- Mots de passe de 8 caracteres minimum, validation Zod + Supabase.
- `service_role` jamais expose cote client.
- Details et checklist production : `AUDIT_SECURITE.md`.

## Design system (Noir & Or)

`lib/constants.ts` : fond `#0A0908`, or `#D8B45A`, titres `PlayfairDisplay`, UI `Inter`, tokens `glass`, `gradients.gold`.

## Feuille de route

- [x] Auth hybride Clerk + Supabase (RLS, webhook, JWT)
- [x] Decouverte evenements et lieux, achat de billets, QR
- [x] Mode vendeur (creation, scan, wallet)
- [x] Demarrage rapide et cache hors ligne
- [ ] Paiement Mobile Money reel (Edge Functions MTN, Orange, Moov)
- [ ] Tests automatises et CI
- [ ] Generation des types Supabase (remplacement du stub)
- [ ] Observabilite (Sentry, ErrorBoundary)

## Contribution

```
npm run lint && npm run typecheck
```

PR vers `develop` apres review. Aucun secret `EXPO_PUBLIC_` pour une cle serveur.

## Licence

Prive - tous droits reserves.
