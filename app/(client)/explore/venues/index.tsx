/**
 * Ecran Liste des Lieux - Grille filtrable de lieux.
 *
 * Design premium « Noir & Or » :
 * - Header : retour pastille verre + titre serif + under-titre + filtres pill
 * - Barre de recherche en pastille verre fumé avec filet doré
 * - Chips catégories pill (or plein actif / verre inactif)
 * - Grille 2 colonnes sombre : cartes ornées, filet doré, badge verre, note or
 * - Etat vide premium avec EmptyState du design system
 *
 * Structure :
 * 1. Header : Bouton retour + Titre "Lieux" + Bouton filtres
 * 2. Barre de recherche : champ editable + ville chips
 * 3. Grille de lieux : 2 colonnes avec VenueGridCard grandes
 * 4. Info resultat : nombre de lieux trouves
 *
 * Conventions :
 * - expo-image pour les images
 * - lucide-react-native pour les icones (noms vérifiés)
 * - Pas de type any, pas d'emojis
 * - Imports @/, design tokens depuis lib/constants.ts
 * - Commentaires en francais
 *
 * Donnees : mock depuis @/data/mock en attendant TanStack Query.
 */

import { useCallback, useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  type ViewStyle,
  type TextStyle,
  type ImageStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ChevronLeft,
  SlidersHorizontal,
  Search,
  X,
  MapPin,
  Star,
} from 'lucide-react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';

import { colors, spacing, radius, shadows, ROUTES } from '@/lib/constants';
import { useHaptics } from '@/hooks/useHaptics';
import { EmptyState } from '@/components/ui/EmptyState';

// Donnees mock
import type { MockVenue } from '@/data/mock';
import { MOCK_VENUES, VENUE_CATEGORIES } from '@/data/mock';

// Store global pour filtres
import { useExploreStore } from '@/stores/explore-store';
import { ScreenBackground } from '@/components/ui/ScreenBackground';

// ============================================================
// Plages de capacite (max personnes) - doit correspondre au modal
// ============================================================

function matchesCapacity(max: number | null, rangeId: string): boolean {
  if (rangeId === 'all') return true;
  if (max === null) return false;
  switch (rangeId) {
    case 'small':
      return max < 100;
    case 'medium':
      return max >= 100 && max <= 300;
    case 'large':
      return max > 300 && max <= 500;
    case 'xlarge':
      return max > 500;
    default:
      return true;
  }
}

// ============================================================
// Plages de prix par jour (FCFA) - doit correspondre au modal
// ============================================================

function matchesPricePerDay(price: number | null, rangeId: string): boolean {
  if (rangeId === 'all') return true;
  if (price === null) return false;
  switch (rangeId) {
    case 'budget':
      return price < 50000;
    case 'mid':
      return price >= 50000 && price <= 100000;
    case 'high':
      return price > 100000 && price <= 200000;
    case 'luxury':
      return price > 200000;
    default:
      return true;
  }
}

// ============================================================
// Composant VenueGridCard - carte verticale pour la grille
// ============================================================

interface VenueGridCardProps {
  readonly venue: MockVenue;
  readonly onPress: () => void;
}

function VenueGridCard({ venue, onPress }: VenueGridCardProps) {
  const { impact } = useHaptics();

  const handlePress = useCallback(() => {
    impact('light');
    onPress();
  }, [impact, onPress]);

  return (
    <Pressable
      onPress={handlePress}
      accessibilityRole="button"
      accessibilityLabel={`Lieu: ${venue.name}`}
    >
      <View style={cardStyle}>
        <View style={imageContainerStyle}>
            <Image
              source={{ uri: venue.image }}
              style={imageStyle}
              contentFit="cover"
              transition={100}
              cachePolicy="memory-disk"
              recyclingKey={venue.id}
              priority="low"
            />
            {/* Dégradé sombre de fond */}
            <LinearGradient
              colors={['rgba(10,9,8,0.02)', 'rgba(10,9,8,0.5)']}
              style={imageGradientStyle}
              pointerEvents="none"
            />
            {/* Badge categorie — pastille verre doré */}
            {venue.badge && (
              <View style={badgeContainerStyle}>
                <Text style={badgeTextStyle} numberOfLines={1}>
                  {venue.badge}
                </Text>
              </View>
            )}
            {/* Note — etoile or sur l'image */}
            {venue.rating > 0 && (
              <View style={ratingPillStyle}>
                <Star size={11} color={colors.goldBright} fill={colors.gold} strokeWidth={1.5} />
                <Text style={ratingTextStyle}>{venue.rating.toFixed(1)} / 5</Text>
              </View>
            )}
          </View>

          <View style={contentStyle}>
            <Text style={nameStyle} numberOfLines={1} ellipsizeMode="tail">
              {venue.name}
            </Text>
            <View style={locationRowStyle}>
              <MapPin size={13} color={colors.goldMuted} strokeWidth={1.5} />
              <Text style={locationTextStyle} numberOfLines={1} ellipsizeMode="tail">
                {venue.location}
              </Text>
            </View>
          </View>
        </View>
    </Pressable>
  );
}

