/**
 * VenueCard — carte lieu premium « Noir & Or ».
 *
 * - Surface ornée, filet doré subtil, coins 20px (même grammaire qu'EventCard)
 * - Image 160px avec dégradé sombre de fond
 * - Badge verre doré, note en étoile or champagne
 * - Nom Playfair, localisation avec icône or tamisée
 */

import React, { useCallback, useRef } from 'react';
import {
  View,
  Text,
  Pressable,
  Animated,
  type ViewStyle,
  type TextStyle,
  type ImageStyle,
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { MapPin, Star } from 'lucide-react-native';

import { colors, spacing, radius, shadows } from '@/lib/constants';
import { useHaptics } from '@/hooks/useHaptics';

// ============================================================
// Types
// ============================================================

interface VenueCardProps {
  readonly id: string;
  readonly name: string;
  readonly image: string;
  readonly location: string;
  readonly rating?: number;
  readonly badge?: string | null;
  readonly onPress?: () => void;
  readonly testID?: string;
}

// ============================================================
// Constantes
// ============================================================

const CARD_WIDTH = 216;
const IMAGE_HEIGHT = 150;

// ============================================================
// Composant
// ============================================================

export const VenueCard = React.memo(function VenueCard({
  //id,
  name,
  image,
  location,
  rating,
  badge,
  onPress,
  testID,
}: VenueCardProps) {
  const { impact } = useHaptics();
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = useCallback(() => {
    if (!onPress) return;
    Animated.spring(scaleAnim, {
      toValue: 0.96,
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

  const handlePress = useCallback(() => {
    impact('light');
    onPress?.();
  }, [impact, onPress]);

  return (
    <Animated.View
      style={[
        {
          width: CARD_WIDTH,
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
      <Pressable
        testID={testID}
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        accessibilityRole="button"
        accessibilityLabel={`Lieu: ${name}`}
      >
        {/* Image hero avec dégradé sombre */}
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: image }}
            style={styles.image}
            contentFit="cover"
            transition={300}
            cachePolicy="memory-disk"
            accessibilityLabel={`Image de ${name}`}
          />
          <LinearGradient
            colors={['rgba(10,9,8,0.02)', 'rgba(10,9,8,0.5)']}
            style={styles.imageGradient}
            pointerEvents="none"
          />

          {/* Badge optionnel — pastille verre doré */}
          {badge ? (
            <View style={styles.badge}>
              <Text style={styles.badgeText} numberOfLines={1}>
                {badge}
              </Text>
            </View>
          ) : null}

          {/* Note — étoile or */}
          {rating !== undefined && rating > 0 && (
            <View style={styles.ratingPill}>
              <Star size={11} color={colors.goldBright} fill={colors.gold} strokeWidth={1.5} />
              <Text style={styles.ratingText}>{rating.toFixed(1)}</Text>
            </View>
          )}
        </View>

        {/* Contenu */}
        <View style={styles.content}>
          <Text style={styles.name} numberOfLines={1} ellipsizeMode="tail">
            {name}
          </Text>

          <View style={styles.locationRow}>
            <MapPin size={13} color={colors.goldMuted} strokeWidth={1.5} />
            <Text style={styles.locationText} numberOfLines={1} ellipsizeMode="tail">
              {location}
            </Text>
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
});

// ============================================================
// Styles
// ============================================================

const styles = {
  imageContainer: {
    height: IMAGE_HEIGHT,
    position: 'relative',
  } as ViewStyle,
  image: {
    width: '100%',
    height: IMAGE_HEIGHT,
  } as ImageStyle,
  imageGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  } as ViewStyle,
  badge: {
    position: 'absolute',
    top: spacing.sm + 2,
    left: spacing.sm + 2,
    maxWidth: CARD_WIDTH - 60,
    backgroundColor: 'rgba(10,9,8,0.62)',
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: `${colors.gold}40`,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 4,
  } as ViewStyle,
  badgeText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 11,
    lineHeight: 15,
    color: colors.goldBright,
    letterSpacing: 0.5,
  } as TextStyle,
  ratingPill: {
    position: 'absolute',
    bottom: spacing.sm + 2,
    right: spacing.sm + 2,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(10,9,8,0.62)',
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: `${colors.gold}40`,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
  } as ViewStyle,
  ratingText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 11,
    lineHeight: 14,
    color: colors.goldBright,
  } as TextStyle,
  content: {
    padding: spacing.md,
  } as ViewStyle,
  name: {
    fontFamily: 'PlayfairDisplay_600SemiBold',
    fontSize: 16,
    lineHeight: 22,
    color: colors.text,
    letterSpacing: -0.2,
    marginBottom: 5,
  } as TextStyle,
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  } as ViewStyle,
  locationText: {
    flex: 1,
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    lineHeight: 17,
    color: colors.textSecondary,
  } as TextStyle,
} as const;