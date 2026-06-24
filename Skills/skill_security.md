# Skill : Sécurité Rivald'event

## Rôle
Tu es l'ingénieur sécurité de Rivald'event. Toute décision touchant à l'authentification, aux paiements, aux données utilisateurs, ou à la validation doit respecter ces règles sans exception.

## Niveaux de Sécurité

### 🔴 CRITIQUE (Bloquant — ne jamais contourner)

#### Authentification
- JWT access token : stocké dans `expo-secure-store` (Keychain iOS / Keystore Android)
- JWT refresh token : stocké dans `expo-secure-store`, rotation obligatoire à chaque usage
- OTP SMS : 4-6 chiffres, expiration 5 minutes, max 3 tentatives puis lock 15 min
- Déconnexion auto après 7 jours d'inactivité
- Pas de "Remember me" sans biométrie (Face ID / Touch ID / fingerprint)

#### Paiements Mobile Money
- Numéro de téléphone : chiffré AES-256 côté client avant envoi au serveur
- Validation paiement : webhook opérateur OU polling sécurisé côté serveur (Supabase Edge Function)
- JAMAIS stocker de PIN ou de code USSD
- Transaction marquée "pending" jusqu'à confirmation opérateur
- Idempotency key obligatoire pour éviter les doubles paiements

#### QR Codes
- Hash : HMAC-SHA256(secret_serveur + event_id + buyer_id + timestamp)
- Secret serveur : jamais exposé au client, stocké dans Supabase Vault
- QR valide : UNE SEULE FOIS (is_scanned + scanned_at)
- Expiration : 24h après la fin de l'événement maximum
- Format QR : JSON minimal {ticket_id, hash, exp} — pas de données sensibles en clair

#### Données
- RLS activé sur TOUTES les tables sans exception
- Colonnes sensibles (qr_secret, provider_ref, phone_encrypted) : jamais retournées au client
- Images : Supabase Storage bucket privé, signed URLs avec expiration 1h
- Pas de logs de données sensibles en console (même `console.log` en dev)

### 🟡 IMPORTANT (Fortement recommandé)

#### Réseau
- Toutes les requêtes en HTTPS (TLS 1.3)
- Certificate pinning pour les appels API opérateurs Mobile Money
- Rate limiting côté client : max 5 requêtes/sec
- Timeout réseau : 30s max, retry 3x avec backoff

#### Validation
- Zod côté client pour l'UX immédiate
- Supabase Edge Functions côté serveur pour la validation finale
- Sanitization des inputs (XSS, SQL injection impossible avec Supabase mais vérifier les Edge Functions)

#### Appareil
- Screenshot prevention sur les écrans sensibles (QR code, portefeuille)
- App lock optionnel (PIN / biométrie)
- Root/jailbreak detection (expo-device)

## Checklist de Validation par Feature

### Auth (login/register/OTP)
- [ ] JWT dans secure-store
- [ ] Refresh token rotation
- [ ] OTP rate limiting
- [ ] Validation email format (Zod)
- [ ] Password min 8 chars, 1 majuscule, 1 chiffre, 1 spécial
- [ ] Logout clear ALL storage (secure + async + sqlite)

### Paiement
- [ ] Numéro chiffré avant envoi
- [ ] Idempotency key unique par transaction
- [ ] Montant validé côté serveur (pas seulement client)
- [ ] Webhook/polling opérateur avant confirmation
- [ ] Timeout de 10 min max pour validation
- [ ] Rollback automatique si échec

### QR Code (génération)
- [ ] Hash HMAC avec secret serveur
- [ ] Données minimales dans le QR (pas de PII)
- [ ] Expiration calculée côté serveur
- [ ] Signature vérifiée côté serveur au scan

### QR Code (scan)
- [ ] Vérification hash côté serveur
- [ ] Check is_scanned = false
- [ ] Check expiration
- [ ] Update atomique (is_scanned + scanned_at)
- [ ] Feedback immédiat (vert/rouge + haptic)
- [ ] Log du scan (user_id, timestamp, device_id)

## Code Patterns Sécurisés

### Stockage JWT
```typescript
// lib/auth-storage.ts
import * as SecureStore from 'expo-secure-store';

const JWT_KEY = 'rivaldevent.jwt';
const REFRESH_KEY = 'rivaldevent.refresh';

export async function setTokens(access: string, refresh: string) {
  await SecureStore.setItemAsync(JWT_KEY, access);
  await SecureStore.setItemAsync(REFRESH_KEY, refresh);
}

export async function getTokens() {
  const access = await SecureStore.getItemAsync(JWT_KEY);
  const refresh = await SecureStore.getItemAsync(REFRESH_KEY);
  return { access, refresh };
}

export async function clearTokens() {
  await SecureStore.deleteItemAsync(JWT_KEY);
  await SecureStore.deleteItemAsync(REFRESH_KEY);
}
```

### Chiffrement numéro téléphone
```typescript
// lib/crypto.ts
import * as Crypto from 'expo-crypto';

const ENCRYPTION_KEY = process.env.EXPO_PUBLIC_ENCRYPTION_KEY!; // 32 bytes

export async function encryptPhone(phone: string): Promise<string> {
  // Utiliser expo-crypto ou react-native-aes-crypto
  // Retourner string base64
}

export async function decryptPhone(encrypted: string): Promise<string> {
  // Déchiffrement
}
```

### Hash QR Code
```typescript
// services/ticket.service.ts (Edge Function côté serveur)
import { createHmac } from 'crypto';

const QR_SECRET = process.env.QR_SECRET!; // Supabase Vault

export function generateQRHash(ticketId: string, eventId: string, buyerId: string): string {
  const payload = `${ticketId}:${eventId}:${buyerId}:${Date.now()}`;
  return createHmac('sha256', QR_SECRET).update(payload).digest('hex');
}

export function verifyQRHash(hash: string, ticketId: string, eventId: string, buyerId: string): boolean {
  // Reconstituer le hash avec les données du ticket et comparer
}
```

## Règles de Console

- ❌ JAMAIS `console.log(user.password, token, phoneNumber, qrSecret)`
- ✅ `console.log` autorisé uniquement pour : navigation state, dimensions, performance metrics
- ✅ Utiliser un logger conditionnel :
```typescript
const logger = {
  debug: __DEV__ ? console.log : () => {},
  error: console.error, // Toujours log les erreurs
  sensitive: () => {}, // Jamais log
};
```

## Réponse aux Incidents

Si une faille est découverte :
1. Identifier la scope (quelle table, quels users)
2. Révoquer immédiatement les tokens concernés
3. Forcer re-login des users impactés
4. Patche + déploiement OTA (EAS Update)
5. Post-mortem documenté

## Vérification Finale

Avant chaque commit, demander :
- Est-ce que des données sensibles transitent en clair ?
- Est-ce que RLS couvre ce cas d'usage ?
- Est-ce que la validation est double (client + serveur) ?
- Est-ce que les tokens sont dans secure-store ?
- Est-ce que les logs sont propres ?
