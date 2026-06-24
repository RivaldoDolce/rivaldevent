# Skill : Qualité de Code & Performance Rivald'event

## Rôle
Tu es l'ingénieur qualité senior de Rivald'event. Tout code produit doit respecter ces standards sans exception. Le code est lu 10x plus qu'il n'est écrit.

## Standards TypeScript

### Strict Mode

```json
// tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "forceConsistentCasingInFileNames": true
  }
}
```

### Interdit

- ❌ `any` — JAMAIS. Utiliser `unknown` + type guard si nécessaire.
- ❌ `@ts-ignore` — JAMAIS. Utiliser `@ts-expect-error` avec justification.
- ❌ `as` non justifié — JAMAIS. Utiliser des guards de type.
- ❌ `!` (non-null assertion) — JAMAIS. Vérifier avec `if` ou `?.`.

### Exigé

- ✅ Types explicites pour les props de composants
- ✅ Types explicites pour les retours de fonctions
- ✅ Enums remplacés par des unions de string literals
- ✅ Interfaces préférées aux types pour les objets
- ✅ `readonly` pour les props et les tableaux immuables

## Structure des Composants

### Ordre dans un fichier

```typescript
// 1. Imports (React Native d'abord, puis libs, puis locaux)
import { View, Text } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/Button';

// 2. Types/Interfaces
interface EventCardProps {
  readonly event: Event;
  readonly onPress?: () => void;
  readonly variant?: 'default' | 'featured';
}

// 3. Constantes
const MAX_TITLE_LENGTH = 50;

// 4. Composant
export const EventCard = React.memo(function EventCard({
  event,
  onPress,
  variant = 'default',
}: EventCardProps) {
  // Hooks
  const { data } = useQuery({...});
  const animatedStyle = useAnimatedStyle(() => ({...}));

  // Handlers (useCallback)
  const handlePress = useCallback(() => {
    onPress?.();
  }, [onPress]);

  // Render helpers (pas de nouveaux composants ici)
  const truncatedTitle = event.title.length > MAX_TITLE_LENGTH 
    ? `${event.title.slice(0, MAX_TITLE_LENGTH)}...` 
    : event.title;

  // Return
  return (
    <Animated.View style={animatedStyle}>
      {/* JSX */}
    </Animated.View>
  );
});

// 5. Styles (NativeWind, pas de StyleSheet.create)
// Utiliser className="..." partout
```

### Règles de Composants

1. **1 composant = 1 fichier** (sauf les composants privés très petits)
2. **Props interface** en haut du fichier, exportée si réutilisée
3. **React.memo** sur TOUS les composants de liste (EventCard, VenueCard, etc.)
4. **useCallback** sur tous les handlers passés aux enfants
5. **useMemo** sur les calculs coûteux (filtrage, mapping)
6. **Pas de logique métier** dans les composants → `services/`
7. **Pas de requêtes API** directement dans les composants → TanStack Query hooks

## Performance

### Budgets

| Métrique | Cible | Comment vérifier |
|----------|-------|-----------------|
| Bundle JS | < 2Mo gzippé | `npx bundle-visualizer` |
| Démarrage à froid | < 2s | Mesure avec `expo-updates` |
| Scroll FPS | 60fps | FlashList + Reanimated |
| Animations | 120fps iOS / 60fps Android | Reanimated UI thread |
| Mémoire | < 200Mo | `expo-memory` monitoring |
| Temps de sync | < 1s | Timer sur `processQueue` |

### Optimisations Obligatoires

#### 1. Listes = FlashList (TOUJOURS)

```typescript
// ❌ INTERDIT
<FlatList data={events} renderItem={...} />

// ✅ OBLIGATOIRE
<FlashList
  data={events}
  renderItem={({ item }) => <EventCard event={item} />}
  estimatedItemSize={280} // ⭐ CLÉ
  keyExtractor={(item) => item.id}
  removeClippedSubviews={true} // Libère la mémoire
/>
```

#### 2. Images = expo-image

```typescript
// ❌ INTERDIT
<Image source={{ uri: url }} style={styles.image} />

// ✅ OBLIGATOIRE
import { Image } from 'expo-image';

<Image
  source={{ uri: url }}
  style={style}
  contentFit="cover"
  transition={300}
  placeholder={require('@/assets/placeholder.png')}
  cachePolicy="memory-disk"
  priority={isHero ? 'high' : 'normal'}
/>
```

#### 3. Animations = Reanimated (UI thread)

```typescript
// ❌ INTERDIT (JS thread)
<Animated.View style={{ opacity: animatedValue }} />

// ✅ OBLIGATOIRE (UI thread)
import Animated, { useAnimatedStyle, useSharedValue } from 'react-native-reanimated';

const opacity = useSharedValue(0);
const animatedStyle = useAnimatedStyle(() => ({
  opacity: opacity.value,
}));

<Animated.View style={animatedStyle} />
```

#### 4. State Global = Zustand (pas Context)

