/**
 * Selecteur d'operateur Mobile Money.
 *
 * Design "Minimalisme Africain Camerounais" :
 * - 3 cartes operateurs : MTN, Orange, Moov
 * - Chaque carte : logo SVG, nom, description
 * - Selection avec bordure d'accent + fond teinte
 * - Haptic feedback au selection
 * - Callback onSelect avec l'operateur choisi
 *
 * Conventions :
 * - Design tokens depuis lib/constants.ts
 * - expo-image pour les logos (SVG en PNG via assets)
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
import { CheckCircle2 } from 'lucide-react-native';

import { colors, spacing, radii, shadows } from '@/lib/constants';
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
  readonly accentColor: string;
  readonly bgColor: string;
}

// ============================================================
// Constantes
// ============================================================

const OPERATORS: readonly OperatorConfig[] = [
  {
    key: 'mtn',
    name: 'MTN MoMo',
    description: 'Mobile Money MTN',
    accentColor: '#FFCC00', // Jaune MTN
    bgColor: '#FFCC0015',
  },
  {
    key: 'orange',
    name: 'Orange Money',
    description: 'Mobile Money Orange',
    accentColor: '#FF6600', // Orange
    bgColor: '#FF660015',
  },
  {
    key: 'moov',
    name: 'Moov Money',
    description: 'Mobile Money Moov',
    accentColor: '#0267B3', // Bleu Moov
    bgColor: '#0267B315',
  },
] as const;

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
              isSelected && { borderColor: op.accentColor, backgroundColor: op.bgColor },
            ]}
            accessibilityRole="button"
            accessibilityLabel={`Selectionner ${op.name}`}
          >
            {/* Indicateur selection */}
            {isSelected && (
              <View style={[styles.checkIcon, { backgroundColor: op.accentColor }]}>
                <CheckCircle2 size={16} color={colors.white} strokeWidth={2} />
              </View>
            )}

            {/* Contenu */}
            <View style={styles.operatorContent}>
              {/* Cercle logo */}
              <View style={[styles.logoCircle, { backgroundColor: op.bgColor, borderColor: op.accentColor }]}>
                <Text style={[styles.logoInitial, { color: op.accentColor }]}>
                  {op.key === 'mtn' ? 'M' : op.key === 'orange' ? 'O' : 'V'}
                </Text>
              </View>

              {/* Nom + description */}
              <View style={styles.operatorTextContainer}>
                <Text style={[styles.operatorName, isSelected && { color: op.accentColor }]}>
                  {op.name}
                </Text>
                <Text style={styles.operatorDescription}>
                  {op.description}
                </Text>
              </View>
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

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
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    borderWidth: 2,
    borderColor: colors.border,
    padding: spacing.md,
    ...shadows.card,
    overflow: 'hidden',
  },
  checkIcon: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  operatorContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    flex: 1,
  },
  logoCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  logoInitial: {
    fontFamily: 'Inter-Bold',
    fontSize: 22,
    lineHeight: 28,
  },
  operatorTextContainer: {
    flex: 1,
  },
  operatorName: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    lineHeight: 22,
    color: colors.onyx,
    marginBottom: 2,
  },
  operatorDescription: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    lineHeight: 16,
    color: colors.stone,
  },
});
