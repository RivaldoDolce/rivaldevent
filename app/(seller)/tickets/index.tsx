/**
 * Mes ventes (mode vendeur) — historique des billets vendus.
 *
 * Structure :
 * 1. Header : logo + avatar + titre + total des ventes
 * 2. Bandeau de statistiques (ventes, revenus, en attente)
 * 3. Filtres par statut (Tous / Payees / En attente)
 * 4. Liste des ventes : acheteur, evenement, tier, statut, scan
 * 5. CTA "Scanner un billet" (demo : marque la prochaine vente comme scannee)
 *
 * Donnees : store vendeur (mock en attendant Supabase).
 */

import { useState, useCallback } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
  type ViewStyle,
  type TextStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import {
  ScanLine,
  Wallet,
  Ticket,
  Clock3,
  ChevronRight,
  BadgeCheck,
} from 'lucide-react-native';

import { Avatar } from '@/components/ui/Avatar';
import { EmptyState } from '@/components/ui/EmptyState';
import { colors, spacing, radius, ROUTES } from '@/lib/constants';
import { formatFCFA, formatShortDate } from '@/lib/format';
import { useHaptics } from '@/hooks/useHaptics';
import { useAuth } from '@/hooks/useAuth';
import { useAvatarUrl } from '@/hooks/useAvatarUrl';
import { useSellerStore } from '@/stores/seller-store';
import type { MockSellerSale } from '@/data/mock';
import { useRouter } from 'expo-router';

// ============================================================
// Metadonnees de statut
// ============================================================

const SALE_STATUS_META = {
  completed: { label: 'Paye', color: colors.forest },
  pending: { label: 'En attente', color: colors.goldDark },
  failed: { label: 'Echoue', color: colors.terracotta },
} as const;

type SaleFilter = 'all' | 'completed' | 'pending';

const FILTERS: readonly { id: SaleFilter; label: string }[] = [
  { id: 'all', label: 'Tous' },
  { id: 'completed', label: 'Payees' },
  { id: 'pending', label: 'En attente' },
];

// ============================================================
// Ecran
// ============================================================

