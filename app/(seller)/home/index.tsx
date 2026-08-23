/**
 * Accueil vendeur — dashboard.
 *
 * Structure :
 * 1. Header "Rivald'event" + avatar
 * 2. Carte portefeuille (solde disponible, retraits en attente, bouton retirer)
 * 3. Grille de stats (billets vendus, evenements actifs, remplissage, revenus)
 * 4. Ventes recentes (liste) + "Voir tout" -> onglet Billets
 * 5. CTA "Creer un evenement" -> onglet Vendre
 *
 * Donnees : store vendeur (mock en attendant Supabase).
 * Design system « Noir & Or » : banniere hero graduee, anneaux dore,
 * stats en cartes verre, statuts colores.
 */

import { useCallback } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
  ImageBackground,
  type ViewStyle,
  type TextStyle,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Wallet,
  Ticket,
  CalendarDays,
  Percent,
  TrendingUp,
  Plus,
  ChevronRight,
  ScanLine,
} from 'lucide-react-native';

import { Avatar } from '@/components/ui/Avatar';
import { colors, spacing, radius, shadows, gradients, ROUTES } from '@/lib/constants';
import { sellerBackgrounds } from '@/lib/images';
import { formatFCFA, formatShortDate } from '@/lib/format';
import { useHaptics } from '@/hooks/useHaptics';
import { useAuth } from '@/hooks/useAuth';
import { useAvatarUrl } from '@/hooks/useAvatarUrl';
import { useSellerStore, useSellerTotals } from '@/stores/seller-store';

// ============================================================
// Donnees statiques (labels + teintes)
// ============================================================

const SALE_STATUS_META = {
  completed: { label: 'Paye', color: colors.success },
  pending: { label: 'En attente', color: colors.warning },
  failed: { label: 'Echoue', color: colors.danger },
} as const;

// ============================================================
// Ecran
// ============================================================

