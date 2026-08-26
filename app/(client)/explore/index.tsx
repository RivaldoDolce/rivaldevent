/**
 * Page Explorer - Catalogue de recherche premium « Noir & Or ».
 *
 * Design distinct de la page d'accueil (Showroom vs Catalogue) :
 * - Barre de recherche ACTIVE (TextInput avec autofocus) en pastille verre
 * - Titre serif + sous-titre
 * - Filtres categories fonctionnels (chips pill verre / dégradé or actif)
 * - Filtres avances via icone SlidersHorizontal (badge compteur)
 * - Toggle Vue Grille / Vue Liste (pastille verre)
 * - Grille 2 colonnes compacte avec prix bien visible et bouton Reserver
 * - Section "Lieux a decouvrir"
 * - Resultats filtres par recherche + categorie + filtres avances
 * - Pas de section "Tendances" (celle-ci appartient a l'Accueil)
 *
 * Conventions :
 * - Design tokens depuis lib/constants.ts
 * - Pas de type any, pas d'emojis, commentaires en francais
 * - TextInput natif, BottomSheet du design system pour les filtres
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  Dimensions,
  ImageBackground,
  StyleSheet,
  Animated,
  type ViewStyle,
  type TextStyle,
  type ImageStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
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
  ChevronRight,
} from 'lucide-react-native';

import { colors, spacing, radius, shadows, gradients, ROUTES } from '@/lib/constants';
import { clientBackgrounds } from '@/lib/images';
import { useHaptics } from '@/hooks/useHaptics';
import { CATEGORIES, MOCK_EVENTS, MOCK_VENUES } from '@/data/mock';
import type { MockEvent } from '@/data/mock';
import { VenueCard } from '@/components/venues/VenueCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { useExploreStore } from '@/stores/explore-store';

// ============================================================
// Constantes
// ============================================================

const SCREEN_WIDTH = Dimensions.get('window').width;
const GRID_CARD_WIDTH = (SCREEN_WIDTH - spacing.lg * 2 - spacing.md) / 2;
const GRID_IMAGE_HEIGHT = 140;
const LIST_IMAGE_HEIGHT = 100;

// ============================================================
// Prix range labels (doit correspondre aux filtres du modal)
// ============================================================

const PRICE_RANGES = [
  { id: 'all', label: 'Tous', min: 0, max: null },
  { id: 'free', label: 'Gratuit', min: 0, max: 0 },
  { id: 'low', label: '< 5 000', min: 0, max: 5000 },
  { id: 'mid', label: '5 000 - 15 000', min: 5000, max: 15000 },
  { id: 'high', label: '15 000 - 50 000', min: 15000, max: 50000 },
  { id: 'vip', label: '> 50 000', min: 50000, max: null },
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
    <Pressable
      onPress={handlePress}
      style={gridCardStyle}
      accessibilityRole="button"
      accessibilityLabel={`Evenement: ${event.title}`}
    >
      {/* Image avec dégradé sombre */}
      <View style={gridImageContainerStyle}>
        <Image
          source={{ uri: event.image }}
          style={gridImageStyle}
          contentFit="cover"
          transition={200}
          cachePolicy="memory-disk"
        />
        <LinearGradient
          colors={['rgba(10,9,8,0.02)', 'rgba(10,9,8,0.6)']}
          style={gridImageGradientStyle}
          pointerEvents="none"
        />
        {/* Badge categorie — verre doré */}
        <View style={gridCategoryBadgeStyle}>
          <Text style={gridCategoryBadgeTextStyle} numberOfLines={1}>
            {event.category}
          </Text>
        </View>
        {/* Badge featured */}
        {event.isFeatured && (
          <View style={gridFeaturedBadgeStyle}>
            <TrendingUp size={10} color={colors.onyx} strokeWidth={2} />
            <Text style={gridFeaturedBadgeTextStyle}>Tendance</Text>
          </View>
        )}
        {/* Prix superimpose sur l'image en bas a gauche */}
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
          <CalendarDays size={12} color={colors.goldMuted} strokeWidth={1.5} />
          <Text style={gridInfoTextStyle} numberOfLines={1}>{event.date}</Text>
        </View>
        <View style={gridInfoRowStyle}>
          <MapPin size={12} color={colors.goldMuted} strokeWidth={1.5} />
          <Text style={gridInfoTextStyle} numberOfLines={1}>{event.location}</Text>
        </View>

        {/* Bouton Reserver seul, toujours visible — dégradé or */}
        <LinearGradient
          colors={[...gradients.gold] as unknown as readonly [string, string, ...string[]]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={gridReserveButtonStyle}
        >
          <Pressable onPress={handleReserve} style={gridReserveInnerStyle} hitSlop={4} accessibilityRole="button" accessibilityLabel="Reserver">
            <Text style={gridReserveTextStyle}>Reserver</Text>
          </Pressable>
        </LinearGradient>
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
    <Pressable
      onPress={handlePress}
      style={listCardStyle}
      accessibilityRole="button"
      accessibilityLabel={`Evenement: ${event.title}`}
    >
      {/* Image avec dégradé */}
      <View style={listImageContainerStyle}>
        <Image
          source={{ uri: event.image }}
          style={listImageStyle}
          contentFit="cover"
          transition={200}
          cachePolicy="memory-disk"
        />
        <LinearGradient
          colors={['rgba(10,9,8,0.02)', 'rgba(10,9,8,0.55)']}
          style={StyleAbsoluteFill}
          pointerEvents="none"
        />
        {/* Badge categorie — verre doré */}
        <View style={listCategoryBadgeStyle}>
          <Text style={listCategoryBadgeTextStyle} numberOfLines={1}>
            {event.category}
          </Text>
        </View>
      </View>

      {/* Contenu */}
      <View style={listContentStyle}>
        <Text style={listTitleStyle} numberOfLines={2} ellipsizeMode="tail">
          {event.title}
        </Text>
        <View style={listInfoRowStyle}>
          <CalendarDays size={12} color={colors.goldMuted} strokeWidth={1.5} />
          <Text style={listInfoTextStyle} numberOfLines={1}>{event.date}</Text>
          <View style={listInfoDotStyle} />
          <Clock size={12} color={colors.goldMuted} strokeWidth={1.5} />
          <Text style={listInfoTextStyle} numberOfLines={1}>{event.time}</Text>
        </View>
        <View style={listInfoRowStyle}>
          <MapPin size={12} color={colors.goldMuted} strokeWidth={1.5} />
          <Text style={[listInfoTextStyle, { flex: 1 }]} numberOfLines={1}>{event.location}</Text>
        </View>
        <View style={listFooterStyle}>
          <Text style={listPriceStyle}>{formattedPrice}</Text>
          <LinearGradient
            colors={[...gradients.gold] as unknown as readonly [string, string, ...string[]]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={listReserveButtonStyle}
          >
            <Pressable onPress={handleReserve} style={listReserveInnerStyle} hitSlop={4} accessibilityRole="button" accessibilityLabel="Reserver">
              <Text style={listReserveTextStyle}>Reserver</Text>
            </Pressable>
          </LinearGradient>
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
  // -- Store global --
  const { activeCategory, setActiveCategory, advancedFilters, setAdvancedFilters } = useExploreStore();

  // -- State local --
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const scrollY = useRef(new Animated.Value(0)).current;
  const clampedScrollY = Animated.diffClamp(scrollY, 0, 110);
  const collapsibleTranslateY = clampedScrollY.interpolate({ inputRange: [0, 110], outputRange: [0, -90], extrapolate: 'clamp' });
  const collapsibleOpacity = clampedScrollY.interpolate({ inputRange: [0, 70], outputRange: [1, 0], extrapolate: 'clamp' });

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

  // -- Appliquer le filtre categorie venant de l'Accueil UNE SEULE FOIS --
  // Important : ce filtre ne doit pas se re-appliquer quand l'utilisateur
  // change de categorie directement sur cette page (sinon son choix est ecrase).
  useEffect(() => {
    if (params.filterCategory) {
      setActiveCategory(params.filterCategory);
    }
  }, [params.filterCategory, setActiveCategory]);

  // -- Handlers --
  const handleEventPress = useCallback((eventId: string) => {
    impact('light');
    // Navigation vers le detail dans le dossier explore/
    // pour que router.back() retourne a Explorer (pas a l'Accueil)
    router.push({
      pathname: ROUTES.EXPLORE_EVENT_DETAIL,
      params: { id: eventId },
    });
  }, [impact, router]);

  const handleReserve = useCallback((eventId: string) => {
    impact('medium');
    router.push({
      pathname: ROUTES.PURCHASE_TICKETS,
      params: { id: eventId },
    });
  }, [impact, router]);

  const handleVenuePress = useCallback((venueId: string) => {
    impact('light');
    router.push({
      pathname: ROUTES.VENUE_DETAIL,
      params: { id: venueId },
    });
  }, [impact, router]);

  const handleClearSearch = useCallback(() => {
    impact('light');
    setSearchQuery('');
    searchInputRef.current?.focus();
  }, [impact]);

  const handleCategoryPress = useCallback((categoryId: string) => {
    impact('light');
    setActiveCategory(categoryId);
  }, [impact, setActiveCategory]);

  const handleOpenFilters = useCallback(() => {
    impact('light');
    router.push('/(modal)/filters');
  }, [impact, router]);

  const handleResetFilters = useCallback(() => {
    impact('light');
    setAdvancedFilters({
      city: 'all',
      priceRange: 'all',
      date: 'all',
    });
  }, [impact, setAdvancedFilters]);

  // -- Nombre de filtres avances actifs (badge sur l'icone) --
  const activeAdvancedFilterCount = useMemo(() => {
    const values = [
      advancedFilters.city,
      advancedFilters.priceRange,
      advancedFilters.date,
    ];
    return values.filter((value) => value !== 'all').length;
  }, [advancedFilters]);

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

    // Filtre prix (depuis le store global)
    const priceRange = PRICE_RANGES.find((r) => r.id === advancedFilters.priceRange);
    if (priceRange && advancedFilters.priceRange !== 'all') {
      if (priceRange.max === null) {
        result = result.filter((e) => e.price >= priceRange.min);
      } else {
        result = result.filter((e) => e.price >= priceRange.min && e.price <= priceRange.max);
      }
    }

    // Filtre date (depuis le store global) - doit correspondre aux options du modal
    if (advancedFilters.date !== 'all') {
      const mockDateMap: Record<string, readonly string[]> = {
        today: ['1', '2', '3'] as const,
        week: ['1', '2', '3', '4', '5', '6'] as const,
        month: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'] as const,
      };
      const allowedIds = mockDateMap[advancedFilters.date];
      if (allowedIds) {
        result = result.filter((e) => allowedIds.includes(e.id));
      }
    }

    return result;
  }, [searchQuery, activeCategory, advancedFilters]);

  // -- Styles --
  const screenStyle: ViewStyle = {
    flex: 1,
    backgroundColor: 'transparent',
  };

  return (
    <ImageBackground
      source={clientBackgrounds.fallback}
      style={{ flex: 1, backgroundColor: colors.background }}
      imageStyle={StyleSheet.absoluteFillObject}
      accessibilityIgnoresInvertColors
    >
      <View style={[StyleSheet.absoluteFillObject, { backgroundColor: 'rgba(10,9,8,0.55)' }]} pointerEvents="none" />
      <View style={screenStyle}>
      {/* =============================================
          HEADER STICKY : Recherche + Toggle vue + Filtres categories
          Minimisation partielle : seul titre + toggle se replient,
          search + categories restent visibles
          ============================================= */}
      <View style={[stickyHeaderStyle, { paddingTop: insets.top + spacing.md }]}>
        {/* Image de fond banniere explore */}
        <ImageBackground
          source={clientBackgrounds.exploreHero}
          style={headerBgStyle}
          imageStyle={headerBgImageStyle}
          accessibilityIgnoresInvertColors
        />
        {/* Voile dégradé pour la lisibilité */}
        <LinearGradient
          colors={['rgba(10,9,8,0.45)', 'rgba(10,9,8,0.78)', 'rgba(10,9,8,0.96)']}
          style={headerScrimStyle}
          pointerEvents="none"
        />

        {/* Titre — se replie au scroll */}
        <Animated.View style={{ transform: [{ translateY: collapsibleTranslateY }], opacity: collapsibleOpacity, overflow: 'hidden' }}>
          <View style={titleBlockStyle}>
            <Text style={overlineStyle}>CATALOGUE COMPLET</Text>
            <Text style={titleStyle}>Explorer</Text>
            <Text style={subtitleStyle}>
              Decouvrez tous les evenements disponibles pres de chez vous
            </Text>
          </View>
        </Animated.View>

        {/* Barre de recherche active — reste visible */}
        <View style={searchContainerStyle}>
          <Search size={20} color={colors.goldMuted} strokeWidth={1.75} />
          <TextInput
            ref={searchInputRef}
            style={searchInputStyle}
            placeholder="Rechercher evenement, artiste, lieu..."
            placeholderTextColor={colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
            autoCapitalize="none"
            autoCorrect={false}
            selectionColor={colors.gold}
            cursorColor={colors.gold}
            accessibilityRole="search"
            accessibilityLabel="Rechercher un evenement"
          />
          {searchQuery.length > 0 && (
            <Pressable onPress={handleClearSearch} hitSlop={12} accessibilityLabel="Effacer">
              <X size={18} color={colors.goldMuted} strokeWidth={1.75} />
            </Pressable>
          )}
          <Pressable
            onPress={handleOpenFilters}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel="Filtres avances"
            style={styles.divider}
          >
            <View style={{ position: 'relative' }}>
              <SlidersHorizontal size={20} color={colors.goldBright} strokeWidth={1.5} />
              {activeAdvancedFilterCount > 0 && (
                <View style={filtersBadgeStyle}>
                  <Text style={filtersBadgeTextStyle}>
                    {activeAdvancedFilterCount}
                  </Text>
                </View>
              )}
            </View>
          </Pressable>
        </View>

        {/* Toggle Vue Grille / Liste + Compteur — se replie aussi */}
        <Animated.View style={{ transform: [{ translateY: collapsibleTranslateY }], opacity: collapsibleOpacity, overflow: 'hidden' }}>
          <View style={viewToggleRowStyle}>
          <View style={viewToggleGroupStyle}>
            <Pressable
              onPress={() => {
                impact('light');
                setViewMode('grid');
              }}
              style={[viewToggleButtonStyle, viewMode === 'grid' ? viewToggleActiveStyle : null]}
              accessibilityRole="button"
              accessibilityLabel="Vue grille"
              accessibilityState={{ selected: viewMode === 'grid' }}
            >
              <LayoutGrid size={17} color={viewMode === 'grid' ? colors.onyx : colors.textMuted} strokeWidth={1.75} />
            </Pressable>
            <Pressable
              onPress={() => {
                impact('light');
                setViewMode('list');
              }}
              style={[viewToggleButtonStyle, viewMode === 'list' ? viewToggleActiveStyle : null]}
              accessibilityRole="button"
              accessibilityLabel="Vue liste"
              accessibilityState={{ selected: viewMode === 'list' }}
            >
              <List size={17} color={viewMode === 'list' ? colors.onyx : colors.textMuted} strokeWidth={1.75} />
            </Pressable>
          </View>
          <Text style={resultCountStyle}>
            {filteredEvents.length} evenement{filteredEvents.length > 1 ? 's' : ''}
          </Text>
          </View>
        </Animated.View>

        {/* Chips filtres categorie — restent visibles */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={filterChipsContainerStyle}
          contentContainerStyle={{ paddingRight: spacing.lg, gap: spacing.sm }}
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
      <Animated.ScrollView
        style={screenStyle}
        contentContainerStyle={{
          paddingBottom: 120, // Espace aeré pour la TabBar
          paddingTop: spacing.md,
        }}
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: true })}
        scrollEventThrottle={16}
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
          /* Etat vide premium */
          <EmptyState
            icon={<Search size={34} color={colors.goldMuted} strokeWidth={1.5} />}
            title="Aucun evenement trouve"
            description="Essayez de modifier vos filtres ou votre recherche"
            actionLabel="Reinitialiser"
            onAction={() => {
              impact('light');
              setSearchQuery('');
              setActiveCategory('all');
              handleResetFilters();
            }}
          />
        )}

        {/* Espacement entre resultats et lieux */}
        <View style={{ height: spacing.xxl }} />

        {/* =============================================
            SECTION "LIEUX A DECOUVRIR"
            ============================================= */}
        <View style={sectionHeaderStyle}>
          <View>
            <Text style={sectionOverlineStyle}>ADRESSES D'EXCEPTION</Text>
            <Text style={sectionTitleStyle}>Lieux a decouvrir</Text>
          </View>
          <Pressable
            onPress={() => {
              impact('light');
              router.push(ROUTES.VENUES);
            }}
            hitSlop={8}
            style={seeAllPressableStyle}
            accessibilityRole="button"
            accessibilityLabel="Voir tous les lieux"
          >
            <Text style={seeAllTextStyle}>Voir tout</Text>
            <ChevronRight size={15} color={colors.gold} strokeWidth={2} />
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
      </Animated.ScrollView>
      </View>
    </ImageBackground>
  );
}

