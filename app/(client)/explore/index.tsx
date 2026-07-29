/**
 * Page Explorer - Catalogue de recherche interactif.
 *
 * Design distinct de la page d'accueil (Showroom vs Catalogue) :
 * - Barre de recherche ACTIVE (TextInput avec autofocus)
 * - Filtres categories superieurs fonctionnels (chips)
 * - Filtres avances via icone SlidersHorizontal (BottomSheet)
 * - Toggle Vue Grille / Vue Liste (libelle fonce)
 * - Grille 2 colonnes compacte avec prix bien visible et bouton Reserver
 * - Section "Lieux a decouvrir"
 * - Resultats filtres par recherche + categorie + filtres avances
 * - Pas de section "Tendances" (celle-ci appartient a l'Accueil)
 *
 * Conventions :
 * - expo-image pour les images
 * - lucide-react-native pour les icones
 * - Design tokens depuis lib/constants.ts
 * - Pas de type any, pas d'emojis
 * - Imports @/
 * - Commentaires en francais
 * - TextInput natif (pas de composant custom)
 * - BottomSheet du design system pour les filtres avances
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  Dimensions,
  type ViewStyle,
  type TextStyle,
  type ImageStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Image } from 'expo-image';
import {
  Search,
  SlidersHorizontal,
  X,
  LayoutGrid,
  List,
  MapPin,
  CalendarDays,
  Clock,
  TrendingUp,
} from 'lucide-react-native';

import { colors, spacing, radii, shadows, ROUTES } from '@/lib/constants';
import { useHaptics } from '@/hooks/useHaptics';
import { CATEGORIES, MOCK_EVENTS, MOCK_VENUES } from '@/data/mock';
import type { MockEvent } from '@/data/mock';
import { VenueCard } from '@/components/venues/VenueCard';
import { BottomSheet, type BottomSheetRef } from '@/components/ui/BottomSheet';

// ============================================================
// Constantes
// ============================================================

const SCREEN_WIDTH = Dimensions.get('window').width;
const GRID_CARD_WIDTH = (SCREEN_WIDTH - spacing.lg * 2 - spacing.md) / 2;
const GRID_IMAGE_HEIGHT = 140;
const LIST_IMAGE_HEIGHT = 100;

// ============================================================
// Prix range labels (pour filtres avances dans BottomSheet)
// ============================================================

const PRICE_RANGES = [
  { id: 'all', label: 'Tous', min: 0, max: Infinity },
  { id: 'free', label: 'Gratuit', min: 0, max: 0 },
  { id: 'budget', label: '< 5 000', min: 1, max: 5000 },
  { id: 'mid', label: '5k-15k', min: 5001, max: 15000 },
  { id: 'premium', label: '15k+', min: 15001, max: Infinity },
] as const;

const DATE_FILTERS = [
  { id: 'all', label: 'Toutes' },
  { id: 'today', label: 'Ce soir' },
  { id: 'weekend', label: 'Ce week-end' },
  { id: 'week', label: 'Cette semaine' },
] as const;

// ============================================================
// Composant : GridCard (compact, 2 colonnes, prix bien visible)
// ============================================================

interface GridCardProps {
  readonly event: MockEvent;
  readonly onPress: () => void;
  readonly onReserve: () => void;
}

function GridCard({ event, onPress, onReserve }: GridCardProps) {
  const { impact } = useHaptics();

  // -- Prix complet avec 'F' (FCFA abrege) en Or brillant --
  const formattedPrice = useMemo(() => {
    const abs = Math.abs(event.price);
    if (abs >= 1000) {
      const fmt = abs.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '\u202F');
      return `${fmt} F`;
    }
    return `${event.price} F`;
  }, [event.price]);

  const handlePress = useCallback(() => {
    impact('light');
    onPress();
  }, [impact, onPress]);

  const handleReserve = useCallback(() => {
    impact('medium');
    onReserve();
  }, [impact, onReserve]);

  return (
    <Pressable onPress={handlePress} style={gridCardStyle}>
      {/* Image */}
      <View style={gridImageContainerStyle}>
        <Image
          source={{ uri: event.image }}
          style={gridImageStyle}
          contentFit="cover"
          transition={200}
          cachePolicy="memory-disk"
        />
        {/* Badge categorie */}
        <View style={gridCategoryBadgeStyle}>
          <Text style={gridCategoryBadgeTextStyle}>{event.category}</Text>
        </View>
        {/* Badge featured */}
        {event.isFeatured && (
          <View style={gridFeaturedBadgeStyle}>
            <TrendingUp size={10} color={colors.onyx} strokeWidth={2} />
            <Text style={gridFeaturedBadgeTextStyle}>Tendance</Text>
          </View>
        )}
        {/* Prix superimpose sur l'image en bas a gauche - montant complet en Or brillant */}
        <View style={gridPriceOverlayStyle}>
          <Text style={gridPriceOverlayTextStyle}>{formattedPrice}</Text>
        </View>
      </View>

      {/* Contenu */}
      <View style={gridContentStyle}>
        <Text style={gridTitleStyle} numberOfLines={2} ellipsizeMode="tail">
          {event.title}
        </Text>
        <View style={gridInfoRowStyle}>
          <CalendarDays size={12} color={colors.stone} strokeWidth={1.5} />
          <Text style={gridInfoTextStyle} numberOfLines={1}>{event.date}</Text>
        </View>
        <View style={gridInfoRowStyle}>
          <MapPin size={12} color={colors.stone} strokeWidth={1.5} />
          <Text style={gridInfoTextStyle} numberOfLines={1}>{event.location}</Text>
        </View>

        {/* Bouton Reserver seul, toujours visible */}
        <Pressable onPress={handleReserve} style={gridReserveButtonStyle}>
          <Text style={gridReserveTextStyle}>Reserver</Text>
        </Pressable>
      </View>
    </Pressable>
  );
}

