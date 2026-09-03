# AUDIT DE SÉCURITÉ & QUALITÉ — RIVALD'EVENT

> Date : 03 Septembre 2026
> Version auditée : branche `redesign` (post-refacto Clerk + Supabase)
> Périmètre : base complète (auth, DB, RLS, edge functions, services, lib, hooks, stores, types, UI)
> Méthodologie : relecture exhaustive + vérif RLS live (`pg_policies`) + test webhook Clerk + `typecheck`/`lint`
> Note globale : **62/100 — progrès majeur sur l'auth, reste NON PRODUCTION-READY (paiement + tests)**
> Verdict : « L'auth est passée de sucre à pro. Le cœur métier (paiement réel, tests, observabilité) reste en mock. »

---

## RÉSUMÉ EXÉCUTIF

| Catégorie | Avant | Maintenant | État |
|---|---|---|---|
| Sécurité (authn/authz/secrets) | 35/100 | **75/100** | Corrigé |
| Intégrité données & RLS | 30/100 | **65/100** | Corrigé partiellement |
| Paiement | 10/100 | **15/100** | Toujours stub |
| Qualité code / typage | 55/100 | **60/100** | Mieux |
| Bonnes pratiques | 40/100 | **50/100** | Mieux |
| Tests | 0/100 | **0/100** | Absents |
| **GLOBALE** | **47/100** | **62/100** | **NE PAS METTRE EN PROD** |

**Progrès clé depuis août :** Clerk remplace Supabase Auth proprement, `clerk_user_id` ajouté, RLS passée en `authenticated` avec `auth.jwt()->>sub`, webhook `clerk-webhook` déployé, `supabase.ts` injecte `Bearer Clerk JWT` (template `supabase`), mots de passe 8 chars, OTP/email fonctionnels. Le plus gros trou est bouché.

---

# ✅ CORRIGÉ DEPUIS L'AUDIT PRÉCÉDENT

## 1. Auth hybride → Clerk pro + Supabase DB-only
- `services/auth.service.ts` : suppression migration legacy Supabase, `signIn.create`/`attemptFirstFactor`/`prepareFirstFactor` propres, `PASSWORD_MIN_LENGTH=8`, `expo-crypto` pour génération sécurisée, `ensureSupabaseProfile` via `clerk_user_id`.
- `hooks/useAuth.ts` : fetch vrai `profiles` par `clerk_user_id`, injection JWT via `getToken({template:'supabase'})` + `setSupabaseClerkToken`, fallback propre, plus de double `update` non atomique.
- `lib/supabase.ts` : `persistSession:false`, `global.fetch` qui ajoute `Authorization: Bearer <Clerk JWT>` → RLS peut vérifier `auth.jwt()`.
- `types/database.ts` : `clerk_user_id text unique` ajouté, `Insert.id` optionnel (uuid auto).
- `lib/validation.ts` : confirme 8 chars min partout, `otpSchema` 6 chiffres aligné avec Clerk.

## 2. RLS — de `public` permissif à `authenticated` + JWT
Vérifié live le 03/09 :
- `profiles` : `SELECT public true` gardé, `INSERT/UPDATE/DELETE` → `authenticated` avec `with check ((auth.jwt()->>'sub')=clerk_user_id)` ✅
- `events` : `SELECT public` pour `published` + JWT pour organizer, `INSERT/UPDATE/DELETE` → `authenticated` via sous-requête `profiles.clerk_user_id` ✅
- `venues` : idem (`public` SELECT, `authenticated` pour owner) ✅
- `tickets` : `SELECT/INSERT/UPDATE` → `authenticated` avec jointure `profiles` + `events.organizer_id` ✅
- `handle_new_user` / `release_tickets` : `REVOKE EXECUTE FROM anon,authenticated` ✅

## 3. Webhook Clerk → Supabase
- `supabase/functions/clerk-webhook/index.ts` : vérif `svix`, `user.created/updated/deleted` → `upsert` sur `clerk_user_id`, `verify_jwt=false`, secrets `CLERK_WEBHOOK_SECRET` dans Vault, test `200` OK.
- `supabase/config.toml` : `verify_jwt=false`, entrypoint corrigé.

## 4. Écrans auth nettoyés
- `login.tsx`/`register.tsx`/`forgot-password.tsx` : suppression `getUserMode` fragile, redirection simple, `rememberMe` gardé, plus de migration silencieuse.