// ============================================================
// Styles - Sticky Header (hors ScrollView)
// ============================================================

const StyleAbsoluteFill: ViewStyle = {
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
};

const styles: { divider: ViewStyle } = {
  divider: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(216,180,90,0.1)',
    borderWidth: 1,
    borderColor: `${colors.gold}26`,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: spacing.xs,
  },
};

const stickyHeaderStyle: ViewStyle = {
  backgroundColor: 'transparent',
  paddingHorizontal: spacing.lg,
  paddingBottom: spacing.sm,
  borderBottomWidth: 1,
  borderBottomColor: `${colors.gold}1F`,
  borderBottomLeftRadius: radius.xxl,
  borderBottomRightRadius: radius.xxl,
  overflow: 'hidden',
  // Pas de zIndex probleme car hors du ScrollView
};

const headerBgStyle: ViewStyle = {
  ...StyleSheet.absoluteFillObject,
};

const headerBgImageStyle: ImageStyle = {
  ...StyleSheet.absoluteFillObject,
};

const headerScrimStyle: ViewStyle = {
  ...StyleSheet.absoluteFillObject,
};

const titleBlockStyle: ViewStyle = {
  marginBottom: spacing.md,
};

const overlineStyle: TextStyle = {
  fontFamily: 'Inter_600SemiBold',
  fontSize: 10,
  lineHeight: 14,
  letterSpacing: 1.4,
  color: colors.goldMuted,
  marginBottom: 3,
};

