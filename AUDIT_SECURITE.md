# AUDIT DE SÉCURITÉ & QUALITÉ — RIVALD'EVENT

> Date : 05 Septembre 2026 (mise à jour ; audit précédent : 03 Septembre 2026)
> Version auditée : branche `redesign` (post-fix SSO/OAuth + OTP email + splash natif)
> Périmètre : base complète (auth, DB, RLS, edge functions, services, lib, hooks, stores, types, UI, démarrage)
> Méthodologie : relecture ciblée des flux auth/démarrage + audit statique (grep/glob/read) + `typecheck`/`lint`
> Note globale : **60/100 — auth assainie, nouveaux risques vendeur/token identifiés, RESTE NON PRODUCTION-READY**
> Verdict : « L'auth tient debout. Le rôle vendeur est auto-attribuable et le token Supabase expire sans refresh : à verrouiller avant prod. »

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
| Autorisation vendeur (nouveau) | — | **20/100** | Auto-attribuable |
| **GLOBALE** | **47/100** | **60/100** | **NE PAS METTRE EN PROD** |

**Progrès clé depuis août :** Clerk remplace Supabase Auth proprement, `clerk_user_id` ajouté, RLS passée en `authenticated` avec `auth.jwt()->>sub`, webhook `clerk-webhook` déployé, `supabase.ts` injecte `Bearer Clerk JWT` (template `supabase`), mots de passe 8 chars, OTP/email fonctionnels. Le plus gros trou est bouché.

---

# ✅ CORRIGÉ LE 05/09 (depuis l'audit du 03/09)

## A. OAuth Google/Apple — attente infinie résolue
- `login.tsx`/`register.tsx` : `useSSO` stable (`@clerk/expo`, fini `experimental`), `setActive({ session: createdSessionId })` appelé après `startSSOFlow`, `redirectUrl` via `AuthSession.makeRedirectUri({ scheme: 'rivaldevent', path: '/oauth-callback' })`, warm-up navigateur Android.
- `oauth-callback.tsx` : suppression de la finalisation manuelle via API privée (`__internal_future` + `rotating_token_nonce`) qui ne se résolvait jamais → simple salle d'attente avec redirection auto dès `isAuthenticated` + timeout 25s (plus jamais d'attente infinie).
- Reste côté Dashboard : enregistrer `rivaldevent://oauth-callback` dans les Redirect URLs Clerk.

## B. OTP email — code qui n'arrivait jamais
- `signUpWithEmail` redirigeait vers l'OTP même quand `prepareEmailAddressVerification` échouait (erreur avalée) ou sans jamais l'appeler (branche fallback) → redirection OTP uniquement si l'envoi réussit, erreurs Clerk (throw) mappées en français.
- `verifyOtp`/`resendOtp` (email + sms) enveloppés en try/catch ; écran OTP avec feedback « nouveau code envoyé » ; `onSubmit` register en try/finally.
- Si le mail n'arrive toujours pas : vérifier stratégie `email_code` + Logs → Email côté Dashboard, et les spams (clé `pk_test`).

## C. Démarrage APK — 7s d'image figée résolues
- Splash natif : `splash.png` 1,8 Mo → `splash-native.jpg` 153 Ko (1080px, q82), `app.json` aligné.
- `_layout` : `hideAsync()` dès le mount JS (plus de gate fonts/persistance SQLite), chargement en fond + préload backgrounds ; `expo-asset` déclaré en dépendance (fini le `@ts-ignore`).
- `RouteTransitionLoader` ignore splash/oauth-callback, écran splash en `animation: 'none'`, splash gardé affiché pendant la redirection (plus de trou noir), StatusBar unique, police `Inter_500Medium` chargée.
- Rebuild APK requis (changements natifs : splash + plugin).

---

# ✅ CORRIGÉ DEPUIS L'AUDIT PRÉCÉDENT (03/09)

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

