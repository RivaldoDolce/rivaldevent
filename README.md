# Rivald'event — Noir & Or

Billetterie & réservation de lieux premium au Cameroun. App Expo 54 + Clerk + Supabase.

![Expo](https://img.shields.io/badge/Expo-54-black) ![Clerk](https://img.shields.io/badge/Auth-Clerk-6C47FF) ![Supabase](https://img.shields.io/badge/DB-Supabase-3FCF8E)

## Stack
Expo Router, React 19, Clerk Expo 4, Supabase JS 2, TanStack Query 5, Zustand, Zod, NativeWind.

## Démarrage
```bash
cp .env.example .env # renseigne EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY + SUPABASE_URL/ANON_KEY
npm install
npm start
```

## Scripts
`npm run lint` · `npm run typecheck` · `npm run android/ios/web`

## Architecture Auth (Clerk = source vérité)
- JWT template `supabase` → `supabase.ts` injecte `Bearer` → RLS `auth.jwt()->>sub = clerk_user_id`
- Webhook `supabase/functions/clerk-webhook` sync `profiles` (`service_role`)
- RLS `authenticated` sur `profiles/events/venues/tickets` (voir `AUDIT_SECURITE.md`)

## Supabase
```bash
npx supabase link --project-ref dfacjpnwgvdwnjvioevy
npx supabase secrets set CLERK_WEBHOOK_SECRET=whsec_xxx
npx supabase functions deploy clerk-webhook --no-verify-jwt
```
Clerk Dashboard → Webhooks → `https://<ref>.supabase.co/functions/v1/clerk-webhook` (events `user.created/updated/deleted`)

## Sécurité
Voir `AUDIT_SECURITE.md` (62/100, paiement mock, tests à faire).

## Licence
Privé — Rivald'event.
