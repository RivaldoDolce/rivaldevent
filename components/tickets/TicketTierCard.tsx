/**
 * Carte d'un tier de billet pour la selection.
 *
 * Design « Noir & Or » premium :
 * - Tuile d'emblème dégradée selon la gamme (PREMIUM → or, VIP → terracotta,
 *   STANDARD → forêt) avec le logo SVG officiel de la qualité
 * - Nom du tier en serif, prix or champagne bien visible
 * - Description et liste des bénéfices
 * - Badge stock pill (disponible / stock faible / epuise) avec point indicateur
 * - Selecteur de quantite : pastilles verre rondes (+/-) avec nombre au centre
 * - Sous-total en overline dorée quand une quantite est choisie
 * - Dégradé d'accent en filigrane sur la tranche supérieure de la carte
 * - Desactive si epuise (is_sold_out = true)
 *
 * Props :
 * - tier : donnees du tier (MockTicketTier)
 * - quantity : quantite selectionnee par l'utilisateur
 * - onQuantityChange : callback quand la quantite change
 *
 * Conventions :
 * - Design tokens depuis lib/constants.ts
 * - Logos de gamme via lib/tier-quality.ts
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
  type ViewStyle,
  type TextStyle,
} from 'react-native';
import { Minus, Plus } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { colors, spacing, radius, shadows } from '@/lib/constants';
import { getTierQualityInfo } from '@/lib/tier-quality';
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
 * Configuration du badge stock — pill avec point indicateur.
 * Disponible -> success, stock faible -> warning « Plus que N », epuise -> danger.
 */
function getStockConfig(tier: MockTicketTier): {
  label: string;
  color: string;
  bgColor: string;
} {
  if (tier.is_sold_out) {
    return { label: 'Epuise', color: colors.danger, bgColor: 'rgba(255,107,94,0.12)' };
  }
  if (tier.is_low_stock) {
    return { label: `Plus que ${tier.available_quantity}`, color: colors.warning, bgColor: 'rgba(232,182,76,0.12)' };
  }
  return { label: `${tier.available_quantity} dispo.`, color: colors.success, bgColor: 'rgba(91,196,139,0.12)' };
}

// ============================================================
// Composant
// ============================================================

