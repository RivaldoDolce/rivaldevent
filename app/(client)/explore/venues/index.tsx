/**
 * Ecran Liste des Lieux - Grille filtrable de lieux.
 *
 * Structure :
 * 1. Header : Bouton retour + Titre "Lieux" + Bouton filtres
 * 2. Barre de recherche : champ editable + ville chips
 * 3. Grille de lieux : 2 colonnes avec VenueCard grandes
 * 4. Info resultat : nombre de lieux trouves
 *
 * Design "Minimalisme Africain Camerounais" :
 * - Fond sand, cartes blanches, ombre subtile
 * - Terracotta pour CTA, gold pour badges premium
 * - PlayfairDisplay pour titre, Inter pour le reste
 *
 * Conventions :
 * - expo-image pour les images
 * - lucide-react-native pour les icones
 * - Pas de type any, pas d'emojis
 * - Imports @/, design tokens depuis lib/constants.ts
 * - Commentaires en francais
 *
 * Donnees : mock depuis @/data/mock en attendant TanStack Query.
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
  type ImageStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft, SlidersHorizontal, Search, X, MapPin } from 'lucide-react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';

import { colors, spacing, radii, shadows } from '@/lib/constants';
import { useHaptics } from '@/hooks/useHaptics';

// Donnees mock
import type { MockVenue } from '@/data/mock';
import { MOCK_VENUES } from '@/data/mock';

// ============================================================
// Villes disponibles dans les mock (pour les chips)
// ============================================================

const CITY_FILTERS: readonly { readonly id: string; readonly label: string }[] = [
  { id: 'all', label: 'Toutes' },
  { id: 'Yaounde', label: 'Yaounde' },
  { id: 'Douala', label: 'Douala' },
  { id: 'Buea', label: 'Buea' },
] as const;

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

  const cardStyle: ViewStyle = {
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    overflow: 'hidden',
    ...shadows.card,
    flex: 1,
  };

  const imageStyle: ImageStyle = {
    height: 140,
  };

  const badgeContainerStyle: ViewStyle = {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    backgroundColor: venue.badge === 'Or Savane' ? `${colors.gold}E6`
      : venue.badge === 'Premium' ? colors.terracotta
      : `${colors.forest}CC`,
    borderRadius: radii.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  };

  const badgeTextStyle: TextStyle = {
    fontFamily: 'Inter-Bold',
    fontSize: 10,
    lineHeight: 14,
    color: colors.white,
    letterSpacing: 0.8,
  };

  const contentStyle: ViewStyle = {
    padding: spacing.md,
  };

  const nameStyle: TextStyle = {
    fontFamily: 'PlayfairDisplay-SemiBold',
    fontSize: 16,
    lineHeight: 22,
    color: colors.text,
    letterSpacing: -0.2,
    marginBottom: spacing.xs,
  };

  const locationRowStyle: ViewStyle = {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  };

  const locationTextStyle: TextStyle = {
    fontFamily: 'Inter-Regular',
    fontSize: 13,
    lineHeight: 18,
    color: colors.stone,
    marginLeft: spacing.xs / 2,
  };

  const ratingRowStyle: ViewStyle = {
    flexDirection: 'row',
    alignItems: 'center',
  };

  const ratingTextStyle: TextStyle = {
    fontFamily: 'Inter-SemiBold',
    fontSize: 13,
    lineHeight: 18,
    color: colors.gold,
    marginLeft: spacing.xs / 2,
  };

  return (
    <Pressable
      onPress={handlePress}
      accessibilityRole="button"
      accessibilityLabel={`Lieu: ${venue.name}`}
    >
      <View style={cardStyle}>
        <View style={{ position: 'relative' }}>
          <Image
            source={{ uri: venue.image }}
            style={imageStyle}
            contentFit="cover"
            transition={300}
            cachePolicy="memory-disk"
          />
          {venue.badge && (
            <View style={badgeContainerStyle}>
              <Text style={badgeTextStyle}>{venue.badge}</Text>
            </View>
          )}
        </View>
        <View style={contentStyle}>
          <Text style={nameStyle} numberOfLines={1} ellipsizeMode="tail">
            {venue.name}
          </Text>
          <View style={locationRowStyle}>
            <MapPin size={14} color={colors.stone} strokeWidth={1.5} />
            <Text style={locationTextStyle} numberOfLines={1} ellipsizeMode="tail">
              {venue.location}
            </Text>
          </View>
          {venue.rating > 0 && (
            <View style={ratingRowStyle}>
              <Text style={ratingTextStyle}>{venue.rating.toFixed(1)} / 5</Text>
            </View>
          )}
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

  // -- State --
  const [activeCity, setActiveCity] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  // -- Handlers --
  const handleBack = useCallback(() => {
    impact('light');
    router.back();
  }, [impact, router]);

  const handleCityPress = useCallback((cityId: string) => {
    impact('light');
    setActiveCity(cityId);
  }, [impact]);

  const handleVenuePress = useCallback((venueId: string) => {
    router.push(`/(client)/explore/venues/${venueId}`);
  }, [router]);

  const handleClearSearch = useCallback(() => {
    impact('light');
    setSearchQuery('');
  }, [impact]);

  const handleFilterPress = useCallback(() => {
    impact('light');
    router.push('/(modal)/filters');
  }, [impact, router]);

  // -- Filtrer les lieux par ville + recherche --
  const filteredVenues = useMemo(() => {
    let result = MOCK_VENUES;

    // Filtre par ville
    if (activeCity !== 'all') {
      result = result.filter((v) => v.location.includes(activeCity));
    }

    // Filtre par recherche
    if (searchQuery.trim().length > 0) {
      const query = searchQuery.toLowerCase().trim();
      result = result.filter((v) =>
        v.name.toLowerCase().includes(query)
        || v.location.toLowerCase().includes(query)
      );
    }

    return result;
  }, [activeCity, searchQuery]);

  // -- Styles --
  const screenStyle: ViewStyle = {
    flex: 1,
    backgroundColor: colors.sand,
  };

  const scrollContentStyle: ViewStyle = {
    paddingTop: insets.top,
    paddingBottom: 100,
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
    fontSize: 24,
    lineHeight: 32,
    color: colors.onyx,
    letterSpacing: -0.3,
  };

  const searchContainerStyle: ViewStyle = {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: radii.xl,
    marginHorizontal: spacing.lg,
    marginTop: spacing.sm,
    marginBottom: spacing.md,
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

  const cityChipsContainerStyle: ViewStyle = {
    paddingLeft: spacing.lg,
    paddingRight: spacing.sm,
    paddingBottom: spacing.md,
  };

  const chipActiveStyle: ViewStyle = {
    backgroundColor: colors.forest,
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
  };

  const chipInactiveTextStyle: TextStyle = {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    lineHeight: 20,
    color: colors.onyx,
  };

  const resultsInfoStyle: TextStyle = {
    fontFamily: 'Inter-Medium',
    fontSize: 13,
    lineHeight: 18,
    color: colors.stone,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  };

  const gridStyle: ViewStyle = {
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

  return (
    <View style={screenStyle}>
      <ScrollView
        style={screenStyle}
        contentContainerStyle={scrollContentStyle}
        showsVerticalScrollIndicator={false}
      >
        {/* ============================================
            1. HEADER : Retour + Titre + Filtres
            ============================================ */}
        <View style={headerStyle}>
          <Pressable
            onPress={handleBack}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel="Retour"
          >
            <ChevronLeft size={24} color={colors.onyx} strokeWidth={2.5} />
          </Pressable>
          <Text style={headerTitleStyle}>Lieux</Text>
          <Pressable
            onPress={handleFilterPress}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel="Filtres"
          >
            <SlidersHorizontal size={22} color={colors.forest} strokeWidth={1.5} />
          </Pressable>
        </View>

        {/* ============================================
            2. BARRE DE RECHERCHE
            ============================================ */}
        <View style={searchContainerStyle}>
          <Search size={20} color={isSearchFocused ? colors.forest : colors.muted} strokeWidth={1.5} />
          <TextInput
            style={searchInputStyle}
            value={searchQuery}
            onChangeText={setSearchQuery}
            onFocus={() => setIsSearchFocused(true)}
            onBlur={() => setIsSearchFocused(false)}
            placeholder="Rechercher un lieu..."
            placeholderTextColor={colors.muted}
            returnKeyType="search"
            accessibilityLabel="Rechercher un lieu"
          />
          {searchQuery.length > 0 && (
            <Pressable
              onPress={handleClearSearch}
              hitSlop={12}
              accessibilityRole="button"
              accessibilityLabel="Effacer"
            >
              <X size={18} color={colors.stone} strokeWidth={2} />
            </Pressable>
          )}
        </View>

        {/* ============================================
            3. CHIP FILTRES VILLE
            ============================================ */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={cityChipsContainerStyle}
          contentContainerStyle={{ paddingRight: spacing.lg }}
        >
          {CITY_FILTERS.map((city) => {
            const isActive = activeCity === city.id;
            return (
              <Pressable
                key={city.id}
                onPress={() => handleCityPress(city.id)}
                style={isActive ? chipActiveStyle : chipInactiveStyle}
                accessibilityRole="button"
                accessibilityState={{ selected: isActive }}
              >
                <Text style={isActive ? chipActiveTextStyle : chipInactiveTextStyle}>
                  {city.label}
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
            {/* Grille en 2 colonnes : pairs et impairs */}
            {Array.from({ length: Math.ceil(filteredVenues.length / 2) }).map((_, rowIndex) => {
              const leftVenue = filteredVenues[rowIndex * 2];
              const rightVenue = filteredVenues[rowIndex * 2 + 1];
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
          </View>
        ) : (
          <View style={emptyContainerStyle}>
            <Text style={emptyTitleStyle}>Aucun lieu trouve</Text>
            <Text style={emptyTextStyle}>
              Essayez une autre ville ou modifiez votre recherche.
            </Text>
          </View>
        )}

        {/* Espacement final */}
        <View style={{ height: spacing.xxl }} />
      </ScrollView>
    </View>
  );
}
