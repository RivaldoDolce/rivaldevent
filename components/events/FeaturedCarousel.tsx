/**
 * FeaturedCarousel — carrousel plein écran premium « Noir & Or ».
 *
 * - Images hero 250px avec dégradé noir profond
 * - Badge « Tendance » or champagne avec halo
 * - Badge catégorie verre doré
 * - Titre Playfair Display, infos ivoire semi-transparentes
 * - Prix or + CTA « Réserver » dégradé or
 * - Pagination : pilule dorée extensible
 * - Auto-scroll toutes les 5 secondes
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Dimensions,
  type ViewStyle,
  type TextStyle,
  type ImageStyle,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { CalendarDays, MapPin, TrendingUp } from 'lucide-react-native';

import { colors, spacing, radius, gradients } from '@/lib/constants';
import { useHaptics } from '@/hooks/useHaptics';

// ============================================================
// Types
// ============================================================

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

interface FeaturedCarouselProps {
  readonly events: readonly FeaturedEvent[];
  readonly onPress?: (eventId: string) => void;
  readonly onReserve?: (eventId: string) => void;
  readonly testID?: string;
}

// ============================================================
// Constants
// ============================================================

const SCREEN_WIDTH = Dimensions.get('window').width;
const CAROUSEL_HEIGHT = 252;
const DOT_SIZE = 6;
const DOT_SPACING = 8;
const AUTO_SCROLL_INTERVAL = 5000;

// ============================================================
// Composant
// ============================================================

export const FeaturedCarousel = React.memo(function FeaturedCarousel({
  events,
  onPress,
  onReserve,
  testID,
}: FeaturedCarouselProps) {
  const { impact } = useHaptics();
  const scrollViewRef = useRef<ScrollView>(null);
  const autoScrollTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const currentIndexRef = useRef(0);

  const [activeIndex, setActiveIndex] = useState(0);

  const startAutoScroll = useCallback(() => {
    if (events.length <= 1) return;
    if (autoScrollTimer.current) {
      clearInterval(autoScrollTimer.current);
      autoScrollTimer.current = null;
    }
    autoScrollTimer.current = setInterval(() => {
      if (events.length === 0) return;
      const nextIndex = (currentIndexRef.current + 1) % events.length;
      scrollViewRef.current?.scrollTo({ x: nextIndex * SCREEN_WIDTH, animated: true });
      currentIndexRef.current = nextIndex;
      setActiveIndex(nextIndex);
    }, AUTO_SCROLL_INTERVAL);
  }, [events.length]);

  useEffect(() => {
    startAutoScroll();
    return () => {
      if (autoScrollTimer.current) clearInterval(autoScrollTimer.current);
    };
  }, [startAutoScroll]);

  const handleScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const offsetX = event.nativeEvent.contentOffset.x;
      const index = Math.round(offsetX / SCREEN_WIDTH);
      if (index !== currentIndexRef.current && index >= 0 && index < events.length) {
        currentIndexRef.current = index;
        setActiveIndex(index);
      }
    },
    [events.length],
  );

  const handleScrollBeginDrag = useCallback(() => {
    if (autoScrollTimer.current) {
      clearInterval(autoScrollTimer.current);
      autoScrollTimer.current = null;
    }
  }, []);

  const handleScrollEndDrag = useCallback(() => {
    setTimeout(() => startAutoScroll(), 3000);
  }, [startAutoScroll]);

  const handleCardPress = useCallback(
    (eventId: string) => {
      impact('light');
      onPress?.(eventId);
    },
    [impact, onPress],
  );

  const handleReserve = useCallback(
    (eventId: string) => {
      impact('medium');
      onReserve?.(eventId);
    },
    [impact, onReserve],
  );

  const formatPrice = useCallback((price: number): string => {
    const absPrice = Math.abs(price);
    if (absPrice >= 1000) {
      const formatted = absPrice.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '\u202F');
      return `${price < 0 ? '-' : ''}${formatted} F`;
    }
    return `${price} F`;
  }, []);

  if (events.length === 0) return null;

  return (
    <View style={styles.container} testID={testID}>
      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        onScrollBeginDrag={handleScrollBeginDrag}
        onScrollEndDrag={handleScrollEndDrag}
        decelerationRate="fast"
      >
        {events.map((event, index) => {
          const isFirst = index === 0;
          return (
            <Pressable
              key={event.id}
              onPress={() => handleCardPress(event.id)}
              style={styles.slide}
              accessibilityRole="button"
              accessibilityLabel={`Événement tendance: ${event.title}`}
            >
              <Image
                source={{ uri: event.image }}
                style={styles.image}
                contentFit="cover"
                transition={100}
                cachePolicy="memory-disk"
                priority="high"
                recyclingKey={event.id}
                accessibilityLabel={`Image de ${event.title}`}
              />

              {/* Dégradé de fond */}
              <LinearGradient
                colors={['rgba(10,9,8,0.02)', 'rgba(10,9,8,0.35)', 'rgba(10,9,8,0.92)']}
                locations={[0, 0.45, 1]}
                style={styles.gradientOverlay}
                pointerEvents="none"
              />

              {/* Filet doré haut */}
              <View pointerEvents="none" style={styles.goldEdge} />

              {/* Badges */}
              <View style={styles.badgeContainer} pointerEvents="box-none">
                <View style={styles.trendingBadge}>
                  <TrendingUp size={12} color={colors.onyx} strokeWidth={2.25} />
                  <Text style={styles.trendingBadgeText}>Tendance</Text>
                </View>
                <View style={styles.categoryBadge}>
                  <Text style={styles.categoryBadgeText} numberOfLines={1}>
                    {event.category}
                  </Text>
                </View>
              </View>

              {/* Contenu superposé */}
              <View style={styles.contentOverlay} pointerEvents="box-none">
                <Text style={styles.title} numberOfLines={2} ellipsizeMode="tail">
                  {event.title}
                </Text>

                <View style={styles.infoRow}>
                  <CalendarDays size={14} color={colors.goldMuted} strokeWidth={1.5} />
                  <Text style={styles.infoText}>{event.date}</Text>
                </View>

                <View style={styles.infoRow}>
                  <MapPin size={14} color={colors.goldMuted} strokeWidth={1.5} />
                  <Text style={styles.infoText} numberOfLines={1} ellipsizeMode="tail">
                    {event.location}
                  </Text>
                </View>

                <View style={styles.footerRow}>
                  <Text style={styles.price}>{formatPrice(event.price)}</Text>
                  <LinearGradient
                    colors={[...gradients.gold] as unknown as readonly [string, string, ...string[]]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.reserveButton}
                  >
                    <Pressable
                      onPress={() => handleReserve(event.id)}
                      style={styles.reserveInner}
                      hitSlop={4}
                      accessibilityRole="button"
                      accessibilityLabel="Réserver"
                    >
                      <Text style={styles.reserveText}>Réserver</Text>
                    </Pressable>
                  </LinearGradient>
                </View>
              </View>

              {!isFirst && <View style={styles.slideDivider} pointerEvents="none" />}
            </Pressable>
          );
        })}
      </ScrollView>

      {/* Pagination */}
      {events.length > 1 && (
        <View style={styles.dotsContainer}>
          {events.map((event, index) => {
            const isActive = index === activeIndex;
            return (
              <View
                key={`dot-${event.id}`}
                style={[
                  styles.dotBase,
                  {
                    backgroundColor: isActive ? colors.gold : 'rgba(255,255,255,0.16)',
                    width: isActive ? DOT_SIZE * 3 : DOT_SIZE,
                  },
                ]}
              />
            );
          })}
        </View>
      )}
    </View>
  );
});

