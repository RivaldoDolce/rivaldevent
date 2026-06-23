/**
 * Skeleton du design system.
 *
 * Regles UI/UX :
 * - Animation shimmer de gauche a droite, duree 1.5s, loop infinie
 * - Couleur : bg ivory, shimmer white a 30% opacity
 * - A utiliser pour TOUT chargement de donnees
 * - Reanimated v3 (UI thread, 120fps)
 *
 * Usage :
 * <Skeleton width="100%" height={200} />         // Card image
 * <Skeleton width={200} height={20} />           // Titre
 * <Skeleton width={120} height={16} radius={8} />// Badge
 */

import React from 'react';
import { View, type ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';

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
  // Position du shimmer (0 = gauche, 1 = droite)
  const shimmer = useSharedValue(0);

  // Lancer l'animation au mount
  React.useEffect(() => {
    shimmer.value = withRepeat(
      withTiming(1, {
        duration: 1500,
        easing: Easing.inOut(Easing.ease),
      }),
      -1, // infinite
      true // reverse
    );
  }, [shimmer]);

  // Style du shimmer (degrade blanc translucide)
  const shimmerStyle = useAnimatedStyle(() => {
    const opacity = shimmer.value * 0.3;
    return {
      opacity,
    };
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
      <Animated.View style={[overlayStyle, shimmerStyle]} />
    </View>
  );
});