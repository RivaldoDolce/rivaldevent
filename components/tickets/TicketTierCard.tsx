/**
 * Carte d'un tier de billet pour la selection.
 *
 * Design "Minimalisme Africain Camerounais" :
 * - Nom du tier en gras avec accent visuel (barre laterale coloree)
 * - Prix en FCFA bien visible
 * - Description et liste des benefices
 * - Badge stock (disponible / stock faible / epuise)
 * - Selecteur de quantite (+/-) avec nombre au centre
 * - Desactive si epuise (is_sold_out = true)
 *
 * Props :
 * - tier : donnees du tier (MockTicketTier)
 * - quantity : quantite selectionnee par l'utilisateur
 * - onQuantityChange : callback quand la quantite change
 *
 * Conventions :
 * - Design tokens depuis lib/constants.ts
 * - lucide-react-native pour les icones
 * - Pas de type any, pas d'emojis
 * - Imports @/
 * - Commentaires en francais
 */

import { useCallback, useMemo } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
} from 'react-native';
import {
  Minus,
  Plus,
  Check,
  AlertTriangle,
  XCircle,
} from 'lucide-react-native';

import { colors, spacing, radii, shadows } from '@/lib/constants';
import { formatPrice } from '@/services/event.service';
import type { MockTicketTier } from '@/data/mock';

// ============================================================
// Types
// ============================================================

interface TicketTierCardProps {
  /** Donnees du tier de billet */
  readonly tier: MockTicketTier;
  /** Quantite selectionnee par l'utilisateur */
  readonly quantity: number;
  /** Callback quand la quantite change */
  readonly onQuantityChange: (tierId: string, newQuantity: number) => void;
}

// ============================================================
// Constantes
// ============================================================

/** Quantite maximale selectionnable par tier */
const MAX_QUANTITY = 10;

/**
 * Couleur d'accent par nom de tier.
 * Standard -> terracotta, VIP -> gold, VVIP/Premium -> forest
 */
function getTierAccent(name: string): string {
  const lower = name.toLowerCase();
  if (lower.includes('premium') || lower.includes('vvip')) return colors.forest;
  if (lower.includes('vip')) return colors.gold;
  return colors.terracotta;
}

/**
 * Configuration du badge stock.
 */
function getStockConfig(tier: MockTicketTier): {
  label: string;
  color: string;
  bgColor: string;
  icon: 'check' | 'warning' | 'epuise';
} {
  if (tier.is_sold_out) {
    return { label: 'Epuise', color: colors.danger, bgColor: `${colors.danger}12`, icon: 'epuise' };
  }
  if (tier.is_low_stock) {
    return { label: `Plus que ${tier.available_quantity}`, color: colors.mango, bgColor: `${colors.mango}12`, icon: 'warning' };
  }
  return { label: `${tier.available_quantity} dispo.`, color: colors.forest, bgColor: `${colors.forest}12`, icon: 'check' };
}

// ============================================================
// Composant
// ============================================================

