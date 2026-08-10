/**
 * Mes favoris — evenements et lieux mis en favori.
 *
 * Design "Minimalisme Africain Camerounais" :
 * - En-tete derivee foret (ScreenHeader) avec compteurs
 * - Segmented control Evenements / Lieux avec badges de comptage
 * - Evenements : EventCard full-width (meme rendu que l'accueil)
 * - Lieux : VenueCard horizontale (meme rendu que l'accueil)
 * - Etat vide premium avec icone coeur + CTA vers Explorer
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
import { Heart } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, spacing, radius, shadows, ROUTES } from '@/lib/constants';
import { useHaptics } from '@/hooks/useHaptics';
import { useFavoritesStore } from '@/stores/favorites-store';
import { ScreenHeader } from '@/components/profile/ScreenHeader';
import { EventCard } from '@/components/events/EventCard';
import { VenueCard } from '@/components/venues/VenueCard';
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
    impact('light');
    router.push({
      pathname: ROUTES.VENUE_DETAIL,
      params: { id: venueId },
    });
  }, [impact, router]);

  const handleExplore = useCallback(() => {
    impact('light');
    router.push(ROUTES.EXPLORE);
  }, [impact, router]);

  // -- Styles dynamiques --
  const contentStyle: ViewStyle = {
    paddingTop: spacing.lg,
    paddingHorizontal: spacing.lg,
    paddingBottom: insets.bottom + spacing.xxl + 40,
  };

  const tabBarStyle: ViewStyle = {
    flexDirection: 'row',
    backgroundColor: `${colors.forest}0F`,
    borderRadius: radius.full,
    padding: 3,
    marginTop: spacing.lg,
  };

  const tabStyle = (active: boolean): ViewStyle => ({
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.full,
    paddingVertical: spacing.sm - 2,
    backgroundColor: active ? colors.forest : 'transparent',
    ...(active
      ? {
          shadowColor: colors.forestDeep,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.18,
          shadowRadius: 6,
          elevation: 3,
        }
      : null),
  });

  const tabLabelStyle = (active: boolean): TextStyle => ({
    fontFamily: active ? 'Inter-Bold' : 'Inter-SemiBold',
    fontSize: 13,
    lineHeight: 18,
    color: active ? colors.sand : colors.stone,
  });

  const countBadgeStyle = (active: boolean): ViewStyle => ({
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 6,
    paddingHorizontal: 5,
    backgroundColor: active ? `${colors.sand}24` : `${colors.stone}14`,
  });

  const countBadgeTextStyle = (active: boolean): TextStyle => ({
    fontFamily: 'Inter-Bold',
    fontSize: 11,
    lineHeight: 14,
    color: active ? colors.sand : colors.stone,
  });

  const sectionTitleStyle: TextStyle = {
    fontFamily: 'PlayfairDisplay-SemiBold',
    fontSize: 18,
    lineHeight: 24,
    color: colors.text,
    letterSpacing: -0.2,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScreenHeader
        title="Mes favoris"
        subtitle={
          activeTab === 'events'
            ? `${favoritedEvents.length} evenement${favoritedEvents.length > 1 ? 's' : ''} sauvegardes`
            : `${favoritedVenues.length} lieu${favoritedVenues.length > 1 ? 'x' : ''} sauvegarde${favoritedVenues.length > 1 ? 's' : ''}`
        }
      />

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
                style={tabStyle(active)}
                accessibilityRole="tab"
                accessibilityState={{ selected: active }}
              >
                <Text style={tabLabelStyle(active)}>{tab.label}</Text>
                <View style={countBadgeStyle(active)}>
                  <Text style={countBadgeTextStyle(active)}>{count}</Text>
                </View>
              </Pressable>
            );
          })}
        </View>

        {/* Onglet Evenements */}
        {activeTab === 'events' && (
          <>
            {favoritedEvents.length === 0 ? (
              <EmptyState
                onExplore={handleExplore}
                title="Aucun evenement en favori"
                subtitle="Touchez le coeur sur un evenement pour le retrouver ici."
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
                onExplore={handleExplore}
                title="Aucun lieu en favori"
                subtitle="Touchez le coeur sur un lieu pour le retrouver ici."
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
  );
}

// ============================================================
// Etat vide
// ============================================================

interface EmptyStateProps {
  readonly title: string;
  readonly subtitle: string;
  readonly onExplore: () => void;
}

function EmptyState({ title, subtitle, onExplore }: EmptyStateProps) {
  const cardStyle: ViewStyle = {
    alignItems: 'center',
    paddingVertical: spacing.xxl * 2,
    paddingHorizontal: spacing.xl,
    marginTop: spacing.xxl,
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    ...shadows.card,
  };

  const heartCircleStyle: ViewStyle = {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: `${colors.terracotta}14`,
    borderWidth: 1,
    borderColor: `${colors.terracotta}28`,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  };

  const buttonStyle: ViewStyle = {
    marginTop: spacing.lg,
    backgroundColor: colors.terracotta,
    borderRadius: radius.full,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm + 2,
    ...shadows.card,
  };

  const buttonTextStyle: TextStyle = {
    fontFamily: 'Inter-Bold',
    fontSize: 14,
    lineHeight: 20,
    color: colors.white,
  };

  return (
    <View style={cardStyle}>
      <View style={heartCircleStyle}>
        <Heart size={30} color={colors.terracotta} fill="none" strokeWidth={1.5} />
      </View>
      <Text style={{
        fontFamily: 'PlayfairDisplay-SemiBold',
        fontSize: 17,
        lineHeight: 24,
        color: colors.text,
        textAlign: 'center',
      }}>
        {title}
      </Text>
      <Text style={{
        fontFamily: 'Inter-Regular',
        fontSize: 13,
        lineHeight: 19,
        color: colors.stone,
        textAlign: 'center',
        marginTop: spacing.xs / 2,
        maxWidth: 260,
      }}>
        {subtitle}
      </Text>
      <Pressable
        onPress={onExplore}
        style={buttonStyle}
        accessibilityRole="button"
        accessibilityLabel="Explorer les evenements"
      >
        <Text style={buttonTextStyle}>Explorer</Text>
      </Pressable>
    </View>
  );
}