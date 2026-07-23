/**
 * Ecran de demarrage - Rivald'event.
 *
 * Design (mis a jour) :
 * - Fond divise : sombre en haut, ivoire/creme en bas
 * - Logo or medaillon au centre de la zone sombre
 * - Titre "Rivald'event" en PlayfairDisplay serif
 * - Tagline "Vivez. Reservez. Celebrez." en or
 * - Separateur courbe art-deco entre les deux zones
 * - Motifs subtils en bas
 * 
 * Logique :
 * - Animation 2.5s + getSession() en PARALLELE
 * - Des que les 2 sont prets, on navigue
 * - Si session : home (buyer par defaut)
 * - Si pas de session : onboarding
 */

import { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import * as SecureStore from 'expo-secure-store';
import { LinearGradient } from 'expo-linear-gradient';
import { Svg, Path, Circle, Ellipse } from 'react-native-svg';

import { colors, spacing } from '@/lib/constants';

const LOGO_SOURCE = require('@/assets/images/logo.png');
const ANIMATION_DURATION = 2500;
const SCREEN_WIDTH = Dimensions.get('window').width;
//const SCREEN_HEIGHT = Dimensions.get('window').height;

/**
 * Construit la cle SecureStore ou Supabase stocke le token.
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
  const logoScale = useRef(new Animated.Value(0.6)).current;
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const titleTranslateY = useRef(new Animated.Value(20)).current;
  const taglineOpacity = useRef(new Animated.Value(0)).current;
  const dividerOpacity = useRef(new Animated.Value(0)).current;
  const bottomOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let cancelled = false;

    // 1. Animation sequentielle
    Animated.parallel([
      // Logo apparait en premier
      Animated.timing(logoOpacity, {
        toValue: 1,
        duration: 700,
        useNativeDriver: true,
      }),
      Animated.spring(logoScale, {
        toValue: 1,
        damping: 12,
        stiffness: 100,
        useNativeDriver: true,
      }),
      // Puis le titre
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
        // Tagline
        Animated.delay(200),
        Animated.timing(taglineOpacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        // Separateur courbe
        Animated.delay(200),
        Animated.timing(dividerOpacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        // Elements du bas
        Animated.delay(200),
        Animated.timing(bottomOpacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
      ]),
    ]).start();

    // 2. Check local ONLY
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
  }, [router, bottomOpacity, dividerOpacity, logoOpacity, logoScale, taglineOpacity, titleOpacity, titleTranslateY]);

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
      {/* Zone sombre en haut avec gradient */}
      <LinearGradient
        colors={['#0d0d0d', '#1a1a1a', '#1f1f1f']}
        style={styles.topSection}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
      >
        {/* Lueur doree derriere le logo */}
        <View style={styles.glowContainer}>
          <View style={styles.glow} />
        </View>

        {/* Logo medaillon or */}
        <Animated.View style={[styles.logoMedallion, logoAnimatedStyle]}>
          <View style={styles.medallionBorder}>
            <View style={styles.medallionInner}>
              <Image source={LOGO_SOURCE} style={styles.logoImage} contentFit="contain" transition={300} />
            </View>
          </View>
        </Animated.View>

        {/* Titre Rivald'event */}
        <Animated.View style={[styles.titleWrapper, titleAnimatedStyle]}>
          <Text style={styles.title}>Rivald&apos;event</Text>
        </Animated.View>

        {/* Ligne decorative or */}
        <Animated.View style={[styles.goldLineWrapper, { opacity: taglineOpacity }]}>
          <View style={styles.goldLine} />
        </Animated.View>

        {/* Tagline */}
        <Animated.View style={[styles.taglineWrapper, { opacity: taglineOpacity }]}>
          <Text style={styles.tagline}>Vivez. Reservez. Celebrez.</Text>
        </Animated.View>
      </LinearGradient>

      {/* Separateur courbe art-deco */}
      <Animated.View style={[styles.dividerContainer, { opacity: dividerOpacity }]}>
        <Svg
          width={SCREEN_WIDTH}
          height={60}
          viewBox={`0 0 ${SCREEN_WIDTH} 60`}
          preserveAspectRatio="none"
          style={styles.dividerSvg}
        >
          {/* Courbe principale */}
          <Path
            d={`M0,0 Q${SCREEN_WIDTH * 0.25},55 ${SCREEN_WIDTH * 0.5},50 Q${SCREEN_WIDTH * 0.75},45 ${SCREEN_WIDTH},0 L${SCREEN_WIDTH},0 L0,0 Z`}
            fill={colors.sand}
          />
          {/* Ligne or sur la courbe */}
          <Path
            d={`M0,2 Q${SCREEN_WIDTH * 0.25},55 ${SCREEN_WIDTH * 0.5},50 Q${SCREEN_WIDTH * 0.75},45 ${SCREEN_WIDTH},2`}
            fill="none"
            stroke={colors.gold}
            strokeWidth={1.5}
            strokeDasharray="6 4"
          />
        </Svg>
      </Animated.View>

      {/* Zone ivoire en bas */}
      <View style={styles.bottomSection}>
        {/* Motif subtil diamant en fond */}
        <View style={styles.patternContainer} pointerEvents="none">
          <Svg width={SCREEN_WIDTH} height={200} viewBox={`0 0 ${SCREEN_WIDTH} 200`} opacity={0.04}>
            {Array.from({ length: 12 }).map((_, col) =>
              Array.from({ length: 6 }).map((_, row) => (
                <Path
                  key={`${col}-${row}`}
                  d={`M${col * 40 + 20},${row * 40} L${col * 40 + 30},${row * 40 + 10} L${col * 40 + 20},${row * 40 + 20} L${col * 40 + 10},${row * 40 + 10} Z`}
                  fill={colors.gold}
                />
              )),
            )}
          </Svg>
        </View>

        {/* Icones ticket + pin (simplifies en SVG) */}
        <Animated.View style={[styles.bottomIcons, { opacity: bottomOpacity }]}>
          <Svg width={80} height={80} viewBox="0 0 80 80">
            {/* Ticket */}
            <Path
              d="M10,25 L55,25 L55,35 Q60,37.5 55,40 L55,50 Q50,52.5 45,50 L10,50 L10,45 Q15,42.5 10,40 Q15,37.5 10,35 Z"
              fill={colors.terracotta}
              opacity={0.9}
            />
            <Path
              d="M20,32 L45,32 L45,34 L20,34 Z M20,38 L45,38 L45,40 L20,40 Z M20,44 L35,44 L35,46 L20,46 Z"
              fill={`${colors.sand}80`}
            />
            {/* Location pin */}
            <Ellipse cx={58} cy={22} rx={10} ry={12} fill={colors.gold} />
            <Path
              d="M58,34 Q54,30 54,26 Q54,22 58,22 Q62,22 62,26 Q62,30 58,34 Z"
              fill={colors.terracotta}
            />
            <Circle cx={58} cy={26} r={3} fill={colors.sand} />
          </Svg>
        </Animated.View>

        {/* Texte CURATING EXCELLENCE en bas */}
        <Animated.View style={[styles.baselineWrapper, { opacity: bottomOpacity }]}>
          <View style={styles.goldBar} />
          <Text style={styles.baseline}>CURATING EXCELLENCE</Text>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.sand,
  },

  // -- Zone sombre (haut, ~55%) --
  topSection: {
    height: '58%',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
  },

  // Lueur doree radiale derriere le logo
  glowContainer: {
    position: 'absolute',
    top: '15%',
    left: '20%',
    right: '20%',
    bottom: '35%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  glow: {
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: `${colors.gold}18`,
  },

  // Medaillon or du logo
  logoMedallion: {
    marginBottom: spacing.lg,
  },
  medallionBorder: {
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: colors.gold,
    padding: 4,
    shadowColor: colors.gold,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  medallionInner: {
    flex: 1,
    borderRadius: 61,
    backgroundColor: '#1a1a1a',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  logoImage: {
    width: 100,
    height: 100,
  },

  // Titre
  titleWrapper: {
    marginTop: spacing.md,
  },
  title: {
    fontFamily: 'PlayfairDisplay-Bold',
    fontSize: 38,
    lineHeight: 48,
    color: '#FFF8E7',
    letterSpacing: 1.5,
    textAlign: 'center',
    textShadowColor: `${colors.gold}40`,
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },

  // Ligne or
  goldLineWrapper: {
    marginTop: spacing.sm,
  },
  goldLine: {
    width: 50,
    height: 1.5,
    backgroundColor: colors.gold,
  },

  // Tagline
  taglineWrapper: {
    marginTop: spacing.sm,
  },
  tagline: {
    fontFamily: 'Inter-Light',
    fontSize: 14,
    lineHeight: 20,
    color: `${colors.gold}BB`,
    letterSpacing: 3,
    textAlign: 'center',
  },

  // Separateur courbe
  dividerContainer: {
    position: 'absolute',
    top: '55%',
    left: 0,
    right: 0,
    height: 60,
    zIndex: 2,
  },
  dividerSvg: {
    position: 'absolute',
    top: 0,
    left: 0,
  },

  // -- Zone ivoire (bas) --
  bottomSection: {
    flex: 1,
    backgroundColor: colors.sand,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginTop: -30,
    paddingTop: 40,
  },

  // Motif diamant subtil
  patternContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },

  // Icones ticket + pin
  bottomIcons: {
    marginBottom: spacing.xl,
  },

  // Baseline
  baselineWrapper: {
    position: 'absolute',
    bottom: spacing.xxxl,
    alignItems: 'center',
  },
  goldBar: {
    width: 40,
    height: 1.5,
    backgroundColor: colors.gold,
    marginBottom: spacing.sm,
  },
  baseline: {
    fontFamily: 'Inter-Medium',
    fontSize: 10,
    lineHeight: 14,
    color: `${colors.stone}80`,
    letterSpacing: 3,
    fontStyle: 'italic',
  },
});
