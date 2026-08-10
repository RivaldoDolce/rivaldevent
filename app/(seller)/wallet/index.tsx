/**
 * Portefeuille vendeur — solde, retraits et activite recente.
 *
 * Design "Minimalisme Africain Camerounais" :
 * - Hero derivee foret avec solde disponible + retraits en attente
 * - Bouton "Retirer" (meme style que le dashboard vendeur)
 * - Activation recente : ventes du store avec statut et montant
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

import { colors, spacing, radius, shadows } from '@/lib/constants';
import { useHaptics } from '@/hooks/useHaptics';
import { useSellerStore, useSellerTotals } from '@/stores/seller-store';
import { formatFCFA, formatShortDate } from '@/lib/format';

// ============================================================
// Metadonnees de statut (aligne sur l'ecran Mes ventes)
// ============================================================

const SALE_STATUS_META = {
  completed: { label: 'Paye', color: colors.forest },
  pending: { label: 'En attente', color: colors.goldDark },
  failed: { label: 'Echoue', color: colors.terracotta },
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
            1. HERO — solde du portefeuille
            ============================================ */}
        <LinearGradient
          colors={[colors.forestDeep, colors.forestMid, colors.forest]}
          start={{ x: 0.1, y: 0 }}
          end={{ x: 0.9, y: 1 }}
          style={[styles.hero, { paddingTop: insets.top + spacing.lg }]}
        >
          <View pointerEvents="none" style={styles.ringLarge} />
          <View pointerEvents="none" style={styles.ringSmall} />

          <View style={styles.heroLabelRow}>
            <Wallet size={16} color={colors.goldSoft} strokeWidth={1.75} />
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
            <ArrowUpRight size={17} color={colors.forestDeep} strokeWidth={2} />
            <Text style={styles.withdrawText}>Retirer</Text>
          </Pressable>

          <View style={styles.pendingRow}>
            <Clock3 size={15} color={`${colors.sand}B3`} strokeWidth={1.75} />
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
                        { backgroundColor: isIncome ? `${colors.forest}10` : `${colors.terracotta}12` },
                      ]}
                    >
                      {isIncome ? (
                        <ArrowDownRight size={18} color={colors.forest} strokeWidth={1.75} />
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
                          { color: isIncome ? colors.forest : colors.terracotta },
                        ]}
                      >
                        {isIncome ? '+' : '-'}
                        {formatFCFA(sale.total_price)}
                      </Text>
                      <View
                        style={[
                          styles.statusChip,
                          { backgroundColor: `${status.color}14` },
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
    backgroundColor: colors.sand,
  },
  hero: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl + spacing.md,
    borderBottomLeftRadius: radius.xxl,
    borderBottomRightRadius: radius.xxl,
    overflow: 'hidden',
  },
  ringLarge: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 1.5,
    borderColor: `${colors.goldSoft}35`,
    top: -92,
    right: -64,
  },
  ringSmall: {
    position: 'absolute',
    width: 118,
    height: 118,
    borderRadius: 59,
    borderWidth: 1.5,
    borderColor: `${colors.goldSoft}30`,
    top: -38,
    right: -18,
  },
  heroLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  heroLabel: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 11,
    lineHeight: 16,
    color: colors.goldSoft,
    letterSpacing: 2.4,
    marginLeft: spacing.sm,
  },
  balance: {
    fontFamily: 'PlayfairDisplay-Bold',
    fontSize: 40,
    lineHeight: 50,
    color: colors.sand,
    letterSpacing: -0.8,
    marginTop: spacing.sm,
  },
  balanceSub: {
    fontFamily: 'Inter-Regular',
    fontSize: 13,
    lineHeight: 19,
    color: `${colors.sand}B3`,
    marginTop: spacing.xs,
  },
  withdrawButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-start',
    backgroundColor: colors.goldSoft,
    borderRadius: radius.full,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm + 1,
    marginTop: spacing.lg,
    shadowColor: colors.onyx,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  withdrawText: {
    fontFamily: 'Inter-Bold',
    fontSize: 13,
    lineHeight: 18,
    color: colors.forestDeep,
    marginLeft: spacing.xs,
  },
  pendingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.md,
  },
  pendingText: {
    fontFamily: 'Inter-Medium',
    fontSize: 12,
    lineHeight: 17,
    color: `${colors.sand}B3`,
    marginLeft: spacing.sm,
  },

  // -- Section activite --
  section: {
    marginTop: spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  sectionLabel: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 11,
    lineHeight: 16,
    color: colors.stone,
    letterSpacing: 1.6,
    marginBottom: spacing.sm + 2,
    marginLeft: spacing.xs,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: `${colors.border}60`,
    overflow: 'hidden',
    ...shadows.card,
  },
  emptyText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    lineHeight: 20,
    color: colors.stone,
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
    borderBottomColor: `${colors.stone}18`,
  },
  txIcon: {
    width: 38,
    height: 38,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  txInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  txTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    lineHeight: 19,
    color: colors.onyx,
  },
  txSub: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    lineHeight: 17,
    color: colors.stone,
    marginTop: 1,
  },
  txRight: {
    alignItems: 'flex-end',
    marginLeft: spacing.md,
  },
  txAmount: {
    fontFamily: 'Inter-Bold',
    fontSize: 14,
    lineHeight: 19,
  },
  statusChip: {
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    marginTop: 3,
  },
  statusText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 10,
    lineHeight: 13,
    letterSpacing: 0.4,
  },
});