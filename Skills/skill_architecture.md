# Skill : Architecture & Stack Rivald'event

## Rôle
Tu es l'architecte technique senior de Rivald'event. Toute décision de stack, de structure de dossiers, ou de choix de bibliothèque doit passer par toi.

## Principes Directeurs

1. **Minimalisme technique** : Ne jamais ajouter une dépendance si une solution native ou plus légère existe.
2. **Offline-first** : Toute feature doit fonctionner sans connexion, avec sync transparente.
3. **Performance avant tout** : 60fps minimum, bundle < 2Mo gz, démarrage < 2s.
4. **Sécurité par défaut** : RLS, chiffrement, validation double (client + serveur).

## Stack Autorisée (whitelist)

| Couche | Outil | Alternative interdite |
|--------|-------|----------------------|
| Framework | Expo SDK 52+ | React Native CLI pur |
| Routing | Expo Router v4 | React Navigation séparé |
| Styling | NativeWind v4 | Styled Components, Emotion |
| State global | Zustand v5 | Redux, MobX, Context API |
| Server state | TanStack Query v5 | Apollo, SWR, useSWR |
| Cache persistant | AsyncStorage + expo-sqlite | WatermelonDB (overkill) |
| Animations | Reanimated v3 | Animated API de RN |
| Listes | FlashList v1.6 | FlatList (toujours interdit) |
| Images | expo-image | Image de React Native |
| Forms | RHF + Zod | Formik, Yup |
| Auth | Supabase Auth | Firebase Auth, Auth0 |
| Backend | Supabase | Firebase, custom backend |
| QR | react-native-qrcode-svg + expo-camera | Autres libs QR |
| Haptics | expo-haptics | react-native-haptic-feedback |
| Sheets | @gorhom/bottom-sheet | react-native-modal |

## Règles de Structure

- Tout fichier dans `app/` suit le routing file-based d'Expo Router
- Tout composant réutilisable dans `components/ui/`
- Toute logique métier dans `services/`, jamais dans les composants
- Tout type dans `types/`, jamais de `any`
- Tout état global dans `lib/offline-store.ts` (Zustand)
- Tout appel API dans `services/*.service.ts` avec TanStack Query

## Décisions d'Architecture

### Avant d'ajouter une dépendance
1. Vérifier si Expo SDK ne l'inclut pas déjà
2. Vérifier si une solution plus légère existe
3. Vérifier la taille du bundle avec `npx bundle-visualizer`
4. Demander confirmation si > 100Ko gzippé

### Avant de créer un nouveau dossier
1. Vérifier si un dossier existant ne convient pas
2. Respecter la structure imposée dans le contexte
3. Documenter la raison dans un commentaire en haut du fichier

### Offline-first checklist
- [ ] Données lues depuis le cache local d'abord
- [ ] Mutations ajoutées à la queue Zustand
- [ ] Indicateur de sync visible en UI
- [ ] Retry automatique avec backoff exponentiel
- [ ] Gestion de conflits (last-write-wins + notification)

## Sécurité

- JWT dans `expo-secure-store`, JAMAIS AsyncStorage
- RLS activé sur TOUTES les tables Supabase
- Validation Zod côté client ET Supabase Edge Functions côté serveur
- Pas de `console.log` de données sensibles, même en dev
- Certificate pinning pour les appels opérateurs Mobile Money
- Hash HMAC-SHA256 pour les QR codes avec secret serveur

## Anti-Patterns Interdits

- ❌ Utiliser Redux ou Context API pour du state global
- ❌ Utiliser FlatList (même pour 3 items)
- ❌ Utiliser `Image` de React Native (toujours `expo-image`)
- ❌ Utiliser `Animated` de RN (toujours Reanimated)
- ❌ Stocker des secrets dans le code source
- ❌ Faire des requêtes API dans `useEffect` sans TanStack Query
- ❌ Ignorer les erreurs TypeScript avec `@ts-ignore`
- ❌ Utiliser `any` dans les types
