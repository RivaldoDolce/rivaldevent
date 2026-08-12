/**
 * Portefeuille vendeur — solde, retraits et activite recente.
 *
 * Design system « Noir & Or » :
 * - Hero sombre gradue avec filet dore, montant Playfair enormement
 * - Bouton "Retirer" en or
 * - Liste de transactions : icone pastille par type, +vert/-rouge, libelle, date
 *
 * Source de verite : stores/seller-store.ts (mock pour l'instant,
 * remplace par l'API Supabase au Jalon 6).
 * Toutes les couleurs viennent de lib/constants.ts.
 */

import { useCallback, useMemo } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  StyleSheet,
  type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import {
  ArrowUpRight,
  ArrowDownRight,
  Clock3,
  Wallet,
} from 'lucide-react-native';

import { colors, spacing, radius, shadows, gradients } from '@/lib/constants';
import { useHaptics } from '@/hooks/useHaptics';
import { useSellerStore, useSellerTotals } from '@/stores/seller-store';
import { formatFCFA, formatShortDate } from '@/lib/format';
import { ScreenHeader } from '@/components/profile/ScreenHeader';

// ============================================================
// Metadonnees de statut (aligne sur l'ecran Mes ventes)
// ============================================================

const SALE_STATUS_META = {
  completed: { label: 'Paye', color: colors.success },
  pending: { label: 'En attente', color: colors.warning },
  failed: { label: 'Echoue', color: colors.danger },
} as const;

// ============================================================
// Ecran
// ============================================================