export default function SellerHomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, profile } = useAuth();
  const avatarUrl = useAvatarUrl(user?.id, profile?.avatar_url);
  const { impact, notification } = useHaptics();

  const sales = useSellerStore((state) => state.sales);
  const availableBalance = useSellerStore((state) => state.availableBalance);
  const pendingWithdrawals = useSellerStore((state) => state.pendingWithdrawals);
  const totals = useSellerTotals();

  const firstName = (profile?.full_name || 'Organisateur').split(' ')[0];

  const handleCreateEvent = useCallback(() => {
    impact('light');
    router.push(ROUTES.SELL);
  }, [impact, router]);

  const handleSeeAllSales = useCallback(() => {
    impact('light');
    router.push(ROUTES.SELLER_TICKETS);
  }, [impact, router]);

  const handleWithdraw = useCallback(() => {
    impact('medium');
    notification('success');
  }, [impact, notification]);

  const recentSales = sales.slice(0, 3);

  // -- Styles dynamiques --
  const screenStyle: ViewStyle = {
    flex: 1,
    backgroundColor: 'transparent',
  };

  const headerStyle: ViewStyle = {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: insets.top + spacing.md,
    paddingBottom: spacing.sm,
  };

  const headerTitleStyle: TextStyle = {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 28,
    color: colors.text,
    letterSpacing: -0.5,
  };

  return (
    <ImageBackground
      source={sellerBackgrounds.headerGeneric}
      style={{ flex: 1, backgroundColor: colors.background }}
      imageStyle={StyleSheet.absoluteFillObject}
      accessibilityIgnoresInvertColors
    >
      <View style={[StyleSheet.absoluteFillObject, { backgroundColor: 'rgba(10,9,8,0.60)' }]} pointerEvents="none" />
      <View style={screenStyle}>
        <ScrollView
          style={screenStyle}
          contentContainerStyle={{ paddingBottom: 120 }}
          showsVerticalScrollIndicator={false}
        >
        {/* ============================================
            1. HEADER
            ============================================ */}
        <View style={headerStyle}>
          <View>
            <Text style={headerTitleStyle}>Rivald'event</Text>
            <Text style={styles.greeting}>Bonjour, {firstName}</Text>
          </View>
          <Pressable
            onPress={() => {
              impact('light');
              router.push(ROUTES.SELLER_PROFILE);
            }}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Voir mon profil"
          >
            <Avatar
              source={avatarUrl}
              fallback={profile?.full_name ?? 'U'}
              size="sm"
              border="highlight"
            />
          </Pressable>
        </View>

        {/* ============================================
            2. CARTE PORTEFEUILLE
            ============================================ */}
        <LinearGradient
          colors={[...gradients.hero] as unknown as readonly [string, string, ...string[]]}
          start={{ x: 0.1, y: 0 }}
          end={{ x: 0.9, y: 1 }}
          style={styles.walletCard}
        >
          {/* Fond hero + voile */}
          <ImageBackground
            source={sellerBackgrounds.accueilHero}
            style={styles.heroBg}
            imageStyle={styles.heroBgImage}
            accessibilityIgnoresInvertColors
          />
          <LinearGradient
            colors={['rgba(10,9,8,0.45)', 'rgba(10,9,8,0.78)', 'rgba(10,9,8,0.96)']}
            style={styles.heroScrim}
            pointerEvents="none"
          />
          <View pointerEvents="none" style={styles.walletGlow} />
          <View pointerEvents="none" style={styles.walletRingLarge} />
          <View pointerEvents="none" style={styles.walletRingSmall} />

          <View style={styles.walletTopRow}>
            <View style={styles.walletLabelRow}>
              <Wallet size={16} color={colors.goldBright} strokeWidth={1.75} />
              <Text style={styles.walletLabel}>SOLDE DISPONIBLE</Text>
            </View>
            <Pressable
              onPress={handleWithdraw}
              style={styles.withdrawButton}
              accessibilityRole="button"
              accessibilityLabel="Retirer des fonds"
            >
              <Text style={styles.withdrawText}>Retirer</Text>
            </Pressable>
          </View>

          <Text style={styles.walletAmount}>
            {formatFCFA(availableBalance)}
          </Text>

          <View style={styles.walletFooter}>
            <View style={styles.walletFooterItem}>
              <Text style={styles.walletFooterValue}>
                {formatFCFA(pendingWithdrawals)}
              </Text>
              <Text style={styles.walletFooterLabel}>En attente de retrait</Text>
            </View>
            <View style={styles.walletFooterDivider} />
            <View style={styles.walletFooterItem}>
              <Text style={styles.walletFooterValue}>{totals.totalSales}</Text>
              <Text style={styles.walletFooterLabel}>Ventes au total</Text>
            </View>
          </View>
        </LinearGradient>

        {/* ============================================
            3. GRILLE DE STATS
            ============================================ */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: 'rgba(216,180,90,0.12)' }]}>
              <Ticket size={19} color={colors.goldBright} strokeWidth={1.75} />
            </View>
            <Text style={styles.statValue}>{totals.ticketsSold}</Text>
            <Text style={styles.statLabel}>Billets vendus</Text>
          </View>

          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: `${colors.terracotta}1A` }]}>
              <CalendarDays size={19} color={colors.terracotta} strokeWidth={1.75} />
            </View>
            <Text style={styles.statValue}>{totals.publishedEvents}</Text>
            <Text style={styles.statLabel}>Evenements actifs</Text>
          </View>

          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: `${colors.info}1A` }]}>
              <Percent size={19} color={colors.info} strokeWidth={1.75} />
            </View>
            <Text style={styles.statValue}>{totals.averageFillRate}%</Text>
            <Text style={styles.statLabel}>Remplissage moyen</Text>
          </View>

          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: `${colors.success}1A` }]}>
              <TrendingUp size={19} color={colors.success} strokeWidth={1.75} />
            </View>
            <Text style={[styles.statValue, styles.statValueSmall]}>
              {formatFCFA(totals.totalRevenue)}
            </Text>
            <Text style={styles.statLabel}>Revenus cumulés</Text>
          </View>
        </View>

        {/* ============================================
            4. VENTES RECENTES
            ============================================ */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Ventes recentes</Text>
          <Pressable
            onPress={handleSeeAllSales}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Voir toutes les ventes"
          >
            <Text style={styles.seeAllText}>Voir tout</Text>
          </Pressable>
        </View>

        <View style={styles.salesCard}>
          {recentSales.length === 0 ? (
            <View style={styles.emptySales}>
              <ScanLine size={28} color={colors.goldMuted} strokeWidth={1.25} />
              <Text style={styles.emptySalesText}>Aucune vente pour le moment</Text>
            </View>
          ) : (
            recentSales.map((sale, index) => {
              const statusMeta = SALE_STATUS_META[sale.status];
              return (
                <Pressable
                  key={sale.id}
                  style={[
                    styles.saleRow,
                    index < recentSales.length - 1 ? styles.saleRowBorder : null,
                  ]}
                  onPress={() => {
                    impact('light');
                    router.push(ROUTES.SELLER_TICKETS);
                  }}
                  accessibilityRole="button"
                  accessibilityLabel={`Vente ${sale.buyer_name}`}
                >
                  <View style={[styles.saleDot, { backgroundColor: statusMeta.color }]} />
                  <View style={styles.saleTextBlock}>
                    <Text style={styles.saleBuyer} numberOfLines={1}>
                      {sale.buyer_name}
                    </Text>
                    <Text style={styles.saleEvent} numberOfLines={1}>
                      {sale.event_title}
                    </Text>
                    <Text style={styles.saleMeta}>
                      {sale.tier_name} x{sale.quantity} · {formatShortDate(sale.purchased_at)}
                    </Text>
                  </View>
                  <View style={styles.saleRight}>
                    <Text style={styles.salePrice}>{formatFCFA(sale.total_price)}</Text>
                    <View style={[styles.saleStatusChip, { backgroundColor: `${statusMeta.color}1A` }]}>
                      <Text style={[styles.saleStatus, { color: statusMeta.color }]}>
                        {statusMeta.label}
                      </Text>
                    </View>
                  </View>
                </Pressable>
              );
            })
          )}
        </View>

        {/* ============================================
            5. CTA CREER UN EVENEMENT
            ============================================ */}
        <Pressable
          onPress={handleCreateEvent}
          style={styles.createCta}
          accessibilityRole="button"
          accessibilityLabel="Creer un evenement"
        >
          <LinearGradient
            colors={[...gradients.gold] as unknown as readonly [string, string, ...string[]]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.createCtaGradient}
          >
            <View style={styles.createCtaIcon}>
              <Plus size={22} color={colors.onyx} strokeWidth={2} />
            </View>
            <View style={styles.createCtaTextBlock}>
              <Text style={styles.createCtaTitle}>Creer un evenement</Text>
              <Text style={styles.createCtaSub}>
                Billetterie en ligne et paiement Mobile Money
              </Text>
            </View>
            <ChevronRight size={20} color={colors.onyx} strokeWidth={1.75} />
          </LinearGradient>
        </Pressable>
        </ScrollView>
      </View>
    </ImageBackground>
  );
}

