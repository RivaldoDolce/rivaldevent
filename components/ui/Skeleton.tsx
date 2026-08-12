/**
 * Skeleton — design system « Noir & Or ».
 *
 * Animation shimmer dorée de gauche à droite, durée 1.6s, boucle infinie.
 * Utilisé pour TOUT chargement de données (cartes, listes, détails).
 *
 * Animations : Animated natif RN (pas reanimated).
 */

import React, { useEffect, useRef } from 'react';
import { View, Animated, Easing, type ViewStyle } from 'react-native';

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
  radius = 10,
  style,
  testID,
}: SkeletonProps) {
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.timing(shimmerAnim, {
        toValue: 1,
        duration: 1600,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    );
    animation.start();
    return () => animation.stop();
  }, [shimmerAnim]);

  // Balayage doré de gauche à droite
  const translateX = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-200, 320],
  });

  const containerStyle: ViewStyle = {
    width: width as ViewStyle['width'],
    height,
    borderRadius: radius,
    backgroundColor: 'rgba(255,255,255,0.055)',
    overflow: 'hidden',
    ...style,
  };

  return (
    <View testID={testID} style={containerStyle}>
      <Animated.View
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: 220,
          height: '100%',
          transform: [{ translateX }],
          backgroundColor: 'rgba(242,220,155,0.13)',
        }}
      />
      <Animated.View
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(255,255,255,0.03)',
        }}
      />
    </View>
  );
});