/**
 * Page "Mes billets" - Espace client.
 *
 * Design « Noir & Or » premium :
 * - En-tête sur fond noir profond, titre Playfair, compteur actif doré
 * - Onglets filtre segmés pastille verre : actif dégradé or + texte noir
 * - Barre de contexte : compteur + bascule LISTE / GRILLE (dégradé or)
 * - Billets REGROUPES PAR EVENEMENT : une seule carte par evenement
 * - Mode LISTE : carte ticket élevée avec liseret de statut, vignette
 *   cercelee d'or, chips gammes, liseret perfore avec losange or
 * - Mode GRILLE : cartes 2 colonnes avec cover + pied de statut colore
 * - Etat vide premium (médaille verre doré + halo), skeleton au chargement
 *
 * Navigation :
 * - Tap sur une carte → billets de l'evenement (tickets/event/[eventId])
 *
 * Conventions :
 * - Design tokens depuis lib/constants.ts
 * - expo-image pour les images
 * - Pas de type any (sauf router.push as never), pas d'emojis
 * - Imports @/
 * - Commentaires en francais
 * - StyleSheet pour les styles
 */

import { useState, useCallback, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  Ticket,
  CalendarDays,
  ChevronRight,
  Sparkles,
  CircleCheck,
  CircleX,
  Clock,
  Rows3,
  LayoutGrid,
} from 'lucide-react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';

import QualityPremiumIcon from '@/assets/icons/quality-premium.svg';
import QualityVipIcon from '@/assets/icons/quality-VIP.svg';
import QualityStandardIcon from '@/assets/icons/quality-standart.svg';

import { colors, spacing, radius, gradients, shadows, ROUTES } from '@/lib/constants';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { useHaptics } from '@/hooks/useHaptics';
import { formatPrice, formatDate } from '@/services/event.service';
import { useTicketsStore } from '@/stores/tickets-store';
import type { PurchasedTicket, TicketEventSummary } from '@/stores/tickets-store';
import { ScreenBackground } from '@/components/ui/ScreenBackground';

// ============================================================
// Types
// ============================================================

type TicketFilter = 'all' | 'valid' | 'used' | 'expired';
type TicketStatus = 'valid' | 'used' | 'expired' | 'pending';
type ViewMode = 'list' | 'grid';

interface FilterTab {
  readonly key: TicketFilter;
  readonly label: string;
  readonly icon: (color: string) => React.ReactNode;
}

/** Groupe de billets pour un meme evenement */
interface TicketGroup {
  readonly eventId: string;
  readonly event: TicketEventSummary;
  readonly tickets: readonly PurchasedTicket[];
  readonly totalQuantity: number;
  readonly totalAmount: number;
  readonly status: TicketStatus;
}

interface TierQualityInfo {
  readonly icon: React.ComponentType<{ width?: number; height?: number }>;
  readonly label: string;
  readonly color: string;
}

// ============================================================
// Helpers
// ============================================================

/**
 * Determine le statut d'affichage d'un billet.
 */
function getTicketDisplayStatus(ticket: PurchasedTicket): TicketStatus {
  if (ticket.payment_status === 'pending') return 'pending';
  if (ticket.is_scanned) return 'used';
  if (ticket.expires_at && new Date(ticket.expires_at) < new Date()) return 'expired';
  return 'valid';
}

/**
 * Statut global d'un groupe : la priorite va au statut qui
 * merite l'attention de l'utilisateur (pending > valid > used > expired).
 */
function getGroupStatus(tickets: readonly PurchasedTicket[]): TicketStatus {
  const statuses = tickets.map((t) => getTicketDisplayStatus(t));
  if (statuses.some((s) => s === 'pending')) return 'pending';
  if (statuses.every((s) => s === 'used')) return 'used';
  if (statuses.every((s) => s === 'expired')) return 'expired';
  return 'valid';
}