// ============================================================
// Composant : ListCard (horizontal, plus dense)
// ============================================================

interface ListCardProps {
  readonly event: MockEvent;
  readonly onPress: () => void;
  readonly onReserve: () => void;
}

function ListCard({ event, onPress, onReserve }: ListCardProps) {
  const { impact } = useHaptics();
  // -- Prix complet avec 'F' (FCFA abrege) en Or brillant --
  const formattedPrice = useMemo(() => {
    const abs = Math.abs(event.price);
    if (abs >= 1000) {
      const fmt = abs.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '\u202F');
      return `${fmt} F`;
    }
    return `${event.price} F`;
  }, [event.price]);

  const handlePress = useCallback(() => {
    impact('light');
    onPress();
  }, [impact, onPress]);

  const handleReserve = useCallback(() => {
    impact('medium');
    onReserve();
  }, [impact, onReserve]);

  return (
    <Pressable onPress={handlePress} style={listCardStyle}>
      {/* Image */}
      <View style={listImageContainerStyle}>
        <Image
          source={{ uri: event.image }}
          style={listImageStyle}
          contentFit="cover"
          transition={200}
          cachePolicy="memory-disk"
        />
        {/* Badge categorie */}
        <View style={listCategoryBadgeStyle}>
          <Text style={listCategoryBadgeTextStyle}>{event.category}</Text>
        </View>
      </View>

      {/* Contenu */}
      <View style={listContentStyle}>
        <Text style={listTitleStyle} numberOfLines={2} ellipsizeMode="tail">
          {event.title}
        </Text>
        <View style={listInfoRowStyle}>
          <CalendarDays size={12} color={colors.stone} strokeWidth={1.5} />
          <Text style={listInfoTextStyle}>{event.date}</Text>
          <Clock size={12} color={colors.stone} strokeWidth={1.5} />
          <Text style={listInfoTextStyle}>{event.time}</Text>
        </View>
        <View style={listInfoRowStyle}>
          <MapPin size={12} color={colors.stone} strokeWidth={1.5} />
          <Text style={listInfoTextStyle} numberOfLines={1}>{event.location}</Text>
        </View>
        <View style={listFooterStyle}>
          <Text style={listPriceStyle}>{formattedPrice}</Text>
          <Pressable onPress={handleReserve} style={listReserveButtonStyle}>
            <Text style={listReserveTextStyle}>Reserver</Text>
          </Pressable>
        </View>
      </View>
    </Pressable>
  );
}

// ============================================================
// Ecran principal
// ============================================================

type ViewMode = 'grid' | 'list';

