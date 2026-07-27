/**
 * Page Explorer - Catalogue de recherche interactif.
 *
 * Design distinct de la page d'accueil (Showroom vs Catalogue) :
 * - Barre de recherche ACTIVE (TextInput avec autofocus)
 * - Filtres fonctionnels (categorie, date, prix) sous forme de chips
 * - Toggle Vue Grille / Vue Liste
 * - Grille 2 colonnes compacte (style Pinterest/Masonry)
 * - Resultats filtres par recherche + categorie + prix + date
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
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  Dimensions,
  InteractionManager,
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
  //ChevronRight,
} from 'lucide-react-native';

import { colors, spacing, radii, shadows, ROUTES } from '@/lib/constants';
import { useHaptics } from '@/hooks/useHaptics';
import { CATEGORIES, MOCK_EVENTS } from '@/data/mock';
import type { MockEvent } from '@/data/mock';

// ============================================================
// Constantes
// ============================================================

const SCREEN_WIDTH = Dimensions.get('window').width;
const GRID_CARD_WIDTH = (SCREEN_WIDTH - spacing.lg * 2 - spacing.md) / 2;
const GRID_IMAGE_HEIGHT = 140;
const LIST_IMAGE_HEIGHT = 100;

// ============================================================
// Prix range labels
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
// Composant : GridCard (compact, 2 colonnes)
// ============================================================

interface GridCardProps {
  readonly event: MockEvent;
  readonly onPress: () => void;
  readonly onReserve: () => void;
}

function GridCard({ event, onPress, onReserve }: GridCardProps) {
  const { impact } = useHaptics();
  const formattedPrice = useMemo(() => {
    const abs = Math.abs(event.price);
    if (abs >= 1000) {
      const fmt = abs.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '\u202F');
      return `${fmt} ${event.currency}`;
    }
    return `${event.price} ${event.currency}`;
  }, [event.price, event.currency]);

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

        {/* Prix + micro-CTA */}
        <View style={gridFooterStyle}>
          <Text style={gridPriceStyle}>{formattedPrice}</Text>
          <Pressable onPress={handleReserve} style={gridReserveButtonStyle}>
            <Text style={gridReserveTextStyle}>Reserver</Text>
          </Pressable>
        </View>
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
  const formattedPrice = useMemo(() => {
    const abs = Math.abs(event.price);
    if (abs >= 1000) {
      const fmt = abs.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '\u202F');
      return `${fmt} ${event.currency}`;
    }
    return `${event.price} ${event.currency}`;
  }, [event.price, event.currency]);

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

  // -- State --
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState(
    params.filterCategory ?? 'all',
  );
  const [activePriceRange, setActivePriceRange] = useState('all');
  const [activeDateFilter, setActiveDateFilter] = useState('all');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');

  // -- Autofocus si navigation depuis la barre de recherche Home --
  // Utilise InteractionManager pour s'assurer que la navigation
  // est completement terminee avant de focusser le TextInput.
  // Cela evite la perte de focus lors de la transition de tab.
  useEffect(() => {
    if (params.autoFocus === 'true') {
      const handle = InteractionManager.runAfterInteractions(() => {
        searchInputRef.current?.focus();
      });
      return () => handle.cancel();
    }
  }, [params.autoFocus]);

  // -- Handlers --
  const handleEventPress = useCallback((eventId: string) => {
    impact('light');
    // Navigation vers le detail avec param from=explore
    // pour que le bouton retour ramene a Explorer, pas a l'Accueil
    router.push(`/(client)/home/${eventId}?from=explore`);
  }, [impact, router]);

  const handleReserve = useCallback((eventId: string) => {
    impact('medium');
    router.push(`/(purchase)/event/${eventId}/tickets`);
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

  const handlePriceRangePress = useCallback((rangeId: string) => {
    impact('light');
    setActivePriceRange(rangeId);
  }, [impact]);

  const handleDateFilterPress = useCallback((dateId: string) => {
    impact('light');
    setActiveDateFilter(dateId);
  }, [impact]);

  const handleViewModeToggle = useCallback(() => {
    impact('light');
    setViewMode((prev) => prev === 'grid' ? 'list' : 'grid');
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

    // Filtre prix
    const priceRange = PRICE_RANGES.find((r) => r.id === activePriceRange);
    if (priceRange && priceRange.id !== 'all') {
      result = result.filter((e) => e.price >= priceRange.min && e.price <= priceRange.max);
    }

    // Filtre date (simule sur les ids mock, pas sur les vraies dates)
    // En mode mock, les evenements n'ont pas de vrai champ date ISO,
    // on simule en filtrant selon l'id (evenements 1-3 = "Ce soir",
    // 4-5 = "Ce week-end", 6 = "Cette semaine")
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

  const scrollContentStyle: ViewStyle = {
    paddingTop: insets.top,
    paddingBottom: 100,
  };

  return (
    <View style={screenStyle}>
      <ScrollView
        style={screenStyle}
        contentContainerStyle={scrollContentStyle}
        showsVerticalScrollIndicator={false}
        stickyHeaderIndices={[0]}
      >
        {/* =============================================
            HEADER STICKY : Recherche + Toggle vue + Filtres
            ============================================= */}
        <View style={stickyHeaderStyle}>
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
              onPress={() => {
                impact('light');
                router.push(ROUTES.FILTERS);
              }}
              hitSlop={12}
              accessibilityRole="button"
              accessibilityLabel="Filtres avances"
            >
              <SlidersHorizontal size={20} color={colors.text} strokeWidth={1.5} />
            </Pressable>
          </View>

          {/* Toggle Vue Grille / Liste */}
          <View style={viewToggleRowStyle}>
            <Pressable onPress={handleViewModeToggle} style={viewToggleButtonStyle}>
              {viewMode === 'grid' ? (
                <List size={18} color={colors.stone} strokeWidth={1.5} />
              ) : (
                <LayoutGrid size={18} color={colors.stone} strokeWidth={1.5} />
              )}
              <Text style={viewToggleTextStyle}>
                {viewMode === 'grid' ? 'Vue liste' : 'Vue grille'}
              </Text>
            </Pressable>
            <Text style={resultCountStyle}>
              {filteredEvents.length} evenement{filteredEvents.length > 1 ? 's' : ''}
            </Text>
          </View>

          {/* Chips filtres categorie */}
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

          {/* Chips filtres prix */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={filterChipsContainerStyle}
            contentContainerStyle={{ paddingRight: spacing.lg }}
          >
            {PRICE_RANGES.map((range) => {
              const isActive = activePriceRange === range.id;
              return (
                <Pressable
                  key={range.id}
                  onPress={() => handlePriceRangePress(range.id)}
                  style={isActive ? chipActiveSmallStyle : chipInactiveSmallStyle}
                  accessibilityRole="button"
                  accessibilityState={{ selected: isActive }}
                >
                  <Text style={isActive ? chipActiveSmallTextStyle : chipInactiveSmallTextStyle}>
                    {range.label}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          {/* Chips filtres date */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={filterChipsContainerStyle}
            contentContainerStyle={{ paddingRight: spacing.lg }}
          >
            {DATE_FILTERS.map((dateFilter) => {
              const isActive = activeDateFilter === dateFilter.id;
              return (
                <Pressable
                  key={dateFilter.id}
                  onPress={() => handleDateFilterPress(dateFilter.id)}
                  style={isActive ? chipActiveSmallStyle : chipInactiveSmallStyle}
                  accessibilityRole="button"
                  accessibilityState={{ selected: isActive }}
                >
                  <CalendarDays size={12} color={isActive ? colors.white : colors.stone} strokeWidth={1.5} />
                  <Text style={isActive ? chipActiveSmallTextStyle : chipInactiveSmallTextStyle}>
                    {dateFilter.label}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

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
              }}
              style={emptyStateButtonStyle}
              accessibilityRole="button"
              accessibilityLabel="Reinitialiser les filtres"
            >
              <Text style={emptyStateButtonTextStyle}>Reinitialiser</Text>
            </Pressable>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

// ============================================================
// Styles - Sticky Header
// ============================================================

const stickyHeaderStyle: ViewStyle = {
  backgroundColor: colors.sand,
  paddingHorizontal: spacing.lg,
  paddingTop: spacing.md,
  paddingBottom: spacing.sm,
  borderBottomWidth: 1,
  borderBottomColor: `${colors.border}50`,
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

const viewToggleTextStyle: TextStyle = {
  fontFamily: 'Inter-Medium',
  fontSize: 13,
  lineHeight: 18,
  color: colors.stone,
};

const resultCountStyle: TextStyle = {
  fontFamily: 'Inter-Regular',
  fontSize: 13,
  lineHeight: 18,
  color: colors.stone,
};

// ============================================================
// Styles - Filtres Chips
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

const chipActiveSmallStyle: ViewStyle = {
  backgroundColor: colors.forest,
  borderRadius: radii.full,
  paddingHorizontal: spacing.sm,
  paddingVertical: spacing.xs,
  marginRight: spacing.sm,
};

const chipInactiveSmallStyle: ViewStyle = {
  backgroundColor: colors.ivory,
  borderRadius: radii.full,
  paddingHorizontal: spacing.sm,
  paddingVertical: spacing.xs,
  marginRight: spacing.sm,
  borderWidth: 1,
  borderColor: `${colors.stone}20`,
};

const chipActiveSmallTextStyle: TextStyle = {
  fontFamily: 'Inter-SemiBold',
  fontSize: 12,
  lineHeight: 16,
  color: colors.white,
  letterSpacing: 0.2,
};

const chipInactiveSmallTextStyle: TextStyle = {
  fontFamily: 'Inter-Medium',
  fontSize: 12,
  lineHeight: 16,
  color: colors.onyx,
};

// ============================================================
// Styles - Grille
// ============================================================

const gridContainerStyle: ViewStyle = {
  paddingHorizontal: spacing.lg,
  gap: spacing.md,
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

const gridFooterStyle: ViewStyle = {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginTop: spacing.sm,
};

const gridPriceStyle: TextStyle = {
  fontFamily: 'Inter-Bold',
  fontSize: 13,
  lineHeight: 18,
  color: colors.gold,
};

const gridReserveButtonStyle: ViewStyle = {
  backgroundColor: colors.terracotta,
  borderRadius: radii.sm,
  paddingHorizontal: spacing.sm,
  paddingVertical: spacing.xs,
};

const gridReserveTextStyle: TextStyle = {
  fontFamily: 'Inter-SemiBold',
  fontSize: 11,
  lineHeight: 15,
  color: colors.white,
};

// ============================================================
// Styles - Liste
// ============================================================

const listContainerStyle: ViewStyle = {
  paddingHorizontal: spacing.lg,
  gap: spacing.md,
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
  color: colors.gold,
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
