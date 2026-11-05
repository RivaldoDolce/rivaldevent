/**
 * Ecran de demarrage - Rivald'event.
 *
 * Design « Noir & Or » premium :
 * - Fond bg_splash (73 Ko) + voile noir pour la lisibilite
 * - Halos dores animes (pulsation Animated natif)
 * - Medaillon or (Logo lg) avec pulsation + anneau de chargement rotatif dore
 * - Titre "Rivald'event" en Playfair Display (taille auto-ajustee, jamais tronque)
 * - Slogan en overline doree, filet gold hairline
 * - Apparition en fade + translateY
 *
 * Performance (session + animation EN PARALLELE) :
 * - Duree visuelle fixe ~1000 ms, jamais d'attente en serie.
 * - La session Supabase (+ Apple via Clerk en fallback) est lue en
 *   arriere-plan ; on navigue des que les DEUX sont prets
 *   (animation minimale + session connue).
 * - Garde-fou a 4000 ms : on sort du splash meme si la session est
 *   injoignable (les donnees secondaires chargent sur l'ecran d'arrivee).
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';

import { Image } from 'expo-image';

import { Logo } from '@/components/icons/Logo';
import { colors, spacing, typography } from '@/lib/constants';
import { authBackgrounds } from '@/lib/images';
import { logger } from '@/lib/logger';
import { useAuth } from '@/hooks/useAuth';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { useAppMode, type AppMode } from '@/stores/app-mode';

const MIN_SPLASH_MS = 1000;
const MAX_SPLASH_MS = 4000;

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

  const startRef = useRef(Date.now());
  const redirectedRef = useRef(false);
  const authRef = useRef({ isAuthenticated, isLoading });
  authRef.current = { isAuthenticated, isLoading };

  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.8)).current;
  const logoPulse = useRef(new Animated.Value(0)).current;
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const titleTranslateY = useRef(new Animated.Value(20)).current;
  const subtitleOpacity = useRef(new Animated.Value(0)).current;
  const baselineOpacity = useRef(new Animated.Value(0)).current;
  const haloPulse = useRef(new Animated.Value(0)).current;
  const ringSpin = useRef(new Animated.Value(0)).current;

  // Echelle de pulsation derivee : le medaillon respire entre 1 et 1.07
  // (jamais 0 — un scale brut 0..1 rendrait le logo invisible).
  const logoPulseScale = logoPulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.07] });

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

  // Animation d'entree — joue UNE SEULE FOIS au montage (~900 ms).
  // Independante de la session : pas de redemarrage quand l'auth se charge.
  useEffect(() => {
    Animated.parallel([
      Animated.timing(logoOpacity, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.spring(logoScale, {
        toValue: 1,
        damping: 12,
        stiffness: 100,
        useNativeDriver: true,
      }),
      Animated.sequence([
        Animated.delay(250),
        Animated.parallel([
          Animated.timing(titleOpacity, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.timing(titleTranslateY, {
            toValue: 0,
            duration: 400,
            useNativeDriver: true,
          }),
        ]),
        Animated.delay(150),
        Animated.timing(subtitleOpacity, {
          toValue: 1,
          duration: 350,
          useNativeDriver: true,
        }),
        Animated.delay(150),
        Animated.timing(baselineOpacity, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, [logoOpacity, logoScale, titleOpacity, titleTranslateY, subtitleOpacity, baselineOpacity]);

  const navigate = useCallback(
    (authenticated: boolean) => {
      if (redirectedRef.current) return;
      redirectedRef.current = true;
      setRedirected(true);
      logger.debug(`[Splash] session ${authenticated ? 'valide' : 'absente'}`);
      if (authenticated) {
        router.replace(mode === 'seller' ? '/(seller)/home' : '/(client)/home');
      } else {
        router.replace('/(auth)/onboarding');
      }
    },
    [router, mode],
  );

  // Session + animation en parallele : on navigue des que la session est
  // connue ET que la duree visuelle minimale est ecoulee.
  useEffect(() => {
    if (redirectedRef.current || isLoading) return;
    const elapsed = Date.now() - startRef.current;
    const wait = Math.max(0, MIN_SPLASH_MS - elapsed);
    const timer = setTimeout(() => navigate(isAuthenticated), wait);
    return () => clearTimeout(timer);
  }, [isLoading, isAuthenticated, navigate]);

  // Garde-fou : note d'attente puis sortie forcee, jamais de splash infini.
  useEffect(() => {
    const noteTimer = setTimeout(() => {
      if (!redirectedRef.current && authRef.current.isLoading) setWaitingNote(true);
    }, MIN_SPLASH_MS);
    const forceTimer = setTimeout(() => {
      if (redirectedRef.current) return;
      logger.debug('[Splash] délai dépassé, session indisponible');
      navigate(authRef.current.isAuthenticated);
    }, MAX_SPLASH_MS);
    return () => {
      clearTimeout(noteTimer);
      clearTimeout(forceTimer);
    };
  }, [navigate]);

  if (redirected) {
    // La navigation est en cours : on garde le splash affiche jusqu'au
    // remplacement effectif pour eviter un trou noir intermediaire.
  }

  const logoAnimatedStyle = {
    opacity: logoOpacity,
    transform: [{ scale: logoScale }, { scale: logoPulseScale }],
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
        priority="high"
        transition={150}
      />
      <LinearGradient
        colors={['rgba(10,9,8,0.42)', 'rgba(10,9,8,0.82)']}
        style={StyleSheet.absoluteFillObject}
        pointerEvents="none"
      />
      <View style={styles.container}>

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

      {/* Titre — taille auto-ajustee sur une ligne, jamais tronque */}
      <Animated.View style={[styles.titleWrap, titleAnimatedStyle]}>
        <View style={styles.hairline} />
        <Text
          style={styles.title}
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.6}
          maxFontSizeMultiplier={1.2}
        >
          Rivald&apos;event
        </Text>
        <View style={styles.hairline} />
      </Animated.View>

      {/* Slogan overline */}
      <Animated.View style={[styles.overlineWrapper, { opacity: subtitleOpacity }]}>
        <Text
          style={styles.overline}
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.7}
          maxFontSizeMultiplier={1.2}
        >
          Vivez. Reservez. Celebrez.
        </Text>
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
  titleWrap: {
    width: '100%',
    alignItems: 'center',
  },
  title: {
    ...typography.display,
    fontSize: 36,
    color: colors.text,
    textAlign: 'center',
    width: '100%',
    paddingVertical: spacing.md,
  },
  overlineWrapper: {
    marginTop: spacing.sm,
    width: '100%',
    alignItems: 'center',
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
