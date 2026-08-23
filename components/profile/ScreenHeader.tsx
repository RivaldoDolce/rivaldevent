/**
 * ScreenHeader — en-tête partagé des sous-écrans (profil, paramètres…).
 *
 * Design « Noir & Or » :
 * - Dégradé noir profond avec halo doré décoratif
 * - Bouton retour pastille verre + chevron or
 * - Titre Playfair Display + sous-titre caption
 */

import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { View, Text, Pressable, StyleSheet, ImageBackground, type ImageSourcePropType } from 'react-native';
import { ChevronLeft } from 'lucide-react-native';

import { useHaptics } from '@/hooks/useHaptics';
import { colors, spacing, radius } from '@/lib/constants';

interface ScreenHeaderProps {
  readonly title: string;
  readonly subtitle?: string;
  /** Image de fond hero (RECETTE B) : inseree en premier enfant du degrade avec voile. */
  readonly background?: ImageSourcePropType;
}

export function ScreenHeader({ title, subtitle, background }: ScreenHeaderProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { impact } = useHaptics();

  return (
    <LinearGradient
      colors={['#26211B', colors.background]}
      start={{ x: 0.1, y: 0 }}
      end={{ x: 0.9, y: 1 }}
      style={[styles.header, { paddingTop: insets.top + spacing.sm }]}
    >
      {background ? (
        <>
          {/* Fond hero + voile */}
          <ImageBackground
            source={background}
            style={styles.headerBg}
            imageStyle={styles.headerBgImage}
            accessibilityIgnoresInvertColors
          />
          <LinearGradient
            colors={['rgba(10,9,8,0.45)', 'rgba(10,9,8,0.78)', 'rgba(10,9,8,0.96)']}
            style={styles.headerScrim}
            pointerEvents="none"
          />
        </>
      ) : null}
      <View pointerEvents="none" style={styles.glowLarge} />
      <View pointerEvents="none" style={styles.ringLarge} />
      <View pointerEvents="none" style={styles.ringSmall} />

      <View style={styles.topRow}>
        <Pressable
          onPress={() => {
            impact('light');
            router.back();
          }}
          hitSlop={12}
          style={styles.backButton}
          accessibilityRole="button"
          accessibilityLabel="Retour"
        >
          <ChevronLeft size={22} color={colors.goldBright} strokeWidth={1.75} />
        </Pressable>

        <View style={styles.titleBlock}>
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
          {subtitle ? (
            <Text style={styles.subtitle} numberOfLines={1}>
              {subtitle}
            </Text>
          ) : null}
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
    borderBottomLeftRadius: radius.xxl,
    borderBottomRightRadius: radius.xxl,
    overflow: 'hidden',
    borderBottomWidth: 1,
    borderBottomColor: `${colors.gold}26`,
  },
  headerBg: {
    ...StyleSheet.absoluteFillObject,
  },
  headerBgImage: {
    ...StyleSheet.absoluteFillObject,
  },
  headerScrim: {
    ...StyleSheet.absoluteFillObject,
  },
  glowLarge: {
    position: 'absolute',
    top: -90,
    right: -50,
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: 'rgba(216,180,90,0.09)',
  },
  ringLarge: {
    position: 'absolute',
    width: 130,
    height: 130,
    borderRadius: 65,
    borderWidth: 1.5,
    borderColor: `${colors.gold}2E`,
    top: -70,
    right: -40,
  },
  ringSmall: {
    position: 'absolute',
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 1.5,
    borderColor: `${colors.gold}26`,
    top: -24,
    right: 14,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.md,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: radius.full,
    backgroundColor: colors.glass,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleBlock: {
    flex: 1,
    marginLeft: spacing.md,
  },
  title: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 23,
    lineHeight: 30,
    color: colors.text,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    lineHeight: 17,
    color: colors.textMuted,
    marginTop: 1,
  },
});