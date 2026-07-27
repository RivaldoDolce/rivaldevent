/**
 * Ecran Explore - Recherche et decouverte d'evenements et lieux.
 *
 * Structure (de haut en bas, dans un ScrollView) :
 * 1. Header : Titre "Explorer" (PlayfairDisplay-Bold) + Bouton filtres (SlidersHorizontal)
 * 2. Barre de recherche : Search icon + placeholder + champ editable
 * 3. Categories : chips horizontaux scrollables (meme que home)
 * 4. Resultats evenements : cartes verticales filtrees par search + category
 * 5. Section "Lieux populaires" : cartes horizontales VenueCard
 *
 * Design "Minimalisme Africain Camerounais" :
 * - Fond sand (#F7F4ED)
 * - Cartes blanches, ombre subtile, radius 16px
 * - CTA terracotta, texte blanc
 * - Hierarchie violente (1 seul point focal par section)
 * - Alternance aere/dense
 *
 * Conventions :
 * - expo-image pour les images
 * - lucide-react-native pour les icones
 * - Animated natif (pas reanimated)
 * - Pas de type any, pas d'emojis
 * - Imports @/
 * - Design tokens depuis lib/constants.ts
 * - Commentaires en francais
 *
 * Donnees : mock importees depuis @/data/mock en attendant TanStack Query.
 */

import { useCallback, useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  type ViewStyle,
  type TextStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Search, SlidersHorizontal, X } from 'lucide-react-native';
import { useRouter } from 'expo-router';

import { colors, spacing, radii, shadows, ROUTES } from '@/lib/constants';
import { useHaptics } from '@/hooks/useHaptics';
import { EventCard } from '@/components/events/EventCard';
import { VenueCard } from '@/components/venues/VenueCard';

// Donnees mock
import { CATEGORIES, MOCK_EVENTS, MOCK_VENUES } from '@/data/mock';

// ============================================================
// Ecran principal
// ============================================================

