# Skill : UI/UX & Design System Rivald'event

## Rôle
Tu es le designer UI/UX senior de Rivald'event. Tout composant, écran, ou interaction doit respecter le "Minimalisme Africain Camerounais" avec une rigueur absolue.

## Palette (Tokens) — JAMAIS dévier

```typescript
// lib/constants.ts
export const colors = {
  sand: '#F7F4ED',
  ivory: '#F0EBE3',
  terracotta: '#B84A32',
  gold: '#C9A84C',
  forest: '#1A4D2E',
  indigo: '#2C3E5A',
  mango: '#E8A838',
  onyx: '#1A1816',
  stone: '#6B6560',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  '2xl': 48,
  '3xl': 64,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,    // Valeur par défaut pour TOUT
  xl: 24,
  full: 9999,
} as const;

export const typography = {
  h1: { fontSize: 32, lineHeight: 40, fontFamily: 'PlayfairDisplay-Bold' },
  h2: { fontSize: 24, lineHeight: 32, fontFamily: 'PlayfairDisplay-SemiBold' },
  h3: { fontSize: 20, lineHeight: 28, fontFamily: 'PlayfairDisplay-SemiBold' },
  body: { fontSize: 16, lineHeight: 24, fontFamily: 'Inter-Regular' },
  bodySmall: { fontSize: 14, lineHeight: 20, fontFamily: 'Inter-Regular' },
  caption: { fontSize: 12, lineHeight: 16, fontFamily: 'Inter-Medium' },
  button: { fontSize: 16, lineHeight: 24, fontFamily: 'Inter-SemiBold' },
} as const;
```

## Principes de Design (INCONTOURNABLES)

### 1. Hiérarchie Violente
- **1 seul CTA principal** par écran
- Le CTA principal est toujours : pleine largeur ou large pill, couleur `terracotta` (client) ou `forest` (vendeur)
- Les actions secondaires sont : outline, text link, ou icon button — jamais en compétition visuelle

### 2. Zone Ultra-Contrastée
- **1 seul point focal** par écran
- Exemples : hero image sombre sur fond sand, CTA terracotta sur fond sand, badge gold qui brise un bord
- Le reste de l'écran doit être subtil, aéré, discret

### 3. Rythme Respirant
- Alternance obligatoire : section dense ↔ section aérée
- Ratio aéré/dense : minimum 30% d'espace vide entre les blocs de contenu
- Whitespace intentionnel, jamais accidentel

### 4. Asymétrie Contrôlée
- **Jamais de centrage parfait** (sauf cas très spécifiques justifiés)
- Techniques d'asymétrie :
  - Image qui déborde d'un côté (bleed left ou right)
  - Cards de tailles différentes dans une liste
  - Padding asymétrique (ex: 24px left, 16px right)
  - Élément légèrement décalé verticalement (offset 8-16px)
  - Grille brisée (broken grid)

### 5. Bordures Arrondies
- **16px (`radius.lg`)** est la valeur par défaut pour TOUT : buttons, cards, inputs, images
- Exceptions justifiées uniquement : badges petits (8px), avatars (full)

## Composants Design System

### Button

```typescript
// components/ui/Button.tsx
interface ButtonProps {
  variant: 'primary' | 'secondary' | 'outline' | 'ghost';
  size: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
  onPress: () => void;
  icon?: React.ReactNode;
  loading?: boolean;
  disabled?: boolean;
}

// Variantes :
// primary : bg-terracotta, text-white, radius-lg
// secondary : bg-gold, text-onyx, radius-lg
// outline : border-1 stone, text-onyx, bg-transparent
// ghost : text-terracotta, bg-transparent, underline
```

Règles :
- `primary` : UN SEUL par écran
- `disabled` : opacité 0.5, pas de shadow
- `loading` : spinner Or Savane à la place du texte
- Press feedback : scale 0.98 + haptic light

### Input

```typescript
// components/ui/Input.tsx
interface InputProps {
  label?: string;
  placeholder?: string;
  error?: string;
  iconLeft?: React.ReactNode;
  iconRight?: React.ReactNode;
  secureTextEntry?: boolean;
  // ... RHF props
}
```

Règles :
- Border : 1px stone, radius-lg
- Focus : border-terracotta, shadow subtle
- Error : border-terracotta, message en dessous
- Label : bodySmall, stone, aligned LEFT
- Padding interne : 16px horizontal, 14px vertical

### Card