---

# 🔴 CRITIQUE — RESTE À FAIRE AVANT PROD

### 1. Paiement toujours stub
`services/payment.service.ts` a grandi (263 lignes) mais reste **mock** : `initiatePayment` attend 1.5s et retourne `ussd_sent`, `checkPaymentStatus` tire à pile ou face 85% succès. Aucune Edge Function `payment-initiate/verify/webhook`, aucun appel MTN/Orange/Moov réel. Écrans `(purchase)/payment/*` restent maquettes.

### 2. Tests = 0
Aucun `*.test.*`, pas de Jest/Vitest. `typecheck` passe (4 erreurs FlashList hors scope ignorées), mais 0 garde-fou régression.

### 3. Observabilité = 0
`lib/logger.ts` loggue `warn/error` en prod via `console.*` (fuite potentielle). Pas de Sentry, pas d'ErrorBoundary racine. Crash = écran rouge.

---

# 🟠 ÉLEVÉ

### 4. `.env.example` manquant
`.env` bien ignoré, mais pas de modèle pour nouveau dev. `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY` et `SUPABASE_URL` non documentés.

### 5. Validation serveur partielle
Zod partagé client/serveur, mais seules `profiles/events/venues/tickets` ont RLS. Pas de trigger Postgres de normalisation téléphone, pas de rate-limit serveur OTP (Clerk le fait, mais pas vérifié).

### 6. `as unknown as` répandu
70 occurrences (`auth.service` casts Clerk, `ticket.service` `as unknown as TicketWithEvent[]`, gradients `as unknown as readonly [...]`). Masque les erreurs de schéma. À remplacer par vrais types générés (`supabase gen types`).

### 7. `types/database.ts` toujours stub
Commentaire dit de générer via `supabase gen types`, mais toujours manuel. Risque de drift si migration.

### 8. Stockage cache en clair
`lib/query-client.ts` persiste TanStack Query en `AsyncStorage` clair, potentiellement avec `profiles`. À chiffrer ou exclure `/auth`.

---

# 🟡 MOYEN

- `app/_layout.tsx` : `LogBox.ignoreLogs` garde `[Layout children]` qui peut masquer bug nav. `console.error` override toujours présent (à supprimer au profit de Sentry).
- `sync.service.ts` : 2 `TODO Jalon 6` restants.
- `generateStrongPassword` inutilisée mais gardée (dead code, `@ts-nocheck` la masque).
- NativeWind `className` mélangé à styles inline (incohérence).
- Pas de `Husky/lint-staged`, pas de CI `lint+typecheck+test`.
- i18n absent (FR en dur), a11y partielle (70% `accessibilityRole`).

---

# TABLEAU FINAL

| Item | Note | Statut |
|---|---|---|
| Auth Clerk pro + JWT + webhook | 90 | OK |
| RLS `authenticated` + `auth.jwt()` | 85 | OK |
| Validation 8 chars + OTP 6 | 80 | OK |
| Paiement réel | 15 | Stub mock |
| Tests | 0 | Absent |
| Sentry/ErrorBoundary | 0 | Absent |
| .env.example | 0 | Manquant |
| database.ts généré | 20 | Stub |
| Casts unsafe | 40 | Répandu |
| Cache chiffré | 50 | Clair |
| Logs prod | 50 | `console` |
| **Moyenne** | **62** | **NON PROD** |

---

# CHECKLIST PRODUCTION

- [x] Clerk 8 chars + OTP + JWT template `supabase`
- [x] `clerk_user_id` + webhook + RLS `authenticated`
- [x] `supabase.ts` JWT injection + `handle_new_user` révoqué
- [ ] Paiement réel (Edge Functions + opérateurs)
- [ ] `supabase gen types` + supprime `as unknown as`
- [ ] Jest + 1 test par service critique
- [ ] Sentry + ErrorBoundary + retire `console.error` override
- [ ] `.env.example` + Husky + CI
- [ ] Chiffrer cache TanStack

---

# ROADMAP

**Phase 1 (1 semaine)** : paiement réel + `database.ts` généré + Sentry + `.env.example`
**Phase 2** : Jest + RLS tests + normalisation téléphone serveur
**Phase 3** : mappers, timeouts réseau, i18n, a11y 100%

*Prochain audit : après Phase 1.*
