/**
 * EventCard - Carte verticale full-width pour evenement.
 *
 * Design "Minimalisme Africain Camerounais" :
 * - Image hero 180px avec badges superposes (categorie + favori)
 * - Titre semi-bold, date (CalendarDays), lieu (MapPin), heure (Clock)
 * - Organisateur (avatar + nom)
 * - Prix en gold bold + bouton "Reserver" terracotta
 * - Fond blanc, radius 16px, ombre subtile
 * - Press feedback avec Animated natif (pas reanimated)
 *
 * Utilise expo-image (pas React Native Image).
 * Utilise lucide-react-native pour les icones.
 */

import React, { useCallback, useRef, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  Animated,
  type ViewStyle,
  type TextStyle,
} from 'react-native';
import { Image } from 'expo-image';
import {
  Heart,
  CalendarDays,
  MapPin,
  Clock,
} from 'lucide-react-native';

import { colors, spacing, radii, shadows } from '@/lib/constants';
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

const IMAGE_HEIGHT = 180;
const FAVORITE_BUTTON_SIZE = 32;
//const AVATAR_ORGANIZER_SIZE = 24;

// ============================================================
// Composant
// ============================================================

export const EventCard = React.memo(function EventCard({
  //id,
  title,
  image,
  date,
  location,
  time,
  organizerName,
  organizerAvatar,
  price,
  //currency = 'FCFA',
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

  // -- Press animation --
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

  const handlePress = useCallback(() => {
    impact('light');
    onPress?.();
  }, [impact, onPress]);

  const handleFavorite = useCallback(() => {
    setFavorited((prev) => !prev);
    impact('light');
    onToggleFavorite?.();
  }, [impact, onToggleFavorite]);

  const handleReserve = useCallback(() => {
    impact('medium');
    onReserve?.();
  }, [impact, onReserve]);

  // -- Format price (formatage africain : 5 000 F, 15 000 F) --
  // FCFA abrege en 'F' pour plus de lisibilite
  const formattedPrice = React.useMemo(() => {
    const absPrice = Math.abs(price);
    if (absPrice >= 1000) {
      // Separateur de milliers style francais : espace insécable
      const formatted = absPrice.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '\u202F');
      return `${price < 0 ? '-' : ''}${formatted} F`;
    }
    return `${price} F`;
  }, [price]);

  // -- Styles --
  const cardStyle: ViewStyle = {
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    overflow: 'hidden',
    ...shadows.eventCard,
  };

  const imageContainerStyle: ViewStyle = {
    height: IMAGE_HEIGHT,
    position: 'relative',
  };

  const imageOverlayStyle: ViewStyle = {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 60,
    backgroundColor: 'rgba(26,24,22,0.15)',
  };

  const categoryBadgeStyle: ViewStyle = {
    position: 'absolute',
    top: spacing.sm,
    left: spacing.sm,
    backgroundColor: colors.terracotta,
    borderRadius: radii.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  };

  const favoriteButtonStyle: ViewStyle = {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    width: FAVORITE_BUTTON_SIZE,
    height: FAVORITE_BUTTON_SIZE,
    borderRadius: FAVORITE_BUTTON_SIZE / 2,
    backgroundColor: 'rgba(26,24,22,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  };

  const contentStyle: ViewStyle = {
    padding: spacing.md,
  };

  const titleStyle: TextStyle = {
    fontFamily: 'PlayfairDisplay-SemiBold',
    fontSize: 17,
    lineHeight: 23,
    color: colors.text,
    letterSpacing: -0.2,
    marginBottom: spacing.xs,
  };

  const detailRowStyle: ViewStyle = {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs / 2,
  };

  const detailTextStyle: TextStyle = {
    fontFamily: 'Inter-Regular',
    fontSize: 13,
    lineHeight: 18,
    color: colors.stone,
    marginLeft: spacing.xs,
  };

  const organizerRowStyle: ViewStyle = {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing.md,
  };

  const organizerNameStyle: TextStyle = {
    fontFamily: 'Inter-Medium',
    fontSize: 13,
    lineHeight: 18,
    color: colors.stone,
    marginLeft: spacing.sm,
  };

  const footerStyle: ViewStyle = {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  };

  const priceContainerStyle: ViewStyle = {
    flexDirection: 'column',
  };

  const priceLabelStyle: TextStyle = {
    fontFamily: 'Inter-Regular',
    fontSize: 11,
    lineHeight: 14,
    color: colors.stone,
  };

  const priceValueStyle: TextStyle = {
    fontFamily: 'Inter-Bold',
    fontSize: 16,
    lineHeight: 22,
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

  return (
    <Animated.View
      style={[cardStyle, { transform: [{ scale: scaleAnim }] }]}
    >
      {/* Image hero avec badges superposes */}
      <Pressable
        testID={testID}
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        accessibilityRole="button"
        accessibilityLabel={`Evenement: ${title}`}
      >
        <View style={imageContainerStyle}>
          <Image
            source={{ uri: image }}
            style={{ width: '100%', height: IMAGE_HEIGHT }}
            contentFit="cover"
            transition={300}
            cachePolicy="memory-disk"
            accessibilityLabel={`Image de ${title}`}
          />
          {/* Gradient overlay subtil en bas de l'image */}
          <View style={imageOverlayStyle} pointerEvents="none" />

          {/* Badge categorie */}
          <View style={categoryBadgeStyle}>
            <Text style={{ fontFamily: 'Inter-SemiBold', fontSize: 12, lineHeight: 16, color: colors.white, letterSpacing: 0.3 }}>
              {category}
            </Text>
          </View>

          {/* Badge "A la une" si featured */}
          {isFeatured && (
            <View
              style={{
                position: 'absolute',
                top: spacing.sm,
                left: categoryBadgeStyle.left,
                marginTop: 24,
                backgroundColor: colors.gold,
                borderRadius: radii.sm,
                paddingHorizontal: spacing.sm,
                paddingVertical: spacing.xs,
              }}
            >
              <Text style={{ fontFamily: 'Inter-Bold', fontSize: 12, lineHeight: 16, color: colors.onyx, letterSpacing: 0.5 }}>
                A la une
              </Text>
            </View>
          )}

          {/* Bouton favori */}
          <Pressable
            onPress={handleFavorite}
            style={favoriteButtonStyle}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={favorited ? 'Retirer des favoris' : 'Ajouter aux favoris'}
          >
            <Heart
              size={16}
              color={favorited ? colors.terracotta : colors.white}
              fill={favorited ? colors.terracotta : 'none'}
              strokeWidth={2}
            />
          </Pressable>
        </View>

        {/* Contenu textuel */}
        <View style={contentStyle}>
          {/* Titre */}
          <Text style={titleStyle} numberOfLines={1} ellipsizeMode="tail">
            {title}
          </Text>

          {/* Date */}
          <View style={detailRowStyle}>
            <CalendarDays size={14} color={colors.stone} strokeWidth={1.5} />
            <Text style={detailTextStyle}>{date}</Text>
          </View>

          {/* Lieu + Heure */}
          <View style={[detailRowStyle, { justifyContent: 'space-between', flex: 1 }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
              <MapPin size={14} color={colors.stone} strokeWidth={1.5} />
              <Text style={[detailTextStyle, { flex: 1 }]} numberOfLines={1} ellipsizeMode="tail">
                {location}
              </Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginLeft: spacing.md }}>
              <Clock size={14} color={colors.stone} strokeWidth={1.5} />
              <Text style={detailTextStyle}>{time}</Text>
            </View>
          </View>

          {/* Organisateur */}
          <View style={organizerRowStyle}>
            <Avatar
              source={organizerAvatar}
              fallback={organizerName}
              size="sm"
            />
            <Text style={organizerNameStyle} numberOfLines={1}>
              {organizerName}
            </Text>
          </View>

          {/* Footer : Prix + Bouton Reserver */}
          <View style={footerStyle}>
            <View style={priceContainerStyle}>
              <Text style={priceLabelStyle}>A partir de</Text>
              <Text style={priceValueStyle}>{formattedPrice}</Text>
            </View>

            <Pressable
              onPress={handleReserve}
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
    </Animated.View>
  );
});
