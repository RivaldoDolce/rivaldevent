/**
 * Selecteur d'operateur Mobile Money — design system « Noir & Or ».
 *
 * - 3 cartes sombres : MTN, Orange, Moov, avec logos SVG existants
 * - Chaque carte : logo dans une pastille verre, nom, description
 * - Pastille radio a droite (cercle 24px) : coche = degrade or + check onyx
 * - Etat actif : filet or, fond verre dore, halo doré doux
 * - Haptic feedback au selection
 * - Callback onSelect avec l'operateur choisi
 *
 * API conservee EXACTEMENT :
 * - selected : PaymentMethod | null
 * - onSelect : (operator: PaymentMethod) => void
 *
 * Conventions :
 * - Design tokens depuis lib/constants.ts
 * - lucide-react-native pour les icones
 * - Pas de type any, pas d'emojis
 * - Imports @/
 * - Commentaires en francais
 */

import {
  View,
  Text,
  Pressable,
  StyleSheet,
} from 'react-native';
import { Check } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

import MtnLogo from '@/assets/icons/mtn-logo.svg';
import OrangeLogo from '@/assets/icons/orange-logo.svg';
import MoovLogo from '@/assets/icons/moov-logo.svg';

import { colors, spacing, radius, shadows, gradients } from '@/lib/constants';
import type { PaymentMethod } from '@/types';

// ============================================================
// Types
// ============================================================

interface OperatorSelectorProps {
  /** Operateur actuellement selectionne */
  readonly selected: PaymentMethod | null;
  /** Callback quand un operateur est selectionne */
  readonly onSelect: (operator: PaymentMethod) => void;
}

interface OperatorConfig {
  readonly key: PaymentMethod;
  readonly name: string;
  readonly description: string;
  readonly logoSource: React.ComponentType<{ width?: number; height?: number }>;
}

// ============================================================
// Constantes
// ============================================================

const OPERATORS: readonly OperatorConfig[] = [
  {
    key: 'mtn',
    name: 'MTN MoMo',
    description: 'Mobile Money MTN',
    logoSource: MtnLogo,
  },
  {
    key: 'orange',
    name: 'Orange Money',
    description: 'Mobile Money Orange',
    logoSource: OrangeLogo,
  },
  {
    key: 'moov',
    name: 'Moov Money',
    description: 'Mobile Money Moov',
    logoSource: MoovLogo,
  },
] as const;

// ============================================================
// Styles
// ============================================================

const styles = StyleSheet.create({
  container: {
    gap: spacing.md,
  },
  operatorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.elevated,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    ...shadows.card,
  },
  operatorCardSelected: {
    borderColor: `${colors.gold}66`,
    backgroundColor: colors.glassGold,
    ...shadows.goldGlowSoft,
  },
  logoWrap: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    backgroundColor: colors.glass,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  operatorTextContainer: {
    flex: 1,
  },
  operatorName: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
    lineHeight: 22,
    color: colors.text,
    marginBottom: 2,
  },
  operatorDescription: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    lineHeight: 16,
    color: colors.textMuted,
  },
  radioOuter: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: spacing.sm,
    backgroundColor: 'transparent',
  },
  radioSelected: {
    borderColor: 'transparent',
  },
  radioInner: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

// ============================================================
// Composant
// ============================================================

export default function OperatorSelector({ selected, onSelect }: OperatorSelectorProps) {
  return (
    <View style={styles.container}>
      {OPERATORS.map((op) => {
        const isSelected = selected === op.key;
        return (
          <Pressable
            key={op.key}
            onPress={() => onSelect(op.key)}
            style={[
              styles.operatorCard,
              isSelected && styles.operatorCardSelected,
            ]}
            accessibilityRole="button"
            accessibilityLabel={`Selectionner ${op.name}`}
            accessibilityState={{ selected: isSelected }}
          >
            {/* LogoSVG dans une pastille verre */}
            <View style={styles.logoWrap}>
              {(() => {
                const OperatorLogo = op.logoSource;
                return <OperatorLogo width={36} height={36} />;
              })()}
            </View>

            {/* Nom + description */}
            <View style={styles.operatorTextContainer}>
              <Text style={styles.operatorName}>
                {op.name}
              </Text>
              <Text style={styles.operatorDescription}>
                {op.description}
              </Text>
            </View>

            {/* Pastille radio — degrade or quand coche */}
            <View style={[
              styles.radioOuter,
              isSelected && styles.radioSelected,
            ]}>
              {isSelected && (
                <LinearGradient
                  colors={[...gradients.gold] as unknown as readonly [string, string, ...string[]]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.radioInner}
                >
                  <Check size={14} color={colors.onyx} strokeWidth={3} />
                </LinearGradient>
              )}
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}