export default function ExploreScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams<{ autoFocus?: string; filterCategory?: string }>();
  const { impact } = useHaptics();
  const searchInputRef = useRef<TextInput>(null);
  const bottomSheetRef = useRef<BottomSheetRef>(null);

  // -- State --
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState(
    params.filterCategory ?? 'all',
  );
  const [activePriceRange, setActivePriceRange] = useState('all');
  const [activeDateFilter, setActiveDateFilter] = useState('all');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [showFiltersSheet, setShowFiltersSheet] = useState(false);

  // -- Autofocus si navigation depuis la barre de recherche Home --
  useEffect(() => {
    if (params.autoFocus === 'true') {
      // Delai plus long pour eviter le crash avec InteractionManager
      // sur certains appareils Expo Go
      const timer = setTimeout(() => {
        searchInputRef.current?.focus();
      }, 400);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [params.autoFocus]);

  // -- Mise a jour du filtre categorie si navigation depuis Home --
  useEffect(() => {
    if (params.filterCategory && params.filterCategory !== activeCategory) {
      setActiveCategory(params.filterCategory);
    }
  }, [params.filterCategory]);

  // -- Handlers --
  const handleEventPress = useCallback((eventId: string) => {
    impact('light');
    // Navigation vers la page detail partagee (pas sous l'onglet Home)
    router.push({
      pathname: ROUTES.EVENT_DETAIL,
      params: { id: eventId },
      query: { from: 'explore' },
    } as any);
  }, [impact, router]);

  const handleReserve = useCallback((eventId: string) => {
    impact('medium');
    router.push({
      pathname: ROUTES.PURCHASE_TICKETS,
      params: { id: eventId },
    } as any);
  }, [impact, router]);

  const handleVenuePress = useCallback((venueId: string) => {
    impact('light');
    router.push({
      pathname: ROUTES.VENUE_DETAIL,
      params: { id: venueId },
    } as any);
  }, [impact, router]);

  const handleClearSearch = useCallback(() => {
    impact('light');
    setSearchQuery('');
    searchInputRef.current?.focus();
  }, [impact]);

  const handleCategoryPress = useCallback((categoryId: string) => {
    impact('light');
    setActiveCategory(categoryId);
  }, [impact]);

  const handleViewModeToggle = useCallback(() => {
    impact('light');
    setViewMode((prev) => prev === 'grid' ? 'list' : 'grid');
  }, [impact]);

  const handleOpenFilters = useCallback(() => {
    impact('light');
    // Ouvrir le BottomSheet de maniere declarative
    bottomSheetRef.current?.expand();
    setShowFiltersSheet(true);
  }, [impact]);

  // -- Callback du BottomSheet (memoise pour eviter les re-rendus infinis) --
  const handleSheetChange = useCallback((index: number) => {
    if (index < 0) {
      setShowFiltersSheet(false);
    }
  }, []);

  const handleApplyFilters = useCallback(() => {
    impact('light');
    setShowFiltersSheet(false);
  }, [impact]);

  const handleResetFilters = useCallback(() => {
    impact('light');
    setActivePriceRange('all');
    setActiveDateFilter('all');
  }, [impact]);

  // -- Filtrage des evenements --
  const filteredEvents = useMemo(() => {
    let result = [...MOCK_EVENTS];

    // Filtre recherche textuelle
    if (searchQuery.trim().length > 0) {
      const query = searchQuery.trim().toLowerCase();
      result = result.filter((e) =>
        e.title.toLowerCase().includes(query) ||
        e.location.toLowerCase().includes(query) ||
        e.organizerName.toLowerCase().includes(query) ||
        e.category.toLowerCase().includes(query)
      );
    }

    // Filtre categorie
    if (activeCategory !== 'all') {
      result = result.filter((e) => e.category === activeCategory);
    }

    // Filtre prix (depuis BottomSheet)
    const priceRange = PRICE_RANGES.find((r) => r.id === activePriceRange);
    if (priceRange && priceRange.id !== 'all') {
      result = result.filter((e) => e.price >= priceRange.min && e.price <= priceRange.max);
    }

    // Filtre date (simule sur les ids mock)
    if (activeDateFilter !== 'all') {
      const mockDateMap: Record<string, readonly string[]> = {
        today: ['1', '2', '3'] as const,
        weekend: ['4', '5'] as const,
        week: ['1', '2', '3', '4', '5', '6'] as const,
      };
      const allowedIds = mockDateMap[activeDateFilter];
      if (allowedIds) {
        result = result.filter((e) => allowedIds.includes(e.id));
      }
    }

    return result;
  }, [searchQuery, activeCategory, activePriceRange, activeDateFilter]);

  // -- Styles --
  const screenStyle: ViewStyle = {
    flex: 1,
    backgroundColor: colors.sand,
  };

  return (
    <View style={screenStyle}>
      {/* =============================================
          HEADER STICKY : Recherche + Toggle vue + Filtres categories
          (Hors ScrollView pour eviter le bug de scroll qui bloque les touches)
          ============================================= */}
      <View style={[stickyHeaderStyle, { paddingTop: insets.top + spacing.md }]}>
        {/* Barre de recherche active */}
        <View style={searchContainerStyle}>
          <Search size={20} color={colors.muted} strokeWidth={1.5} />
          <TextInput
            ref={searchInputRef}
            style={searchInputStyle}
            placeholder="Rechercher evenement, artiste, lieu..."
            placeholderTextColor={colors.muted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
            autoCapitalize="none"
            autoCorrect={false}
            accessibilityRole="search"
            accessibilityLabel="Rechercher un evenement"
          />
          {searchQuery.length > 0 && (
            <Pressable onPress={handleClearSearch} hitSlop={12} accessibilityLabel="Effacer">
              <X size={18} color={colors.stone} strokeWidth={2} />
            </Pressable>
          )}
          <Pressable
            onPress={handleOpenFilters}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel="Filtres avances"
          >
            <SlidersHorizontal size={20} color={colors.text} strokeWidth={1.5} />
          </Pressable>
        </View>

        {/* Toggle Vue Grille / Liste + Compteur */}
        <View style={viewToggleRowStyle}>
          <Pressable onPress={handleViewModeToggle} style={viewToggleButtonStyle}>
            {viewMode === 'grid' ? (
              <List size={18} color={colors.onyx} strokeWidth={1.5} />
            ) : (
              <LayoutGrid size={18} color={colors.onyx} strokeWidth={1.5} />
            )}
            <Text style={viewToggleTextStyle}>
              {viewMode === 'grid' ? 'Vue liste' : 'Vue grille'}
            </Text>
          </Pressable>
          <Text style={resultCountStyle}>
            {filteredEvents.length} evenement{filteredEvents.length > 1 ? 's' : ''}
          </Text>
        </View>

        {/* Chips filtres categorie (superieurs uniquement) */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={filterChipsContainerStyle}
          contentContainerStyle={{ paddingRight: spacing.lg }}
        >
          {CATEGORIES.map((cat) => {
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
      </View>

      {/* =============================================
          CONTENU SCROLLABLE : Resultats + Lieux a decouvrir
          ============================================= */}
      <ScrollView
        style={screenStyle}
        contentContainerStyle={{
          paddingBottom: 120, // Espace aeré pour la TabBar
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* =============================================
            RESULTATS (Grille ou Liste)
            ============================================= */}
        {filteredEvents.length > 0 ? (
          viewMode === 'grid' ? (
            <View style={gridContainerStyle}>
              {filteredEvents.reduce<(MockEvent[])[]>((rows, event, index) => {
                if (index % 2 === 0) rows.push([event]);
                else rows[rows.length - 1].push(event);
                return rows;
              }, []).map((row, rowIndex) => (
                <View key={rowIndex} style={gridRowStyle}>
                  {row.map((event) => (
                    <GridCard
                      key={event.id}
                      event={event}
                      onPress={() => handleEventPress(event.id)}
                      onReserve={() => handleReserve(event.id)}
                    />
                  ))}
                  {/* Cellule vide si row incomplet */}
                  {row.length < 2 && <View style={{ width: GRID_CARD_WIDTH }} />}
                </View>
              ))}
            </View>
          ) : (
            <View style={listContainerStyle}>
              {filteredEvents.map((event) => (
                <ListCard
                  key={event.id}
                  event={event}
                  onPress={() => handleEventPress(event.id)}
                  onReserve={() => handleReserve(event.id)}
                />
              ))}
            </View>
          )
        ) : (
          /* Etat vide */
          <View style={emptyStateStyle}>
            <Search size={48} color={`${colors.stone}30`} strokeWidth={1} />
            <Text style={emptyStateTitleStyle}>Aucun evenement trouve</Text>
            <Text style={emptyStateTextStyle}>
              Essayez de modifier vos filtres ou votre recherche
            </Text>
            <Pressable
              onPress={() => {
                impact('light');
                setSearchQuery('');
                setActiveCategory('all');
                setActivePriceRange('all');
                setActiveDateFilter('all');
              }}
              style={emptyStateButtonStyle}
              accessibilityRole="button"
              accessibilityLabel="Reinitialiser les filtres"
            >
              <Text style={emptyStateButtonTextStyle}>Reinitialiser</Text>
            </Pressable>
          </View>
        )}

        {/* Espacement entre resultats et lieux */}
        <View style={{ height: spacing.xxl }} />

        {/* =============================================
            SECTION "LIEUX A DECOUVRIR"
            ============================================= */}
        <View style={sectionHeaderStyle}>
          <Text style={sectionTitleStyle}>Lieux a decouvrir</Text>
          <Pressable
            onPress={() => {
              impact('light');
              router.push(ROUTES.VENUES);
            }}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Voir tous les lieux"
          >
            <Text style={seeAllTextStyle}>Voir tout</Text>
          </Pressable>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={venuesScrollContainerStyle}
          contentContainerStyle={{ paddingRight: spacing.lg, gap: spacing.md }}
        >
          {MOCK_VENUES.map((venue) => (
            <VenueCard
              key={venue.id}
              id={venue.id}
              name={venue.name}
              image={venue.image}
              location={venue.location}
              rating={venue.rating}
              badge={venue.badge}
              onPress={() => handleVenuePress(venue.id)}
            />
          ))}
        </ScrollView>

        {/* Espacement final aeré */}
        <View style={{ height: spacing.xxl }} />
      </ScrollView>

      {/* =============================================
          BOTTOM SHEET : Filtres avances (prix + date)
          ============================================= */}
      <BottomSheet
        ref={bottomSheetRef}
        snapPoints={['50%']}
        index={showFiltersSheet ? 0 : -1}
        onChange={handleSheetChange}
        testID="filters-bottom-sheet"
      >
        {/* Titre */}
        <View style={sheetHeaderStyle}>
          <Text style={sheetTitleStyle}>Filtres avances</Text>
          <Pressable onPress={handleResetFilters} hitSlop={8} accessibilityLabel="Reinitialiser">
            <Text style={sheetResetTextStyle}>Reinitialiser</Text>
          </Pressable>
        </View>

        {/* Filtre prix */}
        <Text style={sheetSectionLabelStyle}>Budget</Text>
        <View style={sheetChipsRowStyle}>
          {PRICE_RANGES.map((range) => {
            const isActive = activePriceRange === range.id;
            return (
              <Pressable
                key={range.id}
                onPress={() => setActivePriceRange(range.id)}
                style={isActive ? sheetChipActiveStyle : sheetChipInactiveStyle}
                accessibilityRole="button"
                accessibilityState={{ selected: isActive }}
              >
                <Text style={isActive ? sheetChipActiveTextStyle : sheetChipInactiveTextStyle}>
                  {range.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Espacement */}
        <View style={{ height: spacing.md }} />

        {/* Filtre date */}
        <Text style={sheetSectionLabelStyle}>Date</Text>
        <View style={sheetChipsRowStyle}>
          {DATE_FILTERS.map((dateFilter) => {
            const isActive = activeDateFilter === dateFilter.id;
            return (
              <Pressable
                key={dateFilter.id}
                onPress={() => setActiveDateFilter(dateFilter.id)}
                style={isActive ? sheetChipActiveStyle : sheetChipInactiveStyle}
                accessibilityRole="button"
                accessibilityState={{ selected: isActive }}
              >
                <CalendarDays size={12} color={isActive ? colors.white : colors.stone} strokeWidth={1.5} />
                <Text style={isActive ? sheetChipActiveTextStyle : sheetChipInactiveTextStyle}>
                  {dateFilter.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Espacement */}
        <View style={{ height: spacing.xl }} />

        {/* Bouton Appliquer */}
        <Pressable onPress={handleApplyFilters} style={sheetApplyButtonStyle}>
          <Text style={sheetApplyButtonTextStyle}>Appliquer les filtres</Text>
        </Pressable>
      </BottomSheet>
    </View>
  );
}

// ============================================================
// Styles - Sticky Header (hors ScrollView)
// ============================================================

const stickyHeaderStyle: ViewStyle = {
  backgroundColor: colors.sand,
  paddingHorizontal: spacing.lg,
  paddingBottom: spacing.sm,
  borderBottomWidth: 1,
  borderBottomColor: `${colors.border}50`,
  // Pas de zIndex probleme car hors du ScrollView
};

const searchContainerStyle: ViewStyle = {
  flexDirection: 'row',
  alignItems: 'center',
  backgroundColor: colors.white,
  borderRadius: radii.xl,
  paddingHorizontal: spacing.md,
  height: 48,
  borderWidth: 1,
  borderColor: colors.border,
  ...shadows.search,
};

const searchInputStyle: TextStyle = {
  fontFamily: 'Inter-Regular',
  fontSize: 15,
  lineHeight: 20,
  color: colors.onyx,
  flex: 1,
  marginLeft: spacing.sm,
  paddingVertical: 0,
};

const viewToggleRowStyle: ViewStyle = {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginTop: spacing.sm,
  marginBottom: spacing.xs,
};

const viewToggleButtonStyle: ViewStyle = {
  flexDirection: 'row',
  alignItems: 'center',
  gap: spacing.xs,
  backgroundColor: colors.ivory,
  borderRadius: radii.sm,
  paddingHorizontal: spacing.md,
  paddingVertical: spacing.xs,
  borderWidth: 1,
  borderColor: `${colors.stone}20`,
};

// Libelle vue en ecriture FONCE (onyx, pas stone)
const viewToggleTextStyle: TextStyle = {
  fontFamily: 'Inter-SemiBold',
  fontSize: 13,
  lineHeight: 18,
  color: colors.onyx,
  letterSpacing: 0.2,
};

const resultCountStyle: TextStyle = {
  fontFamily: 'Inter-Regular',
  fontSize: 13,
  lineHeight: 18,
  color: colors.stone,
};

// ============================================================
// Styles - Filtres Chips (categories superieurs)
// ============================================================

const filterChipsContainerStyle: ViewStyle = {
  paddingBottom: spacing.sm,
};

const chipActiveStyle: ViewStyle = {
  backgroundColor: colors.terracotta,
  borderRadius: radii.full,
  paddingHorizontal: spacing.md,
  paddingVertical: spacing.sm,
  marginRight: spacing.sm,
};

const chipInactiveStyle: ViewStyle = {
  backgroundColor: colors.ivory,
  borderRadius: radii.full,
  paddingHorizontal: spacing.md,
  paddingVertical: spacing.sm,
  marginRight: spacing.sm,
  borderWidth: 1,
  borderColor: `${colors.stone}30`,
};

const chipActiveTextStyle: TextStyle = {
  fontFamily: 'Inter-SemiBold',
  fontSize: 14,
  lineHeight: 20,
  color: colors.white,
  letterSpacing: 0.3,
};

const chipInactiveTextStyle: TextStyle = {
  fontFamily: 'Inter-Medium',
  fontSize: 14,
  lineHeight: 20,
  color: colors.onyx,
  letterSpacing: 0.2,
};

// ============================================================
// Styles - Grille (prix overlay sur image, boutton seul)
// ============================================================

const gridContainerStyle: ViewStyle = {
  paddingHorizontal: spacing.lg,
  gap: spacing.md,
  paddingTop: spacing.md,
};

const gridRowStyle: ViewStyle = {
  flexDirection: 'row',
  gap: spacing.md,
};

const gridCardStyle: ViewStyle = {
  width: GRID_CARD_WIDTH,
  backgroundColor: colors.white,
  borderRadius: radii.lg,
  overflow: 'hidden',
  ...shadows.card,
};

const gridImageContainerStyle: ViewStyle = {
  height: GRID_IMAGE_HEIGHT,
  position: 'relative',
};

const gridImageStyle: ImageStyle = {
  width: GRID_CARD_WIDTH,
  height: GRID_IMAGE_HEIGHT,
};

const gridCategoryBadgeStyle: ViewStyle = {
  position: 'absolute',
  top: spacing.xs,
  left: spacing.xs,
  backgroundColor: colors.terracotta,
  borderRadius: radii.sm,
  paddingHorizontal: spacing.xs,
  paddingVertical: 2,
};

const gridCategoryBadgeTextStyle: TextStyle = {
  fontFamily: 'Inter-SemiBold',
  fontSize: 10,
  lineHeight: 14,
  color: colors.white,
  letterSpacing: 0.3,
};

const gridFeaturedBadgeStyle: ViewStyle = {
  position: 'absolute',
  top: spacing.xs,
  right: spacing.xs,
  flexDirection: 'row',
  alignItems: 'center',
  backgroundColor: colors.gold,
  borderRadius: radii.sm,
  paddingHorizontal: spacing.xs,
  paddingVertical: 2,
  gap: 2,
};

const gridFeaturedBadgeTextStyle: TextStyle = {
  fontFamily: 'Inter-Bold',
  fontSize: 10,
  lineHeight: 14,
  color: colors.onyx,
  letterSpacing: 0.3,
};

// Prix overlay sur l'image (en bas a gauche) - toujours visible
const gridPriceOverlayStyle: ViewStyle = {
  position: 'absolute',
  bottom: spacing.sm,
  left: spacing.xs,
  backgroundColor: 'rgba(26,24,22,0.7)',
  borderRadius: radii.sm,
  paddingHorizontal: spacing.sm,
  paddingVertical: spacing.xs,
};

const gridPriceOverlayTextStyle: TextStyle = {
  fontFamily: 'Inter-Bold',
  fontSize: 12,
  lineHeight: 16,
  color: colors.goldBright,
  letterSpacing: 0.2,
};

const gridContentStyle: ViewStyle = {
  padding: spacing.sm,
};

const gridTitleStyle: TextStyle = {
  fontFamily: 'PlayfairDisplay-SemiBold',
  fontSize: 14,
  lineHeight: 19,
  color: colors.onyx,
  letterSpacing: -0.2,
  marginBottom: spacing.xs,
};

const gridInfoRowStyle: ViewStyle = {
  flexDirection: 'row',
  alignItems: 'center',
  gap: spacing.xs,
  marginBottom: 2,
};

const gridInfoTextStyle: TextStyle = {
  fontFamily: 'Inter-Regular',
  fontSize: 11,
  lineHeight: 15,
  color: colors.stone,
};

// Bouton Reserver seul (pas de row avec prix - prix est sur l'image)
const gridReserveButtonStyle: ViewStyle = {
  backgroundColor: colors.terracotta,
  borderRadius: radii.sm,
  paddingHorizontal: spacing.sm,
  paddingVertical: spacing.xs + 2,
  marginTop: spacing.sm,
  alignItems: 'center',
};

const gridReserveTextStyle: TextStyle = {
  fontFamily: 'Inter-SemiBold',
  fontSize: 12,
  lineHeight: 16,
  color: colors.white,
  letterSpacing: 0.2,
};

// ============================================================
// Styles - Liste
// ============================================================

const listContainerStyle: ViewStyle = {
  paddingHorizontal: spacing.lg,
  gap: spacing.md,
  paddingTop: spacing.md,
};

const listCardStyle: ViewStyle = {
  flexDirection: 'row',
  backgroundColor: colors.white,
  borderRadius: radii.lg,
  overflow: 'hidden',
  ...shadows.card,
};

const listImageContainerStyle: ViewStyle = {
  width: LIST_IMAGE_HEIGHT,
  height: LIST_IMAGE_HEIGHT,
  position: 'relative',
};

const listImageStyle: ImageStyle = {
  width: LIST_IMAGE_HEIGHT,
  height: LIST_IMAGE_HEIGHT,
};

const listCategoryBadgeStyle: ViewStyle = {
  position: 'absolute',
  top: spacing.xs,
  left: spacing.xs,
  backgroundColor: colors.terracotta,
  borderRadius: radii.sm,
  paddingHorizontal: spacing.xs,
  paddingVertical: 2,
};

const listCategoryBadgeTextStyle: TextStyle = {
  fontFamily: 'Inter-SemiBold',
  fontSize: 10,
  lineHeight: 14,
  color: colors.white,
};

const listContentStyle: ViewStyle = {
  flex: 1,
  padding: spacing.sm,
};

const listTitleStyle: TextStyle = {
  fontFamily: 'PlayfairDisplay-SemiBold',
  fontSize: 15,
  lineHeight: 20,
  color: colors.onyx,
  letterSpacing: -0.2,
  marginBottom: spacing.xs,
};

const listInfoRowStyle: ViewStyle = {
  flexDirection: 'row',
  alignItems: 'center',
  gap: spacing.xs,
  marginBottom: 2,
};

const listInfoTextStyle: TextStyle = {
  fontFamily: 'Inter-Regular',
  fontSize: 12,
  lineHeight: 16,
  color: colors.stone,
};

const listFooterStyle: ViewStyle = {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginTop: spacing.sm,
};

const listPriceStyle: TextStyle = {
  fontFamily: 'Inter-Bold',
  fontSize: 14,
  lineHeight: 20,
  color: colors.goldBright,
};

const listReserveButtonStyle: ViewStyle = {
  backgroundColor: colors.terracotta,
  borderRadius: radii.sm,
  paddingHorizontal: spacing.md,
  paddingVertical: spacing.xs,
};

const listReserveTextStyle: TextStyle = {
  fontFamily: 'Inter-SemiBold',
  fontSize: 12,
  lineHeight: 16,
  color: colors.white,
};

// ============================================================
// Styles - Section header + Lieux
// ============================================================

const sectionHeaderStyle: ViewStyle = {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  paddingHorizontal: spacing.lg,
  marginBottom: spacing.md,
};

const sectionTitleStyle: TextStyle = {
  fontFamily: 'PlayfairDisplay-Bold',
  fontSize: 20,
  lineHeight: 26,
  letterSpacing: -0.3,
  color: colors.onyx,
};

const seeAllTextStyle: TextStyle = {
  fontFamily: 'Inter-SemiBold',
  fontSize: 13,
  lineHeight: 18,
  color: colors.terracotta,
  letterSpacing: 0.2,
};

const venuesScrollContainerStyle: ViewStyle = {
  paddingLeft: spacing.lg,
  paddingRight: spacing.sm,
};

// ============================================================
// Styles - Etat vide
// ============================================================

const emptyStateStyle: ViewStyle = {
  justifyContent: 'center',
  alignItems: 'center',
  paddingVertical: spacing.xxxl,
  paddingHorizontal: spacing.xl,
};

const emptyStateTitleStyle: TextStyle = {
  fontFamily: 'PlayfairDisplay-Bold',
  fontSize: 20,
  lineHeight: 26,
  color: colors.onyx,
  marginTop: spacing.md,
  marginBottom: spacing.sm,
};

const emptyStateTextStyle: TextStyle = {
  fontFamily: 'Inter-Regular',
  fontSize: 14,
  lineHeight: 20,
  color: colors.stone,
  textAlign: 'center',
  marginBottom: spacing.lg,
};

const emptyStateButtonStyle: ViewStyle = {
  backgroundColor: colors.terracotta,
  borderRadius: radii.md,
  paddingHorizontal: spacing.xl,
  paddingVertical: spacing.md,
};

const emptyStateButtonTextStyle: TextStyle = {
  fontFamily: 'Inter-SemiBold',
  fontSize: 16,
  lineHeight: 22,
  color: colors.white,
};

// ============================================================
// Styles - Bottom Sheet (Filtres avances)
// ============================================================

const sheetHeaderStyle: ViewStyle = {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: spacing.md,
};

const sheetTitleStyle: TextStyle = {
  fontFamily: 'PlayfairDisplay-Bold',
  fontSize: 20,
  lineHeight: 26,
  color: colors.onyx,
};

const sheetResetTextStyle: TextStyle = {
  fontFamily: 'Inter-SemiBold',
  fontSize: 14,
  lineHeight: 20,
  color: colors.terracotta,
};

const sheetSectionLabelStyle: TextStyle = {
  fontFamily: 'Inter-SemiBold',
  fontSize: 14,
  lineHeight: 20,
  color: colors.onyx,
  marginBottom: spacing.sm,
};

const sheetChipsRowStyle: ViewStyle = {
  flexDirection: 'row',
  flexWrap: 'wrap',
  gap: spacing.sm,
};

const sheetChipActiveStyle: ViewStyle = {
  backgroundColor: colors.terracotta,
  borderRadius: radii.full,
  paddingHorizontal: spacing.md,
  paddingVertical: spacing.sm,
  flexDirection: 'row',
  alignItems: 'center',
  gap: spacing.xs,
};

const sheetChipInactiveStyle: ViewStyle = {
  backgroundColor: colors.ivory,
  borderRadius: radii.full,
  paddingHorizontal: spacing.md,
  paddingVertical: spacing.sm,
  borderWidth: 1,
  borderColor: `${colors.stone}30`,
  flexDirection: 'row',
  alignItems: 'center',
  gap: spacing.xs,
};

const sheetChipActiveTextStyle: TextStyle = {
  fontFamily: 'Inter-SemiBold',
  fontSize: 13,
  lineHeight: 18,
  color: colors.white,
};

const sheetChipInactiveTextStyle: TextStyle = {
  fontFamily: 'Inter-Medium',
  fontSize: 13,
  lineHeight: 18,
  color: colors.onyx,
};

const sheetApplyButtonStyle: ViewStyle = {
  backgroundColor: colors.terracotta,
  borderRadius: radii.md,
  paddingHorizontal: spacing.xl,
  paddingVertical: spacing.md,
  alignItems: 'center',
};

const sheetApplyButtonTextStyle: TextStyle = {
  fontFamily: 'Inter-SemiBold',
  fontSize: 16,
  lineHeight: 22,
  color: colors.white,
};