/**
 * Configuration du badge statut — pastille pill avec point indicateur.
 * Valide success, Utilisé textSecondary, Expiré danger, En attente warning.
 */
function getStatusConfig(status: string): { color: string; bg: string; label: string } {
  switch (status) {
    case 'valid':
      return { color: colors.success, bg: 'rgba(91,196,139,0.12)', label: 'Valide' };
    case 'used':
      return { color: colors.textSecondary, bg: 'rgba(181,172,156,0.12)', label: 'Utilise' };
    case 'expired':
      return { color: colors.danger, bg: 'rgba(255,107,94,0.12)', label: 'Expire' };
    case 'pending':
      return { color: colors.warning, bg: 'rgba(232,182,76,0.12)', label: 'En attente' };
    default:
      return { color: colors.textSecondary, bg: 'rgba(181,172,156,0.12)', label: status };
  }
}

/**
 * Badge SVG + couleur selon la gamme du billet.
 */
function getTierQualityInfo(name: string): TierQualityInfo {
  const lower = name.toLowerCase();
  if (lower.includes('vvip') || lower.includes('premium')) {
    return { icon: QualityPremiumIcon, label: 'PREMIUM', color: colors.gold };
  }
  if (lower.includes('vip')) {
    return { icon: QualityVipIcon, label: 'VIP', color: colors.terracotta };
  }
  return { icon: QualityStandardIcon, label: 'STANDARD', color: colors.forest };
}

/**
 * Construit la ligne meta "date · ville" d'un evenement.
 */
function buildEventMeta(event: TicketEventSummary): string | null {
  const parts = [
    event.start_date ? formatDate(event.start_date) : null,
    event.city,
  ].filter(Boolean);
  return parts.length > 0 ? parts.join(' \u00B7 ') : null;
}

// ============================================================
// Sous-composants
// ============================================================

/**
 * Pastille de statut compacte (inline ou flottante sur une image).
 */
function StatusPill({ status, floating = false }: { status: TicketStatus; floating?: boolean }) {
  const config = getStatusConfig(status);
  return (
    <View
      style={[
        styles.statusPill,
        floating && styles.statusPillFloating,
        {
          backgroundColor: floating ? 'rgba(10,9,8,0.68)' : config.bg,
          borderColor: floating ? `${config.color}45` : `${colors.gold}26`,
        },
      ]}
    >
      <View style={[styles.statusDot, { backgroundColor: config.color }]} />
      <Text style={[styles.statusPillText, { color: config.color }]}>{config.label}</Text>
    </View>
  );
}

/**
 * Chips des gammes achetees (2 max + "+n").
 */
function TierChips({ tickets }: { tickets: readonly PurchasedTicket[] }) {
  const visible = tickets.slice(0, 2);
  const extra = tickets.length - visible.length;
  return (
    <View style={styles.chipsRow}>
      {visible.map((t) => {
        const quality = getTierQualityInfo(t.tier.name);
        return (
          <View key={t.id} style={[styles.chip, { backgroundColor: `${quality.color}14` }]}>
            <Text style={[styles.chipText, { color: quality.color }]} numberOfLines={1}>
              {t.quantity}x {t.tier.name}
            </Text>
          </View>
        );
      })}
      {extra > 0 && (
        <View style={[styles.chip, styles.chipMore]}>
          <Text style={[styles.chipText, styles.chipMoreText]}>+{extra}</Text>
        </View>
      )}
    </View>
  );
}

/**
 * Vignette evenement (image ou placeholder) avec cerclage or.
 */
function EventThumb({
  cover,
  size = 64,
  outerStyle,
}: {
  cover: string | null;
  size?: number;
  outerStyle?: { marginLeft?: number; marginVertical?: number };
}) {
  const style = { width: size, height: size, borderRadius: radius.md };
  if (cover) {
    return (
      <Image
        source={{ uri: cover }}
        style={[style, styles.thumbRing, outerStyle]}
        contentFit="cover"
        transition={200}
        cachePolicy="memory-disk"
      />
    );
  }
  return (
    <View style={[style, styles.thumbPlaceholder, styles.thumbRing, outerStyle]}>
      <Ticket size={size * 0.34} color={colors.goldMuted} strokeWidth={1.5} />
    </View>
  );
}