// ============================================================
// Ecran principal
// ============================================================

export default function VenuesScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { impact } = useHaptics();

  // -- Store global --
  const { venueFilters, setVenueFilters } = useExploreStore();

  // -- State local pour recherche + categorie --
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [activeCategory, setActiveCategory] = useState('all');
  const [visibleCount, setVisibleCount] = useState(20);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearchQuery(searchQuery), 250);
    return () => clearTimeout(t);
  }, [searchQuery]);

  // -- Handlers --
  const handleBack = useCallback(() => {
    impact('light');
    router.back();
  }, [impact, router]);

  const handleCategoryPress = useCallback((categoryId: string) => {
    impact('light');
    setActiveCategory(categoryId);
  }, [impact]);

  const handleVenuePress = useCallback((venueId: string) => {
    router.push({
      pathname: ROUTES.VENUE_DETAIL,
      params: { id: venueId },
    });
  }, [router]);

  const handleClearSearch = useCallback(() => {
    impact('light');
    setSearchQuery('');
  }, [impact]);

  const handleFilterPress = useCallback(() => {
    impact('light');
    router.push('/(modal)/venue-filters');
  }, [impact, router]);

  // -- Reinitialiser tous les filtres (recherche, categorie, avances) --
  const handleResetAll = useCallback(() => {
    impact('light');
    setSearchQuery('');
    setActiveCategory('all');
    setVenueFilters({
      city: 'all',
      capacityRange: 'all',
      eventType: 'all',
      pricePerDayRange: 'all',
      prestige: 'all',
    });
  }, [impact, setVenueFilters]);

  // -- Nombre de filtres avances actifs (badge sur l'icone) --
  const activeVenueFilterCount = useMemo(() => {
    const values = [
      venueFilters.city,
      venueFilters.capacityRange,
      venueFilters.eventType,
      venueFilters.pricePerDayRange,
      venueFilters.prestige,
    ];
    return values.filter((value) => value !== 'all').length;
  }, [venueFilters]);

  // -- Filtrer les lieux : categorie + recherche + filtres avances dedies --
  const filteredVenues = useMemo(() => {
    let result = MOCK_VENUES;

    // Filtre par categorie de lieu (chips sous la barre de recherche)
    if (activeCategory !== 'all') {
      result = result.filter((v) => v.category === activeCategory);
    }

    // Filtre par ville (depuis le modal filtres lieux)
    if (venueFilters.city !== 'all') {
      result = result.filter((v) => v.location.includes(venueFilters.city));
    }

    // Filtre par capacite maximale
    if (venueFilters.capacityRange !== 'all') {
      result = result.filter((v) => matchesCapacity(v.capacity_max, venueFilters.capacityRange));
    }

    // Filtre par type d'evenement associe
    if (venueFilters.eventType !== 'all') {
      result = result.filter((v) => v.event_types.includes(venueFilters.eventType));
    }

    // Filtre par tarif par jour
    if (venueFilters.pricePerDayRange !== 'all') {
      result = result.filter((v) => matchesPricePerDay(v.price_per_day, venueFilters.pricePerDayRange));
    }

    // Filtre par prestige (badge)
    if (venueFilters.prestige !== 'all') {
      result = result.filter((v) => v.badge === venueFilters.prestige);
    }

    // Filtre par recherche (debounced)
    if (debouncedSearchQuery.trim().length > 0) {
      const query = debouncedSearchQuery.toLowerCase().trim();
      result = result.filter((v) =>
        v.name.toLowerCase().includes(query)
        || v.location.toLowerCase().includes(query)
      );
    }

    return result;
  }, [activeCategory, venueFilters, debouncedSearchQuery]);

  useEffect(() => { setVisibleCount(20); }, [activeCategory, venueFilters, debouncedSearchQuery]);

  const displayVenues = useMemo(() => filteredVenues.slice(0, visibleCount), [filteredVenues, visibleCount]);

  return (
    <ScreenBackground><View style={[screenStyle, { backgroundColor: 'transparent' }]}>
      <ScrollView
        style={screenStyle}
        contentContainerStyle={{
          paddingTop: insets.top + spacing.lg,
          paddingBottom: 100,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* ============================================
            1. HEADER : Retour + Titre + Filtres
            ============================================ */}
        <View style={headerStyle}>
          {/* Retour — pastille verre */}
          <Pressable
            onPress={handleBack}
            style={glassPillStyle}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel="Retour"
          >
            <ChevronLeft size={22} color={colors.goldBright} strokeWidth={1.75} />
          </Pressable>

          {/* Titre serif + under-titre */}
          <View style={titleBlockStyle}>
            <Text style={overlineStyle}>ADRESSES D'EXCEPTION</Text>
            <Text style={headerTitleStyle}>Lieux</Text>
          </View>

          {/* Filtres — pastille verre avec badge compteur */}
          <Pressable
            onPress={handleFilterPress}
            style={glassPillStyle}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel="Filtres"
          >
            <View style={{ position: 'relative' }}>
              <SlidersHorizontal size={20} color={colors.goldBright} strokeWidth={1.5} />
              {activeVenueFilterCount > 0 && (
                <View style={filtersBadgeStyle}>
                  <Text style={filtersBadgeTextStyle}>
                    {activeVenueFilterCount}
                  </Text>
                </View>
              )}
            </View>
          </Pressable>
        </View>

        {/* ============================================
            2. BARRE DE RECHERCHE — pastille verre
            ============================================ */}
        <View
          style={[
            searchContainerStyle,
            { borderColor: isSearchFocused ? `${colors.gold}66` : `${colors.gold}2E` },
          ]}
        >
          <Search size={20} color={colors.goldMuted} strokeWidth={1.75} />
          <TextInput
            style={searchInputStyle}
            value={searchQuery}
            onChangeText={setSearchQuery}
            onFocus={() => setIsSearchFocused(true)}
            onBlur={() => setIsSearchFocused(false)}
            placeholder="Rechercher un lieu..."
            placeholderTextColor={colors.textMuted}
            returnKeyType="search"
            selectionColor={colors.gold}
            cursorColor={colors.gold}
            accessibilityLabel="Rechercher un lieu"
          />
          {searchQuery.length > 0 && (
            <Pressable
              onPress={handleClearSearch}
              hitSlop={12}
              accessibilityRole="button"
              accessibilityLabel="Effacer"
            >
              <X size={18} color={colors.goldMuted} strokeWidth={1.75} />
            </Pressable>
          )}
        </View>

        {/* ============================================
            3. CHIPS CATEGORIES DE LIEUX (filtre direct)
            ============================================ */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={categoryChipsContainerStyle}
          contentContainerStyle={{ paddingRight: spacing.lg, gap: spacing.sm }}
        >
          {VENUE_CATEGORIES.map((cat) => {
            const isActive = activeCategory === cat.id;
            return (
              <Pressable
                key={cat.id}
                onPress={() => handleCategoryPress(cat.id)}
                style={isActive ? chipActiveStyle : chipInactiveStyle}
                accessibilityRole="button"
                accessibilityState={{ selected: isActive }}
              >
                <Text style={isActive ? chipActiveTextStyle : chipInactiveTextStyle}>
                  {cat.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* ============================================
            4. INFO RESULTATS
            ============================================ */}
        <Text style={resultsInfoStyle}>
          {filteredVenues.length} lieu{filteredVenues.length > 1 ? 'x' : filteredVenues.length === 0 ? '' : ''} trouve{filteredVenues.length > 1 ? 's' : filteredVenues.length === 0 ? '' : ''}
        </Text>

        {/* ============================================
            5. GRILLE DE LIEUX (2 colonnes)
            ============================================ */}
        {filteredVenues.length > 0 ? (
          <View style={gridStyle}>
            {/* Grille en 2 colonnes : pairs et impairs (paginé) */}
            {Array.from({ length: Math.ceil(displayVenues.length / 2) }).map((_, rowIndex) => {
              const leftVenue = displayVenues[rowIndex * 2];
              const rightVenue = displayVenues[rowIndex * 2 + 1];
              return (
                <View key={rowIndex} style={{ flexDirection: 'row', gap: spacing.md }}>
                  <View style={{ flex: 1 }}>
                    <VenueGridCard
                      venue={leftVenue}
                      onPress={() => handleVenuePress(leftVenue.id)}
                    />
                  </View>
                  {rightVenue ? (
                    <View style={{ flex: 1 }}>
                      <VenueGridCard
                        venue={rightVenue}
                        onPress={() => handleVenuePress(rightVenue.id)}
                      />
                    </View>
                  ) : (
                    <View style={{ flex: 1 }} />
                  )}
                </View>
              );
            })}
            {displayVenues.length < filteredVenues.length && (
              <Pressable onPress={() => setVisibleCount((c) => c + 20)} style={{ alignSelf: 'center', marginTop: spacing.lg, paddingHorizontal: spacing.xl, paddingVertical: spacing.sm, borderRadius: radius.full, backgroundColor: colors.glass, borderWidth: 1, borderColor: `${colors.gold}40` }}>
                <Text style={{ fontFamily: 'Inter_600SemiBold', color: colors.goldBright, fontSize: 13 }}>Voir plus ({filteredVenues.length - displayVenues.length} restants)</Text>
              </Pressable>
            )}
          </View>
        ) : (
          /* Etat vide premium */
          <EmptyState
            icon={<Search size={34} color={colors.goldMuted} strokeWidth={1.5} />}
            title="Aucun lieu trouve"
            description="Essayez une autre categorie, une autre ville ou modifiez vos filtres."
            actionLabel="Reinitialiser"
            onAction={handleResetAll}
          />
        )}

        {/* Espacement final */}
        <View style={{ height: spacing.xxl }} />
      </ScrollView>
    </View></ScreenBackground>
  );
}

// ============================================================
// Styles — Noir & Or
// ============================================================

const screenStyle: ViewStyle = {
  flex: 1,
  backgroundColor: 'transparent',
};

const headerStyle: ViewStyle = {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  paddingHorizontal: spacing.lg,
  marginBottom: spacing.md,
};

const glassPillStyle: ViewStyle = {
  width: 44,
  height: 44,
  borderRadius: radius.full,
  backgroundColor: 'rgba(10,9,8,0.62)',
  borderWidth: 1,
  borderColor: `${colors.gold}40`,
  justifyContent: 'center',
  alignItems: 'center',
  ...shadows.card,
};

const titleBlockStyle: ViewStyle = {
  flex: 1,
  alignItems: 'center',
  marginHorizontal: spacing.sm,
};

const overlineStyle: TextStyle = {
  fontFamily: 'Inter_600SemiBold',
  fontSize: 10,
  lineHeight: 14,
  letterSpacing: 1.4,
  color: colors.goldMuted,
  marginBottom: 2,
};

const headerTitleStyle: TextStyle = {
  fontFamily: 'PlayfairDisplay_700Bold',
  fontSize: 24,
  lineHeight: 32,
  color: colors.text,
  letterSpacing: -0.3,
};

const filtersBadgeStyle: ViewStyle = {
  position: 'absolute',
  top: -6,
  right: -8,
  minWidth: 18,
  height: 18,
  borderRadius: 9,
  backgroundColor: colors.gold,
  justifyContent: 'center',
  alignItems: 'center',
  paddingHorizontal: spacing.xs,
  borderWidth: 1.5,
  borderColor: colors.background,
};

const filtersBadgeTextStyle: TextStyle = {
  fontFamily: 'Inter_700Bold',
  fontSize: 10,
  lineHeight: 12,
  color: colors.onyx,
};

const searchContainerStyle: ViewStyle = {
  flexDirection: 'row',
  alignItems: 'center',
  backgroundColor: colors.glass,
  borderRadius: radius.full,
  marginHorizontal: spacing.lg,
  marginBottom: spacing.md,
  paddingHorizontal: spacing.md,
  height: 52,
  borderWidth: 1,
  gap: spacing.sm,
  ...shadows.search,
};

const searchInputStyle: TextStyle = {
  fontFamily: 'Inter_400Regular',
  fontSize: 15,
  lineHeight: 20,
  color: colors.text,
  flex: 1,
  marginLeft: spacing.xs,
  paddingVertical: 0,
};

const categoryChipsContainerStyle: ViewStyle = {
  paddingLeft: spacing.lg,
  paddingBottom: spacing.md,
  flexGrow: 0,
};

const chipActiveStyle: ViewStyle = {
  backgroundColor: colors.gold,
  borderRadius: radius.full,
  paddingHorizontal: spacing.md,
  paddingVertical: spacing.sm,
  borderWidth: 1,
  borderColor: `${colors.goldBright}66`,
  shadowColor: 'rgba(216,180,90,0.45)',
  shadowOffset: { width: 0, height: 3 },
  shadowOpacity: 0.5,
  shadowRadius: 8,
  elevation: 4,
};

const chipInactiveStyle: ViewStyle = {
  backgroundColor: colors.glass,
  borderRadius: radius.full,
  paddingHorizontal: spacing.md,
  paddingVertical: spacing.sm,
  borderWidth: 1,
  borderColor: `${colors.gold}26`,
};

const chipActiveTextStyle: TextStyle = {
  fontFamily: 'Inter_600SemiBold',
  fontSize: 14,
  lineHeight: 20,
  color: colors.onyx,
  letterSpacing: 0.2,
};

const chipInactiveTextStyle: TextStyle = {
  fontFamily: 'Inter_500Medium',
  fontSize: 14,
  lineHeight: 20,
  color: colors.textSecondary,
  letterSpacing: 0.1,
};

const resultsInfoStyle: TextStyle = {
  fontFamily: 'Inter_500Medium',
  fontSize: 13,
  lineHeight: 18,
  color: colors.textMuted,
  paddingHorizontal: spacing.lg,
  marginBottom: spacing.md,
  letterSpacing: 0.2,
};

const gridStyle: ViewStyle = {
  paddingHorizontal: spacing.lg,
  gap: spacing.md,
};

// -- Carte lieu (VenueGridCard) --
const cardStyle: ViewStyle = {
  backgroundColor: colors.elevated,
  borderRadius: radius.lg,
  overflow: 'hidden',
  borderWidth: 1,
  borderColor: `${colors.gold}1F`,
  ...shadows.card,
};

const imageContainerStyle: ViewStyle = {
  height: 140,
  position: 'relative',
};

const imageStyle: ImageStyle = {
  width: '100%',
  height: 140,
};

const imageGradientStyle: ViewStyle = {
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
};

const badgeContainerStyle: ViewStyle = {
  position: 'absolute',
  top: spacing.sm,
  left: spacing.sm,
  maxWidth: 130,
  backgroundColor: 'rgba(10,9,8,0.62)',
  borderRadius: radius.full,
  borderWidth: 1,
  borderColor: `${colors.gold}40`,
  paddingHorizontal: spacing.sm + 2,
  paddingVertical: 4,
};

const badgeTextStyle: TextStyle = {
  fontFamily: 'Inter_600SemiBold',
  fontSize: 11,
  lineHeight: 15,
  color: colors.goldBright,
  letterSpacing: 0.5,
};

const ratingPillStyle: ViewStyle = {
  position: 'absolute',
  bottom: spacing.sm,
  right: spacing.sm,
  flexDirection: 'row',
  alignItems: 'center',
  gap: 4,
  backgroundColor: 'rgba(10,9,8,0.62)',
  borderRadius: radius.full,
  borderWidth: 1,
  borderColor: `${colors.gold}40`,
  paddingHorizontal: spacing.sm,
  paddingVertical: 3,
};

const ratingTextStyle: TextStyle = {
  fontFamily: 'Inter_600SemiBold',
  fontSize: 11,
  lineHeight: 14,
  color: colors.goldBright,
};

const contentStyle: ViewStyle = {
  padding: spacing.md,
};

const nameStyle: TextStyle = {
  fontFamily: 'PlayfairDisplay_600SemiBold',
  fontSize: 16,
  lineHeight: 22,
  color: colors.text,
  letterSpacing: -0.2,
  marginBottom: spacing.xs,
};

const locationRowStyle: ViewStyle = {
  flexDirection: 'row',
  alignItems: 'center',
  gap: 5,
};

const locationTextStyle: TextStyle = {
  flex: 1,
  fontFamily: 'Inter_400Regular',
  fontSize: 12,
  lineHeight: 17,
  color: colors.textSecondary,
};