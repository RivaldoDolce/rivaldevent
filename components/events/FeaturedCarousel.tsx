/**
 * FeaturedCarousel - Carrousel plein ecran pour evenements tendance ("A la une").
 *
 * Design "Minimalisme Africain Camerounais" :
 * - Image hero 220px avec gradient overlay sombre en bas
 * - Badge "Tendance" en gold en haut a gauche
 * - Badge categorie en terracotta sous le badge tendance
 * - Titre Playfair Display en blanc sur l'image
 * - Infos (date, lieu) en blanc semi-transparent
 * - Prix en gold bold
 * - Pagination dots centrees sous le carrousel
 * - Auto-scroll toutes les 5 secondes
 *
 * Conventions :
 * - expo-image pour les images
 * - lucide-react-native pour les icones
 * - Animated natif uniquement (pas reanimated)
 * - Pas de Animated.event (bug RN : retourne un objet, pas une fonction)
 * - Pas de type any, pas d'emojis
 * - Design tokens depuis lib/constants.ts
 */

import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
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
import {
  CalendarDays,
  MapPin,
  TrendingUp,
} from 'lucide-react-native';

import { colors, spacing, radii } from '@/lib/constants';
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
const CAROUSEL_HEIGHT = 240;
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

  // -- Auto-scroll --
  const startAutoScroll = useCallback(() => {
    if (events.length <= 1) return;

    // Clear any existing timer first
    if (autoScrollTimer.current) {
      clearInterval(autoScrollTimer.current);
      autoScrollTimer.current = null;
    }

    autoScrollTimer.current = setInterval(() => {
      if (events.length === 0) return;
      const nextIndex = (currentIndexRef.current + 1) % events.length;
      scrollViewRef.current?.scrollTo({
        x: nextIndex * SCREEN_WIDTH,
        animated: true,
      });
      currentIndexRef.current = nextIndex;
      setActiveIndex(nextIndex);
    }, AUTO_SCROLL_INTERVAL);
  }, [events.length]);

  useEffect(() => {
    startAutoScroll();
    return () => {
      if (autoScrollTimer.current) {
        clearInterval(autoScrollTimer.current);
      }
    };
  }, [startAutoScroll]);

  // -- Scroll handler (native callback, NOT Animated.event) --
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

  // -- Reset auto-scroll on manual interaction --
  const handleScrollBeginDrag = useCallback(() => {
    if (autoScrollTimer.current) {
      clearInterval(autoScrollTimer.current);
      autoScrollTimer.current = null;
    }
  }, []);

  const handleScrollEndDrag = useCallback(() => {
    // Restart auto-scroll after 3 seconds of inactivity
    setTimeout(() => {
      startAutoScroll();
    }, 3000);
  }, [startAutoScroll]);

  // -- Press handlers --
  const handleCardPress = useCallback((eventId: string) => {
    impact('light');
    onPress?.(eventId);
  }, [impact, onPress]);

  const handleReserve = useCallback((eventId: string) => {
    impact('medium');
    onReserve?.(eventId);
  }, [impact, onReserve]);

  // -- Format price (formatage africain : 5 000 FCFA, 15 000 FCFA) --
  const formatPrice = useCallback((price: number, currency: string): string => {
    const absPrice = Math.abs(price);
    if (absPrice >= 1000) {
      const formatted = absPrice.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '\u202F');
      return `${price < 0 ? '-' : ''}${formatted} ${currency}`;
    }
    return `${price} ${currency}`;
  }, []);

  if (events.length === 0) return null;

  // -- Styles --
  const containerStyle: ViewStyle = {
    height: CAROUSEL_HEIGHT + 40, // Extra space for dots
    position: 'relative',
  };

  const slideStyle: ViewStyle = {
    width: SCREEN_WIDTH,
    height: CAROUSEL_HEIGHT,
    position: 'relative',
  };

  const imageStyle: ImageStyle = {
    width: SCREEN_WIDTH,
    height: CAROUSEL_HEIGHT,
  };

  const gradientOverlayStyle: ViewStyle = {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: CAROUSEL_HEIGHT * 0.65,
    backgroundColor: 'rgba(26,24,22,0.55)',
  };

  const badgeContainerStyle: ViewStyle = {
    position: 'absolute',
    top: spacing.md,
    left: spacing.md,
    gap: spacing.xs,
  };

  const trendingBadgeStyle: ViewStyle = {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.gold,
    borderRadius: radii.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    gap: 4,
    alignSelf: 'flex-start',
  };

  const trendingBadgeTextStyle: TextStyle = {
    fontFamily: 'Inter-Bold',
    fontSize: 12,
    lineHeight: 16,
    color: colors.onyx,
    letterSpacing: 0.5,
  };

  const categoryBadgeStyle: ViewStyle = {
    backgroundColor: colors.terracotta,
    borderRadius: radii.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    alignSelf: 'flex-start',
  };

  const categoryBadgeTextStyle: TextStyle = {
    fontFamily: 'Inter-SemiBold',
    fontSize: 12,
    lineHeight: 16,
    color: colors.white,
    letterSpacing: 0.3,
  };

  const contentOverlayStyle: ViewStyle = {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: spacing.lg,
  };

  const titleStyle: TextStyle = {
    fontFamily: 'PlayfairDisplay-Bold',
    fontSize: 22,
    lineHeight: 28,
    color: colors.white,
    letterSpacing: -0.3,
    marginBottom: spacing.xs,
  };

  const infoRowStyle: ViewStyle = {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs / 2,
  };

  const infoTextStyle: TextStyle = {
    fontFamily: 'Inter-Regular',
    fontSize: 13,
    lineHeight: 18,
    color: 'rgba(255,255,255,0.85)',
    marginLeft: spacing.xs,
  };

  const footerRowStyle: ViewStyle = {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
  };

  const priceStyle: TextStyle = {
    fontFamily: 'Inter-Bold',
    fontSize: 16,
    color: colors.gold,
  };

  const reserveButtonStyle: ViewStyle = {
    backgroundColor: colors.terracotta,
    borderRadius: radii.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  };

  const reserveTextStyle: TextStyle = {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    lineHeight: 20,
    color: colors.white,
  };

  const dotsContainerStyle: ViewStyle = {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.md,
    gap: DOT_SPACING,
  };

  const dotBaseStyle: ViewStyle = {
    width: DOT_SIZE,
    height: DOT_SIZE,
    borderRadius: DOT_SIZE / 2,
  };

  return (
    <View style={containerStyle} testID={testID}>
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
        {events.map((event) => (
          <Pressable
            key={event.id}
            onPress={() => handleCardPress(event.id)}
            style={slideStyle}
            accessibilityRole="button"
            accessibilityLabel={`Evenement tendance: ${event.title}`}
          >
            {/* Image hero */}
            <Image
              source={{ uri: event.image }}
              style={imageStyle}
              contentFit="cover"
              transition={400}
              cachePolicy="memory-disk"
              accessibilityLabel={`Image de ${event.title}`}
            />

            {/* Gradient overlay */}
            <View style={gradientOverlayStyle} pointerEvents="none" />

            {/* Badges superposes en haut a gauche */}
            <View style={badgeContainerStyle} pointerEvents="none">
              <View style={trendingBadgeStyle}>
                <TrendingUp size={12} color={colors.onyx} strokeWidth={2} />
                <Text style={trendingBadgeTextStyle}>Tendance</Text>
              </View>
              <View style={categoryBadgeStyle}>
                <Text style={categoryBadgeTextStyle}>{event.category}</Text>
              </View>
            </View>

            {/* Contenu textuel superpose */}
            <View style={contentOverlayStyle} pointerEvents="box-none">
              <Text style={titleStyle} numberOfLines={2} ellipsizeMode="tail">
                {event.title}
              </Text>

              <View style={infoRowStyle}>
                <CalendarDays size={14} color="rgba(255,255,255,0.8)" strokeWidth={1.5} />
                <Text style={infoTextStyle}>{event.date}</Text>
              </View>

              <View style={infoRowStyle}>
                <MapPin size={14} color="rgba(255,255,255,0.8)" strokeWidth={1.5} />
                <Text style={infoTextStyle} numberOfLines={1} ellipsizeMode="tail">
                  {event.location}
                </Text>
              </View>

              <View style={footerRowStyle}>
                <Text style={priceStyle}>
                  {formatPrice(event.price, event.currency)}
                </Text>
                <Pressable
                  onPress={() => handleReserve(event.id)}
                  style={reserveButtonStyle}
                  hitSlop={4}
                  accessibilityRole="button"
                  accessibilityLabel="Reserver"
                >
                  <Text style={reserveTextStyle}>Reserver</Text>
                </Pressable>
              </View>
            </View>
          </Pressable>
        ))}
      </ScrollView>

      {/* Pagination dots */}
      {events.length > 1 && (
        <View style={dotsContainerStyle}>
          {events.map((event, index) => {
            const isActive = index === activeIndex;
            return (
              <View
                key={`dot-${event.id}`}
                style={[
                  dotBaseStyle,
                  {
                    backgroundColor: isActive ? colors.terracotta : `${colors.stone}40`,
                    width: isActive ? DOT_SIZE * 2.5 : DOT_SIZE,
                    borderRadius: DOT_SIZE / 2,
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
