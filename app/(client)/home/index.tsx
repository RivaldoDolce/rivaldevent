/**
 * Ecran d'accueil Client — vitrine premium « Noir & Or ».
 *
 * Structure (de haut en bas, dans un ScrollView) :
 * 1. En-tête plein dégradé hero : halo doré + anneaux, salutation serif,
 *    avatar verre avec dot, cloche pastille verre
 * 2. Barre de recherche en pastille verre (Search + SlidersHorizontal)
 * 3. Section "A la une" : carrousel plein écran d'evenements tendance
 * 4. Section "Categories" : chips horizontales pill verre avec icones
 * 5. Section "A venir" : cartes événements verticales full-width
 * 6. Section "Lieux a decouvrir" : cartes horizontales 216px
 *
 * Design system « NOIR & OR » :
 * - Dégradés hero/noir, surfaces verre fumé, accents or champagne
 * - Playfair Display pour les titres, Inter pour l'interface
 * - Animated natif (pas reanimated), pas de NativeWind
 *
 * Donnees : mock en attendant le branchement TanStack Query.
 */

import { useCallback, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  ImageBackground,
  StyleSheet,
  type ViewStyle,
  type TextStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Search, SlidersHorizontal, ChevronRight, Sparkles } from 'lucide-react-native';

import ConcertIcon from '@/assets/icons/concert.svg';
import FestivalIcon from '@/assets/icons/festival.svg';
import ConferenceIcon from '@/assets/icons/conference.svg';
import GalaIcon from '@/assets/icons/gala.svg';
import SportIcon from '@/assets/icons/sport.svg';
import TheatreIcon from '@/assets/icons/theatre.svg';

import { colors, spacing, radius, shadows, gradients, typography, ROUTES } from '@/lib/constants';
import { clientBackgrounds } from '@/lib/images';
import { useHaptics } from '@/hooks/useHaptics';
import { useAuth } from '@/hooks/useAuth';
import { useAvatarUrl } from '@/hooks/useAvatarUrl';
import { Avatar } from '@/components/ui/Avatar';
import { EventCard } from '@/components/events/EventCard';
import { FeaturedCarousel } from '@/components/events/FeaturedCarousel';
import { VenueCard } from '@/components/venues/VenueCard';
import { NotificationBell } from '@/components/notifications/NotificationBell';
import { NotificationsPanel } from '@/components/notifications/NotificationsPanel';
import { useRouter } from 'expo-router';
import { MOCK_FEATURED, MOCK_EVENTS, MOCK_VENUES } from '@/data/mock';
import { useFavoritesStore } from '@/stores/favorites-store';

// ============================================================
// Types (categories icones pour les chips de navigation)
// ============================================================

interface CategoryIconCard {
  readonly id: string;
  readonly label: string;
  readonly iconSource: React.ComponentType<{ width?: number; height?: number }>;
}

// ============================================================
// Donnees : cartes categories avec icones
// ============================================================

const CATEGORY_ICONS: readonly CategoryIconCard[] = [
  { id: 'concerts', label: 'Concerts', iconSource: ConcertIcon },
  { id: 'festivals', label: 'Festivals', iconSource: FestivalIcon },
  { id: 'conferences', label: 'Conferences', iconSource: ConferenceIcon },
  { id: 'galas', label: 'Galas', iconSource: GalaIcon },
  { id: 'sports', label: 'Sports', iconSource: SportIcon },
  { id: 'theatre', label: 'Theatre', iconSource: TheatreIcon },
] as const;

