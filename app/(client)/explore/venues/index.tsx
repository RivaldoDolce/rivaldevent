import { memo, useCallback, useState, useMemo, useEffect } from 'react';
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
import { FlashList } from '@shopify/flash-list';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ChevronLeft,
  SlidersHorizontal,
  Search,
  X,
  MapPin,
  Star,
  LayoutGrid,
  List,
} from 'lucide-react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';

import { colors, spacing, radius, shadows, ROUTES } from '@/lib/constants';
import { useHaptics } from '@/hooks/useHaptics';
import { EmptyState } from '@/components/ui/EmptyState';
import { VoirPlusButton } from '@/components/ui/VoirPlusButton';

import type { MockVenue } from '@/data/mock';
import { MOCK_VENUES, VENUE_CATEGORIES } from '@/data/mock';

import { useExploreStore } from '@/stores/explore-store';
import { ScreenBackground } from '@/components/ui/ScreenBackground';

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

interface VenueGridCardProps {
  readonly venue: MockVenue;
  readonly onPress: () => void;
}

const VenueGridCard = memo(function VenueGridCard({ venue, onPress }: VenueGridCardProps) {
  const { impact } = useHaptics();
  const handlePress = useCallback(() => {
    impact('light');
    onPress();
  }, [impact, onPress]);
  return (
    <Pressable onPress={handlePress} accessibilityRole="button" accessibilityLabel={`Lieu: ${venue.name}`} style={{ flex: 1 }}>
      <View style={cardStyle}>
        <View style={imageContainerStyle}>
          <Image source={{ uri: venue.image }} style={imageStyle} contentFit="cover" transition={100} cachePolicy="memory-disk" recyclingKey={venue.id} priority="low" />
          <LinearGradient colors={['rgba(10,9,8,0.02)', 'rgba(10,9,8,0.5)']} style={imageGradientStyle} pointerEvents="none" />
          {venue.badge && (
            <View style={badgeContainerStyle}>
              <Text style={badgeTextStyle} numberOfLines={1}>{venue.badge}</Text>
            </View>
          )}
          {venue.rating > 0 && (
            <View style={ratingPillStyle}>
              <Star size={11} color={colors.goldBright} fill={colors.gold} strokeWidth={1.5} />
              <Text style={ratingTextStyle}>{venue.rating.toFixed(1)} / 5</Text>
            </View>
          )}
        </View>
        <View style={contentStyle}>
          <Text style={nameStyle} numberOfLines={1} ellipsizeMode="tail">{venue.name}</Text>
          <View style={locationRowStyle}>
            <MapPin size={13} color={colors.goldMuted} strokeWidth={1.5} />
            <Text style={locationTextStyle} numberOfLines={1} ellipsizeMode="tail">{venue.location}</Text>
          </View>
        </View>
      </View>
    </Pressable>
  );
});

interface VenueListCardProps {
  readonly venue: MockVenue;
  readonly onPress: () => void;
}

const VenueListCard = memo(function VenueListCard({ venue, onPress }: VenueListCardProps) {
  const { impact } = useHaptics();
  const handlePress = useCallback(() => {
    impact('light');
    onPress();
  }, [impact, onPress]);
  return (
    <Pressable onPress={handlePress} style={listCardStyle} accessibilityRole="button" accessibilityLabel={`Lieu: ${venue.name}`}>
      <View style={listImageContainerStyle}>
        <Image source={{ uri: venue.image }} style={listImageStyle} contentFit="cover" transition={100} cachePolicy="memory-disk" recyclingKey={venue.id} priority="low" />
        <LinearGradient colors={['rgba(10,9,8,0.02)', 'rgba(10,9,8,0.5)']} style={imageGradientStyle} pointerEvents="none" />
        {venue.badge && (
          <View style={listBadgeStyle}>
            <Text style={badgeTextStyle} numberOfLines={1}>{venue.badge}</Text>
          </View>
        )}
      </View>
      <View style={listContentStyle}>
        <Text style={listNameStyle} numberOfLines={1}>{venue.name}</Text>
        <View style={locationRowStyle}>
          <MapPin size={12} color={colors.goldMuted} strokeWidth={1.5} />
          <Text style={listLocationTextStyle} numberOfLines={1}>{venue.location}</Text>
        </View>
        <View style={listFooterRowStyle}>
          {venue.capacity_max ? <Text style={listMetaStyle}>{venue.capacity_max} places</Text> : null}
          {venue.rating > 0 && (
            <View style={listRatingPillStyle}>
              <Star size={10} color={colors.goldBright} fill={colors.gold} strokeWidth={1.5} />
              <Text style={listRatingTextStyle}>{venue.rating.toFixed(1)}</Text>
            </View>
          )}
        </View>
      </View>
    </Pressable>
  );
});