export default function TicketTierCard({ tier, quantity, onQuantityChange }: TicketTierCardProps) {
  const accent = useMemo(() => getTierAccent(tier.name), [tier.name]);
  const stockConfig = useMemo(() => getStockConfig(tier), [tier]);
  const isDisabled = tier.is_sold_out;

  // -- Handlers --
  const handleIncrement = useCallback(() => {
    if (isDisabled) return;
    if (quantity >= MAX_QUANTITY) return;
    if (quantity >= tier.available_quantity) return;
    onQuantityChange(tier.id, quantity + 1);
  }, [isDisabled, quantity, tier.id, tier.available_quantity, onQuantityChange]);

  const handleDecrement = useCallback(() => {
    if (quantity <= 0) return;
    onQuantityChange(tier.id, quantity - 1);
  }, [quantity, tier.id, onQuantityChange]);

  // -- Sous-total --
  const subtotal = quantity * tier.price;

  return (
    <View style={[styles.card, isDisabled && styles.cardDisabled]}>
      {/* Barre laterale d'accent */}
      <View style={[styles.accentBar, { backgroundColor: accent }]} />

      <View style={styles.cardContent}>
        {/* En-tete : nom + prix */}
        <View style={styles.headerRow}>
          <View style={styles.nameContainer}>
            <Text style={[styles.tierName, { color: accent }]}>
              {tier.name}
            </Text>
            {/* Badge stock */}
            <View style={[styles.stockBadge, { backgroundColor: stockConfig.bgColor }]}>
              {stockConfig.icon === 'check' && (
                <Check size={10} color={stockConfig.color} strokeWidth={2} />
              )}
              {stockConfig.icon === 'warning' && (
                <AlertTriangle size={10} color={stockConfig.color} strokeWidth={2} />
              )}
              {stockConfig.icon === 'epuise' && (
                <XCircle size={10} color={stockConfig.color} strokeWidth={2} />
              )}
              <Text style={[styles.stockBadgeText, { color: stockConfig.color }]}>
                {stockConfig.label}
              </Text>
            </View>
          </View>
          <Text style={styles.price}>
            {formatPrice(tier.price)}
          </Text>
        </View>

        {/* Description */}
        {tier.description ? (
          <Text style={styles.description} numberOfLines={2}>
            {tier.description}
          </Text>
        ) : null}

        {/* Benefices */}
        {tier.benefits.length > 0 ? (
          <View style={styles.benefitsContainer}>
            {tier.benefits.map((benefit, index) => (
              <View key={index} style={styles.benefitItem}>
                <View style={[styles.benefitDot, { backgroundColor: accent }]} />
                <Text style={styles.benefitText}>{benefit}</Text>
              </View>
            ))}
          </View>
        ) : null}

        {/* Selecteur quantite + sous-total */}
        <View style={styles.bottomRow}>
          <View style={[styles.quantitySelector, isDisabled && styles.quantityDisabled]}>
            <Pressable
              onPress={handleDecrement}
              disabled={quantity <= 0}
              style={[styles.quantityButton, quantity <= 0 && styles.quantityButtonDisabled]}
              accessibilityRole="button"
              accessibilityLabel="Diminuer la quantite"
              hitSlop={8}
            >
              <Minus size={16} color={quantity <= 0 ? colors.stone : colors.onyx} strokeWidth={2} />
            </Pressable>

            <Text style={[styles.quantityValue, isDisabled && styles.quantityValueDisabled]}>
              {quantity}
            </Text>

            <Pressable
              onPress={handleIncrement}
              disabled={isDisabled || quantity >= MAX_QUANTITY || quantity >= tier.available_quantity}
              style={[
                styles.quantityButton,
                (isDisabled || quantity >= MAX_QUANTITY || quantity >= tier.available_quantity) && styles.quantityButtonDisabled,
              ]}
              accessibilityRole="button"
              accessibilityLabel="Augmenter la quantite"
              hitSlop={8}
            >
              <Plus
                size={16}
                color={
                  isDisabled || quantity >= MAX_QUANTITY || quantity >= tier.available_quantity
                    ? colors.stone
                    : colors.onyx
                }
                strokeWidth={2}
              />
            </Pressable>
          </View>

          {/* Sous-total */}
          {quantity > 0 ? (
            <Text style={styles.subtotal}>
              {formatPrice(subtotal)}
            </Text>
          ) : (
            <Text style={styles.subtotalPlaceholder}>
              Selectionnez
            </Text>
          )}
        </View>
      </View>
    </View>
  );
}

// ============================================================
// Styles
// ============================================================

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    marginBottom: spacing.md,
    overflow: 'hidden',
    ...shadows.card,
  },
  cardDisabled: {
    opacity: 0.5,
  },

  accentBar: {
    width: 4,
    flex: 1,
  },

  cardContent: {
    flex: 1,
    padding: spacing.md,
  },

  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  nameContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  tierName: {
    fontFamily: 'Inter-Bold',
    fontSize: 18,
    lineHeight: 24,
    letterSpacing: -0.3,
  },
  stockBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radii.sm,
  },
  stockBadgeText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 10,
    lineHeight: 14,
    letterSpacing: 0.3,
  },
  price: {
    fontFamily: 'PlayfairDisplay-Bold',
    fontSize: 18,
    lineHeight: 24,
    color: colors.onyx,
    letterSpacing: -0.3,
  },

  description: {
    fontFamily: 'Inter-Regular',
    fontSize: 13,
    lineHeight: 18,
    color: colors.stone,
    marginBottom: spacing.sm,
  },

  benefitsContainer: {
    marginBottom: spacing.md,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  benefitDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  benefitText: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    lineHeight: 16,
    color: colors.onyx,
  },

  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  quantitySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.ivory,
    borderRadius: radii.md,
    overflow: 'hidden',
  },
  quantityDisabled: {
    opacity: 0.4,
  },
  quantityButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quantityButtonDisabled: {
    opacity: 0.3,
  },
  quantityValue: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    lineHeight: 22,
    color: colors.onyx,
    minWidth: 32,
    textAlign: 'center',
  },
  quantityValueDisabled: {
    color: colors.stone,
  },

  subtotal: {
    fontFamily: 'PlayfairDisplay-Bold',
    fontSize: 16,
    lineHeight: 22,
    color: colors.terracotta,
  },
  subtotalPlaceholder: {
    fontFamily: 'Inter-Regular',
    fontSize: 13,
    lineHeight: 18,
    color: colors.stone,
    fontStyle: 'italic',
  },
});
