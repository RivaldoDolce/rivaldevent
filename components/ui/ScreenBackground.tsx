import type { ReactNode } from 'react';
import { ImageBackground, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { clientBackgrounds } from '@/lib/images';
import { colors } from '@/lib/constants';

interface ScreenBackgroundProps {
  readonly children: ReactNode;
  readonly scrimOpacity?: 'light' | 'medium' | 'strong';
}

const SCRIM: Record<string, readonly [string, string]> = {
  light: ['rgba(10,9,8,0.48)', 'rgba(10,9,8,0.78)'],
  medium: ['rgba(10,9,8,0.62)', 'rgba(10,9,8,0.90)'],
  strong: ['rgba(10,9,8,0.76)', 'rgba(10,9,8,0.96)'],
};

export function ScreenBackground({ children, scrimOpacity = 'medium' }: ScreenBackgroundProps) {
  return (
    <ImageBackground
      source={clientBackgrounds.fallback}
      style={styles.bg}
      imageStyle={styles.bgImage}
      accessibilityIgnoresInvertColors
    >
      <LinearGradient
        colors={[...SCRIM[scrimOpacity]] as unknown as readonly [string, string, ...string[]]}
        style={styles.scrim}
        pointerEvents="none"
      />
      {children}
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  bg: {
    flex: 1,
    backgroundColor: colors.background,
  },
  bgImage: {
    ...StyleSheet.absoluteFillObject,
  },
  scrim: {
    ...StyleSheet.absoluteFillObject,
  },
});
