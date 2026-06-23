/**
 * Splash screen - ecran de demarrage.
 *
 * Design :
 * - Fond terracotta plein
 * - Logo (cercle gold + 3 etoiles) centre
 * - Titre "RIVALD'EVENT" en onyx gras
 * - Sous-titre "LUXURY AFRICAN EVENTS" en gold
 * - Baseline "CURATING EXCELLENCE" en ivory/60%
 *
 * Animation : fade-in du logo + slide-up du titre, duree 1500ms.
 * Redirige vers onboarding apres 2.5s.
 */

import { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
  Easing,
} from 'react-native-reanimated';

import { Logo } from '@/components/icons/Logo';
import { colors, typography, spacing } from '@/lib/constants';

export default function SplashScreen() {
  const router = useRouter();

  const logoOpacity = useSharedValue(0);
  const logoScale = useSharedValue(0.8);
  const titleOpacity = useSharedValue(0);
  const titleTranslateY = useSharedValue(20);
  const subtitleOpacity = useSharedValue(0);
  const baselineOpacity = useSharedValue(0);

  useEffect(() => {
    // Animation d'entree
    logoOpacity.value = withTiming(1, { duration: 800, easing: Easing.out(Easing.ease) });
    logoScale.value = withTiming(1, { duration: 800, easing: Easing.out(Easing.back(1.5)) });

    titleOpacity.value = withDelay(400, withTiming(1, { duration: 600 }));
    titleTranslateY.value = withDelay(400, withTiming(0, { duration: 600 }));

    subtitleOpacity.value = withDelay(800, withTiming(1, { duration: 500 }));
    baselineOpacity.value = withDelay(1200, withTiming(1, { duration: 400 }));

    // Redirection apres 2.5s
    const timer = setTimeout(() => {
      router.replace('/(auth)/onboarding');
    }, 2500);

    return () => clearTimeout(timer);
  }, [logoOpacity, logoScale, titleOpacity, titleTranslateY, subtitleOpacity, baselineOpacity, router]);

  const logoAnimatedStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
    transform: [{ scale: logoScale.value }],
  }));

  const titleAnimatedStyle = useAnimatedStyle(() => ({
    opacity: titleOpacity.value,
    transform: [{ translateY: titleTranslateY.value }],
  }));

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.logoWrapper, logoAnimatedStyle]}>
        <Logo size="lg" />
      </Animated.View>

      <Animated.View style={titleAnimatedStyle}>
        <Text style={styles.title}>RIVALD'EVENT</Text>
      </Animated.View>

      <Animated.View style={{ opacity: subtitleOpacity }}>
        <Text style={styles.subtitle}>LUXURY AFRICAN EVENTS</Text>
      </Animated.View>

      <Animated.View style={[styles.baselineWrapper, { opacity: baselineOpacity }]}>
        <View style={styles.goldBar} />
        <Text style={styles.baseline}>CURATING EXCELLENCE</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.terracotta,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  logoWrapper: {
    marginBottom: spacing.xl,
  },
  title: {
    ...typography.h1,
    fontSize: 36,
    color: colors.onyx,
    letterSpacing: 2,
    fontWeight: '900',
    textAlign: 'center',
  },
  subtitle: {
    ...typography.bodySmall,
    color: colors.gold,
    letterSpacing: 4,
    fontWeight: '600',
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  baselineWrapper: {
    position: 'absolute',
    bottom: spacing['3xl'],
    alignItems: 'center',
  },
  goldBar: {
    width: 40,
    height: 2,
    backgroundColor: colors.gold,
    marginBottom: spacing.sm,
  },
  baseline: {
    ...typography.caption,
    color: `${colors.ivory}99`,
    letterSpacing: 3,
    fontStyle: 'italic',
  },
});