<p align="center">
  <img src="./assets/images/app-icon.png" width="100" alt="Rivald'event"/>
</p>

<h1 align="center">Rivald'event — L'élégance de vos événements</h1>

<p align="center">
  <a href="https://expo.dev"><img src="https://img.shields.io/badge/Expo-54.0-black?style=flat-square&logo=expo" alt="Expo"/></a>
  <a href="https://clerk.com"><img src="https://img.shields.io/badge/Auth-Clerk-6C47FF?style=flat-square" alt="Clerk"/></a>
  <a href="https://supabase.com"><img src="https://img.shields.io/badge/DB-Supabase-3FCF8E?style=flat-square&logo=supabase" alt="Supabase"/></a>
  <img src="https://img.shields.io/badge/Platform-iOS%20%7C%20Android%20%7C%20Web-0A0908?style=flat-square" alt="Platform"/>
  <img src="https://img.shields.io/badge/License-Private-9A7528?style=flat-square" alt="License"/>
</p>

<p align="center">
  Billetterie et réservation de lieux premium au Cameroun.<br/>
  Design <strong>Noir & Or</strong> — Expo Router, Clerk, Supabase, TanStack Query.
</p>

<p align="center">
  <a href="#-démarrage-rapide">Démarrage</a> •
  <a href="#-architecture">Architecture</a> •
  <a href="#-sécurité">Sécurité</a> •
  <a href="#-documentation">Docs</a>
</p>

---

## ✨ Fonctionnalités

| Domaine | Détails |
|---|---|
| **Auth** | Email/password (8 chars), OTP SMS/Email, reset password, Google/Apple OAuth, `clerk_user_id` → Supabase |
| **Événements** | Feed, détail, favoris, filtres, création vendeur |
| **Lieux** | Catalogue, fiche, réservation, promotions `basique/premium/vip` |
| **Billets** | Tiers, QR, tickets par event, scan vendeur |
| **Paiement** | MTN / Orange / Moov (mock actuel, intégration prévue) |
| **Offline** | Queue + cache TanStack persistant |

## 📸 Aperçu

<p align="center">
  <img src="./assets/images/onboarding/slide1.png" width="200" alt="Onboarding"/>
  <img src="./assets/images/background/auth/bg_auth_login.jpg" width="200" alt="Login"/>
</p>

> Splash → Onboarding → Login/Register → OTP → Home (client/seller)

## 🚀 Démarrage rapide

```bash
# 1. Clone
git clone https://github.com/<org>/rivaldevent.git && cd rivaldevent

# 2. Env (voir .env.example)
cp .env.example .env
# EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
# EXPO_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
# EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJ...

# 3. Install + run
npm install
npm start          # → ouvre Expo Go
npm run android    # build natif
npm run ios
npm run web
```

**Scripts :** `npm run lint` · `npm run typecheck`

## 🏗️ Architecture

```
app/
 ├─ (auth)/      splash, onboarding, login, register, phone, otp, forgot-password
 ├─ (client)/    home, explore, tickets, favorites, profile
 ├─ (seller)/    home, explore, sell, tickets, wallet, profile
 ├─ (purchase)/  tickets → payment (mtn/orange/moov)
 ├─ (shared)/    edit-profile, help, privacy
 └─ oauth-callback.tsx
components/  ui/*, events/*, venues/*, tickets/*
hooks/       useAuth (Clerk→Supabase), useEvents, useVenues
services/    auth.service, event.service, venue.service, ticket.service, payment.service
lib/         supabase (DB-only + JWT), validation (Zod), constants (Noir & Or), images
supabase/functions/clerk-webhook  → sync profiles
stores/      app-mode (buyer/seller)
types/       database (stub), models, api
```

**Flux Auth :**
```
Clerk (user_xxx) --JWT template supabase--> Supabase (auth.jwt()->>sub)
       │                                          │
       └─ webhook user.created ──→ profiles.clerk_user_id ──→ RLS authenticated
```
`lib/supabase.ts` injecte `Authorization: Bearer <Clerk JWT>` via `setSupabaseClerkToken()` (appelé dans `useAuth`).

## 🔐 Sécurité

| Sujet | État |
|---|---|
| Mots de passe | 8 chars, Zod + Clerk |
| RLS | `profiles/events/venues/tickets` en `authenticated` avec `auth.jwt()->>sub = clerk_user_id` (public seulement pour SELECT publiés) |
| Webhook | `supabase/functions/clerk-webhook` (Svix, `verify_jwt=false`) |
| Secrets | `service_role` jamais côté client, Vault Supabase |
| Audit | Voir `AUDIT_SECURITE.md` (62/100, paiement/tests restants) |

**Setup Supabase :**
```sql
alter table profiles add column clerk_user_id text unique;
-- RLS voir AUDIT_SECURITE.md §2
```
```bash
npx supabase link --project-ref <ref>
npx supabase secrets set CLERK_WEBHOOK_SECRET=whsec_xxx
npx supabase functions deploy clerk-webhook --no-verify-jwt
```
Clerk → Webhooks → `https://<ref>.supabase.co/functions/v1/clerk-webhook` (`user.created/updated/deleted`)
Clerk → JWT Templates → `supabase` → Signing key = Supabase `JWT Secret`.

## 🎨 Design System — Noir & Or

`lib/constants.ts` : `colors.background #0A0908`, `gold #D8B45A`, `PlayfairDisplay` (titres), `Inter` (UI), `glass`, `gradients.gold`.

## 📂 Variables d'environnement

| Variable | Description |
|---|---|
| `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk publishable |
| `EXPO_PUBLIC_SUPABASE_URL` | Supabase URL |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Anon key |

## 🗺️ Roadmap

- [x] Auth Clerk pro + RLS + webhook
- [ ] Paiement réel (Edge Functions MTN/Orange/Moov)
- [ ] Tests (Jest) + Sentry + CI
- [ ] `supabase gen types` + refacto `as unknown as`

## 🤝 Contribution

```bash
npm run lint && npm run typecheck
```
PR → `redesign` → review. Pas de secret `EXPO_PUBLIC_` pour clé serveur.

## 📄 Licence

Privé — © Rivald'event. Tous droits réservés.

---

<p align="center">Fait avec 🖤💛 à Yaoundé</p>
