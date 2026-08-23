/**
 * Mes favoris — evenements et lieux mis en favori.
 *
 * Design « Noir & Or » :
 * - En-tete hero degrade noir profond avec halo doré, anneaux et filet or bas
 * - Titre Playfair Display 28px + sous-titre compteurs
 * - Segmented control Evenements / Lieux : pastille verre, actif degrade or texte onyx
 * - Evenements : EventCard full-width (meme rendu que l'accueil)
 * - Lieux : VenueCard horizontale (meme rendu que l'accueil)
 * - Etat vide premium : icone coeur en medaillon verre avec halo doré
 *
 * Source de verite : stores/favorites-store.ts (mock pour l'instant,
 * remplace par l'API Supabase au Jalon 6).
 *
 * Toutes les couleurs viennent de lib/constants.ts.
 */

import { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  type ViewStyle,
  type TextStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Heart } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, gradients, spacing, radius, shadows, ROUTES } from '@/lib/constants';
import { ScreenBackground } from '@/components/ui/ScreenBackground';
import { useHaptics } from '@/hooks/useHaptics';
import { useFavoritesStore } from '@/stores/favorites-store';
import { EventCard } from '@/components/events/EventCard';
import { VenueCard } from '@/components/venues/VenueCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { MOCK_EVENTS, MOCK_VENUES } from '@/data/mock';

// ============================================================
// Types
// ============================================================

type TabKey = 'events' | 'venues';

// ============================================================
// Constantes
// ============================================================

const TABS: readonly { key: TabKey; label: string }[] = [
  { key: 'events', label: 'Evenements' },
  { key: 'venues', label: 'Lieux' },
];

// ============================================================
// Composant
// ============================================================

