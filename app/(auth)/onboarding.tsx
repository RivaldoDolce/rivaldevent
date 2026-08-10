/**
 * Onboarding - 3 slides carrousel.
 *
 * Design :
 * - Header : Logo de l'app (image) + "Passer" en haut a droite
 * - Image : 40% hauteur, 90% largeur
 * - Titre : h1 onyx gras, aligne a gauche
 * - Description : body stone (lisible, regulier), aligne a gauche
 * - Indicateurs : 3 points a gauche, actif terracotta
 * - Bouton : "Continuer" / "Commencer" terracotta, bas DROITE
 */

import { useState, useCallback, useRef } from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { ArrowRight } from 'lucide-react-native';

import { Button } from '@/components/ui/Button';
import { colors, spacing, radius } from '@/lib/constants';
import { useHaptics } from '@/hooks/useHaptics';

const LOGO_SOURCE = require('@/assets/images/logo.png');
const SCREEN_WIDTH = Dimensions.get('window').width;

interface Slide {
  readonly title: string;
  readonly description: string;
  readonly illustration: number;
  readonly ctaLabel: string;
}

const SLIDES: readonly Slide[] = [
  {
    title: 'Trouvez des\nevenements',
    description:
      'Decouvrez des experiences culturelles et des lieux exclusifs a travers le Cameroun.',
    illustration: require('@/assets/images/onboarding/slide1.png'),
    ctaLabel: 'Continuer',
  },
  {
    title: 'Accedez avec\nvotre QR Code',
    description:
      'Recevez votre billet numerique instantanement. Presentez-le a l\'entree, c\'est tout simple.',
    illustration: require('@/assets/images/onboarding/slide2.png'),
    ctaLabel: 'Continuer',
  },
  {
    title: 'Payez par\nMobile Money',
    description:
      'Choisissez votre operateur local (MTN, Orange, Moov) pour un paiement simple et securise.',
    illustration: require('@/assets/images/onboarding/slide3.png'),
    ctaLabel: 'Commencer',
  },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { impact } = useHaptics();
  const [currentIndex, setCurrentIndex] = useState(0);

  const scrollViewRef = useRef<ScrollView>(null);

  const handleNext = useCallback(() => {
    impact('light');

    if (currentIndex < SLIDES.length - 1) {
      const nextIndex = currentIndex + 1;
      setCurrentIndex(nextIndex);
      scrollViewRef.current?.scrollTo({ x: nextIndex * SCREEN_WIDTH, animated: true });
    } else {
      router.replace('/(auth)/login');
    }
  }, [currentIndex, impact, router]);

  const handleSkip = useCallback(() => {
    impact('light');
    router.replace('/(auth)/login');
  }, [impact, router]);

  const currentSlide = SLIDES[currentIndex];

  return (
    <View style={[styles.container, { paddingTop: insets.top + spacing.md }]}>
      {/* Header */}
      <View style={styles.header}>
        {/* Logo de l'app au lieu du cercle d'etoiles */}
        <View style={styles.logoContainer}>
          <Image source={LOGO_SOURCE} style={styles.logo} contentFit="contain" transition={300} />
        </View>
        <Pressable onPress={handleSkip} hitSlop={12} accessibilityRole="button" accessibilityLabel="Passer">
          <Text style={styles.skipText}>Passer</Text>
        </Pressable>
      </View>

      {/* Slides */}
      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        scrollEnabled={false}
        showsHorizontalScrollIndicator={false}
        onScroll={(e) => {
          const index = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
          if (index !== currentIndex) setCurrentIndex(index);
        }}
        scrollEventThrottle={16}
        style={styles.scrollView}
      >
        {SLIDES.map((slide, index) => (
          <View key={index} style={[styles.slide, { width: SCREEN_WIDTH }]}>
            {/* Image : plus large (90%) pour correspondre au mockup */}
            <Image
              source={slide.illustration}
              style={styles.illustration}
              contentFit="cover"
              transition={300}
              cachePolicy="memory-disk"
            />

            {/* Texte : aligne a gauche */}
            <View style={styles.textContainer}>
              <Text style={styles.title}>{slide.title}</Text>
              <Text style={styles.description}>{slide.description}</Text>
            </View>
          </View>
        ))}
      </ScrollView>

      {/* Footer : indicateurs a gauche + bouton a droite */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.xl }]}>
        <View style={styles.indicators}>
          {SLIDES.map((_, index) => (
            <View
              key={index}
              style={[
                styles.indicator,
                index === currentIndex ? styles.indicatorActive : styles.indicatorInactive,
              ]}
            />
          ))}
        </View>

        <Button
          variant="primary"
          size="md"
          onPress={handleNext}
          icon={<ArrowRight color={colors.sand} size={18} />}
          iconPosition="right"
        >
          {currentSlide.ctaLabel}
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.sand,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  // Logo de l'app remplace le composant Logo (cercle etoiles)
  logoContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: `${colors.gold}15`,
    borderWidth: 1.5,
    borderColor: `${colors.gold}40`,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  logo: {
    width: 26,
    height: 26,
  },
  skipText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    lineHeight: 20,
    color: colors.stone,
    letterSpacing: 0.3,
  },
  scrollView: {
    flex: 1,
  },
  slide: {
    flex: 1,
    alignItems: 'center',
    paddingTop: spacing.md,
  },
  illustration: {
    width: '90%',
    height: '45%',
    borderRadius: radius.xl,
    marginBottom: spacing.xl,
  },
  textContainer: {
    width: '100%',
    paddingHorizontal: spacing.lg,
    alignItems: 'flex-start',
  },
  title: {
    fontFamily: 'PlayfairDisplay-Bold',
    fontSize: 32,
    lineHeight: 42,
    color: colors.onyx,
    marginBottom: spacing.md,
    letterSpacing: -0.5,
    textAlign: 'left',
  },
  description: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    lineHeight: 26,
    color: colors.stone,
    textAlign: 'left',
    letterSpacing: 0.2,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
  indicators: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  indicator: {
    height: 8,
    borderRadius: 4,
  },
  indicatorActive: {
    width: 24,
    backgroundColor: colors.terracotta,
  },
  indicatorInactive: {
    width: 8,
    backgroundColor: `${colors.stone}40`,
  },
});