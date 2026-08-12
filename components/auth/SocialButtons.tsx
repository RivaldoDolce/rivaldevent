/**
 * Boutons de connexion sociale (Google + Apple).
 *
 * Design « Noir & Or » :
 * - Rangée de cartes verre fumé (bg colors.glass, filet colors.border,
 *   rayon lg, hauteur 52)
 * - Logo isolé dans un slot fixe a gauche (logo et libelle bien separes)
 * - Libelle centre horizontalement, texte textSecondary
 * - Etat de chargement par fournisseur (disabled + texte)
 */

import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Apple } from 'lucide-react-native';

import { GoogleLogo } from '@/components/icons/GoogleLogo';
import { colors, radius, spacing, typography } from '@/lib/constants';

export type SocialProvider = 'google' | 'apple';

interface SocialButtonsProps {
  readonly googleLabel: string;
  readonly appleLabel: string;
  readonly loading?: SocialProvider | null;
  readonly onGoogle: () => void;
  readonly onApple: () => void;
}

export function SocialButtons({
  googleLabel,
  appleLabel,
  loading = null,
  onGoogle,
  onApple,
}: SocialButtonsProps) {
  const googleBusy = loading === 'google';
  const appleBusy = loading === 'apple';

  return (
    <View style={styles.container}>
      <Pressable
        style={[styles.button, googleBusy && styles.buttonDisabled]}
        onPress={onGoogle}
        disabled={googleBusy}
        accessibilityRole="button"
        accessibilityLabel={googleLabel}
      >
        <View style={styles.iconSlot} pointerEvents="none">
          <GoogleLogo size="md" />
        </View>
        <Text style={styles.label}>{googleBusy ? 'Connexion en cours...' : googleLabel}</Text>
      </Pressable>

      <Pressable
        style={[styles.button, appleBusy && styles.buttonDisabled]}
        onPress={onApple}
        disabled={appleBusy}
        accessibilityRole="button"
        accessibilityLabel={appleLabel}
      >
        <View style={styles.iconSlot} pointerEvents="none">
          <Apple color={colors.goldBright} size={22} strokeWidth={1.6} />
        </View>
        <Text style={styles.label}>{appleBusy ? 'Connexion en cours...' : appleLabel}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
  },
  button: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    minHeight: 52,
    height: 52,
    backgroundColor: colors.glass,
    alignItems: 'center',
    position: 'relative',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  iconSlot: {
    position: 'absolute',
    left: spacing.md,
    top: 0,
    bottom: 0,
    width: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  label: {
    flex: 1,
    textAlign: 'center',
    ...typography.bodySmallMedium,
    fontSize: 15,
    color: colors.textSecondary,
    letterSpacing: 0.2,
    paddingHorizontal: spacing.xl,
  },
});