export default function SellerTicketsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, profile } = useAuth();
  const avatarUrl = useAvatarUrl(user?.id, profile?.avatar_url);
  const { impact, notification } = useHaptics();

  const sales = useSellerStore((state) => state.sales);
  const markSaleScanned = useSellerStore((state) => state.markSaleScanned);
  const [filter, setFilter] = useState<SaleFilter>('all');

  const filteredSales =
    filter === 'all' ? sales : sales.filter((sale) => sale.status === filter);

  const totalRevenue = sales
    .filter((sale) => sale.status === 'completed')
    .reduce((sum, sale) => sum + sale.total_price, 0);
  const pendingCount = sales.filter((sale) => sale.status === 'pending').length;

  const handleScanDemo = useCallback(() => {
    impact('medium');
    const nextUnscanned = sales.find(
      (sale) => sale.status === 'completed' && !sale.is_scanned
    );
    if (nextUnscanned) {
      markSaleScanned(nextUnscanned.id);
      notification('success');
    }
    // En production : ouverture de la camera de scan (expo-camera)
  }, [sales, markSaleScanned, impact, notification]);

  // -- Styles dynamiques --
  const screenStyle: ViewStyle = {
    flex: 1,
    backgroundColor: colors.sand,
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
    fontFamily: 'PlayfairDisplay-Bold',
    fontSize: 24,
    lineHeight: 32,
    color: colors.onyx,
    letterSpacing: -0.4,
  };

  return (
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
            <Text style={headerTitleStyle}>Mes ventes</Text>
            <Text style={styles.headerCount}>
              {sales.length} vente{sales.length > 1 ? 's' : ''} enregistree
              {sales.length > 1 ? 's' : ''}
            </Text>
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
            2. BANDEAU DE STATISTIQUES
            ============================================ */}
        <LinearGradient
          colors={[colors.forestDeep, colors.forestMid, colors.forest]}
          start={{ x: 0.1, y: 0 }}
          end={{ x: 0.9, y: 1 }}
          style={styles.summaryCard}
        >
          <View pointerEvents="none" style={styles.summaryRing} />

          <View style={styles.summaryColumn}>
            <Ticket size={17} color={colors.goldSoft} strokeWidth={1.75} />
            <Text style={styles.summaryValue}>{sales.length}</Text>
            <Text style={styles.summaryLabel}>Ventes</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryColumn}>
            <Wallet size={17} color={colors.goldSoft} strokeWidth={1.75} />
            <Text style={[styles.summaryValue, styles.summaryValueSmall]}>
              {formatFCFA(totalRevenue)}
            </Text>
            <Text style={styles.summaryLabel}>Revenus encaisses</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryColumn}>
            <Clock3 size={17} color={colors.goldSoft} strokeWidth={1.75} />
            <Text style={styles.summaryValue}>{pendingCount}</Text>
            <Text style={styles.summaryLabel}>En attente</Text>
          </View>
        </LinearGradient>

        {/* ============================================
            3. FILTRES PAR STATUT
            ============================================ */}
        <View style={styles.filtersRow}>
          {FILTERS.map((item) => {
            const isActive = filter === item.id;
            return (
              <Pressable
                key={item.id}
                onPress={() => {
                  impact('light');
                  setFilter(item.id);
                }}
                style={[styles.filterChip, isActive ? styles.filterChipActive : null]}
                accessibilityRole="button"
                accessibilityLabel={`Filtrer: ${item.label}`}
              >
                <Text
                  style={[styles.filterText, isActive ? styles.filterTextActive : null]}
                >
                  {item.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* ============================================
            4. LISTE DES VENTES
            ============================================ */}
        {filteredSales.length === 0 ? (
          <EmptyState
            icon={<ScanLine size={34} color={colors.terracotta} strokeWidth={1.25} />}
            title="Aucune vente ici"
            description="Les billets vendus apparaitront ici des le premier paiement."
          />
        ) : (
          <View style={styles.list}>
            {filteredSales.map((sale) => (
              <SaleRow key={sale.id} sale={sale} />
            ))}
          </View>
        )}

        {/* ============================================
            5. CTA SCAN
            ============================================ */}
        <Pressable
          onPress={handleScanDemo}
          style={styles.scanCta}
          accessibilityRole="button"
          accessibilityLabel="Scanner un billet"
        >
          <LinearGradient
            colors={[colors.forestDeep, colors.forestMid]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.scanCtaGradient}
          >
            <View style={styles.scanCtaIcon}>
              <ScanLine size={24} color={colors.forestDeep} strokeWidth={1.75} />
            </View>
            <View style={styles.scanCtaTextBlock}>
              <Text style={styles.scanCtaTitle}>Scanner un billet</Text>
              <Text style={styles.scanCtaSub}>
                Validez l'entree de vos clients a l'evenement
              </Text>
            </View>
            <ChevronRight size={20} color={colors.sand} strokeWidth={1.75} />
          </LinearGradient>
        </Pressable>
      </ScrollView>
    </View>
  );
}

// ============================================================
// Sous-composant : ligne de vente
// ============================================================

function SaleRow({ sale }: { readonly sale: MockSellerSale }) {
  const statusMeta = SALE_STATUS_META[sale.status];
  const initials = sale.buyer_name.charAt(0).toUpperCase() || '?';

  return (
    <View style={styles.saleCard}>
      <View style={styles.buyerAvatar}>
        <Text style={styles.buyerInitial}>{initials}</Text>
      </View>

      <View style={styles.saleBody}>
        <View style={styles.saleTopRow}>
          <Text style={styles.buyerName} numberOfLines={1}>
            {sale.buyer_name}
          </Text>
          <View style={[styles.statusChip, { backgroundColor: `${statusMeta.color}12` }]}>
            <Text style={[styles.statusText, { color: statusMeta.color }]}>
              {statusMeta.label}
            </Text>
          </View>
        </View>

        <Text style={styles.saleEvent} numberOfLines={1}>
          {sale.event_title}
        </Text>

        <View style={styles.saleBottomRow}>
          <Text style={styles.saleMeta}>
            {sale.tier_name} x{sale.quantity} · {formatShortDate(sale.purchased_at)}
          </Text>
          <View style={styles.salePriceRow}>
            {sale.is_scanned ? (
              <View style={styles.scannedBadge}>
                <BadgeCheck size={13} color={colors.forest} strokeWidth={1.75} />
                <Text style={styles.scannedText}>Scanne</Text>
              </View>
            ) : null}
            <Text style={styles.salePrice}>{formatFCFA(sale.total_price)}</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

// ============================================================
// Styles
// ============================================================

const styles = StyleSheet.create({
  headerCount: {
    fontFamily: 'Inter-Regular',
    fontSize: 13,
    lineHeight: 18,
    color: colors.stone,
    marginTop: 1,
  },

  // -- Bandeau stats --
  summaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    borderRadius: radius.xxl,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
    overflow: 'hidden',
    shadowColor: colors.onyx,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 18,
    elevation: 6,
  },
  summaryRing: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 75,
    borderWidth: 1.5,
    borderColor: `${colors.goldSoft}22`,
    top: -80,
    right: -50,
  },
  summaryColumn: {
    flex: 1,
    alignItems: 'center',
  },
  summaryDivider: {
    width: StyleSheet.hairlineWidth,
    height: 44,
    backgroundColor: `${colors.sand}30`,
  },
  summaryValue: {
    fontFamily: 'PlayfairDisplay-Bold',
    fontSize: 19,
    lineHeight: 25,
    color: colors.sand,
    marginTop: spacing.xs,
  },
  summaryValueSmall: {
    fontSize: 13,
    lineHeight: 18,
  },
  summaryLabel: {
    fontFamily: 'Inter-Regular',
    fontSize: 10,
    lineHeight: 14,
    color: `${colors.sand}A8`,
    textAlign: 'center',
    marginTop: 1,
  },

  // -- Filtres --
  filtersRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    marginTop: spacing.lg,
    marginBottom: spacing.md,
  },
  filterChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: 7,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: `${colors.stone}30`,
    backgroundColor: colors.white,
  },
  filterChipActive: {
    backgroundColor: colors.forest,
    borderColor: colors.forest,
  },
  filterText: {
    fontFamily: 'Inter-Medium',
    fontSize: 12,
    lineHeight: 17,
    color: colors.stone,
  },
  filterTextActive: {
    color: colors.sand,
    fontFamily: 'Inter-SemiBold',
  },

  // -- Liste --
  list: {
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  saleCard: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: `${colors.border}60`,
    padding: spacing.md,
  },
  buyerAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: `${colors.terracotta}15`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buyerInitial: {
    fontFamily: 'PlayfairDisplay-Bold',
    fontSize: 17,
    lineHeight: 22,
    color: colors.terracotta,
  },
  saleBody: {
    flex: 1,
    marginLeft: spacing.md,
  },
  saleTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  buyerName: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    lineHeight: 19,
    color: colors.onyx,
    flex: 1,
    marginRight: spacing.sm,
  },
  statusChip: {
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
  },
  statusText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 10,
    lineHeight: 14,
  },
  saleEvent: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    lineHeight: 17,
    color: colors.stone,
    marginTop: 2,
  },
  saleBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  saleMeta: {
    fontFamily: 'Inter-Regular',
    fontSize: 11,
    lineHeight: 15,
    color: `${colors.stone}90`,
    flex: 1,
  },
  salePriceRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  scannedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginRight: spacing.sm,
    backgroundColor: `${colors.forest}10`,
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
  },
  scannedText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 10,
    lineHeight: 14,
    color: colors.forest,
  },
  salePrice: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 13,
    lineHeight: 18,
    color: colors.onyx,
  },

  // -- CTA scan --
  scanCta: {
    marginTop: spacing.xl,
    marginHorizontal: spacing.lg,
    borderRadius: radius.xl,
    overflow: 'hidden',
    shadowColor: colors.onyx,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 10,
    elevation: 5,
  },
  scanCtaGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
  },
  scanCtaIcon: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    backgroundColor: colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanCtaTextBlock: {
    flex: 1,
    marginLeft: spacing.md,
  },
  scanCtaTitle: {
    fontFamily: 'PlayfairDisplay-SemiBold',
    fontSize: 16,
    lineHeight: 22,
    color: colors.sand,
    letterSpacing: -0.2,
  },
  scanCtaSub: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    lineHeight: 17,
    color: `${colors.sand}A8`,
    marginTop: 2,
  },
});