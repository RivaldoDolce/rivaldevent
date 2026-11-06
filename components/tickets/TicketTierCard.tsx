import { useCallback, useMemo, useEffect, useRef } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Animated,
  type ViewStyle,
  type TextStyle,
} from 'react-native';
import { Minus, Plus, CircleCheck, Receipt } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { colors, spacing, radius, shadows } from '@/lib/constants';
import { getTierQualityInfo } from '@/lib/tier-quality';
import { formatPrice } from '@/services/event.service';
import type { MockTicketTier } from '@/data/mock';

interface TicketTierCardProps {
  readonly tier: MockTicketTier;
  readonly quantity: number;
  readonly onQuantityChange: (tierId: string, newQuantity: number) => void;
}

const MAX_QUANTITY = 10;

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

export default function TicketTierCard({ tier, quantity, onQuantityChange }: TicketTierCardProps) {
  const quality = useMemo(() => getTierQualityInfo(tier.name), [tier.name]);
  const stockConfig = useMemo(() => getStockConfig(tier), [tier]);
  const isDisabled = tier.is_sold_out;
  const QualityIcon = quality.icon;
  const isElected = quantity > 0 && !isDisabled;

  const scaleAnim = useRef(new Animated.Value(isElected ? 1 : 0)).current;
  const qtyScale = useRef(new Animated.Value(1)).current;
  const shimmerX = useRef(new Animated.Value(-1)).current;

  useEffect(() => {
    Animated.spring(scaleAnim, {
      toValue: isElected ? 1 : 0,
      useNativeDriver: true,
      damping: 18,
      stiffness: 180,
    }).start();
  }, [isElected, scaleAnim]);

  useEffect(() => {
    Animated.sequence([
      Animated.spring(qtyScale, { toValue: 1.22, useNativeDriver: true, damping: 10, stiffness: 300 }),
      Animated.spring(qtyScale, { toValue: 1, useNativeDriver: true, damping: 12, stiffness: 200 }),
    ]).start();
  }, [quantity, qtyScale]);

  useEffect(() => {
    if (!isElected) return;
    const loop = Animated.loop(
      Animated.timing(shimmerX, { toValue: 1, duration: 1600, useNativeDriver: true })
    );
    shimmerX.setValue(-1);
    loop.start();
    return () => loop.stop();
  }, [isElected, shimmerX]);

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

  const subtotal = quantity * tier.price;
  const canIncrement = !isDisabled && quantity < MAX_QUANTITY && quantity < tier.available_quantity;
  const cardScale = scaleAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.01] });
  const shimmerTranslate = shimmerX.interpolate({ inputRange: [-1, 1], outputRange: [-220, 220] });

  return (
    <Animated.View
      style={[
        styles.card,
        isDisabled && styles.cardDisabled,
        isElected && styles.cardElected,
        { transform: [{ scale: cardScale }] },
      ]}
    >
      {isElected && <View style={styles.goldGlow} pointerEvents="none" />}
      <LinearGradient
        colors={[...quality.gradient] as unknown as readonly [string, string, ...string[]]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.accentSheen, isElected && styles.accentSheenElected]}
        pointerEvents="none"
      />
      {isElected && (
        <View style={styles.accentGlow} pointerEvents="none">
          <LinearGradient
            colors={['rgba(242,220,155,0.45)', 'transparent']}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={{ flex: 1, opacity: 0.7 }}
          />
        </View>
      )}

      <View style={styles.cardContent}>
        <View style={styles.headerRow}>
          <View style={styles.nameContainer}>
            <View style={[styles.qualityTile, { borderColor: `${quality.color}40` }, isElected && { borderColor: `${quality.color}88`, backgroundColor: 'rgba(255,255,255,0.10)' }]}>
              <QualityIcon width={26} height={26} />
            </View>

            <View style={styles.nameBlock}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={styles.tierName} numberOfLines={1}>
                  {tier.name}
                </Text>
                {isElected && <CircleCheck size={12} color={colors.gold} strokeWidth={1.75} />}
              </View>
              <Text style={[styles.qualityLabel, { color: quality.color }]}>
                {quality.label}
              </Text>
            </View>
          </View>

          <View style={styles.priceBlock}>
            <Text style={styles.price}>{formatPrice(tier.price)}</Text>
            <Text style={styles.pricePerTicket}>par billet</Text>
          </View>
        </View>

        <View style={styles.stockRow}>
          <View style={[styles.stockBadge, { backgroundColor: stockConfig.bgColor }]}>
            <View style={[styles.stockDot, { backgroundColor: stockConfig.color }]} />
            <Text style={[styles.stockBadgeText, { color: stockConfig.color }]}>
              {stockConfig.label}
            </Text>
          </View>
        </View>

        {tier.description ? (
          <Text style={styles.description} numberOfLines={2}>
            {tier.description}
          </Text>
        ) : null}

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

        <View style={styles.divider} />

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
              {quantity > 0 ? (
                <LinearGradient colors={['#F2DC9B', '#D8B45A'] as unknown as readonly [string, string, ...string[]]} style={styles.qtyBtnGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                  <Minus size={18} color={colors.onyx} strokeWidth={2.25} />
                </LinearGradient>
              ) : (
                <Minus size={18} color={colors.textFaint} strokeWidth={1.75} />
              )}
            </Pressable>

            <Animated.Text style={[styles.quantityValue, isDisabled && styles.quantityValueDisabled, { transform: [{ scale: qtyScale }] }]}>
              {quantity}
            </Animated.Text>

            <Pressable
              onPress={handleIncrement}
              disabled={!canIncrement}
              style={[styles.quantityButton, !canIncrement && styles.quantityButtonDisabled]}
              accessibilityRole="button"
              accessibilityLabel="Augmenter la quantite"
              hitSlop={8}
            >
              {canIncrement ? (
                <LinearGradient colors={['#F2DC9B', '#D8B45A'] as unknown as readonly [string, string, ...string[]]} style={styles.qtyBtnGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                  <Plus size={18} color={colors.onyx} strokeWidth={2.25} />
                </LinearGradient>
              ) : (
                <Plus size={18} color={colors.textFaint} strokeWidth={1.75} />
              )}
            </Pressable>
          </View>

          {quantity > 0 ? (
            <View style={styles.subtotalBlock}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Text style={styles.subtotalOverline}>SOUS-TOTAL</Text>
                <Receipt size={10} color={colors.gold} strokeWidth={2} />
              </View>
              <View style={styles.subtotalShimmerWrap}>
                <Text style={styles.subtotal}>{formatPrice(subtotal)}</Text>
                <Animated.View style={[styles.subtotalShimmer, { transform: [{ translateX: shimmerTranslate }] }]} pointerEvents="none">
                  <LinearGradient
                    colors={['transparent', 'rgba(255,255,255,0.55)', 'transparent']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={{ flex: 1 }}
                  />
                </Animated.View>
              </View>
            </View>
          ) : (
            <Text style={styles.subtotalPlaceholder}>Selectionnez</Text>
          )}
        </View>
      </View>
    </Animated.View>
  );
}

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
  cardElected: {
    borderColor: `${colors.gold}66`,
    ...shadows.goldGlowSoft,
    shadowColor: 'rgba(216,180,90,0.45)',
  } as ViewStyle,
  goldGlow: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(216,180,90,0.06)',
    borderRadius: radius.lg,
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
  accentSheenElected: {
    height: 4,
    shadowColor: colors.gold,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 6,
  } as ViewStyle,
  accentGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 28,
    opacity: 0.9,
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
    overflow: 'hidden',
  } as ViewStyle,
  qtyBtnGradient: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  } as ViewStyle,
  quantityButtonDisabled: {
    opacity: 0.55,
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
  subtotalShimmerWrap: {
    overflow: 'hidden',
    borderRadius: 6,
    marginTop: 2,
  } as ViewStyle,
  subtotalShimmer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 60,
    left: 0,
  } as ViewStyle,
  subtotal: {
    fontFamily: 'Inter_700Bold',
    fontSize: 16,
    lineHeight: 22,
    color: colors.goldBright,
  } as TextStyle,
  subtotalPlaceholder: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    lineHeight: 18,
    color: colors.textMuted,
    fontStyle: 'italic',
  } as TextStyle,
});
