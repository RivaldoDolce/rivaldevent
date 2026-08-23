/**
 * Ecran de demarrage - Rivald'event.
 *
 * Design « Noir & Or » premium :
 * - Degrade noir profond (gradients.noir)
 * - Halos dores animés (pulsation Animated natif)
 * - Medaillon or (Logo lg) avec pulsation + anneau de chargement rotatif dore
 * - Titre "Rivald'event" en Playfair Display 40px
 * - Slogan en overline doree, filet gold hairline
 * - Apparition en fade + translateY
 *
 * Logique session (inchangée) :
 * - Etat auth Clerk (useAuth : isLoaded / isSignedIn)
 * - Si session active : home (mode depuis unsafeMetadata)
 * - Si pas de session : onboarding
 */

import { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { Image } from 'expo-image';

import { Logo } from '@/components/icons/Logo';
import { colors, spacing, typography } from '@/lib/constants';
import { authBackgrounds } from '@/lib/images';
import { logger } from '@/lib/logger';
import { useAuth } from '@/hooks/useAuth';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { useAppMode, type AppMode } from '@/stores/app-mode';

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
  const logoPulse = useRef(new Animated.Value(0)).current;
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const titleTranslateY = useRef(new Animated.Value(20)).current;
  const subtitleOpacity = useRef(new Animated.Value(0)).current;
  const baselineOpacity = useRef(new Animated.Value(0)).current;
  const haloPulse = useRef(new Animated.Value(0)).current;
  const ringSpin = useRef(new Animated.Value(0)).current;

  // Boucles décoratives : pulsation du medaillon, halos et rotation de l'anneau
  useEffect(() => {
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(logoPulse, {
          toValue: 1,
          duration: 1200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(logoPulse, {
          toValue: 0,
          duration: 1200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    );
    const haloLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(haloPulse, {
          toValue: 1,
          duration: 1600,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(haloPulse, {
          toValue: 0,
          duration: 1600,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    );
    const ringLoop = Animated.loop(
      Animated.timing(ringSpin, {
        toValue: 1,
        duration: 1500,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );

    pulseLoop.start();
    haloLoop.start();
    ringLoop.start();

    return () => {
      pulseLoop.stop();
      haloLoop.stop();
      ringLoop.stop();
    };
  }, [logoPulse, haloPulse, ringSpin]);

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
    transform: [{ scale: logoScale }, { scale: logoPulse }],
  };

  const titleAnimatedStyle = {
    opacity: titleOpacity,
    transform: [{ translateY: titleTranslateY }],
  };

  const ringRotation = ringSpin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  const haloTopOpacity = haloPulse.interpolate({ inputRange: [0, 1], outputRange: [0.3, 0.9] });
  const haloBottomOpacity = haloPulse.interpolate({ inputRange: [0, 1], outputRange: [0.9, 0.3] });

  return (
    <View style={styles.bgScreen}>
      <Image
        source={authBackgrounds.splash}
        style={StyleSheet.absoluteFillObject}
        contentFit="cover"
        cachePolicy="memory-disk"
      />
      <LinearGradient
        colors={['rgba(10,9,8,0.42)', 'rgba(10,9,8,0.82)']}
        style={StyleSheet.absoluteFillObject}
        pointerEvents="none"
      />
      <View style={styles.container}>
        <StatusBar style="light" />

        {/* Halos dorés pulsés */}
        <Animated.View pointerEvents="none" style={[styles.glowTop, { opacity: haloTopOpacity }]} />
        <Animated.View pointerEvents="none" style={[styles.glowBottom, { opacity: haloBottomOpacity }]} />

      {/* Anneaux décoratifs fins */}
      <View pointerEvents="none" style={styles.ringLarge} />
      <View pointerEvents="none" style={styles.ringSmall} />

      {/* Medaillon or avec anneau de chargement rotatif */}
      <Animated.View style={[styles.logoWrapper, logoAnimatedStyle]}>
        <View style={styles.medallionFrame}>
          <Animated.View
            pointerEvents="none"
            style={[styles.loadingRing, { transform: [{ rotate: ringRotation }] }]}
          />
          <Logo size="lg" withBackground />
        </View>
      </Animated.View>

      {/* Titre */}
      <Animated.View style={titleAnimatedStyle}>
        <View style={styles.hairline} />
        <Text style={styles.title}>Rivald&apos;event</Text>
        <View style={styles.hairline} />
      </Animated.View>

      {/* Slogan overline */}
      <Animated.View style={[styles.overlineWrapper, { opacity: subtitleOpacity }]}>
        <Text style={styles.overline}>Vivez. Reservez. Celebrez.</Text>
      </Animated.View>

      {/* Baseline */}
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
    </View>
  );
}

const styles = StyleSheet.create({
  bgScreen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    backgroundColor: 'transparent',
  },
  glowTop: {
    position: 'absolute',
    top: -140,
    right: -90,
    width: 340,
    height: 340,
    borderRadius: 170,
    backgroundColor: 'rgba(216,180,90,0.10)',
  },
  glowBottom: {
    position: 'absolute',
    bottom: -160,
    left: -110,
    width: 360,
    height: 360,
    borderRadius: 180,
    backgroundColor: 'rgba(216,180,90,0.07)',
  },
  ringLarge: {
    position: 'absolute',
    top: -70,
    right: -50,
    width: 150,
    height: 150,
    borderRadius: 75,
    borderWidth: 1.5,
    borderColor: 'rgba(216,180,90,0.18)',
  },
  ringSmall: {
    position: 'absolute',
    bottom: -30,
    left: -24,
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 1.5,
    borderColor: 'rgba(216,180,90,0.14)',
  },
  logoWrapper: {
    marginBottom: spacing.xl,
  },
  medallionFrame: {
    width: 150,
    height: 150,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: 'rgba(216,180,90,0.45)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 14,
    elevation: 8,
  },
  loadingRing: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 75,
    borderWidth: 1.5,
    borderColor: 'transparent',
    borderTopColor: colors.goldBright,
    borderRightColor: colors.goldMuted,
  },
  hairline: {
    width: 48,
    height: 1.5,
    backgroundColor: colors.goldMuted,
    alignSelf: 'center',
  },
  title: {
    ...typography.display,
    color: colors.text,
    textAlign: 'center',
    paddingVertical: spacing.md,
  },
  overlineWrapper: {
    marginTop: spacing.sm,
  },
  overline: {
    ...typography.overline,
    color: colors.goldBright,
    letterSpacing: 2.4,
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
    ...typography.overline,
    color: colors.textMuted,
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
    ...typography.bodySmall,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});