export default function TicketTierCard({ tier, quantity, onQuantityChange }: TicketTierCardProps) {
  const quality = useMemo(() => getTierQualityInfo(tier.name), [tier.name]);
  const stockConfig = useMemo(() => getStockConfig(tier), [tier]);
  const isDisabled = tier.is_sold_out;
  const QualityIcon = quality.icon;

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

  const canIncrement = !isDisabled && quantity < MAX_QUANTITY && quantity < tier.available_quantity;

  return (
    <View style={[styles.card, isDisabled && styles.cardDisabled]}>
      {/* Filigrane dégradé d'accent (tranche supérieure) */}
      <LinearGradient
        colors={[...quality.gradient] as unknown as readonly [string, string, ...string[]]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.accentSheen}
        pointerEvents="none"
      />

      <View style={styles.cardContent}>
        {/* En-tete : embleme + nom + badge stock */}
        <View style={styles.headerRow}>
          <View style={styles.nameContainer}>
            {/* Tuile embleme degradee */}
            <View style={[styles.qualityTile, { borderColor: `${quality.color}40` }]}>
              <QualityIcon width={26} height={26} />
            </View>

            <View style={styles.nameBlock}>
              <Text style={styles.tierName} numberOfLines={1}>
                {tier.name}
              </Text>
              <Text style={[styles.qualityLabel, { color: quality.color }]}>
                {quality.label}
              </Text>
            </View>
          </View>

          {/* Prix */}
          <View style={styles.priceBlock}>
            <Text style={styles.price}>{formatPrice(tier.price)}</Text>
            <Text style={styles.pricePerTicket}>par billet</Text>
          </View>
        </View>

        {/* Badge stock */}
        <View style={styles.stockRow}>
          <View style={[styles.stockBadge, { backgroundColor: stockConfig.bgColor }]}>
            <View style={[styles.stockDot, { backgroundColor: stockConfig.color }]} />
            <Text style={[styles.stockBadgeText, { color: stockConfig.color }]}>
              {stockConfig.label}
            </Text>
          </View>
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
                <View style={[styles.benefitDot, { backgroundColor: quality.color }]} />
                <Text style={styles.benefitText}>{benefit}</Text>
              </View>
            ))}
          </View>
        ) : null}

        {/* Separateur filet */}
        <View style={styles.divider} />

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
              <Minus size={18} color={quantity <= 0 ? colors.textFaint : colors.goldBright} strokeWidth={1.75} />
            </Pressable>

            <Text style={[styles.quantityValue, isDisabled && styles.quantityValueDisabled]}>
              {quantity}
            </Text>

            <Pressable
              onPress={handleIncrement}
              disabled={!canIncrement}
              style={[styles.quantityButton, !canIncrement && styles.quantityButtonDisabled]}
              accessibilityRole="button"
              accessibilityLabel="Augmenter la quantite"
              hitSlop={8}
            >
              <Plus
                size={18}
                color={canIncrement ? colors.goldBright : colors.textFaint}
                strokeWidth={1.75}
              />
            </Pressable>
          </View>

          {/* Sous-total */}
          {quantity > 0 ? (
            <View style={styles.subtotalBlock}>
              <Text style={styles.subtotalOverline}>SOUS-TOTAL</Text>
              <Text style={styles.subtotal}>{formatPrice(subtotal)}</Text>
            </View>
          ) : (
            <Text style={styles.subtotalPlaceholder}>Selectionnez</Text>
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
    backgroundColor: colors.elevated,
    borderWidth: 1,
    borderColor: `${colors.gold}1F`,
    borderRadius: radius.lg,
    marginBottom: spacing.md,
    overflow: 'hidden',
    ...shadows.card,
  } as ViewStyle,
  cardDisabled: {
    opacity: 0.5,
  } as ViewStyle,

  accentSheen: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
  } as ViewStyle,

  cardContent: {
    padding: spacing.md,
  } as ViewStyle,

  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: spacing.md,
    marginBottom: spacing.sm,
  } as ViewStyle,
  nameContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  } as ViewStyle,
  nameBlock: {
    flex: 1,
  } as ViewStyle,
  qualityTile: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.glass,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  } as ViewStyle,
  tierName: {
    fontFamily: 'Inter_700Bold',
    fontSize: 16,
    lineHeight: 22,
    color: colors.text,
    letterSpacing: -0.2,
  } as TextStyle,
  qualityLabel: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 10,
    lineHeight: 14,
    letterSpacing: 1.6,
    marginTop: 2,
  } as TextStyle,

  priceBlock: {
    alignItems: 'flex-end',
  } as ViewStyle,
  price: {
    fontFamily: 'Inter_700Bold',
    fontSize: 18,
    lineHeight: 24,
    color: colors.goldBright,
    letterSpacing: -0.2,
  } as TextStyle,
  pricePerTicket: {
    fontFamily: 'Inter_400Regular',
    fontSize: 10,
    lineHeight: 14,
    color: colors.textMuted,
  } as TextStyle,

  stockRow: {
    flexDirection: 'row',
    marginBottom: spacing.sm,
  } as ViewStyle,
  stockBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: `${colors.gold}26`,
  } as ViewStyle,
  stockDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  } as ViewStyle,
  stockBadgeText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 10,
    lineHeight: 14,
    letterSpacing: 0.2,
  } as TextStyle,

  description: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    lineHeight: 18,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  } as TextStyle,

  benefitsContainer: {
    marginBottom: spacing.md,
  } as ViewStyle,
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  } as ViewStyle,
  benefitDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  } as ViewStyle,
  benefitText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    lineHeight: 16,
    color: colors.textSecondary,
  } as TextStyle,

  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: `${colors.gold}2E`,
    marginBottom: spacing.md,
  } as ViewStyle,

  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  } as ViewStyle,

  quantitySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  } as ViewStyle,
  quantityDisabled: {
    opacity: 0.35,
  } as ViewStyle,
  quantityButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.glass,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  } as ViewStyle,
  quantityButtonDisabled: {
    opacity: 0.35,
  } as ViewStyle,
  quantityValue: {
    fontFamily: 'Inter_700Bold',
    fontSize: 18,
    lineHeight: 24,
    color: colors.text,
    minWidth: 36,
    textAlign: 'center',
  } as TextStyle,
  quantityValueDisabled: {
    color: colors.textMuted,
  } as TextStyle,

  subtotalBlock: {
    alignItems: 'flex-end',
  } as ViewStyle,
  subtotalOverline: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 10,
    lineHeight: 14,
    letterSpacing: 1.4,
    color: colors.goldMuted,
    textTransform: 'uppercase',
  } as TextStyle,
  subtotal: {
    fontFamily: 'Inter_700Bold',
    fontSize: 16,
    lineHeight: 22,
    color: colors.goldBright,
    marginTop: 2,
  } as TextStyle,
  subtotalPlaceholder: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    lineHeight: 18,
    color: colors.textMuted,
    fontStyle: 'italic',
  } as TextStyle,
});