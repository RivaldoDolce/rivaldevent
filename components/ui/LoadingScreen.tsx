/**
 * LoadingScreen — design system « Noir & Or ».
 *
 * Écran de chargement plein écran premium :
 * - Dégradé noir profond + halos dorés décoratifs
 * - Logo médaille or avec pulsation douce
 * - Anneau de chargement doré animé
 * - Message optionnel en texte tamisé
 */

import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, Easing, type ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { Logo } from '@/components/icons/Logo';
import { colors, spacing } from '@/lib/constants';

// ============================================================
// Types
// ============================================================

interface LoadingScreenProps {
  readonly message?: string;
  readonly testID?: string;
}

// ============================================================
// Composant
// ============================================================

export const LoadingScreen = React.memo(function LoadingScreen({
  message,
  testID,
}: LoadingScreenProps) {
  const pulse = useRef(new Animated.Value(0)).current;
  const spin = useRef(new Animated.Value(0)).current;
  const fade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const pulseAnim = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 1100,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 1100,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    );
    const spinAnim = Animated.loop(
      Animated.timing(spin, {
        toValue: 1,
        duration: 1400,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    const fadeAnim = Animated.timing(fade, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    });

    pulseAnim.start();
    spinAnim.start();
    fadeAnim.start();

    return () => {
      pulseAnim.stop();
      spinAnim.stop();
      fadeAnim.stop();
    };
  }, [pulse, spin, fade]);

  const ringRotation = spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  const logoScale = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.94, 1.06] });
  const logoGlow = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.25, 0.55] });

  return (
    <LinearGradient
      testID={testID}
      colors={[colors.surface, colors.background]}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={styles.container}
    >
      {/* Halos décoratifs */}
      <Animated.View
        pointerEvents="none"
        style={[styles.glowTop, { opacity: logoGlow }]}
      />
      <View pointerEvents="none" style={styles.glowBottom} />

      <Animated.View style={{ opacity: fade, alignItems: 'center' }}>
        <View style={styles.logoWrap}>
          <Animated.View
            style={[
              styles.ring,
              { transform: [{ rotate: ringRotation }] },
            ]}
          />
          <Animated.View style={{ transform: [{ scale: logoScale }] }}>
            <Logo size="lg" />
          </Animated.View>
        </View>

        {message && (
          <Text style={styles.message}>{message}</Text>
        )}
      </Animated.View>
    </LinearGradient>
  );
});

// ============================================================
// Styles
// ============================================================

const styles = {
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  } as ViewStyle,
  glowTop: {
    position: 'absolute',
    top: -120,
    right: -80,
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: 'rgba(216,180,90,0.14)',
  } as ViewStyle,
  glowBottom: {
    position: 'absolute',
    bottom: -140,
    left: -100,
    width: 340,
    height: 340,
    borderRadius: 170,
    backgroundColor: 'rgba(216,180,90,0.08)',
  } as ViewStyle,
  logoWrap: {
    width: 96,
    height: 96,
    alignItems: 'center',
    justifyContent: 'center',
  } as ViewStyle,
  ring: {
    position: 'absolute',
    width: 84,
    height: 84,
    borderRadius: 42,
    borderWidth: 1.5,
    borderColor: 'transparent',
    borderTopColor: colors.goldMuted,
    borderRightColor: colors.goldMuted,
  } as ViewStyle,
  message: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 20,
    fontFamily: 'Inter_500Medium',
    marginTop: spacing.xl,
    textAlign: 'center',
    letterSpacing: 0.3,
  },
} as const;