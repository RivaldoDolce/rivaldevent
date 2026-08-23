/**
 * Onboarding - 3 slides carrousel.
 *
 * Design « Noir & Or » :
 * - Fond noir profond avec halo doré décoratif
 * - Bannière image arrondie avec dégradé sombre et anneau doré fin
 * - Badges de pagination pilules (active : dorée large ; inactive : grisée)
 * - Titre Playfair Display, description textSecondary
 * - Skip ghost + Suivant / Commencer primary or champagne
 *
 * Logique (inchangée) : ScrollView paginée, callbacks existants.
 */

import { useState, useCallback, useRef } from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView, Dimensions, ImageBackground } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { ArrowRight } from 'lucide-react-native';

import { Button } from '@/components/ui/Button';
import { Logo } from '@/components/icons/Logo';
import { colors, radius, spacing, typography } from '@/lib/constants';
import { clientBackgrounds, images } from '@/lib/images';
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
    title: 'Trouvez des\nevenements',
    description:
      'Decouvrez des experiences culturelles et des lieux exclusifs a travers le Cameroun.',
    illustration: images.onboarding.slide1,
    ctaLabel: 'Continuer',
  },
  {
    title: 'Accedez avec\nvotre QR Code',
    description:
      'Recevez votre billet numerique instantanement. Presentez-le a l\'entree, c\'est tout simple.',
    illustration: images.onboarding.slide2,
    ctaLabel: 'Continuer',
  },
  {
    title: 'Payez par\nMobile Money',
    description:
      'Choisissez votre operateur local (MTN, Orange, Moov) pour un paiement simple et securise.',
    illustration: images.onboarding.slide3,
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
    <ImageBackground
      source={clientBackgrounds.accueil}
      style={styles.bgScreen}
      imageStyle={styles.bgImage}
      accessibilityIgnoresInvertColors
    >
      <LinearGradient
        colors={['rgba(10,9,8,0.55)', 'rgba(10,9,8,0.86)']}
        style={styles.bgScrim}
        pointerEvents="none"
      />
      <View style={[styles.container, { paddingTop: insets.top + spacing.md }]}>
        {/* Halo doré décoratif */}
        <View pointerEvents="none" style={styles.glowTop} />
        <View pointerEvents="none" style={styles.ringDeco} />

      {/* Header */}
      <View style={styles.header}>
        <Logo size="sm" withBackground />
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
            {/* Bannière image avec dégradé sombre */}
            <View style={styles.illustrationCard}>
              <Image
                source={slide.illustration}
                style={styles.illustration}
                contentFit="cover"
                transition={300}
                cachePolicy="memory-disk"
              />
              <LinearGradient
                colors={
                  ['rgba(10,9,8,0.10)', 'rgba(10,9,8,0.45)', colors.background] as unknown as readonly [
                    string,
                    string,
                    ...string[],
                  ]
                }
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
                style={styles.illustrationFade}
                pointerEvents="none"
              />
              <View pointerEvents="none" style={styles.illustrationRing} />
            </View>

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
          icon={<ArrowRight color={colors.onyx} size={18} />}
          iconPosition="right"
        >
          {currentSlide.ctaLabel}
        </Button>
        </View>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  bgScreen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  bgImage: {
    ...StyleSheet.absoluteFillObject,
  },
  bgScrim: {
    ...StyleSheet.absoluteFillObject,
  },
  container: {
    flex: 1,
    backgroundColor: 'transparent',
    overflow: 'hidden',
  },
  glowTop: {
    position: 'absolute',
    top: -120,
    right: -80,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: 'rgba(216,180,90,0.07)',
  },
  ringDeco: {
    position: 'absolute',
    top: -40,
    right: -30,
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 1.5,
    borderColor: 'rgba(216,180,90,0.14)',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  skipText: {
    ...typography.bodySmallMedium,
    color: colors.goldBright,
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
  illustrationCard: {
    width: '92%',
    height: '47%',
    borderRadius: radius.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.borderGold,
    marginBottom: spacing.xl,
  },
  illustration: {
    width: '100%',
    height: '100%',
  },
  illustrationFade: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  illustrationRing: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: 'rgba(216,180,90,0.35)',
  },
  textContainer: {
    width: '100%',
    paddingHorizontal: spacing.lg,
    alignItems: 'flex-start',
  },
  title: {
    ...typography.h1,
    color: colors.text,
    marginBottom: spacing.md,
    textAlign: 'left',
  },
  description: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'left',
    lineHeight: 27,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
  },
  indicators: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  indicator: {
    height: 8,
    borderRadius: radius.full,
  },
  indicatorActive: {
    width: 24,
    backgroundColor: colors.gold,
    shadowColor: 'rgba(216,180,90,0.6)',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 6,
    elevation: 4,
  },
  indicatorInactive: {
    width: 8,
    backgroundColor: 'rgba(255,255,255,0.16)',
  },
});