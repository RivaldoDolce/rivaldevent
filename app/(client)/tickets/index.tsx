/**
 * Page "Mes billets" - Espace client.
 *
 * Design ultra-premium inspire de Apple Wallet :
 * - Header premium avec titre elegant + compteur actif
 * - Onglets filtre : Tous / Valides / Utilises / Expires
 * - Barre de contexte dediee : compteur d'evenements + bascule
 *   LISTE / GRILLE (segmentee, distincte du bouton unique de l'explore)
 * - Billets REGROUPES PAR EVENEMENT : une seule carte par evenement
 * - Mode LISTE (defaut) : carte compacte "ticket" avec liseret de
 *   statut colore, vignette cercelee d'or, chips gammes, total or
 * - Mode GRILLE : cartes 2 colonnes avec cover + pied de statut colore
 * - Etat vide elegant avec illustration et CTA
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

import { useState, useCallback, useMemo } from 'react';
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

import { colors, spacing, radii, shadows, ROUTES } from '@/lib/constants';
import { useHaptics } from '@/hooks/useHaptics';
import { formatPrice, formatDate } from '@/services/event.service';
import { useTicketsStore } from '@/stores/tickets-store';
import type { PurchasedTicket, TicketEventSummary } from '@/stores/tickets-store';

// ============================================================
// Types
// ============================================================

type TicketFilter = 'all' | 'valid' | 'used' | 'expired';
type TicketStatus = 'valid' | 'used' | 'expired' | 'pending';
type ViewMode = 'list' | 'grid';

interface FilterTab {
  readonly key: TicketFilter;
  readonly label: string;
  readonly icon: React.ReactNode;
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
 * Configuration du badge statut.
 */
function getStatusConfig(status: string): { color: string; bg: string; label: string; icon: React.ReactNode } {
  switch (status) {
    case 'valid':
      return {
        color: colors.forest,
        bg: `${colors.forest}15`,
        label: 'Valide',
        icon: <CircleCheck size={11} color={colors.forest} strokeWidth={2.5} />,
      };
    case 'used':
      return {
        color: colors.stone,
        bg: `${colors.stone}15`,
        label: 'Utilise',
        icon: <CircleX size={11} color={colors.stone} strokeWidth={2.5} />,
      };
    case 'expired':
      return {
        color: colors.danger,
        bg: `${colors.danger}15`,
        label: 'Expire',
        icon: <CircleX size={11} color={colors.danger} strokeWidth={2.5} />,
      };
    case 'pending':
      return {
        color: colors.mango,
        bg: `${colors.mango}15`,
        label: 'En attente',
        icon: <Clock size={11} color={colors.mango} strokeWidth={2.5} />,
      };
    default:
      return {
        color: colors.stone,
        bg: `${colors.stone}15`,
        label: status,
        icon: <CircleCheck size={11} color={colors.stone} strokeWidth={2.5} />,
      };
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
        { backgroundColor: floating ? 'rgba(255,255,255,0.94)' : config.bg },
        floating && { borderColor: `${config.color}33` },
      ]}
    >
      {config.icon}
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
  size = 68,
  outerStyle,
}: {
  cover: string | null;
  size?: number;
  outerStyle?: { marginLeft?: number; marginVertical?: number };
}) {
  const style = { width: size, height: size, borderRadius: size / 3 };
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
      <Ticket size={size * 0.34} color={colors.stone} strokeWidth={1.2} />
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
                <CalendarDays size={11} color={colors.terracotta} strokeWidth={1.5} />
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
            <ChevronRight size={15} color={colors.stone} strokeWidth={2} />
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
              colors={['rgba(26,24,22,0)', 'rgba(26,24,22,0.45)']}
              style={styles.gridCoverOverlay}
              pointerEvents="none"
            />
          </>
        ) : (
          <View style={styles.gridCoverPlaceholder}>
            <Ticket size={24} color={colors.stone} strokeWidth={1.2} />
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
          <Text style={styles.gridQuantity}>
            {group.totalQuantity} billet{group.totalQuantity > 1 ? 's' : ''}
          </Text>
          <Text style={styles.gridTotal}>{formatPrice(group.totalAmount)}</Text>
        </View>
      </View>

      {/* Barre de statut */}
      <View style={[styles.gridAccent, { backgroundColor: statusConfig.color }]} />
    </Pressable>
  );
}

