/**
 * Ecran d'accueil Client - Page principale de l'application.
 *
 * Structure (de haut en bas, dans un ScrollView) :
 * 1. Header : Logo "Rivald'event" (gauche) + Avatar profil (droite)
 * 2. Barre de recherche : Search icon + placeholder + SlidersHorizontal
 * 3. Categories : chips horizontaux scrollables (Tous, Concerts, Festivals...)
 * 4. Section "A la une" : carrousel plein ecran d'evenements tendance
 * 5. Section "Evenements a proximite" : cartes verticales full-width
 * 6. Section "Lieux a decouvrir" : cartes horizontales 200px
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
 *
 * Donnees : mock en attendant le branchement TanStack Query.
 * Les types d'interface sont simplifies pour etre remplaces
 * par les vrais types Event/Venue quand les services seront branches.
 */

import { useCallback, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  type ViewStyle,
  type TextStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Search, SlidersHorizontal } from 'lucide-react-native';

import { colors, spacing, radii, shadows, typography, ROUTES } from '@/lib/constants';
import { useHaptics } from '@/hooks/useHaptics';
import { useAuth } from '@/hooks/useAuth';
import { Avatar } from '@/components/ui/Avatar';
import { EventCard } from '@/components/events/EventCard';
import { FeaturedCarousel } from '@/components/events/FeaturedCarousel';
import { VenueCard } from '@/components/venues/VenueCard';
import { useRouter } from 'expo-router';

// ============================================================
// Types (mock - seront remplaces par les vrais types)
// ============================================================

interface MockEvent {
  readonly id: string;
  readonly title: string;
  readonly image: string;
  readonly date: string;
  readonly location: string;
  readonly time: string;
  readonly organizerName: string;
  readonly organizerAvatar?: string | null;
  readonly price: number;
  readonly currency: string;
  readonly category: string;
  readonly isFeatured: boolean;
}

interface MockVenue {
  readonly id: string;
  readonly name: string;
  readonly image: string;
  readonly location: string;
  readonly rating: number;
  readonly badge: string | null;
}

interface FeaturedEvent {
  readonly id: string;
  readonly title: string;
  readonly image: string;
  readonly date: string;
  readonly location: string;
  readonly category: string;
  readonly price: number;
  readonly currency: string;
}

// ============================================================
// Donnees mock
// ============================================================

const CATEGORIES = [
  { id: 'all', label: 'Tous' },
  { id: 'concerts', label: 'Concerts' },
  { id: 'festivals', label: 'Festivals' },
  { id: 'conferences', label: 'Conferences' },
  { id: 'sports', label: 'Sports' },
  { id: 'theatre', label: 'Theatre' },
  { id: 'galas', label: 'Galas' },
] as const;

const MOCK_FEATURED: readonly FeaturedEvent[] = [
  {
    id: 'feat-1',
    title: 'Soiree Afrobeats Yaounde',
    image: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800',
    date: '12 Juil.',
    location: 'Palais des Sports, Yaounde',
    category: 'Concerts',
    price: 5000,
    currency: 'FCFA',
  },
  {
    id: 'feat-2',
    title: 'Festival Culturel Nguon 2026',
    image: 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=800',
    date: '25 Juil.',
    location: 'Centre Culturel, Douala',
    category: 'Festivals',
    price: 2000,
    currency: 'FCFA',
  },
  {
    id: 'feat-3',
    title: 'Gala de Charite 2026',
    image: 'https://images.unsplash.com/photo-1519671482749-fd09be7ccebf?w=800',
    date: '02 Sept.',
    location: 'Hilton Yaounde',
    category: 'Galas',
    price: 50000,
    currency: 'FCFA',
  },
];

