/**
 * Ecran d'accueil Client - Page principale de l'application.
 *
 * Structure (de haut en bas, dans un ScrollView) :
 * 1. Header : Logo "Rivald'event" (gauche) + Avatar profil (droite)
 * 2. Barre de recherche : Search icon + placeholder italic + SlidersHorizontal
 * 3. Section "A la une" : carrousel plein ecran d'evenements tendance
 * 4. Section "Evenements" : cartes d'icones categories (Concerts, Festivals, etc.)
 * 5. Section "Evenements populaires" : cartes verticales full-width
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
import { Search, SlidersHorizontal, Music, PartyPopper, Presentation, Dumbbell, Drama, Wine } from 'lucide-react-native';

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
import { MOCK_FEATURED, MOCK_EVENTS, MOCK_VENUES } from '@/data/mock';

// ============================================================
// Types (categories icones pour les cartes de navigation)
// ============================================================

interface CategoryIconCard {
  readonly id: string;
  readonly label: string;
  readonly icon: React.ComponentType<{ size: number; color: string; strokeWidth: number }>;
  readonly bgColor: string;
  readonly iconColor: string;
}

// ============================================================
// Donnees : cartes categories avec icones
// ============================================================

const CATEGORY_ICONS: readonly CategoryIconCard[] = [
  { id: 'concerts', label: 'Concerts', icon: Music, bgColor: colors.ivory, iconColor: colors.gold },
  { id: 'festivals', label: 'Festivals', icon: PartyPopper, bgColor: colors.ivory, iconColor: colors.terracotta },
  { id: 'conferences', label: 'Conferences', icon: Presentation, bgColor: colors.ivory, iconColor: colors.forest },
  { id: 'galas', label: 'Galas', icon: Wine, bgColor: colors.ivory, iconColor: colors.gold },
  { id: 'sports', label: 'Sports', icon: Dumbbell, bgColor: colors.ivory, iconColor: colors.terracotta },
  { id: 'theatre', label: 'Theatre', icon: Drama, bgColor: colors.ivory, iconColor: colors.indigo },
] as const;

// ============================================================
// Ecran principal
// ============================================================

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { impact } = useHaptics();
  const { profile } = useAuth();

  const [showNotifications, setShowNotifications] = useState(false);

  // Compteur de notifications non lues
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(3);

  // -- Handlers --
  const handleEventPress = useCallback((eventId: string) => {
    impact('light');
    router.push({
      pathname: ROUTES.EVENT_DETAIL,
      params: { id: eventId },
    } as any);
  }, [impact, router]);

  const handleReserve = useCallback((eventId: string) => {
    impact('light');
    router.push({
      pathname: ROUTES.PURCHASE_TICKETS,
      params: { id: eventId },
    } as any);
  }, [impact, router]);

  const handleVenuePress = useCallback((venueId: string) => {
    router.push({
      pathname: ROUTES.VENUE_DETAIL,
      params: { id: venueId },
    } as any);
  }, [router]);

  const handleSearchPress = useCallback(() => {
    impact('light');
    // Navigation avec autoFocus pour que le TextInput d'Explorer
    // recoive le focus immediatement (pas de perte de focus)
    router.push(`${ROUTES.EXPLORE}?autoFocus=true`);
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
    // Navigation vers la page detail partagee (pas de switch d'onglet)
    router.push({
      pathname: ROUTES.EVENT_DETAIL,
      params: { id: eventId },
    } as any);
  }, [router]);

  const handleFeaturedReserve = useCallback((eventId: string) => {
    router.push({
      pathname: ROUTES.PURCHASE_TICKETS,
      params: { id: eventId },
    } as any);
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
      router.push({
        pathname: '/(client)/home/[id]',
        params: { id: notification.eventId },
      } as any);
    }
  }, [router]);

  const handleReadCountChange = useCallback((count: number) => {
    setUnreadNotificationCount(count);
  }, []);

  // Navigation vers Explorer avec filtre categorie pre-applique
  const handleCategoryIconPress = useCallback((categoryId: string) => {
    impact('light');
    router.push(`${ROUTES.EXPLORE}?filterCategory=${categoryId}`);
  }, [impact, router]);

  // -- Styles --
  const screenStyle: ViewStyle = {
    flex: 1,
    backgroundColor: colors.sand,
  };

  const scrollContentStyle: ViewStyle = {
    paddingTop: insets.top,
    paddingBottom: 120, // Espace aeré pour la TabBar
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

  const searchPlaceholderStyle: TextStyle = {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    lineHeight: 20,
    color: colors.muted,
    flex: 1,
    textAlign: 'center',
    fontStyle: 'italic',
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

  // -- Styles cartes categories icones --
  const categoryIconsContainerStyle: ViewStyle = {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  };

  // Grille flexWrap pour des cartes plus grandes et auto-suffisantes
  const categoryIconsGridStyle: ViewStyle = {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    gap: spacing.md,
  };

  // Cartes categories plus grandes : auto-width, minimum 90px, padding vertical accru
  const categoryIconCardStyle: ViewStyle = {
    minWidth: 90,
    height: 90,
    borderRadius: radii.md,
    backgroundColor: colors.ivory,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: `${colors.border}60`,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    ...shadows.card,
  };

  const categoryIconLabelStyle: TextStyle = {
    fontFamily: 'Inter-Medium',
    fontSize: 12,
    lineHeight: 16,
    color: colors.onyx,
    marginTop: spacing.xs,
    textAlign: 'center',
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
            1. HEADER : Logo "Rivald'event" + Avatar profil + Notifications
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
            3. SECTION "A LA UNE" - Carrousel tendance
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

        {/* Espacement entre carrousel et categories */}
        <View style={sectionSpacingStyle} />

        {/* ============================================
            4. SECTION "EVENEMENTS" - Cartes d'icones categories
            ============================================ */}
        <View style={sectionHeaderStyle}>
          <Text style={sectionTitleStyle}>Evenements</Text>
        </View>

        <View style={categoryIconsContainerStyle}>
          {/* Grille flexWrap : toutes les categories sur 2 lignes auto */}
          <View style={categoryIconsGridStyle}>
            {CATEGORY_ICONS.map((cat) => {
              const IconComponent = cat.icon;
              return (
                <Pressable
                  key={cat.id}
                  onPress={() => handleCategoryIconPress(cat.id)}
                  style={categoryIconCardStyle}
                  accessibilityRole="button"
                  accessibilityLabel={`Explorer les ${cat.label}`}
                >
                  <IconComponent size={26} color={cat.iconColor} strokeWidth={1.5} />
                  <Text style={categoryIconLabelStyle}>{cat.label}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Espacement entre categories et evenements populaires */}
        <View style={sectionSpacingStyle} />

        {/* ============================================
            5. SECTION "EVENEMENTS POPULAIRES"
            ============================================ */}
        <View style={sectionHeaderStyle}>
          <Text style={sectionTitleStyle}>Evenements populaires</Text>
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
          {MOCK_EVENTS.map((event) => (
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

        {/* Espacement final aeré */}
        <View style={{ height: spacing.xxl }} />
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