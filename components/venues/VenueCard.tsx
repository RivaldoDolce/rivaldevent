/**
 * VenueCard - Carte horizontale compacte pour lieu.
 *
 * Design "Minimalisme Africain Camerounais" :
 * - Largeur fixe 200px, image 120px en haut
 * - Nom du lieu (semi-bold 14px) + Rating (Star gold + nombre)
 * - Localisation (MapPin + texte)
 * - Badge optionnel (terracotta bg) en haut a droite de l'image
 * - Fond blanc, radius 16px, ombre subtile
 * - Press feedback avec Animated natif (pas reanimated)
 *
 * Utilise expo-image (pas React Native Image).
 * Utilise lucide-react-native pour les icones.
 */

import React, { useCallback, useRef } from 'react';
import {
  View,
  Text,
  Pressable,
  Animated,
  type ViewStyle,
  type TextStyle,
} from 'react-native';
import { Image } from 'expo-image';
import { MapPin, Star } from 'lucide-react-native';

import { colors, spacing, radii, shadows, typography } from '@/lib/constants';
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

const CARD_WIDTH = 200;
const IMAGE_HEIGHT = 120;

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

  // -- Styles --
  const cardStyle: ViewStyle = {
    width: CARD_WIDTH,
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    overflow: 'hidden',
    ...shadows.card,
  };

  const imageContainerStyle: ViewStyle = {
    height: IMAGE_HEIGHT,
    position: 'relative',
  };

  const badgeStyle: ViewStyle = {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    backgroundColor: `${colors.gold}E6`,
    borderRadius: radii.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  };

  const badgeTextStyle: TextStyle = {
    ...typography.overline,
    color: colors.onyx,
    fontWeight: '700',
  };

  const contentStyle: ViewStyle = {
    padding: spacing.sm,
  };

  const nameStyle: TextStyle = {
    ...typography.bodySmall,
    color: colors.text,
    fontWeight: '600',
    marginBottom: spacing.xs / 2,
  };

  const ratingRowStyle: ViewStyle = {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs / 2,
  };

  const ratingTextStyle: TextStyle = {
    ...typography.caption,
    color: colors.onyx,
    fontWeight: '600',
    marginLeft: spacing.xs / 2,
  };

  const locationRowStyle: ViewStyle = {
    flexDirection: 'row',
    alignItems: 'center',
  };

  const locationTextStyle: TextStyle = {
    ...typography.caption,
    color: colors.stone,
    marginLeft: spacing.xs / 2,
    flex: 1,
  };

  return (
    <Animated.View
      style={[cardStyle, { transform: [{ scale: scaleAnim }] }]}
    >
      <Pressable
        testID={testID}
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        accessibilityRole="button"
        accessibilityLabel={`Lieu: ${name}`}
      >
        {/* Image */}
        <View style={imageContainerStyle}>
          <Image
            source={{ uri: image }}
            style={{ width: '100%', height: IMAGE_HEIGHT }}
            contentFit="cover"
            transition={300}
            cachePolicy="memory-disk"
            accessibilityLabel={`Image de ${name}`}
          />

          {/* Badge optionnel */}
          {badge && (
            <View style={badgeStyle}>
              <Text style={badgeTextStyle}>{badge}</Text>
            </View>
          )}
        </View>

        {/* Contenu */}
        <View style={contentStyle}>
          {/* Nom du lieu */}
          <Text style={nameStyle} numberOfLines={1} ellipsizeMode="tail">
            {name}
          </Text>

          {/* Rating */}
          {rating !== undefined && rating > 0 && (
            <View style={ratingRowStyle}>
              <Star size={12} color={colors.gold} fill={colors.gold} strokeWidth={1} />
              <Text style={ratingTextStyle}>{rating.toFixed(1)}</Text>
            </View>
          )}

          {/* Localisation */}
          <View style={locationRowStyle}>
            <MapPin size={12} color={colors.stone} strokeWidth={1.5} />
            <Text style={locationTextStyle} numberOfLines={1} ellipsizeMode="tail">
              {location}
            </Text>
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
});