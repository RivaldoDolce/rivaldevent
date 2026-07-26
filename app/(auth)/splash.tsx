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
 * - Utilise supabase.auth.getSession() (lit via SecureStoreAdapter)
 * - Decode le JWT pour verifier l'expiration LOCALEMENT (pas de reseau)
 * - Si session valide et non expiree : home
 * - Si pas de session ou JWT expire : onboarding
 * - Timeout session : 24h (verifie via claim iat du JWT)
 */

import { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Image } from 'expo-image';

import { supabase } from '@/lib/supabase';
import { colors, spacing } from '@/lib/constants';
import { logger } from '@/lib/logger';

const LOGO_SOURCE = require('@/assets/images/logo.png');
const ANIMATION_DURATION = 2000;

// ============================================================
// Helpers : verification JWT locale (hors ligne)
// ============================================================

/**
 * Decode le payload d'un JWT sans dependance externe.
 * Retourne null si le token est invalide.
 */
function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const base64Url = token.split('.')[1];
    if (!base64Url) return null;
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const json = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c: string) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join(''),
    );
    return JSON.parse(json) as Record<string, unknown>;
  } catch {
    return null;
  }
}

/**
 * Verifie si un token JWT est expire.
 * Un token est considere expire si :
 *   - Le claim exp est depasse (avec 30s de marge)
 *   - Le claim iat indique que le token a ete emis il y a plus de SESSION_TIMEOUT_HOURS heures
 */
const SESSION_TIMEOUT_HOURS = 24;
const SESSION_TIMEOUT_SECONDS = SESSION_TIMEOUT_HOURS * 60 * 60;

function isJwtExpired(token: string): boolean {
  const payload = decodeJwtPayload(token);
  if (!payload) return true;

  // Verifier le claim exp (expiration du token)
  const exp = payload.exp as number | undefined;
  if (exp) {
    const nowSeconds = Date.now() / 1000;
    if (nowSeconds > exp - 30) return true; // 30s de marge
  }

  // Verifier le claim iat (emission) pour le timeout 24h
  const iat = payload.iat as number | undefined;
  if (iat) {
    const ageSeconds = Date.now() / 1000 - iat;
    if (ageSeconds > SESSION_TIMEOUT_SECONDS) return true;
  }

  return false;
}

/**
 * Verifie la session de maniere fiable.
 * 1. Lit la session via supabase.auth.getSession() (utilise SecureStoreAdapter)
 * 2. Decode le JWT pour verifier l'expiration localement (pas d'appel reseau)
 * 3. Retourne true seulement si la session existe ET le token est valide
 */
async function hasValidSession(): Promise<boolean> {
  try {
    const { data: { session } } = await supabase.auth.getSession();

    if (!session?.access_token) {
      logger.debug('[Splash] No session found');
      return false;
    }

    if (isJwtExpired(session.access_token)) {
      logger.debug('[Splash] Session JWT expired');
      // Nettoyer la session expiree
      await supabase.auth.signOut({ scope: 'local' }).catch(() => {
        /* Silent */
      });
      return false;
    }

    logger.debug('[Splash] Valid session found');
    return true;
  } catch (err) {
    logger.error('[Splash] getSession error:', err);
    return false;
  }
}

// ============================================================
// Composant
// ============================================================

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

    // 2. Verification session (en parallele avec l'animation)
    const sessionCheck = hasValidSession();

    // 3. Naviguer apres l'animation
    const timer = setTimeout(async () => {
      if (cancelled) return;

      const validSession = await sessionCheck;
      if (cancelled) return;

      if (validSession) {
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
});
