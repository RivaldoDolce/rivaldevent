# RIVALD'EVENT — Contexte Complet pour Agent IA

## 🎯 Mission

Tu es un agent de développement senior spécialisé React Native / Expo. Tu dois implémenter **Rivald'event**, une application mobile de billetterie et marketplace de lieux d'événements pour le marché africain, avec une identité visuelle inspirée de la culture camerounaise.

L'application doit être :
- **Offline-first** (fonctionne sans connexion, sync automatique)
- **Fluide** (60fps, animations 120fps iOS)
- **Sécurisée** (auth robuste, paiements sécurisés, QR codes inviolables)
- **Accessible** (WCAG 2.1 AA, support lecteurs d'écran)

---

## 👥 Utilisateurs & Parcours

### Type 1 : CLIENT (Acheteur)
1. Découvre événements sur le feed ou via recherche
2. Consulte détails événement (infos, lieu, organisateur)
3. Sélectionne quantité par catégorie de billet (Standard/VIP/VVIP)
4. Paie via Mobile Money (MTN/Orange/Moov) avec instructions USSD
5. Reçoit billet QR code
6. Présente QR à l'entrée

### Type 2 : VENDEUR (Particulier ou Prestataire Pro)
1. Active le mode vendeur dans son profil
2. Crée un événement via wizard 3 étapes (type vendeur → choix lieu → billets & prix)
3. Gère ses ventes (liste participants, export CSV/PDF)
4. Scanne les QR codes à l'entrée (validation temps réel)
5. Consulte son portefeuille et demande des retraits
6. (Si prestataire) Crée une fiche lieu et paie pour la mettre en avant

### Type 3 : PRESTATAIRE (Propriétaire de lieu)
1. Crée une fiche lieu détaillée (photos, capacité, équipements, types d'événements acceptés)
2. Choisi un forfait de promotion (Basique/Premium/VIP)
3. Paie pour la visibilité
4. Son lieu apparaît dans "Lieux à découvrir" et recommandations

---

## 🎨 Design System — "Minimalisme Africain Camerounais"

### Palette (OBLIGATOIRE — jamais dévier)

| Token | HEX | Usage | Référence culturelle |
|-------|-----|-------|---------------------|
| `sand` | `#F7F4ED` | Fond principal | Coton du Nord, ndop blanc |
| `ivory` | `#F0EBE3` | Fond secondaire/cards | Patine bronzes Bamiléké |
| `terracotta` | `#B84A32` | CTA principal, actions client | Latérite Sahel |
| `gold` | `#C9A84C` | Luxe, premium, badge Pro | Or artisans, savane Adamaoua |
| `forest` | `#1A4D2E` | Espace vendeur, business | Forêt Bassin Congo |
| `indigo` | `#2C3E5A` | Badges, détails, sponsors | Teinture indigo traditionnelle |
| `mango` | `#E8A838` | État actif, sélectionné | Soleil harmattan |
| `onyx` | `#1A1816` | Texte principal | Bois masques, bronze fondu |
| `stone` | `#6B6560` | Texte secondaire | Pierre volcanique |

### Principes de design (INCONTOURNABLES)

1. **Hiérarchie violente** : 1 seul CTA principal par écran, visuellement dominant
2. **Zone ultra-contrastée** : 1 seul point focal fort par écran (hero image, CTA coloré, badge doré)
3. **Rythme respirant** : alternance sections aérées (25-40% vide) et sections denses
4. **Asymétrie contrôlée** : jamais de centrage parfait. Décaler images, cards, boutons de 16-32px
5. **Bordures arrondies** : 16px partout (buttons, cards, inputs, images)
6. **Typographie** : serif élégant pour les titres (ex: Playfair Display), sans-serif propre pour le corps (ex: Inter)
7. **Icônes** : style fine line (Lucide/Phosphor), stroke 1.5px

### Navigation

- **Mode Client** : 4 onglets (Home · Explore · Tickets · Profile) — actif en `terracotta`
- **Mode Vendeur** : 5 onglets (Home · Explore · Tickets · **Vendre** · Profile) — actif en `forest`, onglet "Vendre" toujours en `gold` et surélevé de 4px
- **Flux immersifs** (auth, achat, création événement) : **AUCUNE** tab bar

---

## 🛠️ Stack Technique (FIXE — ne pas changer)

| Couche | Technologie | Version | Pourquoi |
|--------|-------------|---------|----------|
| Framework | Expo SDK | 52+ | OTA updates, pas de config native |
| Routing | Expo Router | v4 | File-based routing, groupes `(auth)`, `(client)`, `(seller)`, `(purchase)` |
| Styling | NativeWind | v4 | Tailwind pour RN, correspond au design system |
| State global | Zustand | v5 | Léger, persistant, pas de boilerplate |
| Server state | TanStack Query | v5 | Cache intelligent, offline-first, background refetch |
| Cache persistant | AsyncStorage | — | Persistance Query Client + Zustand |
| DB locale | expo-sqlite | ~14 | SQLite embarqué pour offline |
| Animations | React Native Reanimated | v3 | 60-120fps, UI thread only |
| Listes | FlashList | v1.6 | Performance garantie, même 3 items |
| Bottom sheets | @gorhom/bottom-sheet | v5 | Choix vendeur, filtres, actions |
| Images | expo-image | ~1.12 | Cache memory-disk, transitions, placeholders |
| Forms | React Hook Form + Zod | v7 + v3 | Validation typée, performance |
| Auth | Supabase Auth | v2 | OTP SMS, OAuth, phone auth |
| Backend | Supabase | — | PostgreSQL, Storage, Edge Functions |
| QR Code | react-native-qrcode-svg | v6 | Génération + scan (expo-camera) |
| Haptics | expo-haptics | ~13 | Feedback premium sur chaque press |
| Notifications | expo-notifications | ~0.28 | Push locales + distantes |
| Network | expo-network | — | Détection connexion pour sync |

### Ce qui est INTERDIT

- ❌ Redux (trop verbeux, Zustand suffit)
- ❌ WatermelonDB (overkill pour ce scope, SQLite + Query suffisent)
- ❌ React Navigation séparé (Expo Router inclut déjà la navigation)
- ❌ FlatList (toujours remplacer par FlashList)
- ❌ Images sans expo-image (pas de Image de React Native)
- ❌ Animations sur le JS thread (toujours Reanimated)

---

## 🗄️ Schéma de Données Supabase

### Tables principales

```sql
-- Profils (étend auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  full_name TEXT,
  avatar_url TEXT,
  phone TEXT UNIQUE,
  role TEXT CHECK (role IN ('client', 'particulier', 'prestataire')) DEFAULT 'client',
  is_seller BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Lieux (prestataires)
CREATE TABLE venues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  address TEXT,
  city TEXT,
  country TEXT DEFAULT 'Cameroun',
  capacity_min INT,
  capacity_max INT,
  price_per_day DECIMAL,
  images TEXT[],
  amenities TEXT[],
  event_types TEXT[],
  is_premium BOOLEAN DEFAULT false,
  promotion_tier TEXT CHECK (promotion_tier IN ('basique', 'premium', 'vip')),
  lat DECIMAL,
  lng DECIMAL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Événements
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organizer_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  venue_id UUID REFERENCES venues(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT,
  event_type TEXT,
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ,
  address TEXT,
  city TEXT,
  cover_image TEXT,
  images TEXT[],
  status TEXT CHECK (status IN ('draft', 'published', 'cancelled', 'completed')) DEFAULT 'draft',
  is_featured BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tiers de billets
CREATE TABLE ticket_tiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  price DECIMAL NOT NULL,
  quantity_total INT NOT NULL,
  quantity_sold INT DEFAULT 0,
  description TEXT,
  benefits TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Billets achetés
CREATE TABLE tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES events(id),
  tier_id UUID REFERENCES ticket_tiers(id),
  buyer_id UUID REFERENCES profiles(id),
  quantity INT DEFAULT 1,
  total_price DECIMAL,
  payment_method TEXT CHECK (payment_method IN ('mtn', 'orange', 'moov')),
  payment_status TEXT CHECK (payment_status IN ('pending', 'completed', 'failed', 'refunded')) DEFAULT 'pending',
  qr_code TEXT UNIQUE,
  qr_secret TEXT, -- hash interne pour validation
  is_scanned BOOLEAN DEFAULT false,
  scanned_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ, -- QR valide 24h après l'événement max
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Transactions financières
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id),
  type TEXT CHECK (type IN ('ticket_sale', 'venue_promo', 'withdrawal')),
  amount DECIMAL NOT NULL,
  currency TEXT DEFAULT 'XAF',
  status TEXT CHECK (status IN ('pending', 'completed', 'failed')) DEFAULT 'pending',
  provider_ref TEXT, -- référence opérateur
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Promotions de lieux
CREATE TABLE venue_promotions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id UUID REFERENCES venues(id) ON DELETE CASCADE,
  tier TEXT CHECK (tier IN ('basique', 'premium', 'vip')),
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  amount_paid DECIMAL,
  impressions INT DEFAULT 0,
  clicks INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### RLS (Row Level Security) — OBLIGATOIRE

```sql
-- Profiles : lecture publique, écriture propriétaire
CREATE POLICY "Profiles are viewable by everyone"
  ON profiles FOR SELECT USING (true);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE USING (auth.uid() = id);

-- Événements : publiés visibles par tous, drafts par organisateur
CREATE POLICY "Events are viewable by everyone if published"
  ON events FOR SELECT
  USING (status = 'published' OR auth.uid() = organizer_id);

CREATE POLICY "Users can create events"
  ON events FOR INSERT WITH CHECK (auth.uid() = organizer_id);

CREATE POLICY "Organizers can update own events"
  ON events FOR UPDATE USING (auth.uid() = organizer_id);

-- Billets : acheteur + vendeur de l'événement
CREATE POLICY "Tickets accessible by buyer or event organizer"
  ON tickets FOR SELECT
  USING (
    auth.uid() = buyer_id 
    OR auth.uid() IN (SELECT organizer_id FROM events WHERE events.id = tickets.event_id)
  );

-- Transactions : propriétaire uniquement
CREATE POLICY "Transactions private to user"
  ON transactions FOR SELECT USING (auth.uid() = user_id);
```

---

## 🔒 Exigences de Sécurité (CRITIQUES)

### Authentification
- OTP SMS via Supabase Auth (4-6 chiffres, expiration 5 min)
- Rate limiting : max 3 tentatives OTP, lock 15 min
- JWT stocké dans SecureStore (iOS Keychain / Android Keystore), JAMAIS AsyncStorage
- Refresh token rotation obligatoire
- Déconnexion automatique après 7 jours d'inactivité

### Paiements Mobile Money
- JAMAIS stocker de numéro de téléphone en clair (chiffrement AES-256 côté client avant envoi)
- Validation côté serveur obligatoire (webhook opérateur ou polling sécurisé)
- QR code : hash HMAC-SHA256 avec secret serveur + timestamp + event_id + buyer_id
- QR code unique, scannable une seule fois (is_scanned + scanned_at)
- Expiration QR : 24h après la fin de l'événement

### Données
- Toutes les images passent par Supabase Storage avec bucket privé + signed URLs
- RLS activé sur TOUTES les tables (pas d'exception)
- Colonnes sensibles (qr_secret, provider_ref) jamais retournées au client
- Validation Zod côté client ET Supabase Edge Functions côté serveur

### Réseau
- Toutes les requêtes HTTPS (TLS 1.3)
- Certificate pinning pour les appels opérateurs Mobile Money
- Pas de logs de données sensibles en console (même en dev)

---

## 🔄 Architecture Offline-First

### Stratégie de sync

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   UI Layer  │◄───►│  Zustand    │◄───►│  TanStack   │
│             │     │  Store      │     │  Query      │
└─────────────┘     └──────┬──────┘     └──────┬──────┘
                           │                     │
                    ┌──────┴──────┐      ┌─────┴─────┐
                    │ AsyncStorage│      │ expo-sqlite│
                    │ (persist)   │      │ (cache)    │
                    └─────────────┘      └─────┬─────┘
                                               │
                                        ┌──────┴──────┐
                                        │  Supabase   │
                                        │  (cloud)    │
                                        └─────────────┘
```

### Comportement offline

1. **Lecture** : toujours servie depuis le cache local (SQLite/Query cache). Refetch background quand online.
2. **Écriture** : ajoutée à une queue Zustand persistante. Sync automatique dès retour online.
3. **Conflits** : stratégie "last write wins" avec timestamp côté serveur. Si conflit détecté, notification utilisateur.
4. **Indicateur UI** : badge de sync visible quand des actions sont en attente.

### Queue offline (Zustand)

```typescript
interface OfflineAction {
  id: string;           // UUID local
  type: 'CREATE_EVENT' | 'BUY_TICKET' | 'UPDATE_PROFILE' | 'WITHDRAW';
  payload: unknown;     // Données de la mutation
  timestamp: number;    // Date de création
  retryCount: number;   // 0-3 max
  status: 'pending' | 'processing' | 'failed';
}
```

---

## 📁 Structure de Dossiers (OBLIGATOIRE)

```
rivaldevent/
├── app/                          # Expo Router — FILE BASED
│   ├── (auth)/                   # 🔐 Flux auth (pas de tabs)
│   │   ├── _layout.tsx           # Stack no-header
│   │   ├── splash.tsx
│   │   ├── onboarding.tsx
│   │   ├── login.tsx
│   │   ├── register.tsx
│   │   └── otp.tsx
│   │
│   ├── (client)/                 # 👤 4 tabs : Home·Explore·Tickets·Profile
│   │   ├── _layout.tsx           # Custom TabBar (terracotta active)
│   │   ├── home/
│   │   │   ├── index.tsx         # Feed FlashList + Query
│   │   │   └── [id].tsx          # Détails événement (parallax)
│   │   ├── explore/
│   │   │   ├── index.tsx         # Recherche + filtres
│   │   │   └── venues/
│   │   │       ├── index.tsx     # Explorer lieux
│   │   │       └── [id].tsx      # Détail lieu
│   │   ├── tickets/
│   │   │   ├── index.tsx         # Portefeuille billets
│   │   │   └── [id].tsx          # QR code plein écran
│   │   └── profile/
│   │       └── index.tsx         # Profil + switch vendeur
│   │
│   ├── (seller)/                 # 🏪 5 tabs : +Vendre
│   │   ├── _layout.tsx           # Custom TabBar (forest active, Vendre gold)
│   │   ├── sell/
│   │   │   ├── index.tsx         # Dashboard vendeur
│   │   │   ├── create/
│   │   │   │   ├── step1.tsx     # Type vendeur (bottom sheet)
│   │   │   │   ├── step2.tsx     # Choix lieu
│   │   │   │   └── step3.tsx     # Billets & prix
│   │   │   ├── sales.tsx         # Gestion ventes
│   │   │   ├── scanner.tsx       # Scan QR (expo-camera)
│   │   │   ├── wallet.tsx        # Portefeuille + retraits
│   │   │   └── promote.tsx       # Promouvoir lieu
│   │   └── profile.tsx           # Profil vendeur
│   │
│   ├── (purchase)/               # 💳 Flux achat (pas de tabs)
│   │   ├── _layout.tsx           # Stack modal
│   │   ├── event/[id]/
│   │   │   └── tickets.tsx       # Sélection billets
│   │   ├── payment/
│   │   │   ├── index.tsx         # Sélection opérateur
│   │   │   └── [operator].tsx    # MTN / Orange / Moov (route dynamique)
│   │   └── confirmation/
│   │       └── [id].tsx          # Confirmation + QR
│   │
│   └── _layout.tsx               # Root providers (Query, Auth, Reanimated)
│
├── components/
│   ├── ui/                       # 💎 Design System (TOUS les composants réutilisables)
│   │   ├── Button.tsx            # Reanimated press + haptics + variants
│   │   ├── Input.tsx             # RHF wrapper + Zod + error states
│   │   ├── Card.tsx              # Gradient optionnel + shadow + radius 16
│   │   ├── Badge.tsx             # Pro / Particulier / Sponsorisé / Premium
│   │   ├── Avatar.tsx            # expo-image + fallback
│   │   ├── Skeleton.tsx          # Reanimated shimmer
│   │   ├── TabBar.tsx            # Custom SVG icons + Reanimated indicator
│   │   └── BottomSheet.tsx       # @gorhom/bottom-sheet wrapper
│   ├── events/
│   ├── venues/
│   ├── tickets/
│   └── payment/
│
├── hooks/
│   ├── useAuth.ts
│   ├── useOffline.ts             # Détection + sync queue
│   ├── useScrollAnimation.ts     # Parallax hero
│   ├── useDebounce.ts
│   └── useNotification.ts
│
├── lib/
│   ├── supabase.ts               # Client Supabase singleton
│   ├── query-client.ts           # TanStack Query + persistance + version cache
│   ├── offline-store.ts          # Zustand queue + sync logic
│   ├── constants.ts              # Palette, spacing, typography, routes
│   └── animations.ts             # Shared transitions Reanimated
│
├── services/                     # 🧠 Toute la logique métier
│   ├── auth.service.ts
│   ├── event.service.ts
│   ├── ticket.service.ts
│   ├── payment.service.ts        # USSD overlay + validation opérateur
│   ├── venue.service.ts
│   └── sync.service.ts           # Batch sync offline → Supabase
│
├── types/
│   ├── database.ts               # Généré par Supabase CLI
│   ├── navigation.ts             # Types Expo Router
│   └── api.ts                    # Types API custom
│
└── assets/
    ├── fonts/
    ├── images/
    ├── animations/               # Lottie JSON (confirmation, succès)
    └── icons/                    # SVG custom (Lucide style)
```

---

## ⚡ Règles de Performance (INCONTOURNABLES)

| Règle | Implémentation | Pourquoi |
|-------|----------------|----------|
| **Toute liste = FlashList** | Remplacer FlatList partout, même 3 items | 60fps garanti, recyclage mémoire |
| **Toute image = expo-image** | `cachePolicy="memory-disk"`, `transition={300}` | Pas de flicker, cache agressif |
| **Toute animation = Reanimated** | `useAnimatedStyle`, `useSharedValue` | UI thread, jamais de drop |
| **Tout formulaire = RHF + Zod** | Validation côté client ET serveur | Pas de submit invalide |
| **Tout état global = Zustand** | Pas de Redux, pas de Context pour du state | Léger, persistant, typé |
| **Tout data fetch = TanStack Query** | `staleTime`, `gcTime`, `retry` configurés | Cache intelligent, offline natif |
| **Tout modal = Bottom Sheet** | `@gorhom/bottom-sheet` | UX native, gestures fluides |
| **Tout feedback = Haptics** | `expo-haptics` impact léger sur chaque press | Ressenti premium |
| **Scroll = useAnimatedScrollHandler** | Parallax, header collapse, sticky tabs | 120fps iOS, 60fps Android |
| **Bundle < 2Mo gz** | Tree shaking, lazy imports, pas de lib inutile | Démarrage < 2s |

---

## 🎯 Livrables Attendus

### Phase 1 : Fondation (Semaine 1)
- [ ] App qui compile sur iOS et Android
- [ ] Design System complet (Button, Input, Card, Badge, Avatar, Skeleton, TabBar)
- [ ] Navigation entre les 4 groupes (auth, client, seller, purchase)
- [ ] Connexion Supabase fonctionnelle

### Phase 2 : Auth & Profil (Semaine 2)
- [ ] Splash + Onboarding 3 slides (Reanimated)
- [ ] Login (email/pass + Google + téléphone)
- [ ] OTP SMS fonctionnel
- [ ] Profil complet CRUD
- [ ] Switch vendeur qui change la tab bar (4 → 5 onglets)

### Phase 3 : Client bout-en-bout (Semaine 3)
- [ ] Home feed avec FlashList, catégories, événements "À la une"
- [ ] Recherche & filtres
- [ ] Détails événement (parallax hero, infos, lieu, organisateur)
- [ ] Sélection billets (tiers Standard/VIP/VVIP)
- [ ] Paiement Mobile Money (MTN/Orange/Moov) avec overlay USSD
- [ ] Confirmation + génération QR
- [ ] Mes billets (portefeuille)
- [ ] QR code plein écran

### Phase 4 : Vendeur & Offline (Semaine 4)
- [ ] Dashboard vendeur (stats, graphiques)
- [ ] Wizard création événement 3 étapes
- [ ] Gestion des ventes (liste, export)
- [ ] Scanner QR avec validation temps réel
- [ ] Portefeuille + demande de retrait
- [ ] Promouvoir un lieu (forfaits)
- [ ] Queue offline fonctionnelle (création, achat, modification)
- [ ] Sync automatique au retour online
- [ ] Indicateur de sync visible

---

## 🚨 Anti-Patterns à ÉVITER

| ❌ Ne JAMAIS faire | ✅ Faire à la place |
|---|---|
| Stocker JWT dans AsyncStorage | Utiliser expo-secure-store (Keychain/Keystore) |
| Utiliser `console.log` pour des données sensibles | Utiliser un logger conditionnel (`__DEV__` only) |
| Faire des requêtes API dans `useEffect` sans Query | Utiliser TanStack Query avec `useQuery` / `useMutation` |
| Gérer le state formulaire avec `useState` | Utiliser React Hook Form + Zod |
| Charger toutes les images en haute résolution | Utiliser expo-image avec resize + placeholder |
| Faire des animations avec `Animated` de RN | Utiliser Reanimated v3 (UI thread) |
| Utiliser `alert()` ou `Alert.alert()` brut | Utiliser des bottom sheets modales stylisées |
| Hardcoder des couleurs | Toujours utiliser les tokens du design system |
| Ignorer le mode offline | Toujours implémenter le cache + queue |
| Committer des clés API en dur | Utiliser `.env` + expo-constants |

---

## 💬 Ton de Communication

Quand tu implémentes :
- **Explique chaque choix technique** en 1-2 phrases
- **Signale les compromis** (ex: "J'utilise FlashList même pour peu d'items car c'est une règle d'or du projet")
- **Propose des alternatives** si un choix technique bloque
- **Demande confirmation** avant de changer la stack ou la structure
- **Génère du code typé** (TypeScript strict, jamais `any`)
- **Respecte la palette** — si tu proposes un nouveau composant, vérifie qu'il utilise les tokens `sand`, `terracotta`, `gold`, etc.

---

> Ce document est la source de vérité. Toute décision technique doit s'y référer. En cas de doute, demande clarification avant d'implémenter.