const MOCK_EVENTS: readonly MockEvent[] = [
  {
    id: '1',
    title: 'Soiree Afrobeats Yaounde',
    image: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800',
    date: '12 Juil.',
    location: 'Palais des Sports, Yaounde',
    time: '20h00',
    organizerName: 'Pro Events CMR',
    price: 5000,
    currency: 'FCFA',
    category: 'concerts',
    isFeatured: true,
  },
  {
    id: '2',
    title: 'Festival Culturel Nguon 2026',
    image: 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=800',
    date: '25 Juil.',
    location: 'Centre Culturel, Douala',
    time: '18h30',
    organizerName: 'Ministere de la Culture',
    price: 2000,
    currency: 'FCFA',
    category: 'festivals',
    isFeatured: false,
  },
  {
    id: '3',
    title: 'Conference Tech Douala',
    image: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800',
    date: '03 Aout',
    location: 'Hotel Pullman, Douala',
    time: '09h00',
    organizerName: 'Cameroon Tech Hub',
    price: 15000,
    currency: 'FCFA',
    category: 'conferences',
    isFeatured: false,
  },
  {
    id: '4',
    title: 'Match Football Classique',
    image: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800',
    date: '15 Aout',
    location: 'Stade Japoma, Douala',
    time: '16h00',
    organizerName: 'FECAfoot',
    price: 3000,
    currency: 'FCFA',
    category: 'sports',
    isFeatured: false,
  },
  {
    id: '5',
    title: 'Piece de Theatre "Le Choix"',
    image: 'https://images.unsplash.com/photo-1507924538820-ede94a04019d?w=800',
    date: '20 Aout',
    location: 'Maison de la Culture, Yaounde',
    time: '19h30',
    organizerName: 'Troupe Les Eclats',
    price: 3500,
    currency: 'FCFA',
    category: 'theatre',
    isFeatured: false,
  },
  {
    id: '6',
    title: 'Gala de Charite 2026',
    image: 'https://images.unsplash.com/photo-1519671482749-fd09be7ccebf?w=800',
    date: '02 Sept.',
    location: 'Hilton Yaounde',
    time: '20h00',
    organizerName: 'Fondation Hope',
    price: 50000,
    currency: 'FCFA',
    category: 'galas',
    isFeatured: true,
  },
] as const;

const MOCK_VENUES: readonly MockVenue[] = [
  {
    id: '1',
    name: 'The Golden Lounge',
    image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400',
    location: 'Bastos, Yaounde',
    rating: 4.7,
    badge: 'Or Savane',
  },
  {
    id: '2',
    name: 'Suna \' a Home Bonapriso',
    image: 'https://cf.bstatic.com/xdata/images/hotel/max1024x768/509004353.jpg?k=e299286e7a5328538faeffe4d7cd874f2cc4c31f498228afc0f15e5d70f7d501&o=',
    location: 'Bonapriso, Douala',
    rating: 4.5,
    badge: null,
  },
  {
    id: '3',
    name: 'Espace Mont Febe',
    image: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400',
    location: 'Mont Febe, Yaounde',
    rating: 4.8,
    badge: 'Premium',
  },
  {
    id: '4',
    name: 'Stade Japoma',
    image: 'https://images.unsplash.com/photo-1459865264687-595d652de67e?w=400',
    location: 'Japoma, Douala',
    rating: 4.3,
    badge: null,
  },
  {
    id: '5',
    name: 'Silicon Mountain Hub',
    image: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=400',
    location: 'Buea, Sud-Ouest',
    rating: 4.6,
    badge: 'Recommande',
  },
] as const;