export default function SellerWalletScreen() {
  const insets = useSafeAreaInsets();
  const { impact, notification } = useHaptics();
  const availableBalance = useSellerStore((s) => s.availableBalance);
  const pendingWithdrawals = useSellerStore((s) => s.pendingWithdrawals);
  const sales = useSellerStore((s) => s.sales);
  const totals = useSellerTotals();

  const recentSales = useMemo(
    () => [...sales].sort((a, b) => b.purchased_at.localeCompare(a.purchased_at)).slice(0, 6),
    [sales],
  );

  const handleWithdraw = useCallback(() => {
    impact('medium');
    notification('warning');
  }, [impact, notification]);

  // -- Styles dynamiques --
  const contentStyle: ViewStyle = {
    paddingBottom: insets.bottom + spacing.xxl + 40,
  };

  return (
    <View style={styles.screen}>
      <ScrollView
        style={styles.screen}
        contentContainerStyle={contentStyle}
        showsVerticalScrollIndicator={false}
      >
        {/* ============================================
            1. HEADER (retour vers le profil vendeur)
            ============================================ */}
        <ScreenHeader
          title="Mon portefeuille"
          subtitle="Vos revenus et votre activite"
        />

        {/* ============================================
            2. HERO — solde du portefeuille
            ============================================ */}
        <LinearGradient
          colors={[...gradients.surface] as unknown as readonly [string, string, ...string[]]}
          start={{ x: 0.1, y: 0 }}
          end={{ x: 0.9, y: 1 }}
          style={styles.hero}
        >
          <View pointerEvents="none" style={styles.glowLarge} />
          <View pointerEvents="none" style={styles.ringLarge} />
          <View pointerEvents="none" style={styles.ringSmall} />
          <View pointerEvents="none" style={styles.heroHairline} />

          <View style={styles.heroLabelRow}>
            <Wallet size={16} color={colors.goldBright} strokeWidth={1.75} />
            <Text style={styles.heroLabel}>SOLDE DISPONIBLE</Text>
          </View>

          <Text style={styles.balance}>{formatFCFA(availableBalance)}</Text>
          <Text style={styles.balanceSub}>
            {totals.totalSales} vente{totals.totalSales > 1 ? 's' : ''} au total ·{' '}
            {formatFCFA(totals.totalRevenue)} encaisses
          </Text>

          <Pressable
            onPress={handleWithdraw}
            style={styles.withdrawButton}
            accessibilityRole="button"
            accessibilityLabel="Retirer des fonds"
          >
            <LinearGradient
              colors={[...gradients.gold] as unknown as readonly [string, string, ...string[]]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.withdrawGradient}
            >
              <ArrowUpRight size={17} color={colors.onyx} strokeWidth={2} />
              <Text style={styles.withdrawText}>Retirer</Text>
            </LinearGradient>
          </Pressable>

          <View style={styles.pendingRow}>
            <Clock3 size={15} color={colors.textSecondary} strokeWidth={1.75} />
            <Text style={styles.pendingText}>
              {formatFCFA(pendingWithdrawals)} en attente de retrait
            </Text>
          </View>
        </LinearGradient>

        {/* ============================================
            2. ACTIVITE RECENTE
            ============================================ */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>ACTIVITE RECENTE</Text>
          <View style={styles.card}>
            {recentSales.length === 0 ? (
              <Text style={styles.emptyText}>Aucune vente pour le moment.</Text>
            ) : (
              recentSales.map((sale, index) => {
                const status = SALE_STATUS_META[sale.status];
                const isIncome = sale.status !== 'failed';
                return (
                  <View
                    key={sale.id}
                    style={[
                      styles.txRow,
                      index < recentSales.length - 1 ? styles.txRowBorder : null,
                    ]}
                  >
                    <View
                      style={[
                        styles.txIcon,
                        {
                          backgroundColor: isIncome ? `${colors.success}1A` : `${colors.terracotta}1A`,
                          borderColor: isIncome ? `${colors.success}38` : `${colors.terracotta}38`,
                        },
                      ]}
                    >
                      {isIncome ? (
                        <ArrowDownRight size={18} color={colors.success} strokeWidth={1.75} />
                      ) : (
                        <ArrowUpRight size={18} color={colors.terracotta} strokeWidth={1.75} />
                      )}
                    </View>

                    <View style={styles.txInfo}>
                      <Text style={styles.txTitle} numberOfLines={1}>
                        {sale.event_title}
                      </Text>
                      <Text style={styles.txSub} numberOfLines={1}>
                        {sale.buyer_name} · {sale.tier_name} x{sale.quantity} ·{' '}
                        {formatShortDate(sale.purchased_at)}
                      </Text>
                    </View>

                    <View style={styles.txRight}>
                      <Text
                        style={[
                          styles.txAmount,
                          { color: isIncome ? colors.success : colors.danger },
                        ]}
                      >
                        {isIncome ? '+' : '-'}
                        {formatFCFA(sale.total_price)}
                      </Text>
                      <View
                        style={[
                          styles.statusChip,
                          { backgroundColor: `${status.color}1A`, borderColor: `${status.color}38` },
                        ]}
                      >
                        <Text style={[styles.statusText, { color: status.color }]}>
                          {status.label}
                        </Text>
                      </View>
                    </View>
                  </View>
                );
              })
            )}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

// ============================================================
// Styles
// ============================================================

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  hero: {
    marginHorizontal: spacing.lg,
    marginTop: -spacing.md,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl + spacing.md,
    borderRadius: radius.xxl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: `${colors.gold}2E`,
    ...shadows.eventCard,
  },
  glowLarge: {
    position: 'absolute',
    top: -120,
    right: -80,
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: 'rgba(216,180,90,0.10)',
  },
  ringLarge: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 1.5,
    borderColor: `${colors.gold}2E`,
    top: -92,
    right: -64,
  },
  ringSmall: {
    position: 'absolute',
    width: 118,
    height: 118,
    borderRadius: 59,
    borderWidth: 1.5,
    borderColor: `${colors.gold}26`,
    top: -38,
    right: -18,
  },
  heroHairline: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
    bottom: spacing.xl,
    height: 1,
    backgroundColor: 'rgba(216,180,90,0.09)',
  },
  heroLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  heroLabel: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 11,
    lineHeight: 16,
    color: colors.goldMuted,
    letterSpacing: 2.4,
    marginLeft: spacing.sm,
  },
  balance: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 40,
    lineHeight: 50,
    color: colors.goldBright,
    letterSpacing: -0.8,
    marginTop: spacing.sm,
  },
  balanceSub: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    lineHeight: 19,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  withdrawButton: {
    alignSelf: 'flex-start',
    borderRadius: radius.full,
    overflow: 'hidden',
    marginTop: spacing.lg,
    ...shadows.goldGlow,
  },
  withdrawGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm + 1,
  },
  withdrawText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 13,
    lineHeight: 18,
    color: colors.onyx,
    marginLeft: spacing.xs,
  },
  pendingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.md,
  },
  pendingText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 12,
    lineHeight: 17,
    color: colors.textSecondary,
    marginLeft: spacing.sm,
  },

  // -- Section activite --
  section: {
    marginTop: spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  sectionLabel: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 11,
    lineHeight: 16,
    color: colors.goldMuted,
    letterSpacing: 1.6,
    marginBottom: spacing.sm + 2,
    marginLeft: spacing.xs,
  },
  card: {
    backgroundColor: colors.elevated,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: `${colors.gold}1F`,
    overflow: 'hidden',
    ...shadows.card,
  },
  emptyText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    lineHeight: 20,
    color: colors.textMuted,
    textAlign: 'center',
    paddingVertical: spacing.xl,
  },
  txRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  txRowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.divider,
  },
  txIcon: {
    width: 38,
    height: 38,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  txInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  txTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    lineHeight: 19,
    color: colors.text,
  },
  txSub: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    lineHeight: 17,
    color: colors.textMuted,
    marginTop: 1,
  },
  txRight: {
    alignItems: 'flex-end',
    marginLeft: spacing.md,
  },
  txAmount: {
    fontFamily: 'Inter_700Bold',
    fontSize: 14,
    lineHeight: 19,
  },
  statusChip: {
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    marginTop: 3,
    borderWidth: 1,
  },
  statusText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 10,
    lineHeight: 13,
    letterSpacing: 0.4,
  },
});