/**
 * Carte compacte horizontale "ticket" (mode liste).
 *
 * Structure : liseret de statut + vignette + infos, puis liseret
 * perfore avec losange or, puis pied (quantite · total · chevron).
 */
function ListGroupCard({
  group,
  onPress,
}: {
  group: TicketGroup;
  onPress: (eventId: string) => void;
}) {
  const meta = buildEventMeta(group.event);
  const statusConfig = getStatusConfig(group.status);
  return (
    <Pressable
      onPress={() => onPress(group.eventId)}
      style={({ pressed }) => [styles.listCard, pressed && styles.cardPressed]}
      accessibilityRole="button"
      accessibilityLabel={`Billets pour ${group.event.title}`}
    >
      {/* Liseret de statut */}
      <View style={[styles.listAccent, { backgroundColor: statusConfig.color }]} />

      {/* Colonne principale */}
      <View style={styles.listColumn}>
        {/* Vignette + infos */}
        <View style={styles.listTopRow}>
          <EventThumb cover={group.event.cover_image} />

          <View style={styles.listBody}>
            <View style={styles.listTitleRow}>
              <Text style={styles.listTitle} numberOfLines={1}>
                {group.event.title}
              </Text>
              <StatusPill status={group.status} />
            </View>

            {meta && (
              <View style={styles.listMetaRow}>
                <CalendarDays size={12} color={colors.goldMuted} strokeWidth={1.5} />
                <Text style={styles.listMetaText} numberOfLines={1}>
                  {meta}
                </Text>
              </View>
            )}

            <TierChips tickets={group.tickets} />
          </View>
        </View>

        {/* Liseret perfore avec losange or */}
        <View style={styles.perfRow}>
          <View style={styles.perfLine} />
          <View style={styles.perfDiamond} />
          <View style={styles.perfLine} />
        </View>

        {/* Pied : quantite · total · chevron */}
        <View style={styles.listFooterRow}>
          <Text style={styles.listQuantity}>
            {group.totalQuantity} billet{group.totalQuantity > 1 ? 's' : ''}
          </Text>
          <Text style={styles.listTotal}>{formatPrice(group.totalAmount)}</Text>
          <View style={styles.listChevron}>
            <ChevronRight size={15} color={colors.goldMuted} strokeWidth={1.75} />
          </View>
        </View>
      </View>
    </Pressable>
  );
}

/**
 * Carte 2 colonnes avec cover (mode grille).
 *
 * Structure : cover + statut flottant, puis infos, liseret perfore
 * avec losange or, pied (quantite · total) et barre de statut.
 */