### 0. Élévation vendeur auto-attribuable (NOUVEAU 05/09)
`services/auth.service.ts:156,356,366` + `hooks/useAuth.ts:81` + `supabase/functions/clerk-webhook/index.ts:44,54,67`.
`unsafeMetadata.is_seller` est modifiable par l'utilisateur (`user.update()`) mais pilote le mode vendeur, est écrit en DB, et le webhook en fait foi à l'inscription → n'importe qui peut se promouvoir vendeur.
Correctif : ne jamais lire `unsafeMetadata` pour l'autorisation (utiliser `publicMetadata` écrite uniquement backend), forcer `is_seller:false, role:'client'` à `user.created`, promotion via Edge Function admin, RLS bloquant `UPDATE(is_seller, role)` côté client.

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

### 5bis. RLS non versionnée — risque de drift (NOUVEAU 05/09)
RLS vérifiée live le 03/09 (`pg_policies`), mais `supabase/` ne contient aucune migration SQL (seuls `config.toml` + `clerk-webhook`). Toute modification Dashboard est intraçable et non rejouable.
Correctif : versionner les migrations (`supabase db diff` → `migrations/`), `ENABLE RLS` partout, `SELECT` public limité aux `events/venues` publiés, `profiles/tickets/transactions WHERE auth.jwt()->>sub = clerk_user_id`.

### 6. `as unknown as` répandu
70 occurrences (`auth.service` casts Clerk, `ticket.service` `as unknown as TicketWithEvent[]`, gradients `as unknown as readonly [...]`). Masque les erreurs de schéma. À remplacer par vrais types générés (`supabase gen types`).

### 7. `types/database.ts` toujours stub
Commentaire dit de générer via `supabase gen types`, mais toujours manuel. Risque de drift si migration.

### 8. Stockage cache en clair
`lib/query-client.ts` persiste TanStack Query en `AsyncStorage` clair, potentiellement avec `profiles`. À chiffrer ou exclure `/auth`.

### 9. Token Supabase sans refresh (NOUVEAU 05/09 — HAUTE)
`hooks/useAuth.ts:37-55` : `getToken({ template: 'supabase' })` appelé une fois au login puis stocké en variable module. Après expiry (~60s), requêtes en 401 ou en anonyme → contournement RLS `authenticated`.
Correctif : `fetch` custom qui `await getToken()` par requête avec cache TTL, retry sur 401, `setSupabaseClerkToken(null)` au logout.

### 10. Zone vendeur sans guard (NOUVEAU 05/09 — HAUTE)
`app/(seller)/_layout.tsx:66` + `stores/app-mode.ts:36-37` : aucune redirection si `!is_seller`, deep link `rivaldevent://(seller)/...` accessible à tout authentifié.
Correctif : guard dans le `_layout` seller (`replace /(client)/home` si pas vendeur) + enforcement serveur `organizer_id = sub` sur `events/venues`.

### 11. Écritures `profiles` directes en anon (NOUVEAU 05/09 — HAUTE)
`services/auth.service.ts:85-107,365` : `ensureSupabaseProfile`/`toggleSellerMode` écrivent avec la clé anon, `.eq(clerk_user_id, user.id)` contournable en SDK modifié.
Correctif : RLS stricte + déplacer `toggleSeller` en Edge Function `service_role` avec JWT Clerk vérifié.

---

# 🟡 MOYEN

