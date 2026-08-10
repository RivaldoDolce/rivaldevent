/**
 * ScreenHeader — en-tete partage des sous-ecrans du profil.
 *
 * Design :
 * - Derivee foret avec anneau decoratif or (coherence avec la page profil)
 * - Bouton retour dans une pastille verre
 * - Titre Playfair + sous-titre caption
 *
 * Conventions :
 * - Toutes les couleurs viennent de lib/constants.ts
 * - Haptics legers sur le retour
 */

import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { ChevronLeft } from 'lucide-react-native';

import { useHaptics } from '@/hooks/useHaptics';
import { colors, spacing, radius } from '@/lib/constants';

interface ScreenHeaderProps {
  readonly title: string;
  readonly subtitle?: string;
}

export function ScreenHeader({ title, subtitle }: ScreenHeaderProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { impact } = useHaptics();

  return (
    <LinearGradient
      colors={[colors.forestDeep, colors.forestMid]}
      start={{ x: 0.1, y: 0 }}
      end={{ x: 0.9, y: 1 }}
      style={[styles.header, { paddingTop: insets.top + spacing.sm }]}
    >
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
          <ChevronLeft size={22} color={colors.sand} strokeWidth={1.75} />
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
  },
  ringLarge: {
    position: 'absolute',
    width: 130,
    height: 130,
    borderRadius: 65,
    borderWidth: 1.5,
    borderColor: `${colors.goldSoft}30`,
    top: -70,
    right: -40,
  },
  ringSmall: {
    position: 'absolute',
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 1.5,
    borderColor: `${colors.goldSoft}28`,
    top: -24,
    right: 14,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.md,
  },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: radius.full,
    backgroundColor: `${colors.sand}14`,
    borderWidth: 1,
    borderColor: `${colors.sand}24`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleBlock: {
    flex: 1,
    marginLeft: spacing.md,
  },
  title: {
    fontFamily: 'PlayfairDisplay-Bold',
    fontSize: 22,
    lineHeight: 28,
    color: colors.sand,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    lineHeight: 17,
    color: `${colors.sand}A8`,
    marginTop: 1,
  },
});
