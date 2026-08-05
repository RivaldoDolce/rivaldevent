/**
 * Page "Mes billets" - Espace client.
 *
 * Design ultra-premium inspire de Apple Wallet et Passbook :
 * - Header premium avec titre elegant
 * - Onglets filtre : Tous / Valides / Utilises / Expires
 *   avec compteur dynamique et indicateur actif
 * - Cartes de billets style "boarding pass" avec :
 *   - Image evenement en haut (cover)
 *   - Zone d'info avec titre, date, lieu
 *   - Ligne perforee decorative
 *   - Zone bas avec tier, prix, statut, operateur
 *   - Ombre et coins arrondis
 * - Etat vide elegant avec illustration et CTA
 * - Espacement genereux, scroll fluide
 * - Pas de donnees mock - billets reels depuis le store
 *
 * Navigation :
 * - Tap sur un billet → detail billet (tickets/[id])
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
  MapPin,
  ChevronRight,
  Sparkles,
  CircleCheck,
  CircleX,
  Clock,
} from 'lucide-react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';

import { colors, spacing, radii, shadows, ROUTES } from '@/lib/constants';
import { useHaptics } from '@/hooks/useHaptics';
import { formatPrice, formatDate } from '@/services/event.service';
import { useTicketsStore } from '@/stores/tickets-store';
import type { PurchasedTicket } from '@/stores/tickets-store';

// ============================================================
// Types
// ============================================================

type TicketFilter = 'all' | 'valid' | 'used' | 'expired';

interface FilterTab {
  readonly key: TicketFilter;
  readonly label: string;
  readonly icon: React.ReactNode;
}

// ============================================================
// Constantes
// ============================================================

// ============================================================
// Helpers
// ============================================================

/**
 * Determine le statut d'affichage d'un billet.
 */
function getTicketDisplayStatus(ticket: PurchasedTicket): 'valid' | 'used' | 'expired' | 'pending' {
  if (ticket.payment_status === 'pending') return 'pending';
  if (ticket.is_scanned) return 'used';
  if (ticket.expires_at && new Date(ticket.expires_at) < new Date()) return 'expired';
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
        icon: <CircleCheck size={12} color={colors.forest} strokeWidth={2.5} />,
      };
    case 'used':
      return {
        color: colors.stone,
        bg: `${colors.stone}15`,
        label: 'Utilise',
        icon: <CircleX size={12} color={colors.stone} strokeWidth={2.5} />,
      };
    case 'expired':
      return {
        color: colors.danger,
        bg: `${colors.danger}15`,
        label: 'Expire',
        icon: <CircleX size={12} color={colors.danger} strokeWidth={2.5} />,
      };
    case 'pending':
      return {
        color: colors.mango,
        bg: `${colors.mango}15`,
        label: 'En attente',
        icon: <Clock size={12} color={colors.mango} strokeWidth={2.5} />,
      };
    default:
      return {
        color: colors.stone,
        bg: `${colors.stone}15`,
        label: status,
        icon: <CircleCheck size={12} color={colors.stone} strokeWidth={2.5} />,
      };
  }
}

/**
 * Nom de l'operateur pour le badge.
 */
function getOperatorName(method: string): string {
  switch (method) {
    case 'mtn': return 'MTN';
    case 'orange': return 'Orange';
    case 'moov': return 'Moov';
    default: return '';
  }
}

/**
 * Couleur de l'operateur.
 */
