/**
 * Ecran d'accueil Client - Page principale de l'application.
 *
 * Structure (de haut en bas, dans un ScrollView) :
 * 1. Header : Logo "Rivald'event" (gauche) + Avatar profil (droite)
 * 2. Barre de recherche : Search icon + placeholder italic centre une seule ligne + SlidersHorizontal
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
 * Donnees : mock importees depuis @/data/mock en attendant le branchement TanStack Query.
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

import { colors, spacing, radii, shadows, ROUTES } from '@/lib/constants';
import { useHaptics } from '@/hooks/useHaptics';
import { useAuth } from '@/hooks/useAuth';
import { Avatar } from '@/components/ui/Avatar';
import { EventCard } from '@/components/events/EventCard';
import { FeaturedCarousel } from '@/components/events/FeaturedCarousel';
import { VenueCard } from '@/components/venues/VenueCard';
import { NotificationBell } from '@/components/notifications/NotificationBell';
import { NotificationsPanel } from '@/components/notifications/NotificationsPanel';
import { useRouter } from 'expo-router';

// Donnees mock extraites dans data/mock/ (plus inline)
import { CATEGORIES, MOCK_FEATURED, MOCK_EVENTS, MOCK_VENUES } from '@/data/mock';

// ============================================================
// Ecran principal
// ============================================================

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { impact } = useHaptics();
  const { profile } = useAuth();

  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [showNotifications, setShowNotifications] = useState(false);

  // Compteur de notifications non lues (dynamique, mis a jour par le panel)
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(3);

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

  const handleNotificationPress = useCallback(() => {
    impact('light');
    setShowNotifications(true);
  }, [impact]);

  const handleCloseNotifications = useCallback(() => {
    setShowNotifications(false);
  }, []);

  const handleNotificationItemPress = useCallback((notification: { eventId?: string }) => {
    if (notification.eventId) {
      router.push(`/(client)/home/${notification.eventId}`);
    }
  }, [router]);

  const handleReadCountChange = useCallback((count: number) => {
    setUnreadNotificationCount(count);
  }, []);

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

  // Titre Rivald'event : gras fantasique (Playfair Display Bold, taille elaguee)
  const headerTitleStyle: TextStyle = {
    fontFamily: 'Lobster_400Regular',
    fontSize: 32,
    color: colors.forest,
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

  // Placeholder : centree, une seule ligne, italique
  const searchPlaceholderStyle: TextStyle = {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    lineHeight: 20,
    color: colors.muted,
    flex: 1,
    textAlign: 'center',
    fontStyle: 'italic',
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

  const seeAllTextStyle: TextStyle = {
    fontFamily: 'Inter-SemiBold',
    fontSize: 13,
    lineHeight: 18,
    color: colors.terracotta,
    letterSpacing: 0.2,
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
            1. HEADER : Logo "Rivald'event" + Avatar profil
            ============================================ */}
        <View style={headerStyle}>
          <Text style={headerTitleStyle}>Rivald'event</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
            <NotificationBell
              count={unreadNotificationCount}
              onPress={handleNotificationPress}
              testID="notification-bell"
            />
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
                border="highlight"
              />
            </Pressable>
          </View>
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
          <Text style={searchPlaceholderStyle} numberOfLines={1}>
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

      {/* Panneau de notifications (apres le ScrollView pour etre au-dessus en z-order) */}
      <NotificationsPanel
        visible={showNotifications}
        onClose={handleCloseNotifications}
        onNotificationPress={handleNotificationItemPress}
        onReadCountChange={handleReadCountChange}
        testID="notifications-panel"
      />
    </View>
  );
}