// ============================================================
// Ecran principal
// ============================================================

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { impact } = useHaptics();
  const { profile } = useAuth();

  const [activeCategory, setActiveCategory] = useState<string>('all');

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

  const handleSearchPress = useCallback(() => {
    impact('light');
    router.push(ROUTES.EXPLORE);
  }, [impact, router]);

  const handleFilterPress = useCallback(() => {
    impact('light');
    router.push(ROUTES.FILTERS);
  }, [impact, router]);

  const handleProfilePress = useCallback(() => {
    impact('light');
    router.push(ROUTES.PROFILE);
  }, [impact, router]);

  const handleFeaturedPress = useCallback((eventId: string) => {
    router.push(`/(client)/home/${eventId}`);
  }, [router]);

  const handleFeaturedReserve = useCallback((eventId: string) => {
    router.push(`/(purchase)/event/${eventId}/tickets`);
  }, [router]);

  // -- Filtrer les evenements par categorie active --
  const filteredEvents = activeCategory === 'all'
    ? MOCK_EVENTS
    : MOCK_EVENTS.filter((e) => e.category === activeCategory);

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
    fontFamily: 'PlayfairDisplay-SemiBold',
    fontSize: 22,
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
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.search,
  };

  const searchPlaceholderStyle: TextStyle = {
    ...typography.bodySmall,
    color: colors.muted,
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
    ...typography.bodySmall,
    color: colors.white,
    fontWeight: '600',
  };

  const categoryChipInactiveTextStyle: TextStyle = {
    ...typography.bodySmall,
    color: colors.onyx,
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
    ...typography.h3,
    color: colors.onyx,
  };

  const seeAllTextStyle: TextStyle = {
    ...typography.caption,
    color: colors.terracotta,
    fontWeight: '600',
  };

  const eventsContainerStyle: ViewStyle = {
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
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
            1. HEADER : Logo + Avatar
            ============================================ */}
        <View style={headerStyle}>
          <Text style={headerTitleStyle}>Rivald'event</Text>
          <Pressable
            onPress={handleProfilePress}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel="Mon profil"
          >
            <Avatar
              source={profile?.avatar_url ?? null}
              fallback={profile?.full_name ?? 'U'}
              size="sm"
              border
            />
          </Pressable>
        </View>

        {/* ============================================
            2. BARRE DE RECHERCHE
            ============================================ */}
        <Pressable
          onPress={handleSearchPress}
          style={searchContainerStyle}
          accessibilityRole="search"
          accessibilityLabel="Rechercher un evenement"
        >
          <Search size={20} color={colors.muted} strokeWidth={1.5} />
          <Text style={searchPlaceholderStyle}>
            Rechercher un evenement, artiste, lieu...
          </Text>
          <Pressable
            onPress={handleFilterPress}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel="Filtres"
          >
            <SlidersHorizontal size={20} color={colors.text} strokeWidth={1.5} />
          </Pressable>
        </Pressable>

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
            4. SECTION "A LA UNE" - Carrousel tendance
            ============================================ */}
        <View style={sectionHeaderStyle}>
          <Text style={sectionTitleStyle}>A la une</Text>
          <Pressable
            onPress={() => {
              impact('light');
              router.push(ROUTES.EXPLORE);
            }}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Voir tous les evenements tendance"
          >
            <Text style={seeAllTextStyle}>Voir tout</Text>
          </Pressable>
        </View>

        <FeaturedCarousel
          events={MOCK_FEATURED}
          onPress={handleFeaturedPress}
          onReserve={handleFeaturedReserve}
          testID="featured-carousel"
        />

        {/* Espacement entre carrousel et evenements a proximite */}
        <View style={sectionSpacingStyle} />

        {/* ============================================
            5. SECTION "EVENEMENTS A PROXIMITE"
            ============================================ */}
        <View style={sectionHeaderStyle}>
          <Text style={sectionTitleStyle}>Evenements a proximite</Text>
          <Pressable
            onPress={() => {
              impact('light');
              router.push(ROUTES.EXPLORE);
            }}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Voir tous les evenements"
          >
            <Text style={seeAllTextStyle}>Voir tout</Text>
          </Pressable>
        </View>

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

        {/* Espacement entre sections */}
        <View style={sectionSpacingStyle} />

        {/* ============================================
            6. SECTION "LIEUX A DECOUVRIR"
            ============================================ */}
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

        {/* Espacement final */}
        <View style={{ height: spacing.lg }} />
      </ScrollView>
    </View>
  );
}