// ============================================================
// Ecran principal
// ============================================================

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { impact } = useHaptics();
  const { user, profile } = useAuth();
  const avatarUrl = useAvatarUrl(user?.id, profile?.avatar_url);

  const [showNotifications, setShowNotifications] = useState(false);

  // Prénom pour la salutation (fallback générique)
  const firstName = profile?.full_name?.split(' ')[0] ?? '';

  // Favoris : etat global partage (home, detail, explorer, profil)
  const isEventFavorited = useFavoritesStore((s) => s.isEventFavorited);
  const toggleEvent = useFavoritesStore((s) => s.toggleEvent);

  // Compteur de notifications non lues
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(3);

  // -- Handlers --
  const handleEventPress = useCallback((eventId: string) => {
    impact('light');
    router.push({
      pathname: ROUTES.EVENT_DETAIL,
      params: { id: eventId },
    });
  }, [impact, router]);

  const handleReserve = useCallback((eventId: string) => {
    impact('light');
    router.push({
      pathname: ROUTES.PURCHASE_TICKETS,
      params: { id: eventId },
    });
  }, [impact, router]);

  const handleVenuePress = useCallback((venueId: string) => {
    router.push({
      pathname: ROUTES.HOME_VENUE_DETAIL,
      params: { id: venueId },
    });
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
    });
  }, [router]);

  const handleFeaturedReserve = useCallback((eventId: string) => {
    router.push({
      pathname: ROUTES.PURCHASE_TICKETS,
      params: { id: eventId },
    });
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
        pathname: ROUTES.EVENT_DETAIL,
        params: { id: notification.eventId },
      });
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
    backgroundColor: 'transparent',
  };

  const scrollContentStyle: ViewStyle = {
    paddingTop: 0,
    paddingBottom: 120, // Espace aeré pour la TabBar
  };

  return (
    <ImageBackground
      source={clientBackgrounds.accueil}
      style={{ flex: 1, backgroundColor: colors.background }}
      imageStyle={StyleSheet.absoluteFillObject}
      accessibilityIgnoresInvertColors
    >
      <View style={[StyleSheet.absoluteFillObject, { backgroundColor: 'rgba(10,9,8,0.55)' }]} pointerEvents="none" />
      <View style={screenStyle}>
        <ScrollView
          style={screenStyle}
          contentContainerStyle={scrollContentStyle}
          showsVerticalScrollIndicator={false}
        >
        {/* ============================================
            1. EN-TETE HERO — dégradé noir & or
            ============================================ */}
        <LinearGradient
          colors={[...gradients.hero] as unknown as readonly [string, string, ...string[]]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={styles.hero}
        >
          {/* Image de fond hero */}
          <ImageBackground
            source={clientBackgrounds.homeHero}
            style={styles.heroBg}
            imageStyle={styles.heroBgImage}
            accessibilityIgnoresInvertColors
          />
          {/* Voile dégradé pour la lisibilité */}
          <LinearGradient
            colors={['rgba(10,9,8,0.45)', 'rgba(10,9,8,0.78)', 'rgba(10,9,8,0.96)']}
            style={styles.heroScrim}
            pointerEvents="none"
          />

          {/* Halo doré + anneaux décoratifs */}
          <View pointerEvents="none" style={styles.heroGlow} />
          <View pointerEvents="none" style={styles.heroRingLarge} />
          <View pointerEvents="none" style={styles.heroRingSmall} />

          {/* Rangée haute : mot-clé + cloche + avatar */}
          <View style={[styles.heroTopRow, { paddingTop: insets.top + spacing.md }]}>
            <View>
              <Text style={styles.heroWordmark}>Rivald'event</Text>
              <Text style={styles.heroWordmarkOverline}>EDITION PRESTIGE</Text>
            </View>
            <View style={styles.heroActions}>
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
                <View style={styles.avatarWrap}>
                  <Avatar
                    source={avatarUrl}
                    fallback={profile?.full_name ?? 'U'}
                    size="sm"
                    border="highlight"
                  />
                  <View pointerEvents="none" style={styles.avatarDot} />
                </View>
              </Pressable>
            </View>
          </View>

          {/* Salutation serif */}
          <View style={styles.heroGreeting}>
            <Text style={styles.heroOverline}>BONSOIR{firstName ? `, ${firstName.toUpperCase()}` : ''}</Text>
            <Text style={styles.heroTitle}>
              {firstName ? `Bonsoir ${firstName}` : 'Bonsoir'}
            </Text>
            <Text style={styles.heroSubtitle}>
              Decouvrez les plus beaux evenements et lieux du Cameroun.
            </Text>
          </View>
        </LinearGradient>

        {/* ============================================
            2. BARRE DE RECHERCHE — pastille verre
            ============================================ */}
        <Pressable
          onPress={handleSearchPress}
          style={styles.searchContainer}
          accessibilityRole="search"
          accessibilityLabel="Rechercher un evenement"
        >
          <Search size={20} color={colors.goldMuted} strokeWidth={1.75} />
          <Text style={styles.searchPlaceholder} numberOfLines={1}>
            Rechercher un evenement, artiste, lieu...
          </Text>
          <Pressable
            onPress={handleFilterPress}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel="Filtres"
          >
            <SlidersHorizontal size={20} color={colors.goldBright} strokeWidth={1.5} />
          </Pressable>
        </Pressable>

        {/* ============================================
            3. SECTION "A LA UNE" - Carrousel tendance
            ============================================ */}
        <View style={styles.sectionHeader}>
          <View style={styles.sectionHeaderBlock}>
            <Text style={styles.sectionOverline}>TENDANCES DE LA SEMAINE</Text>
            <Text style={styles.sectionTitle}>A la une</Text>
          </View>
          <Pressable
            onPress={() => {
              impact('light');
              router.push(ROUTES.EXPLORE);
            }}
            hitSlop={8}
            style={styles.seeAllButton}
            accessibilityRole="button"
            accessibilityLabel="Voir tous les evenements tendance"
          >
            <Text style={styles.seeAllText}>Voir tout</Text>
            <ChevronRight size={15} color={colors.goldMuted} strokeWidth={2} />
          </Pressable>
        </View>

        <FeaturedCarousel
          events={MOCK_FEATURED}
          onPress={handleFeaturedPress}
          onReserve={handleFeaturedReserve}
          testID="featured-carousel"
        />

        {/* Espacement entre carrousel et categories */}
        <View style={styles.sectionSpacing} />

        {/* ============================================
            4. SECTION "CATEGORIES" - chips horizontales
            ============================================ */}
        <View style={styles.sectionHeader}>
          <View style={styles.sectionHeaderBlock}>
            <Text style={styles.sectionOverline}>EXPLORER PAR UNIVERS</Text>
            <Text style={styles.sectionTitle}>Categories</Text>
          </View>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.categoryChipsScroll}
          contentContainerStyle={styles.categoryChipsContent}
        >
          {CATEGORY_ICONS.map((cat) => {
            const CategoryIcon = cat.iconSource;
            return (
              <Pressable
                key={cat.id}
                onPress={() => handleCategoryIconPress(cat.id)}
                style={styles.categoryChip}
                accessibilityRole="button"
                accessibilityLabel={`Explorer les ${cat.label}`}
              >
                <View style={styles.categoryChipIcon}>
                  <CategoryIcon width={20} height={20} />
                </View>
                <Text style={styles.categoryChipText}>{cat.label}</Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* Espacement entre categories et evenements */}
        <View style={styles.sectionSpacing} />

        {/* ============================================
            5. SECTION "A VENIR"
            ============================================ */}
        <View style={styles.sectionHeader}>
          <View style={styles.sectionHeaderBlock}>
            <Text style={styles.sectionOverline}>SELECTION PRIVILEGE</Text>
            <Text style={styles.sectionTitle}>A venir</Text>
          </View>
          <Pressable
            onPress={() => {
              impact('light');
              router.push(ROUTES.EXPLORE);
            }}
            hitSlop={8}
            style={styles.seeAllButton}
            accessibilityRole="button"
            accessibilityLabel="Voir tous les evenements"
          >
            <Text style={styles.seeAllText}>Voir tout</Text>
            <ChevronRight size={15} color={colors.goldMuted} strokeWidth={2} />
          </Pressable>
        </View>

        <View style={styles.eventsContainer}>
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
              isFavorited={isEventFavorited(event.id)}
              onToggleFavorite={() => toggleEvent(event.id)}
            />
          ))}
        </View>

        {/* Espacement entre sections */}
        <View style={styles.sectionSpacing} />

        {/* ============================================
            6. SECTION "LIEUX A DECOUVRIR"
            ============================================ */}
        <View style={styles.sectionHeader}>
          <View style={styles.sectionHeaderBlock}>
            <Text style={styles.sectionOverline}>ADRESSES D'EXCEPTION</Text>
            <Text style={styles.sectionTitle}>Lieux a decouvrir</Text>
          </View>
          <Pressable
            onPress={() => {
              impact('light');
              router.push(ROUTES.VENUES);
            }}
            hitSlop={8}
            style={styles.seeAllButton}
            accessibilityRole="button"
            accessibilityLabel="Voir tous les lieux"
          >
            <Text style={styles.seeAllText}>Voir tout</Text>
            <ChevronRight size={15} color={colors.goldMuted} strokeWidth={2} />
          </Pressable>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.venuesScroll}
          contentContainerStyle={styles.venuesScrollContent}
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

        {/* Signature premium */}
        <View style={styles.signatureRow}>
          <Sparkles size={13} color={colors.goldMuted} strokeWidth={1.5} />
          <Text style={styles.signatureText}>RIVAL'EVENT — L'EXCELLENCE EN EVIDENCE</Text>
        </View>

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
    </ImageBackground>
  );
}