function GridGroupCard({
  group,
  onPress,
}: {
  group: TicketGroup;
  onPress: (eventId: string) => void;
}) {
  const meta = buildEventMeta(group.event);
  const statusConfig = getStatusConfig(group.status);
  return (
    <Pressable
      onPress={() => onPress(group.eventId)}
      style={({ pressed }) => [styles.gridCard, pressed && styles.cardPressed]}
      accessibilityRole="button"
      accessibilityLabel={`Billets pour ${group.event.title}`}
    >
      {/* Cover image + overlay + statut flottant */}
      <View style={styles.gridCover}>
        {group.event.cover_image ? (
          <>
            <Image
              source={{ uri: group.event.cover_image }}
              style={styles.gridCoverImage}
              contentFit="cover"
              transition={200}
              cachePolicy="memory-disk"
            />
            <LinearGradient
              colors={['rgba(10,9,8,0)', 'rgba(10,9,8,0.6)']}
              style={styles.gridCoverOverlay}
              pointerEvents="none"
            />
          </>
        ) : (
          <View style={styles.gridCoverPlaceholder}>
            <Ticket size={26} color={colors.goldMuted} strokeWidth={1.5} />
          </View>
        )}
        <StatusPill status={group.status} floating />
      </View>

      {/* Corps compact */}
      <View style={styles.gridBody}>
        <Text style={styles.gridTitle} numberOfLines={2}>
          {group.event.title}
        </Text>
        {meta && (
          <Text style={styles.gridMeta} numberOfLines={1}>
            {meta}
          </Text>
        )}

        <TierChips tickets={group.tickets} />

        {/* Liseret perfore avec losange or */}
        <View style={styles.perfRow}>
          <View style={styles.perfLine} />
          <View style={styles.perfDiamond} />
          <View style={styles.perfLine} />
        </View>

        {/* Pied : quantite + total */}
        <View style={styles.gridFooterRow}>
          <View style={styles.gridQuantityBlock}>
            <Text style={styles.gridQuantityLabel}>BILLETS</Text>
            <Text style={styles.gridQuantity}>
              {group.totalQuantity} billet{group.totalQuantity > 1 ? 's' : ''}
            </Text>
          </View>
          <Text style={styles.gridTotal}>{formatPrice(group.totalAmount)}</Text>
        </View>
      </View>

      {/* Barre de statut */}
      <View style={[styles.gridAccent, { backgroundColor: statusConfig.color }]} />
    </Pressable>
  );
}

/**
 * Squelette de carte pendant le chargement initial.
 */
function TicketListSkeleton() {
  return (
    <View>
      {[0, 1, 2].map((key) => (
        <View key={key} style={styles.skeletonCard}>
          <Skeleton width={84} height={84} radius={radius.md} />
          <View style={styles.skeletonBody}>
            <Skeleton width="72%" height={18} radius={8} />
            <Skeleton width="92%" height={12} radius={6} style={{ marginTop: spacing.sm }} />
            <Skeleton width="55%" height={12} radius={6} style={{ marginTop: spacing.sm }} />
          </View>
        </View>
      ))}
    </View>
  );
}

