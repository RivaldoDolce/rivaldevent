/**
 * Ecran d'accueil - ecran de demarrage.
 *
 * Utilise le logo utilisateur (assets/images/logo.png).
 * Fond terracotta, titre RIVALD'EVENT, baseline CURATING EXCELLENCE.
 *
 * Apres l'animation : verifie la session et redirige vers
 * le bon layout selon is_seller.
 */

import { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';

import { colors, typography, spacing } from '@/lib/constants';
import { supabase } from '@/lib/supabase';
import { logger } from '@/lib/logger';
import { useAppMode } from '@/stores/app-mode';

const LOGO_SOURCE = require('@/assets/images/logo.png');

export default function SplashScreen() {
  const router = useRouter();
  const initializeFromProfile = useAppMode((state: { initializeFromProfile: (v: boolean) => void }) => state.initializeFromProfile);

  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.8)).current;
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const titleTranslateY = useRef(new Animated.Value(20)).current;
  const subtitleOpacity = useRef(new Animated.Value(0)).current;
  const baselineOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(logoOpacity, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(logoScale, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();

    Animated.sequence([
      Animated.delay(400),
      Animated.parallel([
        Animated.timing(titleOpacity, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(titleTranslateY, {
          toValue: 0,
          duration: 600,
          useNativeDriver: true,
        }),
      ]),
      Animated.delay(400),
      Animated.timing(subtitleOpacity, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.delay(400),
      Animated.timing(baselineOpacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();

    const timer = setTimeout(() => {
      navigateAfterSplash();
    }, 2500);

    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  const navigateAfterSplash = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (session?.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();

        const row = profile as Record<string, unknown> | null;
        const isSeller = (row?.is_seller as boolean) ?? false;
        initializeFromProfile(isSeller);
        router.replace(isSeller ? '/(seller)/home' : '/(client)/home');
      } else {
        router.replace('/(auth)/onboarding');
      }
    } catch (err) {
      logger.error('[Splash] navigate error:', err);
      router.replace('/(auth)/onboarding');
    }
  };

  const logoAnimatedStyle = {
    opacity: logoOpacity,
    transform: [{ scale: logoScale }],
  };

  const titleAnimatedStyle = {
    opacity: titleOpacity,
    transform: [{ translateY: titleTranslateY }],
  };

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.logoWrapper, logoAnimatedStyle]}>
        <Image source={LOGO_SOURCE} style={styles.logo} contentFit="contain" transition={300} />
      </Animated.View>

      <Animated.View style={titleAnimatedStyle}>
        <Text style={styles.title}>RIVALD'EVENT</Text>
      </Animated.View>

      <Animated.View style={[styles.subtitleWrapper, { opacity: subtitleOpacity }]}> 
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
  logo: {
    width: 120,
    height: 120,
  },
  title: {
    ...typography.h1,
    fontSize: 36,
    color: colors.onyx,
    letterSpacing: 2,
    fontWeight: '900',
    textAlign: 'center',
  },
  subtitleWrapper: {
    marginTop: spacing.sm,
  },
  subtitle: {
    ...typography.bodySmall,
    color: colors.gold,
    letterSpacing: 4,
    fontWeight: '600',
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