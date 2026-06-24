/**
 * Onboarding - 3 slides carrousel.
 *
 * Design :
 * - Header : Logo small + "Passer" en haut a droite
 * - Image : 40% hauteur (require @/assets/images/onboarding/slideN.png)
 * - Titre : h1 onyx gras, centre
 * - Description : body onyx opaque (lisible, PAS flou)
 * - Indicateurs : 3 points a gauche, actif terracotta
 * - Bouton : "Continuer" / "Commencer" terracotta, bas DROITE (pas pleine largeur)
 */

import { useState, useCallback, useRef } from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { ArrowRight } from 'lucide-react-native';

import { Button } from '@/components/ui/Button';
import { Logo } from '@/components/icons/Logo';
import { colors, typography, spacing, radius } from '@/lib/constants';
import { useHaptics } from '@/hooks/useHaptics';

const SCREEN_WIDTH = Dimensions.get('window').width;

interface Slide {
  readonly title: string;
  readonly description: string;
  readonly illustration: number;
  readonly ctaLabel: string;
}

const SLIDES: readonly Slide[] = [
  {
    title: 'Trouvez des événements',
    description:
      'Découvrez des expériences culturelles et des lieux exclusifs à travers le Cameroun.',
    illustration: require('@/assets/images/onboarding/slide1.png'),
    ctaLabel: 'Continuer',
  },
  {
    title: 'Accédez avec votre QR Code',
    description:
      'Recevez votre billet numérique instantanément. Présentez-le à l\'entrée, c\'est tout simple.',
    illustration: require('@/assets/images/onboarding/slide2.png'),
    ctaLabel: 'Continuer',
  },
  {
    title: 'Payez par Mobile Money',
    description:
      'Choisissez votre opérateur local (MTN, Orange, Moov) pour un paiement simple et sécurisé.',
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

  const isLastSlide = currentIndex === SLIDES.length - 1;
  const currentSlide = SLIDES[currentIndex];

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Logo size="sm" />
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
            {/* Image : 40% de la hauteur, coins arrondis */}
            <Image
              source={slide.illustration}
              style={styles.illustration}
              contentFit="cover"
              transition={300}
              cachePolicy="memory-disk"
            />

            {/* Texte */}
            <Text style={styles.title}>{slide.title}</Text>
            <Text style={styles.description}>{slide.description}</Text>
          </View>
        ))}
      </ScrollView>

      {/* Footer : indicateurs a gauche + bouton a droite */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.lg }]}>
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

        <Button variant="primary" size="md" onPress={handleNext} icon={<ArrowRight color={colors.sand} size={18} />} iconPosition="right">
          {isLastSlide ? 'Commencer' : currentSlide.ctaLabel}
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
  skipText: {
    ...typography.bodySmall,
    color: colors.stone,
    fontWeight: '500',
  },
  scrollView: {
    flex: 1,
  },
  slide: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
  },
  illustration: {
    width: '70%',
    height: '40%',
    borderRadius: radius.xl,
    marginBottom: spacing.xl,
  },
  title: {
    ...typography.h1,
    color: colors.onyx,
    textAlign: 'center',
    marginBottom: spacing.md,
    fontWeight: '900',
  },
  description: {
    ...typography.body,
    color: colors.onyx,
    textAlign: 'center',
    lineHeight: 24,
    opacity: 0.8,
    fontWeight: '700',
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