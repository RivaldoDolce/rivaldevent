/**
 * Onboarding - 3 slides carrousel.
 *
 * Slides :
 * 1. "Trouvez des evenements" - decouverte culturelle
 * 2. "Accedez avec votre QR Code" - billet digital
 * 3. "Payez par Mobile Money" - paiement MTN/Orange/Moov
 *
 * Design :
 * - Fond sand
 * - Illustration en haut (40% hauteur) - placeholder couleur ivory
 * - Titre + texte au centre
 * - 3 indicateurs (point actif terracotta)
 * - Bouton "Continuer" / "Commencer" terracotta (largeur pleine)
 * - Lien "Passer" en haut a droite
 *
 * Animation : slide horizontal entre slides (Reanimated).
 */

import { useState, useCallback, useRef } from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView, type ViewStyle } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/Button';
import { Logo } from '@/components/icons/Logo';
import { colors, typography, spacing, radius } from '@/lib/constants';
import { useHaptics } from '@/hooks/useHaptics';

interface Slide {
  readonly title: string;
  readonly description: string;
  readonly illustrationColor: string;
  readonly ctaLabel: string;
}

const SLIDES: readonly Slide[] = [
  {
    title: 'Trouvez des événements',
    description:
      'Découvrez des expériences culturelles et des lieux exclusifs à travers le Cameroun.',
    illustrationColor: colors.terracotta,
    ctaLabel: 'Continuer',
  },
  {
    title: 'Accédez avec votre QR Code',
    description:
      'Recevez votre billet numérique instantanément. Présentez-le à l\'entrée, c\'est tout simple.',
    illustrationColor: colors.forest,
    ctaLabel: 'Continuer',
  },
  {
    title: 'Payez par Mobile Money',
    description:
      'Choisissez votre opérateur local (MTN, Orange, Moov) pour un paiement simple et sécurisé.',
    illustrationColor: colors.indigo,
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
      scrollViewRef.current?.scrollTo({
        x: nextIndex * 360, // approximatif, sera ajuste
        animated: true,
      });
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
      {/* Header avec logo + Passer */}
      <View style={styles.header}>
        <Logo size="sm" />
        <Pressable onPress={handleSkip} hitSlop={12} accessibilityRole="button" accessibilityLabel="Passer l'introduction">
          <Text style={styles.skipText}>Passer</Text>
        </Pressable>
      </View>

      {/* Slides horizontaux */}
      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        scrollEnabled={false}
        showsHorizontalScrollIndicator={false}
        onScroll={(e) => {
          const index = Math.round(e.nativeEvent.contentOffset.x / 360);
          if (index !== currentIndex) setCurrentIndex(index);
        }}
        scrollEventThrottle={16}
        style={styles.scrollView}
      >
        {SLIDES.map((slide, index) => (
          <View key={index} style={styles.slide}>
            {/* Illustration placeholder */}
            <View style={[styles.illustration, { backgroundColor: slide.illustrationColor }]}>
              <Logo size="md" withBackground={false} />
            </View>

            {/* Texte */}
            <Text style={styles.title}>{slide.title}</Text>
            <Text style={styles.description}>{slide.description}</Text>
          </View>
        ))}
      </ScrollView>

      {/* Indicateurs + bouton */}
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

        <Button variant="primary" size="lg" fullWidth onPress={handleNext}>
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
    width: 360, // sera calcule dynamiquement si besoin
    flex: 1,
    paddingHorizontal: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  illustration: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: radius.xl,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  title: {
    ...typography.h1,
    color: colors.onyx,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  description: {
    ...typography.body,
    color: colors.stone,
    textAlign: 'center',
    lineHeight: 24,
  },
  footer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    gap: spacing.lg,
  },
  indicators: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  indicator: {
    height: 8,
    borderRadius: 4,
  } as ViewStyle,
  indicatorActive: {
    width: 24,
    backgroundColor: colors.terracotta,
  } as ViewStyle,
  indicatorInactive: {
    width: 8,
    backgroundColor: `${colors.stone}40`,
  } as ViewStyle,
});