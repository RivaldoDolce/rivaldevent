/**
 * Ecran d'accueil - ecran de demarrage.
 *
 * Design :
 * - Fond terracotta, logo anime, titre RIVALD'EVENT
 * - Baseline CURATING EXCELLENCE en bas
 *
 * Logique :
 * - Animation 2s + getSession() en PARALLELE
 * - Des que les 2 sont prets, on navigue
 * - Pas de fetch profil ici (useAuth s'en charge en arriere-plan)
 * - Si session : home (buyer par defaut, useAuth corrigera si vendeur)
 * - Si pas de session : onboarding
 */

/**
 * Ecran de demarrage.
 *
 * Offline-first : ZERO appel reseau.
 * - Verifie uniquement si un token existe dans SecureStore (lecture locale)
 * - Animation 2s puis navigation
 * - Si token en local : home (buyer par defaut)
 * - Si pas de token : onboarding
 */

import { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import * as SecureStore from 'expo-secure-store';

import { colors, spacing } from '@/lib/constants';

const LOGO_SOURCE = require('@/assets/images/logo.png');
const ANIMATION_DURATION = 2000;

/**
 * Construit la clé SecureStore où Supabase stocke le token.
 * Format : rivaldevent.sb-<projectRef>-auth-token
 * Identique à la logique interne de GoTrue + notre prefixe SecureStoreAdapter.
 */
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const projectRef = supabaseUrl.replace(/^https?:\/\//, '').split('.')[0];
const AUTH_TOKEN_KEY = `rivaldevent.sb-${projectRef}-auth-token`;

async function hasLocalSession(): Promise<boolean> {
  try {
    const token = await SecureStore.getItemAsync(AUTH_TOKEN_KEY);
    return token !== null;
  } catch {
    return false;
  }
}

export default function SplashScreen() {
  const router = useRouter();

  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.8)).current;
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const titleTranslateY = useRef(new Animated.Value(20)).current;
  const subtitleOpacity = useRef(new Animated.Value(0)).current;
  const baselineOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let cancelled = false;

    // 1. Animation
    Animated.parallel([
      Animated.timing(logoOpacity, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(logoScale, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.sequence([
        Animated.delay(300),
        Animated.parallel([
          Animated.timing(titleOpacity, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(titleTranslateY, {
            toValue: 0,
            duration: 500,
            useNativeDriver: true,
          }),
        ]),
        Animated.delay(200),
        Animated.timing(subtitleOpacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.delay(200),
        Animated.timing(baselineOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]),
    ]).start();

    // 2. Check local ONLY (SecureStore, pas de reseau)
    const sessionCheck = hasLocalSession();

    // 3. Naviguer apres l'animation
    const timer = setTimeout(async () => {
      if (cancelled) return;

      const hasSession = await sessionCheck;

      if (cancelled) return;

      if (hasSession) {
        router.replace('/(client)/home');
      } else {
        router.replace('/(auth)/onboarding');
      }
    }, ANIMATION_DURATION);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [router, baselineOpacity, logoOpacity, logoScale, subtitleOpacity, titleOpacity, titleTranslateY]);

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
        <Text style={styles.title}>RIVALD&apos;EVENT</Text>
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
    fontFamily: 'PlayfairDisplay-Black',
    fontSize: 36,
    color: colors.onyx,
    letterSpacing: 2,
    textAlign: 'center',
  },
  subtitleWrapper: {
    marginTop: spacing.sm,
  },
  subtitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 13,
    lineHeight: 18,
    color: colors.gold,
    letterSpacing: 4,
    textAlign: 'center',
  },
  baselineWrapper: {
    position: 'absolute',
    bottom: spacing.xxxl,
    alignItems: 'center',
  },
  goldBar: {
    width: 40,
    height: 2,
    backgroundColor: colors.gold,
    marginBottom: spacing.sm,
  },
  baseline: {
    fontFamily: 'Inter-Medium',
    fontSize: 11,
    lineHeight: 14,
    color: `${colors.ivory}99`,
    letterSpacing: 3,
    fontStyle: 'italic',
  },
});