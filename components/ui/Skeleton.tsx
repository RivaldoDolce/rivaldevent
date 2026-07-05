/**
 * Skeleton du design system.
 *
 * Regles UI/UX :
 * - Animation shimmer de gauche a droite, duree 1.5s, loop infinie
 * - Couleur : bg ivory, shimmer white a 30% opacity
 * - A utiliser pour TOUT chargement de donnees
 *
 * Animations : Animated natif RN (pas reanimated — cause erreur TurboModule avec Expo Go).
 * Conformement au handoff section 8.6.
 *
 * Usage :
 * <Skeleton width="100%" height={200} />         // Card image
 * <Skeleton width={200} height={20} />           // Titre
 * <Skeleton width={120} height={16} radius={8} />// Badge
 */

import React, { useEffect, useRef } from 'react';
import { View, Animated, type ViewStyle } from 'react-native';

import { colors } from '@/lib/constants';

// ============================================================
// Types
// ============================================================

interface SkeletonProps {
  readonly width?: number | string;
  readonly height?: number;
  readonly radius?: number;
  readonly style?: ViewStyle;
  readonly testID?: string;
}

// ============================================================
// Composant
// ============================================================

export const Skeleton = React.memo(function Skeleton({
  width = '100%',
  height = 20,
  radius = 8,
  style,
  testID,
}: SkeletonProps) {
  // ── Animation shimmer avec Animated natif (pas reanimated) ──
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerAnim, {
          toValue: 0,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [shimmerAnim]);

  // Le shimmer est un overlay blanc dont l'opacite pulsee
  // entre 0 et 0.3 pour simuler l'effet de lumiere
  const shimmerOpacity = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.3],
  });

  const containerStyle: ViewStyle = {
    width: width as ViewStyle['width'],
    height,
    borderRadius: radius,
    backgroundColor: colors.ivory,
    overflow: 'hidden',
    ...style,
  };

  const overlayStyle: ViewStyle = {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#FFFFFF',
  };

  return (
    <View testID={testID} style={containerStyle}>
      <Animated.View style={[overlayStyle, { opacity: shimmerOpacity }]} />
    </View>
  );
});