export default function FavoritesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { impact } = useHaptics();

  const [activeTab, setActiveTab] = useState<TabKey>('events');

  const eventIds = useFavoritesStore((s) => s.eventIds);
  const venueIds = useFavoritesStore((s) => s.venueIds);
  const toggleEvent = useFavoritesStore((s) => s.toggleEvent);

  // -- Donnees derivees --
  const favoritedEvents = useMemo(
    () => MOCK_EVENTS.filter((event) => eventIds.includes(event.id)),
    [eventIds],
  );

  const favoritedVenues = useMemo(
    () => MOCK_VENUES.filter((venue) => venueIds.includes(venue.id)),
    [venueIds],
  );

  // -- Handlers --
  const handleTabPress = useCallback((tab: TabKey) => {
    impact('light');
    setActiveTab(tab);
  }, [impact]);

  const handleEventPress = useCallback((eventId: string) => {
    impact('light');
    // Pousse le detail DANS la stack Favoris : le retour revient
    // ici, segment et scroll intacts.
    router.push({
      pathname: ROUTES.FAVORITES_EVENT_DETAIL,
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
    impact('light');
    // Meme principe : detail du lieu dans la stack Favoris.
    router.push({
      pathname: ROUTES.FAVORITES_VENUE_DETAIL,
      params: { id: venueId },
    });
  }, [impact, router]);

  const handleExplore = useCallback(() => {
    impact('light');
    router.push(ROUTES.EXPLORE);
  }, [impact, router]);

  // -- Styles dynamiques --
  const contentStyle: ViewStyle = {
    paddingHorizontal: spacing.lg,
    paddingBottom: insets.bottom + spacing.xxl + 40,
  };

  const tabBarStyle: ViewStyle = {
    flexDirection: 'row',
    alignSelf: 'center',
    backgroundColor: colors.glass,
    borderWidth: 1,
    borderColor: `${colors.gold}2E`,
    borderRadius: radius.full,
    padding: 4,
    marginTop: spacing.lg,
  };

  const activeTabStyle: ViewStyle = {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.full,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm - 2,
    ...shadows.goldGlow,
  };

  const inactiveTabStyle: ViewStyle = {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.full,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm - 2,
  };

  const tabLabelStyle = (active: boolean): TextStyle => ({
    fontFamily: active ? 'Inter_700Bold' : 'Inter_600SemiBold',
    fontSize: 13,
    lineHeight: 18,
    color: active ? colors.onyx : colors.textSecondary,
  });

  const countBadgeStyle = (active: boolean): ViewStyle => ({
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 6,
    paddingHorizontal: 5,
    backgroundColor: active ? 'rgba(10,9,8,0.22)' : 'rgba(255,255,255,0.08)',
  });

  const countBadgeTextStyle = (active: boolean): TextStyle => ({
    fontFamily: 'Inter_700Bold',
    fontSize: 11,
    lineHeight: 14,
    color: active ? colors.onyx : colors.textSecondary,
  });

  const sectionTitleStyle: TextStyle = {
    fontFamily: 'PlayfairDisplay_600SemiBold',
    fontSize: 18,
    lineHeight: 24,
    color: colors.text,
    letterSpacing: -0.2,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  };

  return (
    <ScreenBackground>
      <View style={{ flex: 1, backgroundColor: 'transparent' }}>
      {/* ============================================
          EN-TETE HERO — degradef noir + halo doré
          ============================================ */}
      <LinearGradient
        colors={[...gradients.hero] as unknown as readonly [string, string, ...string[]]}
        start={{ x: 0.1, y: 0 }}
        end={{ x: 0.9, y: 1 }}
        style={[styles.header, { paddingTop: insets.top + spacing.lg }]}
      >
        {/* Halos et anneaux décoratifs */}
        <View pointerEvents="none" style={styles.headerGlow} />
        <View pointerEvents="none" style={styles.headerRingLarge} />
        <View pointerEvents="none" style={styles.headerRingSmall} />
        <View pointerEvents="none" style={styles.headerGoldDot} />

        <Text style={styles.headerOverline}>VOTRE SELECTION</Text>
        <Text style={styles.headerTitle}>Mes favoris</Text>
        <Text style={styles.headerSubtitle}>
          {activeTab === 'events'
            ? `${favoritedEvents.length} evenement${favoritedEvents.length > 1 ? 's' : ''} sauvegarde${favoritedEvents.length > 1 ? 's' : ''}`
            : `${favoritedVenues.length} lieu${favoritedVenues.length > 1 ? 'x' : ''} sauvegarde${favoritedVenues.length > 1 ? 's' : ''}`}
        </Text>

        {/* Filet or bas */}
        <View pointerEvents="none" style={styles.headerHairline} />
      </LinearGradient>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={contentStyle}
      >
        {/* Segmented control Evenements / Lieux */}
        <View style={tabBarStyle} accessibilityRole="tablist">
          {TABS.map((tab) => {
            const active = activeTab === tab.key;
            const count = tab.key === 'events' ? favoritedEvents.length : favoritedVenues.length;
            return (
              <Pressable
                key={tab.key}
                onPress={() => handleTabPress(tab.key)}
                accessibilityRole="tab"
                accessibilityState={{ selected: active }}
              >
                {active ? (
                  <LinearGradient
                    colors={[...gradients.gold] as unknown as readonly [string, string, ...string[]]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={activeTabStyle}
                  >
                    <Text style={tabLabelStyle(active)}>{tab.label}</Text>
                    <View style={countBadgeStyle(active)}>
                      <Text style={countBadgeTextStyle(active)}>{count}</Text>
                    </View>
                  </LinearGradient>
                ) : (
                  <View style={inactiveTabStyle}>
                    <Text style={tabLabelStyle(active)}>{tab.label}</Text>
                    <View style={countBadgeStyle(active)}>
                      <Text style={countBadgeTextStyle(active)}>{count}</Text>
                    </View>
                  </View>
                )}
              </Pressable>
            );
          })}
        </View>

        {/* Onglet Evenements */}
        {activeTab === 'events' && (
          <>
            {favoritedEvents.length === 0 ? (
              <EmptyState
                icon={
                  <Heart
                    size={30}
                    color={colors.goldBright}
                    fill="rgba(216,180,90,0.25)"
                    strokeWidth={1.5}
                  />
                }
                title="Aucun evenement en favori"
                description="Touchez le coeur sur un evenement pour le retrouver ici."
                actionLabel="Explorer"
                onAction={handleExplore}
              />
            ) : (
              <>
                <Text style={sectionTitleStyle}>Evenements sauvegardes</Text>
                <View style={{ gap: spacing.md }}>
                  {favoritedEvents.map((event) => (
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
                      isFavorited
                      onPress={() => handleEventPress(event.id)}
                      onReserve={() => handleReserve(event.id)}
                      onToggleFavorite={() => toggleEvent(event.id)}
                    />
                  ))}
                </View>
              </>
            )}
          </>
        )}

        {/* Onglet Lieux */}
        {activeTab === 'venues' && (
          <>
            {favoritedVenues.length === 0 ? (
              <EmptyState
                icon={
                  <Heart
                    size={30}
                    color={colors.goldBright}
                    fill="rgba(216,180,90,0.25)"
                    strokeWidth={1.5}
                  />
                }
                title="Aucun lieu en favori"
                description="Touchez le coeur sur un lieu pour le retrouver ici."
                actionLabel="Explorer"
                onAction={handleExplore}
              />
            ) : (
              <>
                <Text style={sectionTitleStyle}>Lieux sauvegardes</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ gap: spacing.md, paddingRight: spacing.lg }}
                >
                  {favoritedVenues.map((venue) => (
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
              </>
            )}
          </>
        )}
      </ScrollView>
      </View>
    </ScreenBackground>
  );
}

// ============================================================
// Styles
// ============================================================

const styles = {
  // -- En-tete hero --
  header: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
    borderBottomLeftRadius: radius.xxl,
    borderBottomRightRadius: radius.xxl,
    overflow: 'hidden',
  } as ViewStyle,
  headerGlow: {
    position: 'absolute',
    top: -90,
    right: -50,
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: 'rgba(216,180,90,0.09)',
  } as ViewStyle,
  headerRingLarge: {
    position: 'absolute',
    width: 130,
    height: 130,
    borderRadius: 65,
    borderWidth: 1.5,
    borderColor: `${colors.gold}2E`,
    top: -70,
    right: -40,
  } as ViewStyle,
  headerRingSmall: {
    position: 'absolute',
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 1.5,
    borderColor: `${colors.gold}26`,
    top: -24,
    right: 14,
  } as ViewStyle,
  headerGoldDot: {
    position: 'absolute',
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: `${colors.gold}45`,
    bottom: spacing.xl + 8,
    right: spacing.lg,
  } as ViewStyle,
  headerOverline: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 11,
    lineHeight: 15,
    letterSpacing: 2.2,
    color: colors.goldMuted,
    marginBottom: spacing.sm,
  } as TextStyle,
  headerTitle: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 28,
    lineHeight: 36,
    letterSpacing: -0.4,
    color: colors.text,
  } as TextStyle,
  headerSubtitle: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    lineHeight: 19,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  } as TextStyle,
  headerHairline: {
    position: 'absolute',
    bottom: 0,
    left: spacing.lg,
    right: spacing.lg,
    height: 1,
    backgroundColor: `${colors.gold}2E`,
  } as ViewStyle,
} as const;