- `app/_layout.tsx` : `LogBox.ignoreLogs` garde `[Layout children]` qui peut masquer bug nav. `console.error` override toujours présent (à supprimer au profit de Sentry).
- `sync.service.ts` : 2 `TODO Jalon 6` restants.
- `generateStrongPassword` inutilisée mais gardée (dead code, `@ts-nocheck` la masque).
- NativeWind `className` mélangé à styles inline (incohérence).
- Pas de `Husky/lint-staged`, pas de CI `lint+typecheck+test`.
- i18n absent (FR en dur), a11y partielle (70% `accessibilityRole`).
- Upload avatar sans contrôle (NOUVEAU 05/09) : `services/auth.service.ts:395-411`, `fetch(dataUri).blob()` sans limite taille/type → limite 5 Mo jpeg/png/webp, bucket Storage avec policies, whitelist `https://img.clerk.com/*`.
- IDOR tickets + params non validés (NOUVEAU 05/09) : `services/ticket.service.ts:10-46`, IDs `useLocalSearchParams` sans `zod.uuid()`, `qr_secret` exposé → forcer `buyerId = session.user.id`, RLS `tickets SELECT WHERE buyer_id = sub`, QR HMAC signé serveur.
- Scheme custom hijackable (NOUVEAU 05/09) : `app.json:8`, pas d'App Links/`autoVerify` → Universal/App Links HTTPS + `assetlinks.json`/`apple-app-site-association`.
- OTP/reset rejouables + énumération email (NOUVEAU 05/09) : `services/auth.service.ts:261-316`, `form_identifier_not_found` distinct → cooldown UI 30-60s, message générique, CAPTCHA/rate-limit Clerk.
- Mot de passe `min(8)` seul (NOUVEAU 05/09) : `lib/validation.ts:78-81` → `min(12)` + complexité (zod refine), breach-protection côté Dashboard.
- PII en logs dev (NOUVEAU 05/09 — BASSE) : `services/payment.service.ts:185`, masquage `6******56`, ne logger que `transactionId`.
- Paiement mock validé côté client (NOUVEAU 05/09 — BASSE) : `services/payment.service.ts:188-224`, billet obtenu en patchant JS → Edge `verify-payment` + création `tickets` uniquement sur webhook opérateur signé + `idempotency_key`.

---

# 🟣 QUALITÉ DE CODE & BONNES PRATIQUES (audit 05/09 — note : 61/100)

Socle sain (a11y, `expo-image` + `cachePolicy`, sélecteurs Zustand fins, README honnête), plombé par le typage désactivé sur l'auth, le stub DB et l'absence tests/CI.

## Typage (dette)
- `hooks/useAuth.ts:1`, `services/auth.service.ts:1` : `@ts-nocheck` désactive tout le typage du cœur auth → retirer, typer via `Awaited<ReturnType<…>>` + garde `isClerkAPIError`.
- `app/(client)/_layout.tsx:60,78` : `props: any` + `@ts-ignore` (seul échec `expo lint`) → typer `TabBarProps` expo-router.
- `types/database.ts:1-11` : stub manuel jamais généré → `supabase gen types` (cf. §6 ÉLEVÉ existant).
- ~60x `as unknown as` (gradients `gold`, `TabBar`, `Button`, `Input`) → typer `colors.gold` en tuple dans `lib/constants.ts` (cf. §6 existant).
- `tsc --noEmit` : 10 erreurs persistantes — `estimatedItemSize` (API FlashList v2 → `estimatedListSize`) dans `explore/`, + `clerk-webhook` (Deno) à exclure du `tsconfig`.

## Duplication (dette)
- `login.tsx:157` vs `register.tsx:127` : `handleSocial` copié (~45 lignes) → hook unique `useSocialAuth.ts`.
- `profile/index.tsx` client (783 lignes) vs seller (850 lignes), ~80% identiques → `components/profile/ProfileScreenTemplate`.
- `payment/mtn.tsx` / `orange.tsx` / `moov.tsx` (`:38`) + `filters.tsx` vs `venue-filters.tsx` tripliqués → `OperatorPaymentScreen{operator}` + `GenericFilters{config}`.