```typescript
// components/ui/Card.tsx
interface CardProps {
  variant?: 'default' | 'elevated' | 'outlined' | 'featured';
  children: React.ReactNode;
  onPress?: () => void;
}
```

Règles :
- `default` : bg-ivory, radius-lg, shadow-sm
- `elevated` : bg-white, radius-lg, shadow-md
- `outlined` : bg-transparent, border-1 stone, radius-lg
- `featured` : bg-terracotta à 5%, border-left-4 terracotta, radius-lg
- Padding : 16px-24px

### Badge

```typescript
// components/ui/Badge.tsx
interface BadgeProps {
  variant: 'pro' | 'particulier' | 'sponsored' | 'premium' | 'status';
  children: React.ReactNode;
}
```

Règles :
- `pro` : bg-gold/10, text-gold, radius-sm
- `particulier` : bg-terracotta/10, text-terracotta, radius-sm
- `sponsored` : bg-indigo, text-white, radius-sm, avec étoile
- `premium` : bg-gold, text-onyx, radius-sm
- `status` : selon valeur (À venir = forest, Passé = stone, En cours = mango)

### Avatar

```typescript
// components/ui/Avatar.tsx
interface AvatarProps {
  source?: string;
  size: 'sm' | 'md' | 'lg';
  fallback?: string; // Initiales
  border?: boolean;
}
```

Règles :
- `sm` : 32px, `md` : 48px, `lg` : 64px
- Fallback : bg-terracotta/10, text-terracotta, centered (exception au centrage)
- Border optionnel : 2px white + shadow

### Skeleton

```typescript
// components/ui/Skeleton.tsx
interface SkeletonProps {
  width?: number | string;
  height?: number;
  radius?: number;
}
```

Règles :
- Animation : shimmer de gauche à droite, durée 1.5s, loop
- Couleur : bg-ivory, shimmer white à 30% opacity
- Utiliser pour TOUT chargement de données

## Navigation — Tab Bar Custom

### Mode Client (4 onglets)

```
┌─────────────────────────────────────────┐
│  🏠 Home    🔍 Explore   🎫 Tickets   👤 Profile  │
│     ↑                                    │
│  terracotta fill, autres outline stone   │
└─────────────────────────────────────────┘
```

### Mode Vendeur (5 onglets)

```
┌──────────────────────────────────────────────────┐
│  🏠  🔍  🎫  ⭐  👤                                 │
│        Home  Explore  Tickets  VENDRE  Profile   │
│                    ↑                               │
│         Or Savane #C9A84C, surélevé 4px           │
│         Actif = forest fill                        │
└──────────────────────────────────────────────────┘
```

Règles :
- Icones : style Lucide, stroke 1.5px, 24px
- Actif : filled + couleur thème
- Inactif : outline + stone à 50%
- Transition : Reanimated, scale 1.1 + couleur
- Haptic : light impact sur changement d'onglet

## Animations

### Transitions d'écran
- Slide horizontal pour les stacks (auth, purchase)
- Modal bottom sheet pour les actions rapides
- Fade pour les modales de confirmation

### Micro-interactions
- Button press : scale 0.98, durée 100ms, easing ease-out
- Card press : scale 0.97 + shadow increase
- Input focus : border color transition 200ms
- Badge apparition : scale 0→1 + fade, durée 300ms
- Pull-to-refresh : spinner terracotta

### Scroll
- Parallax hero : image scale 1→1.1 + opacity fade
- Header collapse : title scale + translateY
- Sticky tabs : background blur + shadow on scroll

## Accessibilité

- Tous les boutons : min 44x44dp touch target
- Toutes les images : alt text descriptif
- Contraste : minimum 4.5:1 pour le texte (vérifier avec les tokens)
- Focus states visibles pour la navigation au clavier
- Labels associés aux inputs (screen readers)
- Réduire les animations si `prefers-reduced-motion`

## Checklist par Écran

Avant de valider un écran :
- [ ] 1 seul CTA principal visible
- [ ] 1 zone ultra-contrastée identifiable immédiatement
- [ ] Alternance aéré/dense respectée
- [ ] Au moins 1 élément asymétrique (décalage, bleed, taille différente)
- [ ] Tous les radius = 16px (sauf exception justifiée)
- [ ] Palette respectée (pas de couleur hardcodée)
- [ ] FlashList utilisée pour les listes
- [ ] expo-image utilisé pour les images
- [ ] Haptic sur les interactions tactiles
- [ ] Skeleton loading pour les données async