function getOperatorColor(method: string): string {
  switch (method) {
    case 'mtn': return '#FFC300';
    case 'orange': return '#FF7900';
    case 'moov': return '#0099FF';
    default: return colors.stone;
  }
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

  /* Onglets filtre premium */
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
    marginBottom: spacing.lg,
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

  /* Contenu */
  content: {
    paddingHorizontal: spacing.lg,
  },

  /* Carte billet style boarding pass */
  ticketCard: {
    backgroundColor: colors.white,
    borderRadius: radii.xl,
    marginBottom: spacing.lg,
    overflow: 'hidden',
    ...shadows.eventCard,
  },

  /* Cover image du billet */
  ticketCover: {
    width: '100%',
    height: 140,
    position: 'relative',
  },
  ticketCoverImage: {
    width: '100%',
    height: 140,
  },
  ticketCoverOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 60,
  },
  ticketCoverPlaceholder: {
    width: '100%',
    height: 140,
    backgroundColor: colors.ivory,
    justifyContent: 'center',
    alignItems: 'center',
  },

  /* Status badge flottant sur l'image */
  statusBadgeFloating: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radii.md,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.xs + 1,
    gap: spacing.xs,
  },
  statusBadgeText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 11,
    lineHeight: 15,
    letterSpacing: 0.3,
  },

  /* Corps du billet */
  ticketBody: {
    padding: spacing.lg,
  },

  /* Titre evenement */
  ticketEventTitle: {
    fontFamily: 'PlayfairDisplay-SemiBold',
    fontSize: 18,
    lineHeight: 24,
    color: colors.onyx,
    marginBottom: spacing.sm,
  },

  /* Meta info rows */
  ticketMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xs + 1,
  },
  ticketMetaText: {
    fontFamily: 'Inter-Regular',
    fontSize: 13,
    lineHeight: 18,
    color: colors.stone,
  },

  /* Ligne perforee decorative */
  perforatedLine: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing.md,
    gap: 0,
  },
  perforatedDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.sand,
  },

  /* Zone du bas : tier + prix + operateur */
  ticketBottomZone: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ticketTierBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radii.md,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.xs + 1,
    gap: spacing.xs,
  },
  ticketTierName: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 13,
    lineHeight: 18,
  },
  ticketRightArea: {
    alignItems: 'flex-end',
  },
  ticketPrice: {
    fontFamily: 'PlayfairDisplay-Bold',
    fontSize: 18,
    lineHeight: 24,
    color: colors.onyx,
  },
  ticketOperatorBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  ticketOperatorDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  ticketOperatorText: {
    fontFamily: 'Inter-Medium',
    fontSize: 11,
    lineHeight: 15,
    color: colors.stone,
  },

  /* Chevron indicateur */
  chevronIndicator: {
    position: 'absolute',
    right: spacing.md,
    top: '50%',
    marginTop: -10,
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

  // -- Donnees filtree --
  const filteredTickets = useMemo(() => {
    if (activeFilter === 'all') return tickets;

    return tickets.filter((ticket) => {
      const status = getTicketDisplayStatus(ticket);
      switch (activeFilter) {
        case 'valid': return status === 'valid';
        case 'used': return status === 'used';
        case 'expired': return status === 'expired' || status === 'pending';
        default: return true;
      }
    });
  }, [tickets, activeFilter]);

  // -- Compteurs --
  const ticketCounts = useMemo(() => {
    let valid = 0;
    let used = 0;
    let expired = 0;
    for (const t of tickets) {
      const status = getTicketDisplayStatus(t);
      if (status === 'valid') valid++;
      else if (status === 'used') used++;
      else expired++;
    }
    return { valid, used, expired, total: tickets.length };
  }, [tickets]);

  // -- Handlers --
  const handleFilterChange = useCallback((filter: TicketFilter) => {
    impact('light');
    setActiveFilter(filter);
  }, [impact]);

  const handleTicketPress = useCallback((ticketId: string) => {
    impact('light');
    router.push({
      pathname: ROUTES.TICKET_DETAIL,
      params: { id: ticketId },
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
      case 'all': return ticketCounts.total;
      case 'valid': return ticketCounts.valid;
      case 'used': return ticketCounts.used;
      case 'expired': return ticketCounts.expired;
    }
  }, [ticketCounts]);

  // ============================================================
  // Rendu
  // ============================================================

  return (
    <View style={styles.root}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingTop: insets.top,
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
                  {ticketCounts.valid} actif{ticketCounts.valid > 1 ? 's' : ''}
                </Text>
              </View>
            )}
          </View>
          <Text style={styles.headerSubtitle}>
            {tickets.length > 0
              ? `${tickets.length} billet${tickets.length > 1 ? 's' : ''} au total`
              : 'Vos billets achetes apparaitront ici'}
          </Text>
        </View>

        {/* Onglets filtre */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabsContainer}
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

        {/* Liste des billets */}
        <View style={styles.content}>
          {filteredTickets.length === 0 ? (
            /* Etat vide premium */
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconWrap}>
                <Ticket size={40} color={colors.terracotta} strokeWidth={1.5} />
              </View>
              <Text style={styles.emptyTitle}>
                {tickets.length === 0
                  ? 'Aucun billet pour le moment'
                  : 'Aucun billet dans cette categorie'}
              </Text>
              <Text style={styles.emptySubtitle}>
                {tickets.length === 0
                  ? 'Reservez des billets lors de vos prochains evenements et retrouvez-les ici.'
                  : 'Changez de filtre pour voir vos autres billets.'}
              </Text>
              {tickets.length === 0 && (
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
            filteredTickets.map((ticket) => {
              const displayStatus = getTicketDisplayStatus(ticket);
              const statusConfig = getStatusConfig(displayStatus);
              const operator = getOperatorName(ticket.payment_method);
              const operatorColor = getOperatorColor(ticket.payment_method);

              return (
                <Pressable
                  key={ticket.id}
                  onPress={() => handleTicketPress(ticket.id)}
                  style={styles.ticketCard}
                  accessibilityRole="button"
                  accessibilityLabel={`Billet ${ticket.event.title}`}
                >
                  {/* Cover image avec overlay */}
                  <View style={styles.ticketCover}>
                    {ticket.event.cover_image ? (
                      <>
                        <Image
                          source={{ uri: ticket.event.cover_image }}
                          style={styles.ticketCoverImage}
                          contentFit="cover"
                          transition={300}
                          cachePolicy="memory-disk"
                        />
                        <LinearGradient
                          colors={['rgba(26,24,22,0.0)', 'rgba(26,24,22,0.5)']}
                          style={styles.ticketCoverOverlay}
                          pointerEvents="none"
                        />
                      </>
                    ) : (
                      <View style={styles.ticketCoverPlaceholder}>
                        <Ticket size={32} color={colors.stone} strokeWidth={1} />
                      </View>
                    )}

                    {/* Badge statut flottant */}
                    <View style={[styles.statusBadgeFloating, { backgroundColor: statusConfig.bg }]}>
                      {statusConfig.icon}
                      <Text style={[styles.statusBadgeText, { color: statusConfig.color }]}>
                        {statusConfig.label}
                      </Text>
                    </View>
                  </View>

                  {/* Corps du billet */}
                  <View style={styles.ticketBody}>
                    {/* Titre evenement */}
                    <Text style={styles.ticketEventTitle} numberOfLines={2}>
                      {ticket.event.title}
                    </Text>

                    {/* Date + Lieu */}
                    {ticket.event.start_date && (
                      <View style={styles.ticketMetaRow}>
                        <CalendarDays size={14} color={colors.terracotta} strokeWidth={1.5} />
                        <Text style={styles.ticketMetaText}>
                          {formatDate(ticket.event.start_date)}
                        </Text>
                      </View>
                    )}
                    {ticket.event.city && (
                      <View style={styles.ticketMetaRow}>
                        <MapPin size={14} color={colors.terracotta} strokeWidth={1.5} />
                        <Text style={styles.ticketMetaText}>{ticket.event.city}</Text>
                      </View>
                    )}

                    {/* Ligne perforee decorative */}
                    <View style={styles.perforatedLine}>
                      {Array.from({ length: 40 }, (_, i) => (
                        <View key={i} style={styles.perforatedDot} />
                      ))}
                    </View>

                    {/* Zone du bas : tier + prix + operateur */}
                    <View style={styles.ticketBottomZone}>
                      <View style={[styles.ticketTierBadge, { backgroundColor: `${colors.gold}15` }]}>
                        <Ticket size={14} color={colors.gold} strokeWidth={1.5} />
                        <Text style={[styles.ticketTierName, { color: colors.gold }]}>
                          {ticket.tier.name}
                        </Text>
                      </View>

                      <View style={styles.ticketRightArea}>
                        <Text style={styles.ticketPrice}>
                          {formatPrice(ticket.total_price)}
                        </Text>
                        {operator && (
                          <View style={styles.ticketOperatorBadge}>
                            <View style={[styles.ticketOperatorDot, { backgroundColor: operatorColor }]} />
                            <Text style={styles.ticketOperatorText}>{operator}</Text>
                          </View>
                        )}
                      </View>
                    </View>
                  </View>
                </Pressable>
              );
            })
          )}
        </View>
      </ScrollView>
    </View>
  );
}
