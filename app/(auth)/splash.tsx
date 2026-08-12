/**
 * Ecran de demarrage - Rivald'event.
 *
 * Design :
 * - Fond sombre onyx premium
 * - Logo avec contours circulaires epais en or brillant (bordure naturelle)
 * - Titre "Rivald'event" en PlayfairDisplay creme
 * - Ligne decorative or
 * - Tagline "Vivez. Reservez. Celebrez."
 * - Baseline "CURATING EXCELLENCE"
 *
 * Logique session :
 * - Etat auth Clerk (useAuth : isLoaded / isSignedIn)
 * - Si session active : home (mode depuis unsafeMetadata)
 * - Si pas de session : onboarding
 */

import { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Image } from 'expo-image';

import { colors, spacing } from '@/lib/constants';
import { logger } from '@/lib/logger';
import { useAuth } from '@/hooks/useAuth';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { useAppMode, type AppMode } from '@/stores/app-mode';

const LOGO_SOURCE = require('@/assets/images/logo.png');
const ANIMATION_DURATION = 2000;
const SESSION_TIMEOUT = 10000;

// ============================================================
// Composant
// ============================================================

export default function SplashScreen() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();
  const mode = useAppMode((state: { mode: AppMode }) => state.mode);
  const { isConnected } = useNetworkStatus();
  const [redirected, setRedirected] = useState(false);
  const [waitingNote, setWaitingNote] = useState(false);

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
      Animated.spring(logoScale, {
        toValue: 1,
        damping: 12,
        stiffness: 100,
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

    // 2. Naviguer apres l'animation (une seule fois)
    const timer = setTimeout(() => {
      if (cancelled) return;

      if (!isLoading) {
        if (cancelled) return;
        setRedirected(true);
        logger.debug(`[Splash] session ${isAuthenticated ? 'valide' : 'absente'}`);
        if (isAuthenticated) {
          router.replace(mode === 'seller' ? '/(seller)/home' : '/(client)/home');
        } else {
          router.replace('/(auth)/onboarding');
        }
      }
    }, ANIMATION_DURATION);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [router, isAuthenticated, isLoading, mode, baselineOpacity, logoOpacity, logoScale, subtitleOpacity, titleOpacity, titleTranslateY]);

  // Session Clerk qui ne se charge pas (hors ligne, serveur injoignable) :
  // on informe l'utilisateur, puis on force la sortie plutot que d'attendre.
  useEffect(() => {
    if (!isLoading) return;
    let cancelled = false;

    const noteTimer = setTimeout(() => {
      if (!cancelled) setWaitingNote(true);
    }, ANIMATION_DURATION);

    const forceTimer = setTimeout(() => {
      if (cancelled) return;
      logger.debug('[Splash] délai dépassé, session Clerk indisponible');
      setRedirected(true);
      router.replace(isAuthenticated ? (mode === 'seller' ? '/(seller)/home' : '/(client)/home') : '/(auth)/onboarding');
    }, ANIMATION_DURATION + SESSION_TIMEOUT);

    return () => {
      cancelled = true;
      clearTimeout(noteTimer);
      clearTimeout(forceTimer);
    };
  }, [isLoading, isAuthenticated, mode, router]);

  if (redirected) return null;

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
      <StatusBar style="light" />

      <Animated.View style={[styles.logoWrapper, logoAnimatedStyle]}>
        <View style={styles.logoBorder}>
          <View style={styles.logoBorderInner}>
            <View style={styles.logoContainer}>
              <Image source={LOGO_SOURCE} style={styles.logo} contentFit="cover" transition={300} />
            </View>
          </View>
        </View>
      </Animated.View>

      <Animated.View style={titleAnimatedStyle}>
        <Text style={styles.title}>Rivald&apos;event</Text>
      </Animated.View>

      <Animated.View style={[styles.lineWrapper, { opacity: subtitleOpacity }]}>
        <View style={styles.goldLine} />
      </Animated.View>

      <Animated.View style={[styles.subtitleWrapper, { opacity: subtitleOpacity }]}>
        <Text style={styles.subtitle}>Vivez. Reservez. Celebrez.</Text>
      </Animated.View>

      <Animated.View style={[styles.baselineWrapper, { opacity: baselineOpacity }]}>
        <View style={styles.baselineBar} />
        <Text style={styles.baseline}>CURATING EXCELLENCE</Text>
      </Animated.View>

      {!isConnected || waitingNote ? (
        <View style={styles.statusBox}>
          <Text style={styles.statusText}>
            {!isConnected
              ? 'Aucune connexion Internet. Rétablissez le réseau pour continuer.'
              : 'Vérification de votre session en cours...'}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.onyx,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  logoWrapper: {
    marginBottom: spacing.xl,
  },
  /**
   * Bordure exterieure epaisse en or brillant.
   * L'effet "brillant" est obtenu par le combo :
   *   - borderWidth epais (6px)
   *   - shadowColor/shadowOpacity en or (halo dore)
   *   - Couleur de bordure gold
   */
  logoBorder: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 6,
    borderColor: colors.gold,
    backgroundColor: colors.gold,
    shadowColor: colors.gold,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.6,
    shadowRadius: 20,
    elevation: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  /**
   * Anneau intermediaire plus fin pour renforcer l'effet
   * de double bordure or (style medaillon/baguette).
   */
  logoBorderInner: {
    width: 124,
    height: 124,
    borderRadius: 62,
    borderWidth: 2,
    borderColor: '#D4B85C',
    backgroundColor: '#0f0e0d',
    alignItems: 'center',
    justifyContent: 'center',
  },
  /**
   * Conteneur du logo avec overflow hidden.
   * Le logo se decoupe naturellement en cercle.
   */
  logoContainer: {
    width: 108,
    height: 108,
    borderRadius: 54,
    overflow: 'hidden',
    backgroundColor: '#0f0e0d',
  },
  logo: {
    width: 108,
    height: 108,
  },
  title: {
    fontFamily: 'PlayfairDisplay-Bold',
    fontSize: 36,
    lineHeight: 46,
    color: '#FFF8E7',
    letterSpacing: 1.5,
    textAlign: 'center',
  },
  lineWrapper: {
    marginTop: spacing.sm,
    alignItems: 'center',
  },
  goldLine: {
    width: 48,
    height: 1.5,
    backgroundColor: colors.gold,
  },
  subtitleWrapper: {
    marginTop: spacing.sm,
  },
  subtitle: {
    fontFamily: 'Inter-Light',
    fontSize: 14,
    lineHeight: 20,
    color: `${colors.gold}AA`,
    letterSpacing: 3,
    textAlign: 'center',
  },
  baselineWrapper: {
    position: 'absolute',
    bottom: spacing.xxxl,
    alignItems: 'center',
  },
  baselineBar: {
    width: 36,
    height: 1.5,
    backgroundColor: colors.gold,
    marginBottom: spacing.sm,
  },
  baseline: {
    fontFamily: 'Inter-Medium',
    fontSize: 10,
    lineHeight: 14,
    color: `${colors.ivory}66`,
    letterSpacing: 3,
    fontStyle: 'italic',
  },
  statusBox: {
    position: 'absolute',
    bottom: 120,
    left: spacing.lg,
    right: spacing.lg,
    alignItems: 'center',
  },
  statusText: {
    fontFamily: 'Inter-Regular',
    fontSize: 13,
    lineHeight: 20,
    color: `${colors.ivory}AA`,
    textAlign: 'center',
  },
});
