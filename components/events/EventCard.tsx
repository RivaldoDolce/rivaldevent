/**
 * EventCard — carte événement premium « Noir & Or ».
 *
 * - Surface ornée, filet doré subtil, coins 20px
 * - Image hero avec dégradé sombre de fond
 * - Badge catégorie verre doré, favori pastille verre
 * - Titre Playfair, infos avec icônes or tamisées
 * - Prix or champagne + CTA « Réserver » dégradé or
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  Animated,
  type ViewStyle,
  type TextStyle,
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Heart, CalendarDays, MapPin, Clock } from 'lucide-react-native';

import { colors, spacing, radius, shadows, gradients } from '@/lib/constants';
import { useHaptics } from '@/hooks/useHaptics';
import { Avatar } from '@/components/ui/Avatar';

// ============================================================
// Types
// ============================================================

interface EventCardProps {
  readonly id: string;
  readonly title: string;
  readonly image: string;
  readonly date: string;
  readonly location: string;
  readonly time: string;
  readonly organizerName: string;
  readonly organizerAvatar?: string | null;
  readonly price: number;
  readonly currency?: string;
  readonly category: string;
  readonly isFeatured?: boolean;
  readonly isFavorited?: boolean;
  readonly onPress?: () => void;
  readonly onReserve?: () => void;
  readonly onToggleFavorite?: () => void;
  readonly testID?: string;
}

// ============================================================
// Constantes
// ============================================================

const IMAGE_HEIGHT = 170;
const FAVORITE_BUTTON_SIZE = 34;

// ============================================================
// Composant
// ============================================================

export const EventCard = React.memo(function EventCard({
  title,
  image,
  date,
  location,
  time,
  organizerName,
  organizerAvatar,
  price,
  category,
  isFeatured = false,
  isFavorited = false,
  onPress,
  onReserve,
  onToggleFavorite,
  testID,
}: EventCardProps) {
  const { impact } = useHaptics();
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const [favorited, setFavorited] = useState(isFavorited);

  useEffect(() => {
    setFavorited(isFavorited);
  }, [isFavorited]);

  const handlePressIn = useCallback(() => {
    if (!onPress) return;
    Animated.spring(scaleAnim, {
      toValue: 0.97,
      damping: 15,
      stiffness: 300,
      useNativeDriver: true,
    }).start();
  }, [onPress, scaleAnim]);

  const handlePressOut = useCallback(() => {
    if (!onPress) return;
    Animated.spring(scaleAnim, {
      toValue: 1,
      damping: 15,
      stiffness: 300,
      useNativeDriver: true,
    }).start();
  }, [onPress, scaleAnim]);

  const handleFavorite = useCallback(() => {
    setFavorited((prev) => !prev);
    impact('light');
    onToggleFavorite?.();
  }, [impact, onToggleFavorite]);

  const handleReserve = useCallback(() => {
    impact('medium');
    onReserve?.();
  }, [impact, onReserve]);

  const formattedPrice = React.useMemo(() => {
    const absPrice = Math.abs(price);
    if (absPrice >= 1000) {
      const formatted = absPrice.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '\u202F');
      return `${price < 0 ? '-' : ''}${formatted} F`;
    }
    return `${price} F`;
  }, [price]);

  return (
    <Animated.View
      testID={testID}
      style={[
        {
          backgroundColor: colors.elevated,
          borderRadius: radius.lg,
          overflow: 'hidden',
          borderWidth: 1,
          borderColor: `${colors.gold}1F`,
          ...shadows.eventCard,
        },
        { transform: [{ scale: scaleAnim }] },
      ]}
    >
      <Pressable onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} accessibilityRole="button" accessibilityLabel={`Événement: ${title}`}>
        {/* Image hero */}
        <View style={{ height: IMAGE_HEIGHT, position: 'relative' }}>
          <Image
            source={{ uri: image }}
            style={{ width: '100%', height: IMAGE_HEIGHT }}
            contentFit="cover"
            transition={100}
            cachePolicy="memory-disk"
            recyclingKey={image}
            priority="low"
            accessibilityLabel={`Image de ${title}`}
          />
          {/* Dégradé de fond */}
          <LinearGradient
            colors={['rgba(10,9,8,0.05)', 'rgba(10,9,8,0.02)', 'rgba(10,9,8,0.5)']}
            locations={[0, 0.55, 1]}
            style={StyleAbsoluteFill}
            pointerEvents="none"
          />

          {/* Badge catégorie — verre doré */}
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryText} numberOfLines={1}>
              {category}
            </Text>
          </View>

          {/* À la une */}
          {isFeatured && (
            <View style={styles.featuredBadge}>
              <Text style={styles.featuredText}>À la une</Text>
            </View>
          )}

          {/* Favori */}
          <Pressable
            onPress={handleFavorite}
            style={styles.favoriteButton}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={favorited ? 'Retirer des favoris' : 'Ajouter aux favoris'}
          >
            <Heart
              size={16}
              color={favorited ? colors.terracotta : colors.text}
              fill={favorited ? colors.terracotta : 'none'}
              strokeWidth={2}
            />
          </Pressable>
        </View>

        {/* Contenu */}
        <View style={styles.content}>
          <Text style={styles.title} numberOfLines={1} ellipsizeMode="tail">
            {title}
          </Text>

          <View style={styles.detailRow}>
            <CalendarDays size={14} color={colors.goldMuted} strokeWidth={1.5} />
            <Text style={styles.detailText}>{date}</Text>
            <View style={styles.detailDivider} />
            <Clock size={14} color={colors.goldMuted} strokeWidth={1.5} />
            <Text style={styles.detailText}>{time}</Text>
          </View>

          <View style={styles.detailRow}>
            <MapPin size={14} color={colors.goldMuted} strokeWidth={1.5} />
            <Text style={[styles.detailText, { flex: 1 }]} numberOfLines={1} ellipsizeMode="tail">
              {location}
            </Text>
          </View>

          <View style={styles.organizerRow}>
            <Avatar source={organizerAvatar} fallback={organizerName} size="xs" />
            <Text style={styles.organizerName} numberOfLines={1}>
              {organizerName}
            </Text>
          </View>

          <View style={styles.footer}>
            <View>
              <Text style={styles.priceLabel}>À partir de</Text>
              <Text style={styles.priceValue}>{formattedPrice}</Text>
            </View>

            <LinearGradient
              colors={[...gradients.gold] as unknown as readonly [string, string, ...string[]]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.reserveButton}
            >
              <Pressable onPress={handleReserve} style={styles.reserveInner} hitSlop={4} accessibilityRole="button" accessibilityLabel="Réserver">
                <Text style={styles.reserveText}>Réserver</Text>
              </Pressable>
            </LinearGradient>
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
});