const titleStyle: TextStyle = {
  fontFamily: 'PlayfairDisplay_700Bold',
  fontSize: 30,
  lineHeight: 38,
  color: colors.text,
  letterSpacing: -0.4,
};

const subtitleStyle: TextStyle = {
  fontFamily: 'Inter_400Regular',
  fontSize: 13,
  lineHeight: 19,
  color: colors.textMuted,
  marginTop: 2,
};

const searchContainerStyle: ViewStyle = {
  flexDirection: 'row',
  alignItems: 'center',
  height: 58,
  borderRadius: radius.full,
  backgroundColor: colors.glass,
  borderWidth: 1,
  borderColor: `${colors.gold}2E`,
  paddingHorizontal: spacing.md,
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

const viewToggleRowStyle: ViewStyle = {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginTop: spacing.md,
  marginBottom: spacing.md,
};

const viewToggleGroupStyle: ViewStyle = {
  flexDirection: 'row',
  backgroundColor: colors.surfaceAlt,
  borderRadius: radius.full,
  padding: 3,
  borderWidth: 1,
  borderColor: `${colors.gold}26`,
};

const viewToggleButtonStyle: ViewStyle = {
  width: 40,
  height: 32,
  borderRadius: radius.full,
  alignItems: 'center',
  justifyContent: 'center',
};

const viewToggleActiveStyle: ViewStyle = {
  backgroundColor: colors.gold,
  shadowColor: 'rgba(216,180,90,0.45)',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.5,
  shadowRadius: 6,
  elevation: 4,
};

const resultCountStyle: TextStyle = {
  fontFamily: 'Inter_400Regular',
  fontSize: 13,
  lineHeight: 18,
  color: colors.textMuted,
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

// ============================================================
// Styles - Filtres Chips (categories superieurs)
// ============================================================

const filterChipsContainerStyle: ViewStyle = {
  paddingBottom: spacing.md,
  marginTop: spacing.xs,
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

// ============================================================
// Styles - Grille (prix overlay sur image, bouton seul)
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
  backgroundColor: colors.elevated,
  borderRadius: radius.lg,
  overflow: 'hidden',
  borderWidth: 1,
  borderColor: `${colors.gold}1F`,
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

const gridImageGradientStyle: ViewStyle = {
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
};

const gridCategoryBadgeStyle: ViewStyle = {
  position: 'absolute',
  top: spacing.xs,
  left: spacing.xs,
  backgroundColor: 'rgba(10,9,8,0.62)',
  borderRadius: radius.full,
  borderWidth: 1,
  borderColor: `${colors.gold}40`,
  paddingHorizontal: spacing.sm,
  paddingVertical: 3,
  maxWidth: GRID_CARD_WIDTH - 40,
};

const gridCategoryBadgeTextStyle: TextStyle = {
  fontFamily: 'Inter_600SemiBold',
  fontSize: 10,
  lineHeight: 14,
  color: colors.goldBright,
  letterSpacing: 0.3,
};

const gridFeaturedBadgeStyle: ViewStyle = {
  position: 'absolute',
  top: spacing.xs,
  right: spacing.xs,
  flexDirection: 'row',
  alignItems: 'center',
  backgroundColor: colors.gold,
  borderRadius: radius.full,
  paddingHorizontal: spacing.sm,
  paddingVertical: 3,
  gap: 3,
};

const gridFeaturedBadgeTextStyle: TextStyle = {
  fontFamily: 'Inter_700Bold',
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
  backgroundColor: 'rgba(26,22,16,0.75)',
  borderRadius: radius.full,
  borderWidth: 1,
  borderColor: `${colors.gold}40`,
  paddingHorizontal: spacing.sm,
  paddingVertical: 3,
};

const gridPriceOverlayTextStyle: TextStyle = {
  fontFamily: 'Inter_700Bold',
  fontSize: 12,
  lineHeight: 16,
  color: colors.goldBright,
  letterSpacing: 0.2,
};

const gridContentStyle: ViewStyle = {
  padding: spacing.sm,
};

const gridTitleStyle: TextStyle = {
  fontFamily: 'PlayfairDisplay_600SemiBold',
  fontSize: 14,
  lineHeight: 19,
  color: colors.text,
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
  fontFamily: 'Inter_400Regular',
  fontSize: 11,
  lineHeight: 15,
  color: colors.textMuted,
};

// Bouton Reserver seul (pas de row avec prix - prix est sur l'image)
const gridReserveButtonStyle: ViewStyle = {
  borderRadius: radius.full,
  overflow: 'hidden',
  marginTop: spacing.sm,
  shadowColor: 'rgba(216,180,90,0.4)',
  shadowOffset: { width: 0, height: 3 },
  shadowOpacity: 0.45,
  shadowRadius: 6,
  elevation: 4,
};

const gridReserveInnerStyle: ViewStyle = {
  paddingHorizontal: spacing.sm,
  paddingVertical: spacing.xs + 2,
  alignItems: 'center',
  justifyContent: 'center',
};

const gridReserveTextStyle: TextStyle = {
  fontFamily: 'Inter_700Bold',
  fontSize: 12,
  lineHeight: 16,
  color: colors.onyx,
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
  backgroundColor: colors.elevated,
  borderRadius: radius.lg,
  overflow: 'hidden',
  borderWidth: 1,
  borderColor: `${colors.gold}1F`,
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
  backgroundColor: 'rgba(10,9,8,0.62)',
  borderRadius: radius.full,
  borderWidth: 1,
  borderColor: `${colors.gold}40`,
  paddingHorizontal: spacing.sm,
  paddingVertical: 3,
  maxWidth: LIST_IMAGE_HEIGHT - 12,
};

const listCategoryBadgeTextStyle: TextStyle = {
  fontFamily: 'Inter_600SemiBold',
  fontSize: 10,
  lineHeight: 14,
  color: colors.goldBright,
};

const listContentStyle: ViewStyle = {
  flex: 1,
  padding: spacing.sm,
};

const listTitleStyle: TextStyle = {
  fontFamily: 'PlayfairDisplay_600SemiBold',
  fontSize: 15,
  lineHeight: 20,
  color: colors.text,
  letterSpacing: -0.2,
  marginBottom: spacing.xs,
};

const listInfoRowStyle: ViewStyle = {
  flexDirection: 'row',
  alignItems: 'center',
  gap: 5,
  marginBottom: 2,
};

const listInfoTextStyle: TextStyle = {
  fontFamily: 'Inter_400Regular',
  fontSize: 12,
  lineHeight: 16,
  color: colors.textMuted,
};

const listInfoDotStyle: ViewStyle = {
  width: 3,
  height: 3,
  borderRadius: 1.5,
  backgroundColor: colors.textFaint,
  marginHorizontal: 2,
};

const listFooterStyle: ViewStyle = {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginTop: spacing.sm,
};

const listPriceStyle: TextStyle = {
  fontFamily: 'Inter_700Bold',
  fontSize: 14,
  lineHeight: 20,
  color: colors.goldBright,
};

const listReserveButtonStyle: ViewStyle = {
  borderRadius: radius.full,
  overflow: 'hidden',
  shadowColor: 'rgba(216,180,90,0.4)',
  shadowOffset: { width: 0, height: 3 },
  shadowOpacity: 0.45,
  shadowRadius: 6,
  elevation: 4,
};

const listReserveInnerStyle: ViewStyle = {
  paddingHorizontal: spacing.md,
  paddingVertical: 6,
  alignItems: 'center',
  justifyContent: 'center',
};

const listReserveTextStyle: TextStyle = {
  fontFamily: 'Inter_700Bold',
  fontSize: 12,
  lineHeight: 16,
  color: colors.onyx,
};

// ============================================================
// Styles - Section header + Lieux
// ============================================================

const sectionHeaderStyle: ViewStyle = {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'flex-end',
  paddingHorizontal: spacing.lg,
  marginBottom: spacing.md,
};

const sectionOverlineStyle: TextStyle = {
  fontFamily: 'Inter_600SemiBold',
  fontSize: 10,
  lineHeight: 14,
  letterSpacing: 1.4,
  color: colors.goldMuted,
  marginBottom: 3,
};

const sectionTitleStyle: TextStyle = {
  fontFamily: 'PlayfairDisplay_700Bold',
  fontSize: 22,
  lineHeight: 30,
  letterSpacing: -0.3,
  color: colors.text,
};

const seeAllPressableStyle: ViewStyle = {
  flexDirection: 'row',
  alignItems: 'center',
  gap: 2,
  paddingVertical: spacing.xs,
};

const seeAllTextStyle: TextStyle = {
  fontFamily: 'Inter_600SemiBold',
  fontSize: 12,
  lineHeight: 16,
  color: colors.goldBright,
  letterSpacing: 0.3,
};

const venuesScrollContainerStyle: ViewStyle = {
  marginHorizontal: spacing.lg,
  paddingBottom: spacing.xl,
  flexGrow: 0,
};