```typescript
// ❌ INTERDIT (re-render cascade)
const AuthContext = createContext(...);

// ✅ OBLIGATOIRE (sélecteurs précis)
const useAuth = () => useAuthStore((state) => state.user);
const useIsLoggedIn = () => useAuthStore((state) => !!state.user);
```

#### 5. Lazy Loading

```typescript
// app/_layout.tsx
import { lazy } from 'react';

const HeavyScreen = lazy(() => import('@/app/(client)/home/[id]'));

// Ou avec Expo Router : les routes sont déjà lazy-loaded
```

### Anti-Patterns Performance

| ❌ Anti-Pattern | ✅ Solution | Impact |
|---------------|-----------|--------|
| `useState` pour du data fetch | TanStack Query | -80% re-renders |
| `useEffect` + `setState` pour du derived | `useMemo` | -50% calculs |
| `Array.map` dans le render sans memo | `useMemo` + `keyExtractor` | -30% JS thread |
| Images sans dimensions | `expo-image` avec `contentFit` | -40% layout thrashing |
| `console.log` en production | Logger conditionnel `__DEV__` | -10% JS thread |
| Animations JS thread | Reanimated | +60fps garanti |

## Tests

### Structure

```
├── __tests__/
│   ├── unit/
│   │   ├── components/
│   │   ├── hooks/
│   │   └── services/
│   ├── integration/
│   │   └── auth-flow.test.ts
│   └── e2e/
│       └── purchase-flow.test.ts
```

### Unit Tests (Jest)

```typescript
// __tests__/unit/services/event.service.test.ts
import { eventService } from '@/services/event.service';

describe('eventService', () => {
  describe('getAll', () => {
    it('returns cached events when offline', async () => {
      // Arrange
      mockOffline();
      const cachedEvents = [{ id: '1', title: 'Test' }];
      mockSQLiteCache(cachedEvents);

      // Act
      const result = await eventService.getAll();

      // Assert
      expect(result).toEqual(cachedEvents);
      expect(supabase.from).not.toHaveBeenCalled();
    });

    it('fetches from Supabase and updates cache when online', async () => {
      // ...
    });
  });
});
```

### E2E Tests (Maestro)

```yaml
# .maestro/purchase-flow.yaml
appId: com.rivaldevent.app
---
- launchApp
- tapOn: "Continuer" # Onboarding
- tapOn: "Se connecter"
- inputText: "test@email.com"
- inputText: "password123"
- tapOn: "Se connecter"
- assertVisible: "Events Nearby"
- tapOn: "Afro-Jazz Night"
- tapOn: "Réserver"
- tapOn: "Standard"
- tapOn: "Continuer vers le paiement"
- tapOn: "MTN Mobile Money"
- inputText: "+237650000000"
- tapOn: "Valider le paiement"
- assertVisible: "Paiement confirmé"
- tapOn: "Voir mon billet"
- assertVisible: "QR Code"
```

## Linting & Formatting

### ESLint Config

```json
// .eslintrc.json
{
  "extends": [
    "expo",
    "plugin:@typescript-eslint/recommended",
    "plugin:react-hooks/recommended"
  ],
  "rules": {
    "@typescript-eslint/no-explicit-any": "error",
    "@typescript-eslint/no-unused-vars": "error",
    "react-hooks/exhaustive-deps": "warn",
    "no-console": ["warn", { "allow": ["error"] }]
  }
}
```

### Prettier Config

```json
// .prettierrc
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 2
}
```

### Pre-commit Hook

```json
// .husky/pre-commit
{
  "hooks": {
    "pre-commit": "lint-staged"
  }
}

// lint-staged.config.js
module.exports = {
  '*.{ts,tsx}': ['eslint --fix', 'prettier --write', 'tsc --noEmit'],
};
```

## Documentation

### JSDoc pour les fonctions publiques

```typescript
/**
 * Achète un billet pour un événement.
 * En mode offline, ajoute l'action à la queue de sync.
 * 
 * @param payload - Données d'achat (eventId, tierId, quantity, paymentMethod)
 * @returns Le ticket créé (optimiste si offline)
 * @throws {PaymentError} Si le paiement est refusé par l'opérateur
 * @throws {ValidationError} Si les données sont invalides
 * 
 * @example
 * const ticket = await ticketService.purchase({
 *   eventId: 'evt-123',
 *   tierId: 'tier-vip',
 *   quantity: 2,
 *   paymentMethod: 'mtn',
 *   phoneNumber: '+237650000000',
 * });
 */
export async function purchase(payload: PurchasePayload): Promise<Ticket> {
  // ...
}
```

## Checklist avant Commit

- [ ] `npm run lint` passe sans erreur
- [ ] `npm run typecheck` passe sans erreur
- [ ] `npm run test` passe sans échec
- [ ] Pas de `console.log` de données sensibles
- [ ] Pas de `any` dans le code modifié
- [ ] React.memo sur les composants de liste
- [ ] FlashList utilisée pour les listes
- [ ] expo-image utilisé pour les images
- [ ] Reanimated pour les animations
- [ ] Haptics sur les interactions tactiles
- [ ] Zod validation sur les formulaires
- [ ] RLS testé sur les nouvelles tables
