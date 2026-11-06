/**
 * Mes favoris — evenements et lieux mis en favori.
 *
 * Design « Noir & Or » fantastique :
 * - ScreenBackground + halos décoratifs
 * - En-tete hero degrade noir profond avec halo doré, anneaux et filet or bas
 * - Overline or + titre Playfair Display 28px + compteur pastille or avec Sparkles
 * - Segmented control Evenements / Lieux : pastilles verre, actif degrade or
 * - Evenements : EventCard full-width
 * - Lieux : VenueCard horizontale
 * - EmptyState premium : halo doré + Sparkles + CTA or pleine largeur
 *
 * Source de verite : stores/favorites-store.ts
 * Toutes les couleurs depuis lib/constants.ts.
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
import { Heart, MapPin } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, gradients, spacing, radius, shadows, ROUTES } from '@/lib/constants';
import { ScreenBackground } from '@/components/ui/ScreenBackground';
import { useHaptics } from '@/hooks/useHaptics';
import { useFavoritesStore } from '@/stores/favorites-store';
import { EventCard } from '@/components/events/EventCard';
import { VenueCard } from '@/components/venues/VenueCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/Button';
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
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: `${colors.gold}18`,
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

  const totalCount = activeTab === 'events' ? favoritedEvents.length : favoritedVenues.length;

  return (
    <ScreenBackground>
      <View style={{ flex: 1, backgroundColor: 'transparent' }}>
        {/* Halos décoratifs verre fumé */}
        <View pointerEvents="none" style={styles.bgHalo} />
        <View pointerEvents="none" style={styles.bgHalo2} />

        {/* ============================================
            EN-TETE HERO — degrade noir + halo doré + Sparkles
            ============================================ */}
        <LinearGradient
          colors={[...gradients.hero] as unknown as readonly [string, string, ...string[]]}
          start={{ x: 0.1, y: 0 }}
          end={{ x: 0.9, y: 1 }}
          style={[styles.header, { paddingTop: insets.top + spacing.lg }]}
        >
          <View pointerEvents="none" style={styles.headerGlow} />
          <View pointerEvents="none" style={styles.headerRingLarge} />
          <View pointerEvents="none" style={styles.headerRingSmall} />
          <View pointerEvents="none" style={styles.headerGoldDot} />
          <LinearGradient
            colors={['rgba(216,180,90,0.0)', 'rgba(216,180,90,0.12)', 'rgba(216,180,90,0.0)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.headerShimmer}
            pointerEvents="none"
          />

          <View style={styles.headerOverlineRow}>
            <Heart size={12} color={colors.gold} fill="rgba(216,180,90,0.25)" strokeWidth={1.75} />
            <Text style={styles.headerOverline}>VOTRE SELECTION</Text>
          </View>
          <View style={styles.headerTitleRow}>
            <Text style={styles.headerTitle}>Mes favoris</Text>
            {/* Compteur pastille or */}
            <View style={styles.headerCountPill}>
              <Heart size={12} color={colors.onyx} fill="rgba(10,9,8,0.12)" strokeWidth={2} />
              <Text style={styles.headerCountText}>{totalCount}</Text>
            </View>
          </View>
          <Text style={styles.headerSubtitle}>
            {activeTab === 'events'
              ? `${favoritedEvents.length} evenement${favoritedEvents.length > 1 ? 's' : ''} sauvegarde${favoritedEvents.length > 1 ? 's' : ''}`
              : `${favoritedVenues.length} lieu${favoritedVenues.length > 1 ? 'x' : ''} sauvegarde${favoritedVenues.length > 1 ? 's' : ''}`}
          </Text>
          <View pointerEvents="none" style={styles.headerHairline} />
        </LinearGradient>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={contentStyle}>
          {/* Segmented control */}
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
                <View style={styles.emptyWrap}>
                  <View style={styles.emptyHalo} pointerEvents="none" />
                  <EmptyState
                    icon={
                      <View style={styles.emptyIconHalo}>
                        <Heart size={30} color={colors.goldBright} fill="rgba(216,180,90,0.25)" strokeWidth={1.5} />
                        <View style={styles.emptySparkle}>
                          <Heart size={12} color={colors.gold} fill="rgba(216,180,90,0.35)" strokeWidth={1.75} />
                        </View>
                      </View>
                    }
                    title="Aucun evenement en favori"
                    description="Touchez le coeur sur un evenement pour le retrouver ici. Votre collection vous attend."
                  />
                  <View style={styles.emptyCtaWrap}>
                    <Button variant="primary" size="lg" fullWidth onPress={handleExplore}>
                      Explorer les evenements
                    </Button>
                  </View>
                </View>
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
                <View style={styles.emptyWrap}>
                  <View style={styles.emptyHalo} pointerEvents="none" />
                  <EmptyState
                    icon={
                      <View style={styles.emptyIconHalo}>
                        <Heart size={30} color={colors.goldBright} fill="rgba(216,180,90,0.25)" strokeWidth={1.5} />
                        <View style={styles.emptySparkle}>
                          <MapPin size={12} color={colors.gold} strokeWidth={1.75} />
                        </View>
                      </View>
                    }
                    title="Aucun lieu en favori"
                    description="Touchez le coeur sur un lieu pour le retrouver ici."
                  />
                  <View style={styles.emptyCtaWrap}>
                    <Button variant="primary" size="lg" fullWidth onPress={handleExplore}>
                      Explorer les lieux
                    </Button>
                  </View>
                </View>
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
  bgHalo: {
    position: 'absolute',
    top: 160,
    left: -50,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(216,180,90,0.045)',
  } as ViewStyle,
  bgHalo2: {
    position: 'absolute',
    top: 520,
    right: -30,
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(255,255,255,0.03)',
  } as ViewStyle,
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
  headerShimmer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1,
  } as ViewStyle,
  headerOverlineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: spacing.sm,
  } as ViewStyle,
  headerOverline: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 11,
    lineHeight: 15,
    letterSpacing: 2.2,
    color: colors.goldMuted,
  } as TextStyle,
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  } as ViewStyle,
  headerTitle: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 28,
    lineHeight: 36,
    letterSpacing: -0.4,
    color: colors.text,
    flex: 1,
  } as TextStyle,
  headerCountPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.gold,
    borderRadius: radius.full,
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginLeft: spacing.md,
    ...shadows.goldGlowSoft,
  } as ViewStyle,
  headerCountText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 13,
    lineHeight: 16,
    color: colors.onyx,
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
  emptyWrap: {
    marginTop: spacing.xl,
    backgroundColor: 'rgba(30,26,22,0.55)',
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: `${colors.gold}12`,
    overflow: 'hidden',
  } as ViewStyle,
  emptyHalo: {
    position: 'absolute',
    top: -30,
    right: -30,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(216,180,90,0.06)',
  } as ViewStyle,
  emptyIconHalo: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: 'rgba(216,180,90,0.12)',
    borderWidth: 1,
    borderColor: `${colors.gold}35`,
    alignItems: 'center',
    justifyContent: 'center',
  } as ViewStyle,
  emptySparkle: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.elevated,
    borderWidth: 1,
    borderColor: `${colors.gold}30`,
    alignItems: 'center',
    justifyContent: 'center',
  } as ViewStyle,
  emptyCtaWrap: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  } as ViewStyle,
} as const;