const FLASH_VENUE_ITEM_WRAPPER: ViewStyle = { flex: 1, paddingHorizontal: spacing.md / 2 };
type ViewMode = 'grid' | 'list';

export default function VenuesScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { impact } = useHaptics();
  const { venueFilters, setVenueFilters } = useExploreStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [activeCategory, setActiveCategory] = useState('all');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [visibleCount, setVisibleCount] = useState(20);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearchQuery(searchQuery), 250);
    return () => clearTimeout(t);
  }, [searchQuery]);

  const handleBack = useCallback(() => {
    impact('light');
    if (router.canGoBack()) router.back();
    else router.replace(ROUTES.EXPLORE);
  }, [impact, router]);

  const handleCategoryPress = useCallback((categoryId: string) => {
    impact('light');
    setActiveCategory(categoryId);
  }, [impact]);

  const handleVenuePress = useCallback((venueId: string) => {
    router.push({ pathname: ROUTES.VENUE_DETAIL, params: { id: venueId } });
  }, [router]);

  const handleClearSearch = useCallback(() => {
    impact('light');
    setSearchQuery('');
  }, [impact]);

  const handleFilterPress = useCallback(() => {
    impact('light');
    router.push('/(modal)/venue-filters');
  }, [impact, router]);

  const handleResetAll = useCallback(() => {
    impact('light');
    setSearchQuery('');
    setActiveCategory('all');
    setVenueFilters({ city: 'all', capacityRange: 'all', eventType: 'all', pricePerDayRange: 'all', prestige: 'all' });
  }, [impact, setVenueFilters]);

  const activeVenueFilterCount = useMemo(() => {
    const values = [venueFilters.city, venueFilters.capacityRange, venueFilters.eventType, venueFilters.pricePerDayRange, venueFilters.prestige];
    return values.filter((value) => value !== 'all').length;
  }, [venueFilters]);

  const filteredVenues = useMemo(() => {
    let result = MOCK_VENUES;
    if (activeCategory !== 'all') result = result.filter((v) => v.category === activeCategory);
    if (venueFilters.city !== 'all') result = result.filter((v) => v.location.includes(venueFilters.city));
    if (venueFilters.capacityRange !== 'all') result = result.filter((v) => matchesCapacity(v.capacity_max, venueFilters.capacityRange));
    if (venueFilters.eventType !== 'all') result = result.filter((v) => v.event_types.includes(venueFilters.eventType));
    if (venueFilters.pricePerDayRange !== 'all') result = result.filter((v) => matchesPricePerDay(v.price_per_day, venueFilters.pricePerDayRange));
    if (venueFilters.prestige !== 'all') result = result.filter((v) => v.badge === venueFilters.prestige);
    if (debouncedSearchQuery.trim().length > 0) {
      const query = debouncedSearchQuery.toLowerCase().trim();
      result = result.filter((v) => v.name.toLowerCase().includes(query) || v.location.toLowerCase().includes(query));
    }
    return result;
  }, [activeCategory, venueFilters, debouncedSearchQuery]);

  useEffect(() => { setVisibleCount(20); }, [activeCategory, venueFilters, debouncedSearchQuery]);
  const displayVenues = useMemo(() => filteredVenues.slice(0, visibleCount), [filteredVenues, visibleCount]);

  const keyExtractorVenues = useCallback((item: MockVenue) => item.id, []);
  const handleEndReachedVenues = useCallback(() => {
    if (displayVenues.length < filteredVenues.length) setVisibleCount((c) => Math.min(c + 20, filteredVenues.length));
  }, [displayVenues.length, filteredVenues.length]);

  const renderVenueGridItem = useCallback(({ item }: { item: MockVenue }) => (
    <View style={FLASH_VENUE_ITEM_WRAPPER}>
      <VenueGridCard venue={item} onPress={() => handleVenuePress(item.id)} />
    </View>
  ), [handleVenuePress]);
  const renderVenueListItem = useCallback(({ item }: { item: MockVenue }) => (
    <View style={{ paddingHorizontal: spacing.lg, paddingBottom: spacing.md }}>
      <VenueListCard venue={item} onPress={() => handleVenuePress(item.id)} />
    </View>
  ), [handleVenuePress]);

  const renderVenuesHeader = useCallback(() => (
    <View>
      <View style={[headerStyle, { paddingTop: insets.top }]}>
        <Pressable onPress={handleBack} style={glassPillStyle} hitSlop={12} accessibilityRole="button" accessibilityLabel="Retour">
          <ChevronLeft size={22} color={colors.goldBright} strokeWidth={1.75} />
        </Pressable>
        <View style={titleBlockStyle}>
          <Text style={overlineStyle}>ADRESSES D'EXCEPTION</Text>
          <Text style={headerTitleStyle}>Lieux</Text>
        </View>
        <Pressable onPress={handleFilterPress} style={glassPillStyle} hitSlop={12} accessibilityRole="button" accessibilityLabel="Filtres">
          <View style={{ position: 'relative' }}>
            <SlidersHorizontal size={20} color={colors.goldBright} strokeWidth={1.5} />
            {activeVenueFilterCount > 0 && (<View style={filtersBadgeStyle}><Text style={filtersBadgeTextStyle}>{activeVenueFilterCount}</Text></View>)}
          </View>
        </Pressable>
      </View>
      <View style={[searchContainerStyle, { borderColor: isSearchFocused ? `${colors.gold}66` : `${colors.gold}2E` }]}>
        <Search size={20} color={colors.goldMuted} strokeWidth={1.75} />
        <TextInput style={searchInputStyle} value={searchQuery} onChangeText={setSearchQuery} onFocus={() => setIsSearchFocused(true)} onBlur={() => setIsSearchFocused(false)} placeholder="Rechercher un lieu..." placeholderTextColor="rgba(245,240,230,0.58)" returnKeyType="search" selectionColor={colors.gold} cursorColor={colors.gold} accessibilityLabel="Rechercher un lieu" />
        {searchQuery.length > 0 && (<Pressable onPress={handleClearSearch} hitSlop={12} accessibilityRole="button" accessibilityLabel="Effacer"><X size={18} color={colors.goldMuted} strokeWidth={1.75} /></Pressable>)}
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={categoryChipsContainerStyle} contentContainerStyle={{ paddingRight: spacing.lg, gap: spacing.sm }}>
        {VENUE_CATEGORIES.map((cat) => {
          const isActive = activeCategory === cat.id;
          return (<Pressable key={cat.id} onPress={() => handleCategoryPress(cat.id)} style={isActive ? chipActiveStyle : chipInactiveStyle} accessibilityRole="button" accessibilityState={{ selected: isActive }}><Text style={isActive ? chipActiveTextStyle : chipInactiveTextStyle}>{cat.label}</Text></Pressable>);
        })}
      </ScrollView>
      <View style={viewToggleRowStyle}>
        <View style={viewToggleGroupStyle}>
          <Pressable onPress={() => { impact('light'); setViewMode('grid'); }} style={[viewToggleButtonStyle, viewMode === 'grid' ? viewToggleActiveStyle : null]} accessibilityRole="button" accessibilityLabel="Vue grille"><LayoutGrid size={16} color={viewMode === 'grid' ? colors.onyx : colors.textMuted} strokeWidth={1.75} /></Pressable>
          <Pressable onPress={() => { impact('light'); setViewMode('list'); }} style={[viewToggleButtonStyle, viewMode === 'list' ? viewToggleActiveStyle : null]} accessibilityRole="button" accessibilityLabel="Vue liste"><List size={16} color={viewMode === 'list' ? colors.onyx : colors.textMuted} strokeWidth={1.75} /></Pressable>
        </View>
        <Text style={resultsInfoStyle}>{filteredVenues.length} lieu{filteredVenues.length > 1 ? 'x' : ''} trouvé{filteredVenues.length > 1 ? 's' : ''}</Text>
      </View>
    </View>
  ), [insets.top, handleBack, handleFilterPress, activeVenueFilterCount, isSearchFocused, searchQuery, handleClearSearch, activeCategory, handleCategoryPress, viewMode, filteredVenues.length, impact]);

  const renderVenuesEmpty = useCallback(() => (
    <View style={{ paddingHorizontal: spacing.lg }}>
      <EmptyState icon={<Search size={34} color={colors.goldMuted} strokeWidth={1.5} />} title="Aucun lieu trouvé" description="Essayez une autre catégorie, une autre ville ou modifiez vos filtres." actionLabel="Réinitialiser" onAction={handleResetAll} />
    </View>
  ), [handleResetAll]);

  const renderVenuesFooter = useCallback(() => (
    <View>
      {displayVenues.length < filteredVenues.length && filteredVenues.length > 0 ? (
        <View style={{ marginTop: spacing.lg }}><VoirPlusButton remaining={filteredVenues.length - displayVenues.length} onPress={() => setVisibleCount((c) => c + 20)} /></View>
      ) : null}
      <View style={{ height: spacing.xxl }} />
    </View>
  ), [displayVenues.length, filteredVenues.length]);

  return (
    <ScreenBackground><View style={[screenStyle, { backgroundColor: 'transparent', flex: 1 }]}>
      {viewMode === 'grid' ? (
        <FlashList key="venues-grid" data={displayVenues} keyExtractor={keyExtractorVenues} renderItem={renderVenueGridItem} numColumns={2} extraData={viewMode} ListHeaderComponent={renderVenuesHeader} ListEmptyComponent={renderVenuesEmpty} ListFooterComponent={renderVenuesFooter} contentContainerStyle={{ paddingBottom: 100, paddingHorizontal: spacing.lg - spacing.md / 2 }} showsVerticalScrollIndicator={false} onEndReached={handleEndReachedVenues} onEndReachedThreshold={0.5} />
      ) : (
        <FlashList key="venues-list" data={displayVenues} keyExtractor={keyExtractorVenues} renderItem={renderVenueListItem} numColumns={1} extraData={viewMode} ListHeaderComponent={renderVenuesHeader} ListEmptyComponent={renderVenuesEmpty} ListFooterComponent={renderVenuesFooter} contentContainerStyle={{ paddingBottom: 100 }} showsVerticalScrollIndicator={false} onEndReached={handleEndReachedVenues} onEndReachedThreshold={0.5} />
      )}
    </View></ScreenBackground>
  );
}