// ============================================================
// Styles
// ============================================================

const StyleAbsoluteFill: ViewStyle = {
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
};

const styles = {
  categoryBadge: {
    position: 'absolute',
    top: spacing.sm + 2,
    left: spacing.sm + 2,
    backgroundColor: 'rgba(10,9,8,0.62)',
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: `${colors.gold}40`,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 4,
    maxWidth: 160,
  } as ViewStyle,
  categoryText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 11,
    lineHeight: 15,
    color: colors.goldBright,
    letterSpacing: 0.5,
  } as TextStyle,
  featuredBadge: {
    position: 'absolute',
    top: spacing.sm + 2,
    left: spacing.sm + 2,
    marginTop: 26,
    backgroundColor: 'rgba(216,180,90,0.9)',
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 4,
  } as ViewStyle,
  featuredText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 11,
    lineHeight: 15,
    color: colors.onyx,
    letterSpacing: 0.6,
  } as TextStyle,
  favoriteButton: {
    position: 'absolute',
    top: spacing.sm + 2,
    right: spacing.sm + 2,
    width: FAVORITE_BUTTON_SIZE,
    height: FAVORITE_BUTTON_SIZE,
    borderRadius: radius.full,
    backgroundColor: 'rgba(10,9,8,0.62)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
    justifyContent: 'center',
    alignItems: 'center',
  } as ViewStyle,
  content: {
    padding: spacing.md,
  } as ViewStyle,
  title: {
    fontFamily: 'PlayfairDisplay_600SemiBold',
    fontSize: 18,
    lineHeight: 24,
    color: colors.text,
    letterSpacing: -0.2,
    marginBottom: spacing.sm,
  } as TextStyle,
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
    gap: 5,
  } as ViewStyle,
  detailDivider: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: colors.textFaint,
    marginHorizontal: spacing.sm,
  } as ViewStyle,
  detailText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    lineHeight: 18,
    color: colors.textSecondary,
  } as TextStyle,
  organizerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing.md,
  } as ViewStyle,
  organizerName: {
    fontFamily: 'Inter_500Medium',
    fontSize: 13,
    lineHeight: 18,
    color: colors.textMuted,
    marginLeft: spacing.sm,
  } as TextStyle,
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  } as ViewStyle,
  priceLabel: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    lineHeight: 14,
    color: colors.textMuted,
    letterSpacing: 0.4,
  } as TextStyle,
  priceValue: {
    fontFamily: 'Inter_700Bold',
    fontSize: 17,
    lineHeight: 22,
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
} as const;