// ============================================================
// Styles
// ============================================================

const styles = {
  container: {
    height: CAROUSEL_HEIGHT + 38,
    position: 'relative',
  } as ViewStyle,
  slide: {
    width: SCREEN_WIDTH,
    height: CAROUSEL_HEIGHT,
    position: 'relative',
  } as ViewStyle,
  image: {
    width: SCREEN_WIDTH,
    height: CAROUSEL_HEIGHT,
  } as ImageStyle,
  gradientOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    top: 0,
  } as ViewStyle,
  goldEdge: {
    position: 'absolute',
    top: 0,
    left: 16,
    right: 16,
    height: 1,
    backgroundColor: `${colors.goldBright}4D`,
  } as ViewStyle,
  slideDivider: {
    position: 'absolute',
    right: 0,
    top: spacing.lg,
    bottom: spacing.lg,
    width: 1,
    backgroundColor: `${colors.gold}2E`,
  } as ViewStyle,
  badgeContainer: {
    position: 'absolute',
    top: spacing.md,
    left: spacing.md + 2,
    gap: 6,
  } as ViewStyle,
  trendingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.gold,
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 5,
    gap: 5,
    alignSelf: 'flex-start',
    shadowColor: 'rgba(216,180,90,0.5)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.6,
    shadowRadius: 8,
    elevation: 4,
  } as ViewStyle,
  trendingBadgeText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 11,
    lineHeight: 15,
    color: colors.onyx,
    letterSpacing: 0.6,
  } as TextStyle,
  categoryBadge: {
    backgroundColor: 'rgba(10,9,8,0.62)',
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: `${colors.gold}40`,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 4,
    alignSelf: 'flex-start',
    maxWidth: 180,
  } as ViewStyle,
  categoryBadgeText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 11,
    lineHeight: 15,
    color: colors.goldBright,
    letterSpacing: 0.5,
  } as TextStyle,
  contentOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: spacing.lg,
  } as ViewStyle,
  title: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 23,
    lineHeight: 30,
    color: colors.text,
    letterSpacing: -0.3,
    marginBottom: spacing.sm,
  } as TextStyle,
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 6,
  } as ViewStyle,
  infoText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    lineHeight: 18,
    color: 'rgba(245,240,230,0.82)',
  } as TextStyle,
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
  } as ViewStyle,
  price: {
    fontFamily: 'Inter_700Bold',
    fontSize: 17,
    color: colors.goldBright,
    letterSpacing: 0.2,
  } as TextStyle,
  reserveButton: {
    borderRadius: radius.full,
    overflow: 'hidden',
    shadowColor: 'rgba(216,180,90,0.45)',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 5,
  } as ViewStyle,
  reserveInner: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm + 2,
    alignItems: 'center',
    justifyContent: 'center',
  } as ViewStyle,
  reserveText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 14,
    lineHeight: 20,
    color: colors.onyx,
    letterSpacing: 0.4,
  } as TextStyle,
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.md,
    gap: DOT_SPACING,
  } as ViewStyle,
  dotBase: {
    height: DOT_SIZE,
    borderRadius: DOT_SIZE / 2,
  } as ViewStyle,
} as const;