const screenStyle: ViewStyle = { flex: 1, backgroundColor: 'transparent' };
const headerStyle: ViewStyle = { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing.lg, marginBottom: spacing.md };
const glassPillStyle: ViewStyle = { width: 44, height: 44, borderRadius: radius.full, backgroundColor: 'rgba(10,9,8,0.62)', borderWidth: 1, borderColor: `${colors.gold}40`, justifyContent: 'center', alignItems: 'center', ...shadows.card };
const titleBlockStyle: ViewStyle = { flex: 1, alignItems: 'center', marginHorizontal: spacing.sm };
const overlineStyle: TextStyle = { fontFamily: 'Inter_600SemiBold', fontSize: 10, lineHeight: 14, letterSpacing: 1.4, color: colors.goldMuted, marginBottom: 2 };
const headerTitleStyle: TextStyle = { fontFamily: 'PlayfairDisplay_700Bold', fontSize: 24, lineHeight: 32, color: colors.text, letterSpacing: -0.3 };
const filtersBadgeStyle: ViewStyle = { position: 'absolute', top: -6, right: -8, minWidth: 18, height: 18, borderRadius: 9, backgroundColor: colors.gold, justifyContent: 'center', alignItems: 'center', paddingHorizontal: spacing.xs, borderWidth: 1.5, borderColor: colors.background };
const filtersBadgeTextStyle: TextStyle = { fontFamily: 'Inter_700Bold', fontSize: 10, lineHeight: 12, color: colors.onyx };
const searchContainerStyle: ViewStyle = { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.glass, borderRadius: radius.full, marginHorizontal: spacing.lg, marginBottom: spacing.md, paddingHorizontal: spacing.md, height: 52, borderWidth: 1, gap: spacing.sm, ...shadows.search };
const searchInputStyle: TextStyle = { fontFamily: 'Inter_400Regular', fontSize: 15, lineHeight: 20, color: colors.text, flex: 1, marginLeft: spacing.xs, paddingVertical: 0 };
const categoryChipsContainerStyle: ViewStyle = { paddingLeft: spacing.lg, paddingBottom: spacing.md, flexGrow: 0 };
const chipActiveStyle: ViewStyle = { backgroundColor: colors.gold, borderRadius: radius.full, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderWidth: 1, borderColor: `${colors.goldBright}66`, shadowColor: 'rgba(216,180,90,0.45)', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.5, shadowRadius: 8, elevation: 4 };
const chipInactiveStyle: ViewStyle = { backgroundColor: colors.glass, borderRadius: radius.full, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderWidth: 1, borderColor: `${colors.gold}26` };
const chipActiveTextStyle: TextStyle = { fontFamily: 'Inter_600SemiBold', fontSize: 14, lineHeight: 20, color: colors.onyx, letterSpacing: 0.2 };
const chipInactiveTextStyle: TextStyle = { fontFamily: 'Inter_500Medium', fontSize: 14, lineHeight: 20, color: colors.textSecondary, letterSpacing: 0.1 };
const resultsInfoStyle: TextStyle = { fontFamily: 'Inter_500Medium', fontSize: 13, lineHeight: 18, color: colors.textMuted, paddingHorizontal: spacing.lg, marginBottom: spacing.xs, letterSpacing: 0.2 };
const viewToggleRowStyle: ViewStyle = { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing.lg, marginBottom: spacing.md };
const viewToggleGroupStyle: ViewStyle = { flexDirection: 'row', backgroundColor: colors.surfaceAlt, borderRadius: radius.full, padding: 3, borderWidth: 1, borderColor: `${colors.gold}26` };
const viewToggleButtonStyle: ViewStyle = { width: 40, height: 32, borderRadius: radius.full, alignItems: 'center', justifyContent: 'center' };
const viewToggleActiveStyle: ViewStyle = { backgroundColor: colors.gold, shadowColor: 'rgba(216,180,90,0.45)', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.5, shadowRadius: 6, elevation: 4 };
const cardStyle: ViewStyle = { backgroundColor: colors.elevated, borderRadius: radius.lg, overflow: 'hidden', borderWidth: 1, borderColor: `${colors.gold}1F`, ...shadows.card };
const imageContainerStyle: ViewStyle = { height: 140, position: 'relative' };
const imageStyle: ImageStyle = { width: '100%', height: 140 };
const imageGradientStyle: ViewStyle = { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 };
const badgeContainerStyle: ViewStyle = { position: 'absolute', top: spacing.sm, left: spacing.sm, maxWidth: 130, backgroundColor: 'rgba(10,9,8,0.62)', borderRadius: radius.full, borderWidth: 1, borderColor: `${colors.gold}40`, paddingHorizontal: spacing.sm + 2, paddingVertical: 4 };
const badgeTextStyle: TextStyle = { fontFamily: 'Inter_600SemiBold', fontSize: 11, lineHeight: 15, color: colors.goldBright, letterSpacing: 0.5 };
const ratingPillStyle: ViewStyle = { position: 'absolute', bottom: spacing.sm, right: spacing.sm, flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(10,9,8,0.62)', borderRadius: radius.full, borderWidth: 1, borderColor: `${colors.gold}40`, paddingHorizontal: spacing.sm, paddingVertical: 3 };
const ratingTextStyle: TextStyle = { fontFamily: 'Inter_600SemiBold', fontSize: 11, lineHeight: 14, color: colors.goldBright };
const contentStyle: ViewStyle = { padding: spacing.md };
const nameStyle: TextStyle = { fontFamily: 'PlayfairDisplay_600SemiBold', fontSize: 16, lineHeight: 22, color: colors.text, letterSpacing: -0.2, marginBottom: spacing.xs };
const locationRowStyle: ViewStyle = { flexDirection: 'row', alignItems: 'center', gap: 5 };
const locationTextStyle: TextStyle = { flex: 1, fontFamily: 'Inter_400Regular', fontSize: 12, lineHeight: 17, color: colors.textSecondary };
const listCardStyle: ViewStyle = { flexDirection: 'row', backgroundColor: colors.elevated, borderRadius: radius.lg, overflow: 'hidden', borderWidth: 1, borderColor: `${colors.gold}1F`, ...shadows.card };
const listImageContainerStyle: ViewStyle = { width: 110, height: 110, position: 'relative' };
const listImageStyle: ImageStyle = { width: 110, height: 110 };
const listBadgeStyle: ViewStyle = { position: 'absolute', top: spacing.xs, left: spacing.xs, maxWidth: 90, backgroundColor: 'rgba(10,9,8,0.62)', borderRadius: radius.full, borderWidth: 1, borderColor: `${colors.gold}40`, paddingHorizontal: spacing.sm, paddingVertical: 3 };
const listContentStyle: ViewStyle = { flex: 1, padding: spacing.md, justifyContent: 'center' };
const listNameStyle: TextStyle = { fontFamily: 'PlayfairDisplay_600SemiBold', fontSize: 15, lineHeight: 20, color: colors.text, marginBottom: 4 };
const listLocationTextStyle: TextStyle = { flex: 1, fontFamily: 'Inter_400Regular', fontSize: 12, lineHeight: 16, color: colors.textSecondary };
const listFooterRowStyle: ViewStyle = { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: spacing.sm };
const listMetaStyle: TextStyle = { fontFamily: 'Inter_500Medium', fontSize: 12, lineHeight: 16, color: colors.textMuted };
const listRatingPillStyle: ViewStyle = { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: 'rgba(10,9,8,0.45)', borderRadius: radius.full, borderWidth: 1, borderColor: `${colors.gold}26`, paddingHorizontal: spacing.sm, paddingVertical: 3 };
const listRatingTextStyle: TextStyle = { fontFamily: 'Inter_600SemiBold', fontSize: 11, lineHeight: 14, color: colors.goldBright };