// ============================================================
// Styles
// ============================================================

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.sand },

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
    fontFamily: 'PlayfairDisplay-Bold',
    fontSize: 28,
    lineHeight: 36,
    color: colors.onyx,
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    lineHeight: 20,
    color: colors.stone,
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
    borderRadius: radii.full,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.xs,
  },
  tabActive: {
    backgroundColor: colors.terracotta,
    borderColor: colors.terracotta,
  },
  tabText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 13,
    lineHeight: 18,
    color: colors.stone,
  },
  tabTextActive: {
    color: colors.white,
  },
  tabCount: {
    fontFamily: 'Inter-Bold',
    fontSize: 11,
    lineHeight: 15,
    color: colors.stone,
    backgroundColor: colors.ivory,
    borderRadius: radii.sm,
    paddingHorizontal: spacing.xs + 1,
    paddingVertical: 1,
    minWidth: 18,
    textAlign: 'center',
  },
  tabCountActive: {
    color: colors.terracotta,
    backgroundColor: `${colors.white}30`,
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
    fontFamily: 'Inter-SemiBold',
    fontSize: 13,
    lineHeight: 18,
    color: colors.stone,
  },
  contextHairline: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  viewToggle: {
    flexDirection: 'row',
    backgroundColor: colors.ivory,
    borderRadius: radii.full,
    padding: 3,
  },
  viewToggleBtn: {
    width: 36,
    height: 32,
    borderRadius: radii.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  viewToggleBtnActive: {
    backgroundColor: colors.white,
    ...shadows.card,
  },

  /* Contenu */
  content: {
    paddingHorizontal: spacing.lg,
  },

  /* --- Carte LISTE (compacte, type ticket) --- */
  listCard: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderRadius: radii.xl,
    borderWidth: 1.5,
    borderColor: `${colors.gold}40`,
    overflow: 'hidden',
    marginBottom: spacing.md,
    ...shadows.eventCard,
  },
  cardPressed: {
    opacity: 0.88,
    transform: [{ scale: 0.99 }],
  },
  listAccent: {
    alignSelf: 'stretch',
    width: 4,
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
    borderWidth: 1.5,
    borderColor: `${colors.gold}45`,
  },
  thumbPlaceholder: {
    backgroundColor: colors.ivory,
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
    fontFamily: 'PlayfairDisplay-SemiBold',
    fontSize: 16,
    lineHeight: 22,
    color: colors.onyx,
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
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    lineHeight: 16,
    color: colors.stone,
  },
  listFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  listQuantity: {
    flex: 1,
    fontFamily: 'Inter-Regular',
    fontSize: 11,
    lineHeight: 15,
    color: colors.stone,
  },
  listTotal: {
    fontFamily: 'PlayfairDisplay-Bold',
    fontSize: 18,
    lineHeight: 24,
    color: colors.gold,
  },
  listChevron: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.ivory,
    justifyContent: 'center',
    alignItems: 'center',
  },

  /* --- Pastille statut compacte --- */
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radii.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    gap: 3,
  },
  statusPillFloating: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    borderWidth: 1,
    shadowColor: colors.onyx,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  statusPillText: {
    fontFamily: 'Inter-Bold',
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
    borderRadius: radii.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
  },
  chipText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 10,
    lineHeight: 14,
    flexShrink: 1,
  },
  chipMore: {
    backgroundColor: colors.ivory,
  },
  chipMoreText: {
    color: colors.stone,
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
    borderColor: `${colors.onyx}22`,
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
    backgroundColor: colors.white,
    borderRadius: radii.xl,
    borderWidth: 1.5,
    borderColor: `${colors.gold}40`,
    overflow: 'hidden',
    marginBottom: spacing.md,
    ...shadows.eventCard,
  },
  gridCover: {
    height: 100,
    position: 'relative',
    backgroundColor: colors.ivory,
  },
  gridCoverImage: {
    width: '100%',
    height: 100,
  },
  gridCoverOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 48,
  },
  gridCoverPlaceholder: {
    width: '100%',
    height: 100,
    backgroundColor: colors.ivory,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gridBody: {
    padding: spacing.md,
    paddingBottom: 0,
  },
  gridTitle: {
    fontFamily: 'PlayfairDisplay-SemiBold',
    fontSize: 15,
    lineHeight: 20,
    color: colors.onyx,
    letterSpacing: -0.2,
    marginBottom: 2,
  },
  gridMeta: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    lineHeight: 16,
    color: colors.stone,
    marginBottom: spacing.sm,
  },
  gridFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
  },
  gridQuantity: {
    fontFamily: 'Inter-Regular',
    fontSize: 11,
    lineHeight: 15,
    color: colors.stone,
  },
  gridTotal: {
    fontFamily: 'PlayfairDisplay-Bold',
    fontSize: 16,
    lineHeight: 22,
    color: colors.gold,
  },
  gridAccent: {
    height: 3,
  },

  /* Etat vide premium */
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxxl * 2,
    paddingHorizontal: spacing.xl,
  },
  emptyIconWrap: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: `${colors.terracotta}12`,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  emptyTitle: {
    fontFamily: 'PlayfairDisplay-SemiBold',
    fontSize: 20,
    lineHeight: 26,
    color: colors.onyx,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    lineHeight: 20,
    color: colors.stone,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  emptyCtaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.terracotta,
    borderRadius: radii.xl,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md + 2,
    gap: spacing.sm,
    ...shadows.card,
  },
  emptyCtaText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 15,
    lineHeight: 22,
    color: colors.white,
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
    { key: 'all', label: 'Tous', icon: <Ticket size={14} color={colors.stone} strokeWidth={1.5} /> },
    { key: 'valid', label: 'Valides', icon: <CircleCheck size={14} color={colors.stone} strokeWidth={1.5} /> },
    { key: 'used', label: 'Utilises', icon: <CircleX size={14} color={colors.stone} strokeWidth={1.5} /> },
    { key: 'expired', label: 'Expires', icon: <Clock size={14} color={colors.stone} strokeWidth={1.5} /> },
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
    <View style={styles.root}>
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
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
                <Sparkles size={16} color={colors.gold} strokeWidth={1.5} />
                <Text style={{ fontFamily: 'Inter-SemiBold', fontSize: 13, lineHeight: 18, color: colors.gold }}>
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
                <Text style={[styles.tabText, isActive && styles.tabTextActive]}>
                  {tab.label}
                </Text>
                <Text style={[styles.tabCount, isActive && styles.tabCountActive]}>
                  {count}
                </Text>
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
              <Rows3
                size={16}
                color={viewMode === 'list' ? colors.onyx : colors.stone}
                strokeWidth={2}
              />
            </Pressable>
            <Pressable
              onPress={() => handleToggleMode('grid')}
              style={[styles.viewToggleBtn, viewMode === 'grid' && styles.viewToggleBtnActive]}
              accessibilityRole="button"
              accessibilityLabel="Vue grille"
              accessibilityState={{ selected: viewMode === 'grid' }}
              hitSlop={4}
            >
              <LayoutGrid
                size={16}
                color={viewMode === 'grid' ? colors.onyx : colors.stone}
                strokeWidth={2}
              />
            </Pressable>
          </View>
        </View>

        {/* Liste des groupes (evenements) */}
        <View style={styles.content}>
          {filteredGroups.length === 0 ? (
            /* Etat vide premium */
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconWrap}>
                <Ticket size={40} color={colors.terracotta} strokeWidth={1.5} />
              </View>
              <Text style={styles.emptyTitle}>
                {groups.length === 0
                  ? 'Aucun billet pour le moment'
                  : 'Aucun billet dans cette categorie'}
              </Text>
              <Text style={styles.emptySubtitle}>
                {groups.length === 0
                  ? 'Reservez des billets lors de vos prochains evenements et retrouvez-les ici.'
                  : 'Changez de filtre pour voir vos autres billets.'}
              </Text>
              {groups.length === 0 && (
                <Pressable
                  onPress={handleExplore}
                  style={styles.emptyCtaButton}
                  accessibilityRole="button"
                  accessibilityLabel="Explorer les evenements"
                >
                  <Text style={styles.emptyCtaText}>Explorer les evenements</Text>
                  <ChevronRight size={18} color={colors.white} strokeWidth={2} />
                </Pressable>
              )}
            </View>
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
    </View>
  );
}