export default function ExploreScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { impact } = useHaptics();

  // -- State --
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  // -- Handlers --
  const handleCategoryPress = useCallback((categoryId: string) => {
    impact('light');
    setActiveCategory(categoryId);
  }, [impact]);

  const handleEventPress = useCallback((eventId: string) => {
    router.push(`/(client)/home/${eventId}`);
  }, [router]);

  const handleReserve = useCallback((eventId: string) => {
    router.push(`/(purchase)/event/${eventId}/tickets`);
  }, [router]);

  const handleVenuePress = useCallback((venueId: string) => {
    router.push(`/(client)/explore/venues/${venueId}`);
  }, [router]);

  const handleFilterPress = useCallback(() => {
    impact('light');
    router.push(ROUTES.FILTERS);
  }, [impact, router]);

  const handleClearSearch = useCallback(() => {
    impact('light');
    setSearchQuery('');
  }, [impact]);

  // -- Filtrer les evenements par category + recherche --
  const filteredEvents = useMemo(() => {
    let result = MOCK_EVENTS;

    // Filtre par category
    if (activeCategory !== 'all') {
      result = result.filter((e) => e.category === activeCategory);
    }

    // Filtre par recherche (titre, lieu, organisateur)
    if (searchQuery.trim().length > 0) {
      const query = searchQuery.toLowerCase().trim();
      result = result.filter((e) =>
        e.title.toLowerCase().includes(query)
        || e.location.toLowerCase().includes(query)
        || e.organizerName.toLowerCase().includes(query)
        || e.category.toLowerCase().includes(query)
      );
    }

    return result;
  }, [activeCategory, searchQuery]);

  // -- Styles --
  const screenStyle: ViewStyle = {
    flex: 1,
    backgroundColor: colors.sand,
  };

  const scrollContentStyle: ViewStyle = {
    paddingTop: insets.top,
    paddingBottom: 100, // Espace pour la TabBar
  };

  const headerStyle: ViewStyle = {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  };

  const headerTitleStyle: TextStyle = {
    fontFamily: 'PlayfairDisplay-Bold',
    fontSize: 28,
    lineHeight: 36,
    color: colors.onyx,
    letterSpacing: -0.5,
  };

  const searchContainerStyle: ViewStyle = {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: radii.xl,
    marginHorizontal: spacing.lg,
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
    paddingHorizontal: spacing.md,
    height: 48,
    borderWidth: isSearchFocused ? 2 : 1,
    borderColor: isSearchFocused ? colors.terracotta : colors.border,
    ...shadows.search,
  };

  const searchInputStyle: TextStyle = {
    fontFamily: 'Inter-Regular',
    fontSize: 15,
    lineHeight: 20,
    color: colors.text,
    flex: 1,
    marginLeft: spacing.sm,
  };

  const categoriesContainerStyle: ViewStyle = {
    paddingLeft: spacing.lg,
    paddingRight: spacing.sm,
    paddingBottom: spacing.lg,
  };

  const categoryChipActiveStyle: ViewStyle = {
    backgroundColor: colors.terracotta,
    borderRadius: radii.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginRight: spacing.sm,
  };

  const categoryChipInactiveStyle: ViewStyle = {
    backgroundColor: colors.ivory,
    borderRadius: radii.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginRight: spacing.sm,
    borderWidth: 1,
    borderColor: `${colors.stone}30`,
  };

  const categoryChipActiveTextStyle: TextStyle = {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    lineHeight: 20,
    color: colors.white,
    letterSpacing: 0.3,
  };

  const categoryChipInactiveTextStyle: TextStyle = {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    lineHeight: 20,
    color: colors.onyx,
    letterSpacing: 0.2,
  };

  const sectionHeaderStyle: ViewStyle = {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
    marginTop: spacing.xs,
  };

  const sectionTitleStyle: TextStyle = {
    fontFamily: 'PlayfairDisplay-Bold',
    fontSize: 20,
    lineHeight: 26,
    letterSpacing: -0.3,
    color: colors.onyx,
  };

  const resultsInfoStyle: TextStyle = {
    fontFamily: 'Inter-Medium',
    fontSize: 13,
    lineHeight: 18,
    color: colors.stone,
  };

  const eventsContainerStyle: ViewStyle = {
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  };

  const emptyContainerStyle: ViewStyle = {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xxl,
    alignItems: 'center',
  };

  const emptyTitleStyle: TextStyle = {
    fontFamily: 'PlayfairDisplay-SemiBold',
    fontSize: 18,
    lineHeight: 24,
    color: colors.onyx,
    marginBottom: spacing.sm,
  };

  const emptyTextStyle: TextStyle = {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    lineHeight: 20,
    color: colors.stone,
    textAlign: 'center',
  };

  const venuesScrollContainerStyle: ViewStyle = {
    paddingLeft: spacing.lg,
    paddingRight: spacing.sm,
    paddingBottom: spacing.xl,
  };

  const sectionSpacingStyle: ViewStyle = {
    height: spacing.lg,
  };

  return (
    <View style={screenStyle}>
      <ScrollView
        style={screenStyle}
        contentContainerStyle={scrollContentStyle}
        showsVerticalScrollIndicator={false}
      >
        {/* ============================================
            1. HEADER : Titre + Bouton filtres
            ============================================ */}
        <View style={headerStyle}>
          <Text style={headerTitleStyle}>Explorer</Text>
          <Pressable
            onPress={handleFilterPress}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel="Ouvrir les filtres"
          >
            <SlidersHorizontal size={22} color={colors.terracotta} strokeWidth={1.5} />
          </Pressable>
        </View>

        {/* ============================================
            2. BARRE DE RECHERCHE
            ============================================ */}
        <View style={searchContainerStyle}>
          <Search size={20} color={isSearchFocused ? colors.terracotta : colors.muted} strokeWidth={1.5} />
          <TextInput
            style={searchInputStyle}
            value={searchQuery}
            onChangeText={setSearchQuery}
            onFocus={() => setIsSearchFocused(true)}
            onBlur={() => setIsSearchFocused(false)}
            placeholder="Rechercher un evenement, artiste, lieu..."
            placeholderTextColor={colors.muted}
            returnKeyType="search"
            accessibilityLabel="Rechercher"
          />
          {searchQuery.length > 0 && (
            <Pressable
              onPress={handleClearSearch}
              hitSlop={12}
              accessibilityRole="button"
              accessibilityLabel="Effacer la recherche"
            >
              <X size={18} color={colors.stone} strokeWidth={2} />
            </Pressable>
          )}
        </View>

        {/* ============================================
            3. CATEGORIES (chips horizontaux)
            ============================================ */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={categoriesContainerStyle}
          contentContainerStyle={{ paddingRight: spacing.lg }}
        >
          {CATEGORIES.map((cat) => {
            const isActive = activeCategory === cat.id;
            return (
              <Pressable
                key={cat.id}
                onPress={() => handleCategoryPress(cat.id)}
                style={isActive ? categoryChipActiveStyle : categoryChipInactiveStyle}
                accessibilityRole="button"
                accessibilityState={{ selected: isActive }}
              >
                <Text style={isActive ? categoryChipActiveTextStyle : categoryChipInactiveTextStyle}>
                  {cat.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* ============================================
            4. RESULTATS EVENEMENTS
            ============================================ */}
        <View style={sectionHeaderStyle}>
          <Text style={sectionTitleStyle}>Evenements</Text>
          <Text style={resultsInfoStyle}>
            {filteredEvents.length} resultat{filteredEvents.length > 1 ? 's' : filteredEvents.length === 0 ? '' : ''}
          </Text>
        </View>

        {filteredEvents.length > 0 ? (
          <View style={eventsContainerStyle}>
            {filteredEvents.map((event) => (
              <EventCard
                key={event.id}
                id={event.id}
                title={event.title}
                image={event.image}
                date={event.date}
                location={event.location}
                time={event.time}
                organizerName={event.organizerName}
                organizerAvatar={event.organizerAvatar}
                price={event.price}
                currency={event.currency}
                category={event.category}
                isFeatured={event.isFeatured}
                onPress={() => handleEventPress(event.id)}
                onReserve={() => handleReserve(event.id)}
                onToggleFavorite={() => {
                  // TODO: brancher la logique favoris avec TanStack Query
                }}
              />
            ))}
          </View>
        ) : (
          <View style={emptyContainerStyle}>
            <Text style={emptyTitleStyle}>Aucun evenement trouve</Text>
            <Text style={emptyTextStyle}>
              Essayez une autre categorie ou modifiez votre recherche.
            </Text>
          </View>
        )}

        {/* Espacement entre sections */}
        <View style={sectionSpacingStyle} />

        {/* ============================================
            5. SECTION "LIEUX POPULAIRES"
            ============================================ */}
        <View style={sectionHeaderStyle}>
          <Text style={sectionTitleStyle}>Lieux populaires</Text>
          <Pressable
            onPress={() => {
              impact('light');
              router.push('/(client)/explore/venues');
            }}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Voir tous les lieux"
          >
            <Text style={{
              fontFamily: 'Inter-SemiBold',
              fontSize: 13,
              lineHeight: 18,
              color: colors.terracotta,
              letterSpacing: 0.2,
            }}>
              Voir tout
            </Text>
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

        {/* Espacement final */}
        <View style={{ height: spacing.lg }} />
      </ScrollView>
    </View>
  );
}