// ============================================================
// Styles
// ============================================================

const styles = {
  // -- Hero --
  heroBg: {
    ...StyleSheet.absoluteFillObject,
  },
  heroBgImage: {
    ...StyleSheet.absoluteFillObject,
  },
  heroScrim: {
    ...StyleSheet.absoluteFillObject,
  },
  hero: {
    overflow: 'hidden',
    borderBottomLeftRadius: radius.xxl,
    borderBottomRightRadius: radius.xxl,
    paddingBottom: spacing.xl + 8,
    borderBottomWidth: 1,
    borderBottomColor: `${colors.gold}26`,
  } as ViewStyle,
  heroGlow: {
    position: 'absolute',
    top: -110,
    right: -70,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: 'rgba(216,180,90,0.1)',
  } as ViewStyle,
  heroRingLarge: {
    position: 'absolute',
    top: -90,
    right: -50,
    width: 170,
    height: 170,
    borderRadius: 85,
    borderWidth: 1.5,
    borderColor: `${colors.gold}2E`,
  } as ViewStyle,
  heroRingSmall: {
    position: 'absolute',
    top: -30,
    right: 22,
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 1.5,
    borderColor: `${colors.gold}26`,
  } as ViewStyle,
  heroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  } as ViewStyle,
  heroWordmark: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 22,
    lineHeight: 28,
    color: colors.text,
    letterSpacing: -0.3,
  } as TextStyle,
  heroWordmarkOverline: {
    ...typography.overline,
    color: colors.goldMuted,
    fontSize: 9,
    lineHeight: 13,
  } as TextStyle,
  heroActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  } as ViewStyle,
  avatarWrap: {
    position: 'relative',
  } as ViewStyle,
  avatarDot: {
    position: 'absolute',
    top: 1,
    right: 1,
    width: 9,
    height: 9,
    borderRadius: 4.5,
    backgroundColor: colors.gold,
    borderWidth: 1.5,
    borderColor: colors.background,
    shadowColor: 'rgba(216,180,90,0.7)',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
    elevation: 3,
  } as ViewStyle,
  heroGreeting: {
    paddingHorizontal: spacing.lg,
  } as ViewStyle,
  heroOverline: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 10,
    lineHeight: 14,
    letterSpacing: 1.8,
    color: colors.goldBright,
    marginBottom: spacing.xs,
  } as TextStyle,
  heroTitle: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 34,
    lineHeight: 42,
    color: colors.text,
    letterSpacing: -0.5,
    marginBottom: spacing.xs,
  } as TextStyle,
  heroSubtitle: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    lineHeight: 20,
    color: colors.textSecondary,
  } as TextStyle,

  // -- Recherche --
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 57,
    borderRadius: radius.full,
    backgroundColor: colors.glass,
    borderWidth: 1,
    borderColor: colors.border,
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    marginBottom: spacing.xl,
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
    zIndex: 2,
    ...shadows.card,
  } as ViewStyle,
  searchPlaceholder: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    lineHeight: 20,
    color: colors.textMuted,
    flex: 1,
  } as TextStyle,

  // -- Sections --
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  } as ViewStyle,
  sectionHeaderBlock: {
    flex: 1,
  } as ViewStyle,
  sectionOverline: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 10,
    lineHeight: 14,
    letterSpacing: 1.4,
    color: colors.goldMuted,
    marginBottom: 3,
  } as TextStyle,
  sectionTitle: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 22,
    lineHeight: 30,
    letterSpacing: -0.3,
    color: colors.text,
  } as TextStyle,
  seeAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingVertical: spacing.xs,
    marginBottom: 2,
  } as ViewStyle,
  seeAllText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 12,
    lineHeight: 16,
    color: colors.goldBright,
    letterSpacing: 0.3,
  } as TextStyle,
  sectionSpacing: {
    height: spacing.xl,
  } as ViewStyle,

  // -- Chips categories --
  categoryChipsScroll: {
    flexGrow: 0,
  } as ViewStyle,
  categoryChipsContent: {
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
    paddingBottom: spacing.xs,
  } as ViewStyle,
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius.full,
    backgroundColor: colors.glass,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    gap: spacing.sm,
  } as ViewStyle,
  categoryChipIcon: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(216,180,90,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  } as ViewStyle,
  categoryChipText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 13,
    lineHeight: 18,
    color: colors.textSecondary,
    letterSpacing: 0.2,
  } as TextStyle,

  // -- Evenements --
  eventsContainer: {
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  } as ViewStyle,

  // -- Lieux --
  venuesScroll: {
    flexGrow: 0,
  } as ViewStyle,
  venuesScrollContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
    gap: spacing.md,
  } as ViewStyle,

  // -- Signature --
  signatureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    marginTop: spacing.xxl,
  } as ViewStyle,
  signatureText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 10,
    lineHeight: 14,
    letterSpacing: 1.6,
    color: colors.textFaint,
  } as TextStyle,
} as const;