// ============================================================
// Styles
// ============================================================

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: 'transparent' },

  /* Header premium */
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  headerTitle: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 28,
    lineHeight: 36,
    color: colors.text,
    letterSpacing: -0.4,
  },
  headerSubtitle: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    lineHeight: 20,
    color: colors.textMuted,
  },
  headerCountPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: 'rgba(216,180,90,0.12)',
    borderWidth: 1,
    borderColor: `${colors.gold}40`,
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 5,
  },
  headerCountText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 12,
    lineHeight: 16,
    color: colors.goldBright,
  },

  /* Onglets filtre */
  tabsContent: {
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md + 2,
    paddingVertical: spacing.sm + 2,
    borderRadius: radius.full,
    backgroundColor: colors.glass,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.xs,
  },
  tabActive: {
    borderWidth: 0,
    overflow: 'hidden',
  },
  tabRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  tabGradientFill: {
    paddingHorizontal: spacing.md + 2,
    paddingVertical: spacing.sm + 2,
    borderRadius: radius.full,
  },
  tabText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 13,
    lineHeight: 18,
    color: colors.textSecondary,
  },
  tabTextActive: {
    color: colors.onyx,
  },
  tabCount: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 11,
    lineHeight: 15,
    color: colors.textMuted,
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderRadius: radius.sm,
    paddingHorizontal: spacing.xs + 1,
    paddingVertical: 1,
    minWidth: 18,
    textAlign: 'center',
  },
  tabCountActive: {
    color: colors.onyx,
    backgroundColor: 'rgba(10,9,8,0.25)',
  },

  /* Barre de contexte : compteur + toggle LISTE / GRILLE */
  contextRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
    gap: spacing.md,
  },
  contextCount: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 13,
    lineHeight: 18,
    color: colors.textSecondary,
  },
  contextHairline: {
    flex: 1,
    height: 1,
    backgroundColor: colors.divider,
  },
  viewToggle: {
    flexDirection: 'row',
    backgroundColor: colors.glass,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.full,
    padding: 3,
  },
  viewToggleBtn: {
    width: 36,
    height: 32,
    borderRadius: radius.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  viewToggleBtnActive: {
    overflow: 'hidden',
  },
  viewToggleFill: {
    width: 36,
    height: 32,
    borderRadius: radius.full,
    justifyContent: 'center',
    alignItems: 'center',
  },

  /* Contenu */
  content: {
    paddingHorizontal: spacing.lg,
  },

  /* --- Skeleton --- */
  skeletonCard: {
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.elevated,
    borderWidth: 1,
    borderColor: `${colors.gold}1F`,
    borderRadius: radius.lg,
    marginBottom: spacing.md,
    ...shadows.card,
  },
  skeletonBody: {
    flex: 1,
    justifyContent: 'center',
  },

  /* --- Carte LISTE (compacte, type ticket) --- */
  listCard: {
    flexDirection: 'row',
    backgroundColor: colors.elevated,
    borderWidth: 1.5,
    borderColor: `${colors.gold}45`,
    borderRadius: radius.lg,
    overflow: 'hidden',
    marginBottom: spacing.md,
    ...shadows.card,
  },
  cardPressed: {
    opacity: 0.88,
    transform: [{ scale: 0.99 }],
  },
  listAccent: {
    alignSelf: 'stretch',
    width: 3,
  },
  listColumn: {
    flex: 1,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
  },
  listTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
  },
  thumbRing: {
    borderWidth: 1,
    borderColor: `${colors.gold}45`,
  },
  thumbPlaceholder: {
    backgroundColor: colors.surfaceAlt,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listBody: {
    flex: 1,
  },
  listTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  listTitle: {
    flex: 1,
    fontFamily: 'PlayfairDisplay_600SemiBold',
    fontSize: 16,
    lineHeight: 22,
    color: colors.text,
    letterSpacing: -0.2,
  },
  listMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: 3,
  },
  listMetaText: {
    flex: 1,
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    lineHeight: 16,
    color: colors.textSecondary,
  },
  listFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  listQuantity: {
    flex: 1,
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    lineHeight: 15,
    color: colors.textSecondary,
  },
  listTotal: {
    fontFamily: 'Inter_700Bold',
    fontSize: 16,
    lineHeight: 22,
    color: colors.goldBright,
    letterSpacing: 0.2,
  },
  listChevron: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.glass,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },

  /* --- Pastille statut compacte --- */
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    gap: 5,
    borderWidth: 1,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusPillFloating: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 2,
  },
  statusPillText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 10,
    lineHeight: 14,
    letterSpacing: 0.2,
  },

  /* --- Chips gammes --- */
  chipsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  chip: {
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
  },
  chipText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 10,
    lineHeight: 14,
    flexShrink: 1,
  },
  chipMore: {
    backgroundColor: colors.glass,
  },
  chipMoreText: {
    color: colors.textSecondary,
  },

  /* --- Liseret perfore partage (liste + grille) --- */
  perfRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  perfLine: {
    flex: 1,
    height: 1,
    borderTopWidth: 1,
    borderStyle: 'dashed',
    borderColor: `${colors.gold}35`,
  },
  perfDiamond: {
    width: 6,
    height: 6,
    backgroundColor: colors.gold,
    transform: [{ rotate: '45deg' }],
    marginHorizontal: spacing.sm,
  },

  /* --- Carte GRILLE (2 colonnes) --- */
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  gridCard: {
    width: '48.5%',
    backgroundColor: colors.elevated,
    borderWidth: 1.5,
    borderColor: `${colors.gold}45`,
    borderRadius: radius.lg,
    overflow: 'hidden',
    marginBottom: spacing.md,
    ...shadows.card,
  },
  gridCover: {
    height: 118,
    position: 'relative',
    backgroundColor: colors.surfaceAlt,
  },
  gridCoverImage: {
    width: '100%',
    height: 118,
  },
  gridCoverOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 52,
  },
  gridCoverPlaceholder: {
    width: '100%',
    height: 118,
    backgroundColor: colors.surfaceAlt,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gridBody: {
    padding: spacing.md,
    paddingBottom: 0,
  },
  gridTitle: {
    fontFamily: 'PlayfairDisplay_600SemiBold',
    fontSize: 15,
    lineHeight: 21,
    color: colors.text,
    letterSpacing: -0.2,
    marginBottom: 3,
  },
  gridMeta: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    lineHeight: 16,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  gridFooterRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
  },
  gridQuantityBlock: {
    flex: 1,
  },
  gridQuantityLabel: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 9,
    lineHeight: 12,
    letterSpacing: 1.2,
    color: colors.goldMuted,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  gridQuantity: {
    fontFamily: 'Inter_500Medium',
    fontSize: 11,
    lineHeight: 15,
    color: colors.textSecondary,
  },
  gridTotal: {
    fontFamily: 'Inter_700Bold',
    fontSize: 15,
    lineHeight: 20,
    color: colors.goldBright,
  },
  gridAccent: {
    height: 3,
  },
});