// ============================================================
// Styles
// ============================================================

const styles = StyleSheet.create({
  greeting: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    lineHeight: 18,
    color: colors.textMuted,
    marginTop: -2,
  },

  // -- Portefeuille --
  walletCard: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.sm,
    borderRadius: radius.xxl,
    padding: spacing.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: `${colors.gold}2E`,
    ...shadows.eventCard,
  },
  heroBg: {
    ...StyleSheet.absoluteFillObject,
  },
  heroBgImage: {
    ...StyleSheet.absoluteFillObject,
  },
  heroScrim: {
    ...StyleSheet.absoluteFillObject,
  },
  walletGlow: {
    position: 'absolute',
    top: -110,
    right: -70,
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: 'rgba(216,180,90,0.10)',
  },
  walletRingLarge: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    borderWidth: 1.5,
    borderColor: `${colors.gold}2E`,
    top: -95,
    right: -60,
  },
  walletRingSmall: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 1.5,
    borderColor: `${colors.gold}26`,
    top: -38,
    right: -14,
  },
  walletTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  walletLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  walletLabel: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 11,
    lineHeight: 16,
    color: colors.goldMuted,
    letterSpacing: 1.8,
    marginLeft: spacing.sm,
  },
  withdrawButton: {
    backgroundColor: colors.gold,
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    ...shadows.goldGlowSoft,
  },
  withdrawText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 13,
    lineHeight: 18,
    color: colors.onyx,
  },
  walletAmount: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 32,
    lineHeight: 42,
    color: colors.goldBright,
    letterSpacing: -0.5,
    marginTop: spacing.md,
  },
  walletFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  walletFooterItem: {
    flex: 1,
  },
  walletFooterValue: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    lineHeight: 20,
    color: colors.text,
  },
  walletFooterLabel: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    lineHeight: 16,
    color: colors.textSecondary,
    marginTop: 1,
  },
  walletFooterDivider: {
    width: StyleSheet.hairlineWidth,
    height: 32,
    backgroundColor: `${colors.text}2B`,
    marginHorizontal: spacing.md,
  },

  // -- Stats --
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    marginTop: spacing.lg,
    gap: spacing.sm,
  },
  statCard: {
    width: '48.5%',
    backgroundColor: colors.elevated,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: `${colors.gold}1F`,
    padding: spacing.md,
    ...shadows.card,
  },
  statIcon: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: `${colors.gold}26`,
  },
  statValue: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 20,
    lineHeight: 26,
    color: colors.text,
    letterSpacing: -0.3,
  },
  statValueSmall: {
    fontSize: 16,
    lineHeight: 22,
  },
  statLabel: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    lineHeight: 16,
    color: colors.textMuted,
    marginTop: 1,
  },

  // -- Ventes recentes --
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    marginTop: spacing.xl,
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 20,
    lineHeight: 26,
    letterSpacing: -0.3,
    color: colors.text,
  },
  seeAllText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 13,
    lineHeight: 18,
    color: colors.goldBright,
    letterSpacing: 0.2,
  },
  salesCard: {
    marginHorizontal: spacing.lg,
    backgroundColor: colors.elevated,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: `${colors.gold}1F`,
    overflow: 'hidden',
    ...shadows.card,
  },
  saleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md - 2,
  },
  saleRowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.divider,
  },
  saleDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: spacing.md,
  },
  saleTextBlock: {
    flex: 1,
    marginRight: spacing.sm,
  },
  saleBuyer: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    lineHeight: 19,
    color: colors.text,
  },
  saleEvent: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    lineHeight: 17,
    color: colors.textMuted,
    marginTop: 1,
  },
  saleMeta: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    lineHeight: 15,
    color: colors.textFaint,
    marginTop: 2,
  },
  saleRight: {
    alignItems: 'flex-end',
  },
  salePrice: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 13,
    lineHeight: 18,
    color: colors.text,
  },
  saleStatusChip: {
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    marginTop: 3,
    borderWidth: 1,
    borderColor: `${colors.gold}22`,
  },
  saleStatus: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 11,
    lineHeight: 15,
  },
  emptySales: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  emptySalesText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    lineHeight: 18,
    color: colors.textMuted,
    marginTop: spacing.sm,
  },

  // -- CTA --
  createCta: {
    marginTop: spacing.xl,
    marginHorizontal: spacing.lg,
    borderRadius: radius.xl,
    overflow: 'hidden',
    ...shadows.goldGlow,
  },
  createCtaGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
  },
  createCtaIcon: {
    width: 46,
    height: 46,
    borderRadius: radius.md,
    backgroundColor: 'rgba(10,9,8,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  createCtaTextBlock: {
    flex: 1,
    marginLeft: spacing.md,
  },
  createCtaTitle: {
    fontFamily: 'PlayfairDisplay_600SemiBold',
    fontSize: 16,
    lineHeight: 22,
    color: colors.onyx,
    letterSpacing: -0.2,
  },
  createCtaSub: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    lineHeight: 17,
    color: 'rgba(10,9,8,0.65)',
    marginTop: 2,
  },
});