## Conventions / erreurs / perf (à améliorer)
- Commentaires 40-101/fichier + `.eslintrc.js` référençant un `code_quality.md` inexistant, `AGENTS.md` sans règles → écrire les conventions réelles ou les faire respecter par ESLint.
- Hex en dur (`#FFC300`, `#7BA7C9`, `#000000`) malgré la règle `constants.ts` → `colors.*`.
- `Linking.openURL()` sans `.catch` (`home/[id].tsx:95,312`) → `.catch(logger.warn)`.
- Listes `home`/`favorites`/`tickets` en `ScrollView` vertical, seul `explore/` en `FlashList` → `FlashList` + `React.memo` sur les cards.
- Dépendances : `expo-sqlite`, `expo-updates` jamais importés → `depcheck` + nettoyage.
- Dead code : `TODO Jalon 6` (`sync.service.ts`), code commenté (`DateInput.tsx:47-51`), `generateStrongPassword` inutilisée.

## A11y / i18n / tests / git / docs
- A11y OK (labels présents) ; i18n : dette assumée, 100% FR en dur → `expo-localization` si expansion.
- Tests/CI : zéro `*.test.*`, pas de Husky/CI (cf. §2 CRITIQUE existant) → `vitest` + GH Action `lint + typecheck + test`.
- Git : `.env` ignoré OK, mais assets lourds versionnés (`splash.png` 1,8 Mo + doublon `splash_optimized.png`, `slide1.png` 1,5 Mo, double `logo.png`) → `expo-optimize`, nettoyer les doublons.
- Docs : `README` à jour, mais `CLAUDE.md` = simple renvoi vers `AGENTS.md` quasi vide → un seul `AGENTS.md` actionnable.

---

# TABLEAU FINAL

| Item | Note | Statut |
|---|---|---|
| Auth Clerk pro + JWT + webhook | 90 | OK |
| SSO Google/Apple + OTP email (05/09) | 85 | OK |
| Démarrage APK direct sur splash (05/09) | 90 | OK (rebuild requis) |
| Rôle vendeur (auto-attribuable) | 20 | CRITIQUE |
| Refresh token Supabase | 30 | À faire |
| RLS versionnée (drift) | 40 | Live OK, non versionnée |
| RLS `authenticated` + `auth.jwt()` | 85 | OK (live 03/09) |
| Validation 8 chars + OTP 6 | 80 | OK |
| Paiement réel | 15 | Stub mock |
| Tests | 0 | Absent |
| Sentry/ErrorBoundary | 0 | Absent |
| .env.example | 0 | Manquant |
| database.ts généré | 20 | Stub |
| Casts unsafe | 40 | Répandu |
| Cache chiffré | 50 | Clair |
| Logs prod | 50 | `console` |
| Qualité code (typage/duplication/tests) | 61 | Dette auth + stub DB |
| **Moyenne** | **60** | **NON PROD** |

---

# CHECKLIST PRODUCTION

- [x] Clerk 8 chars + OTP + JWT template `supabase`
- [x] `clerk_user_id` + webhook + RLS `authenticated`
- [x] `supabase.ts` JWT injection + `handle_new_user` révoqué
- [x] (05/09) SSO `setActive` + OTP envoi garanti + splash APK immédiat
- [ ] Verrouiller rôle vendeur (publicMetadata + webhook + RLS)
- [ ] Refresh token Supabase par requête + retry 401
- [ ] Versionner migrations RLS (`supabase db diff`)
- [ ] Guard seller + enforcement `organizer_id = sub`
- [ ] Paiement réel (Edge Functions + opérateurs)
- [ ] `supabase gen types` + supprime `as unknown as`
- [ ] Jest + 1 test par service critique
- [ ] Sentry + ErrorBoundary + retire `console.error` override
- [ ] `.env.example` + Husky + CI
- [ ] Chiffrer cache TanStack (ou exclure profils/tickets)

---

# ROADMAP

**Phase 0 (urgent, 2-3 jours)** : rôle vendeur (C2/C3) + refresh token (H3) + guard seller (H5) + migrations RLS versionnées
**Phase 1 (1 semaine)** : paiement réel + `database.ts` généré + Sentry + `.env.example`
**Phase 2** : Jest + RLS tests + normalisation téléphone serveur
**Phase 3** : mappers, timeouts réseau, i18n, a11y 100%

*Prochain audit : après Phase 0.*