// ============================================================
// Composant principal
// ============================================================

export default function TicketsList() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { impact } = useHaptics();
  const tickets = useTicketsStore((state) => state.tickets);

  const [activeFilter, setActiveFilter] = useState<TicketFilter>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('list');

  // -- Skeleton au chargement initial (purement visuel) --
  const [isLoading, setIsLoading] = useState(true);
  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 450);
    return () => clearTimeout(timer);
  }, []);

  // -- Regroupement des billets par evenement --
  const groups = useMemo<TicketGroup[]>(() => {
    const byEvent = new Map<string, {
      event: TicketEventSummary;
      tickets: PurchasedTicket[];
      totalQuantity: number;
      totalAmount: number;
      statuses: TicketStatus[];
      lastCreatedAt: string;
    }>();

    for (const ticket of tickets) {
      const current = byEvent.get(ticket.event_id);
      if (current) {
        current.tickets.push(ticket);
        current.totalQuantity += ticket.quantity;
        current.totalAmount += ticket.total_price;
        current.statuses.push(getTicketDisplayStatus(ticket));
        if (ticket.created_at > current.lastCreatedAt) {
          current.lastCreatedAt = ticket.created_at;
        }
      } else {
        byEvent.set(ticket.event_id, {
          event: ticket.event,
          tickets: [ticket],
          totalQuantity: ticket.quantity,
          totalAmount: ticket.total_price,
          statuses: [getTicketDisplayStatus(ticket)],
          lastCreatedAt: ticket.created_at,
        });
      }
    }

    return Array.from(byEvent.entries())
      .map(([eventId, group]): TicketGroup => ({
        eventId,
        event: group.event,
        tickets: group.tickets.sort((a, b) =>
          b.created_at.localeCompare(a.created_at),
        ),
        totalQuantity: group.totalQuantity,
        totalAmount: group.totalAmount,
        status: getGroupStatus(group.tickets),
      }))
      .sort((a, b) => b.tickets[0].created_at.localeCompare(a.tickets[0].created_at));
  }, [tickets]);

  // -- Groupes filtres --
  const filteredGroups = useMemo(() => {
    if (activeFilter === 'all') return groups;
    return groups.filter((group) => {
      if (activeFilter === 'expired') {
        return group.status === 'expired' || group.status === 'pending';
      }
      return group.status === activeFilter;
    });
  }, [groups, activeFilter]);

  // -- Compteurs (nombre de groupes par statut) --
  const groupCounts = useMemo(() => {
    let valid = 0;
    let used = 0;
    let expired = 0;
    for (const group of groups) {
      if (group.status === 'valid') valid++;
      else if (group.status === 'used') used++;
      else expired++;
    }
    return { valid, used, expired, total: groups.length };
  }, [groups]);

  // -- Nombre de billets actifs (pour la pastille du header) --
  const activeTicketCount = useMemo(() => {
    let count = 0;
    for (const ticket of tickets) {
      if (getTicketDisplayStatus(ticket) === 'valid') count++;
    }
    return count;
  }, [tickets]);

  const totalQuantity = useMemo(() => {
    return groups.reduce((sum, group) => sum + group.totalQuantity, 0);
  }, [groups]);

  // -- Handlers --
  const handleFilterChange = useCallback((filter: TicketFilter) => {
    impact('light');
    setActiveFilter(filter);
  }, [impact]);

  const handleToggleMode = useCallback((mode: ViewMode) => {
    if (mode === viewMode) return;
    impact('light');
    setViewMode(mode);
  }, [impact, viewMode]);

  const handleGroupPress = useCallback((eventId: string) => {
    impact('light');
    router.push({
      pathname: ROUTES.TICKET_EVENT,
      params: { eventId },
    } as never);
  }, [impact, router]);

  const handleExplore = useCallback(() => {
    impact('light');
    router.push(ROUTES.EXPLORE as never);
  }, [impact, router]);

  // -- Onglets avec compteurs --
  const filterTabs: readonly FilterTab[] = useMemo(() => [
    { key: 'all', label: 'Tous', icon: (c: string) => <Ticket size={14} color={c} strokeWidth={1.75} /> },
    { key: 'valid', label: 'Valides', icon: (c: string) => <CircleCheck size={14} color={c} strokeWidth={1.75} /> },
    { key: 'used', label: 'Utilises', icon: (c: string) => <CircleX size={14} color={c} strokeWidth={1.75} /> },
    { key: 'expired', label: 'Expires', icon: (c: string) => <Clock size={14} color={c} strokeWidth={1.75} /> },
  ], []);

  const getCountForFilter = useCallback((key: TicketFilter): number => {
    switch (key) {
      case 'all': return groupCounts.total;
      case 'valid': return groupCounts.valid;
      case 'used': return groupCounts.used;
      case 'expired': return groupCounts.expired;
    }
  }, [groupCounts]);

  // ============================================================
  // Rendu
  // ============================================================

  return (
    <ScreenBackground><View style={[styles.root, { backgroundColor: 'transparent' }]}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingTop: insets.top + spacing.sm,
          paddingBottom: insets.bottom + spacing.xxxl + 20,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTopRow}>
            <Text style={styles.headerTitle}>Mes billets</Text>
            {tickets.length > 0 && (
              <View style={styles.headerCountPill}>
                <Sparkles size={14} color={colors.gold} strokeWidth={1.75} />
                <Text style={styles.headerCountText}>
                  {activeTicketCount} actif{activeTicketCount > 1 ? 's' : ''}
                </Text>
              </View>
            )}
          </View>
          <Text style={styles.headerSubtitle}>
            {groups.length > 0
              ? `${groups.length} evenement${groups.length > 1 ? 's' : ''} · ${totalQuantity} billet${totalQuantity > 1 ? 's' : ''}`
              : 'Vos billets achetes apparaitront ici'}
          </Text>
        </View>

        {/* Onglets filtre */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabsContent}
        >
          {filterTabs.map((tab) => {
            const isActive = activeFilter === tab.key;
            const count = getCountForFilter(tab.key);
            return (
              <Pressable
                key={tab.key}
                onPress={() => handleFilterChange(tab.key)}
                style={[styles.tab, isActive && styles.tabActive]}
                accessibilityRole="button"
                accessibilityLabel={tab.label}
              >
                {isActive ? (
                  <LinearGradient
                    colors={[...gradients.gold] as unknown as readonly [string, string, ...string[]]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.tabGradientFill}
                  >
                    <View style={styles.tabRow}>
                      {tab.icon(colors.onyx)}
                      <Text style={[styles.tabText, styles.tabTextActive]}>
                        {tab.label}
                      </Text>
                      <Text style={[styles.tabCount, styles.tabCountActive]}>
                        {count}
                      </Text>
                    </View>
                  </LinearGradient>
                ) : (
                  <View style={styles.tabRow}>
                    {tab.icon(colors.textSecondary)}
                    <Text style={styles.tabText}>{tab.label}</Text>
                    <Text style={styles.tabCount}>{count}</Text>
                  </View>
                )}
              </Pressable>
            );
          })}
        </ScrollView>

        {/* Barre de contexte : compteur + bascule LISTE / GRILLE */}
        <View style={styles.contextRow}>
          <Text style={styles.contextCount}>
            {filteredGroups.length} evenement{filteredGroups.length > 1 ? 's' : ''}
          </Text>
          <View style={styles.contextHairline} />
          <View style={styles.viewToggle}>
            <Pressable
              onPress={() => handleToggleMode('list')}
              style={[styles.viewToggleBtn, viewMode === 'list' && styles.viewToggleBtnActive]}
              accessibilityRole="button"
              accessibilityLabel="Vue liste"
              accessibilityState={{ selected: viewMode === 'list' }}
              hitSlop={4}
            >
              {viewMode === 'list' ? (
                <LinearGradient
                  colors={[...gradients.gold] as unknown as readonly [string, string, ...string[]]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.viewToggleFill}
                >
                  <Rows3 size={16} color={colors.onyx} strokeWidth={2} />
                </LinearGradient>
              ) : (
                <Rows3 size={16} color={colors.textSecondary} strokeWidth={2} />
              )}
            </Pressable>
            <Pressable
              onPress={() => handleToggleMode('grid')}
              style={[styles.viewToggleBtn, viewMode === 'grid' && styles.viewToggleBtnActive]}
              accessibilityRole="button"
              accessibilityLabel="Vue grille"
              accessibilityState={{ selected: viewMode === 'grid' }}
              hitSlop={4}
            >
              {viewMode === 'grid' ? (
                <LinearGradient
                  colors={[...gradients.gold] as unknown as readonly [string, string, ...string[]]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.viewToggleFill}
                >
                  <LayoutGrid size={16} color={colors.onyx} strokeWidth={2} />
                </LinearGradient>
              ) : (
                <LayoutGrid size={16} color={colors.textSecondary} strokeWidth={2} />
              )}
            </Pressable>
          </View>
        </View>

        {/* Liste des groupes (evenements) */}
        <View style={styles.content}>
          {isLoading ? (
            <TicketListSkeleton />
          ) : filteredGroups.length === 0 ? (
            /* Etat vide premium */
            <EmptyState
              icon={<Ticket size={36} color={colors.gold} strokeWidth={1.5} />}
              title={
                groups.length === 0
                  ? 'Aucun billet pour le moment'
                  : 'Aucun billet dans cette categorie'
              }
              description={
                groups.length === 0
                  ? 'Reservez des billets lors de vos prochains evenements et retrouvez-les ici.'
                  : 'Changez de filtre pour voir vos autres billets.'
              }
              actionLabel={groups.length === 0 ? 'Explorer les evenements' : undefined}
              onAction={groups.length === 0 ? handleExplore : undefined}
            />
          ) : (
            <View style={viewMode === 'grid' ? styles.gridContainer : undefined}>
              {filteredGroups.map((group) =>
                viewMode === 'grid' ? (
                  <GridGroupCard key={group.eventId} group={group} onPress={handleGroupPress} />
                ) : (
                  <ListGroupCard key={group.eventId} group={group} onPress={handleGroupPress} />
                ),
              )}
            </View>
          )}
        </View>
      </ScrollView>
    </View></ScreenBackground>
  );
}