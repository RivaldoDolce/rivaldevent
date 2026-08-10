/**
 * Page des billets d'un evenement - Espace client.
 *
 * Accessible depuis "Mes billets" (tap sur une carte d'evenement).
 * Liste toutes les gammes achetees pour cet evenement, avec leur
 * statut individuel. Tap sur une gamme → detail du billet (tickets/[id]).
 *
 * Design premium :
 * - Hero cover evenement (image plein largeur + overlay + sur-titre
 *   "VOS BILLETS" + badge nombre de billets)
 * - Cartes par gamme : liseret statut, tuile qualite SVG en degrade,
 *   nom, quantite, operateur, statut, prix or
 * - Total paye en "coupon" onyx avec liseret perfore et losange or
 * - Etat vide si aucun billet
 *
 * Conventions :
 * - Design tokens depuis lib/constants.ts
 * - Pas de type any (sauf router.push as never), pas d'emojis
 * - Imports @/
 * - Commentaires en francais
 * - StyleSheet pour les styles
 */

import { useCallback, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  ChevronLeft,
  ChevronRight,
  Ticket,
  CalendarDays,
  MapPin,
  CircleCheck,
  CircleX,
  Clock,
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
import type { PurchasedTicket } from '@/stores/tickets-store';

// ============================================================
// Types
// ============================================================

type TicketStatus = 'valid' | 'used' | 'expired' | 'pending';

interface TierQualityInfo {
  readonly icon: React.ComponentType<{ width?: number; height?: number }>;
  readonly label: string;
  readonly color: string;
}

// ============================================================
// Helpers
// ============================================================

function getTicketDisplayStatus(ticket: PurchasedTicket): TicketStatus {
  if (ticket.payment_status === 'pending') return 'pending';
  if (ticket.is_scanned) return 'used';
  if (ticket.expires_at && new Date(ticket.expires_at) < new Date()) return 'expired';
  return 'valid';
}

function getStatusConfig(status: TicketStatus): {
  color: string;
  bg: string;
  label: string;
  icon: React.ReactNode;
} {
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
  }
}

function getOperatorName(method: string): string {
  switch (method) {
    case 'mtn': return 'MTN';
    case 'orange': return 'Orange';
    case 'moov': return 'Moov';
    default: return '';
  }
}

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

// ============================================================
// Styles
// ============================================================

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.sand },

  /* Header */
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  headerBackButton: {
    width: 40,
    height: 40,
    borderRadius: radii.full,
    backgroundColor: colors.ivory,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  headerTitleArea: {
    flex: 1,
  },
  headerTitle: {
    fontFamily: 'PlayfairDisplay-Bold',
    fontSize: 22,
    lineHeight: 28,
    color: colors.onyx,
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontFamily: 'Inter-Regular',
    fontSize: 13,
    lineHeight: 18,
    color: colors.stone,
    marginTop: 1,
  },

  /* Contenu */
  content: {
    paddingHorizontal: spacing.lg,
  },

  /* Hero cover evenement */
  heroCard: {
    borderRadius: radii.xxl,
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
    overflow: 'hidden',
    ...shadows.eventCard,
  },
  heroCover: {
    width: '100%',
    height: 200,
  },
  heroOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  heroPlaceholder: {
    width: '100%',
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroContent: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xxl,
    paddingBottom: spacing.lg,
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  heroOverline: {
    fontFamily: 'Inter-Bold',
    fontSize: 10,
    lineHeight: 14,
    letterSpacing: 2,
    color: colors.gold,
  },
  heroCountBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderWidth: 1,
    borderColor: `${colors.gold}55`,
    borderRadius: radii.full,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 4,
    gap: spacing.xs,
  },
  heroCountText: {
    fontFamily: 'Inter-Bold',
    fontSize: 11,
    lineHeight: 15,
    color: colors.gold,
  },
  heroTitle: {
    fontFamily: 'PlayfairDisplay-SemiBold',
    fontSize: 24,
    lineHeight: 30,
    color: colors.white,
    letterSpacing: -0.3,
  },
  heroMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  heroMetaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(26,24,22,0.35)',
    borderRadius: radii.full,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 3,
    gap: spacing.xs,
  },
  heroMetaText: {
    fontFamily: 'Inter-Regular',
    fontSize: 11,
    lineHeight: 15,
    color: 'rgba(255,255,255,0.9)',
  },

  /* Titre section */
  sectionTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 11,
    lineHeight: 15,
    letterSpacing: 2,
    color: colors.gold,
    marginBottom: spacing.md,
  },

  /* Carte gamme type coupon */
  ticketCard: {
    backgroundColor: colors.white,
    borderRadius: radii.xxl,
    padding: spacing.md + 2,
    marginBottom: spacing.md,
    ...shadows.card,
  },
  cardPressed: {
    opacity: 0.88,
    transform: [{ scale: 0.99 }],
  },
  ticketHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  tierIconTile: {
    width: 44,
    height: 44,
    borderRadius: radii.lg,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: `${colors.white}AA`,
  },
  tierName: {
    flex: 1,
    fontFamily: 'PlayfairDisplay-SemiBold',
    fontSize: 17,
    lineHeight: 23,
    color: colors.onyx,
    letterSpacing: -0.2,
  },
  chevronCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.ivory,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ticketSub: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    lineHeight: 16,
    color: colors.stone,
    marginTop: spacing.xs,
    paddingLeft: 60,
  },
  ticketDividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing.md,
    position: 'relative',
  },
  ticketDashedLine: {
    flex: 1,
    height: 1,
    borderTopWidth: 1,
    borderStyle: 'dashed',
    borderColor: `${colors.onyx}22`,
  },
  ticketDiamond: {
    width: 6,
    height: 6,
    backgroundColor: colors.gold,
    transform: [{ rotate: '45deg' }],
    marginHorizontal: spacing.sm,
  },
  ticketFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radii.full,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 4,
    gap: 4,
  },
  statusBadgeText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 11,
    lineHeight: 15,
    letterSpacing: 0.3,
  },
  tierPrice: {
    fontFamily: 'PlayfairDisplay-Bold',
    fontSize: 18,
    lineHeight: 24,
    color: colors.gold,
  },

  /* Total paye : coupon onyx */
  totalStub: {
    borderRadius: radii.xxl,
    padding: spacing.lg,
    marginTop: spacing.xs,
    overflow: 'hidden',
    ...shadows.eventCard,
  },
  totalTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  totalLabel: {
    fontFamily: 'Inter-Bold',
    fontSize: 10,
    lineHeight: 14,
    letterSpacing: 2,
    color: colors.gold,
  },
  totalCaption: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    lineHeight: 16,
    color: `${colors.white}88`,
    marginTop: 3,
  },
  totalValue: {
    fontFamily: 'PlayfairDisplay-Bold',
    fontSize: 26,
    lineHeight: 32,
    color: colors.gold,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.md,
    position: 'relative',
  },
  dashedLine: {
    flex: 1,
    height: 1,
    borderTopWidth: 1,
    borderStyle: 'dashed',
    borderColor: `${colors.white}30`,
  },
  dividerDiamond: {
    width: 8,
    height: 8,
    backgroundColor: colors.gold,
    transform: [{ rotate: '45deg' }],
    marginHorizontal: spacing.sm,
  },
  notchLeft: {
    position: 'absolute',
    left: -44,
    top: 0,
    marginTop: -18,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.sand,
  },
  notchRight: {
    position: 'absolute',
    right: -44,
    top: 0,
    marginTop: -18,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.sand,
  },

  /* Etat vide */
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxxl * 2,
    paddingHorizontal: spacing.xl,
  },
  emptyTitle: {
    fontFamily: 'PlayfairDisplay-SemiBold',
    fontSize: 18,
    lineHeight: 24,
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
  },
});

// ============================================================
// Composant principal
// ============================================================

export default function TicketEventDetail() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams<{ eventId: string }>();
  const { impact } = useHaptics();

  const eventId = params.eventId;

  // -- Billets de cet evenement (du plus recent au plus ancien) --
  // Attention : le selecteur doit retourner une reference stable
  // (sinon zustand/useSyncExternalStore boucle infiniment).
  const allTickets = useTicketsStore((state) => state.tickets);

  const eventTickets = useMemo(() => {
    return allTickets
      .filter((t) => t.event_id === eventId)
      .sort((a, b) => b.created_at.localeCompare(a.created_at));
  }, [allTickets, eventId]);

  const totalQuantity = useMemo(() => {
    return eventTickets.reduce((sum, t) => sum + t.quantity, 0);
  }, [eventTickets]);

  const totalAmount = useMemo(() => {
    return eventTickets.reduce((sum, t) => sum + t.total_price, 0);
  }, [eventTickets]);

  // -- Handlers --
  const handleBack = useCallback(() => {
    impact('light');
    router.back();
  }, [impact, router]);

  const handleTicketPress = useCallback((ticketId: string) => {
    impact('light');
    router.push({
      pathname: ROUTES.TICKET_DETAIL,
      params: { id: ticketId },
    } as never);
  }, [impact, router]);

  const eventSummary = eventTickets[0]?.event ?? null;

  // ============================================================
  // Rendu
  // ============================================================

  return (
    <View style={styles.root}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingTop: insets.top,
          // Compense la TabBar flottante (60px + inset) pour que la
          // carte "Total paye" ne soit jamais masquee en bas d'ecran.
          paddingBottom: insets.bottom + 60 + spacing.xl,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={handleBack} style={styles.headerBackButton} hitSlop={12}>
            <ChevronLeft size={22} color={colors.onyx} strokeWidth={2} />
          </Pressable>
          <View style={styles.headerTitleArea}>
            <Text style={styles.headerTitle}>Billets</Text>
            <Text style={styles.headerSubtitle} numberOfLines={1}>
              {eventSummary?.title ?? 'Evenement'}
            </Text>
          </View>
        </View>

        <View style={styles.content}>
          {eventTickets.length === 0 ? (
            /* Etat vide */
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyTitle}>Aucun billet pour cet evenement</Text>
              <Text style={styles.emptySubtitle}>
                Vos billets achetes pour cet evenement apparaitront ici.
              </Text>
            </View>
          ) : (
            <>
              {/* Hero cover evenement */}
              <View style={styles.heroCard}>
                {eventSummary?.cover_image ? (
                  <>
                    <Image
                      source={{ uri: eventSummary.cover_image }}
                      style={styles.heroCover}
                      contentFit="cover"
                      transition={300}
                      cachePolicy="memory-disk"
                    />
                    <LinearGradient
                      colors={['rgba(26,24,22,0.05)', 'rgba(26,24,22,0.82)']}
                      style={styles.heroOverlay}
                      pointerEvents="none"
                    />
                  </>
                ) : (
                  <LinearGradient
                    colors={['#2A2723', '#141210']}
                    style={styles.heroPlaceholder}
                  >
                    <Ticket size={32} color={`${colors.gold}88`} strokeWidth={1.2} />
                  </LinearGradient>
                )}

                <View style={styles.heroContent}>
                  <View style={styles.heroTopRow}>
                    <Text style={styles.heroOverline}>VOS BILLETS</Text>
                    <View style={styles.heroCountBadge}>
                      <Ticket size={12} color={colors.gold} strokeWidth={2} />
                      <Text style={styles.heroCountText}>
                        {totalQuantity} billet{totalQuantity > 1 ? 's' : ''}
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.heroTitle} numberOfLines={2}>
                    {eventSummary?.title ?? 'Evenement'}
                  </Text>

                  <View style={styles.heroMetaRow}>
                    {eventSummary?.start_date && (
                      <View style={styles.heroMetaChip}>
                        <CalendarDays size={11} color={colors.gold} strokeWidth={1.5} />
                        <Text style={styles.heroMetaText}>
                          {formatDate(eventSummary.start_date)}
                        </Text>
                      </View>
                    )}
                    {eventSummary?.city && (
                      <View style={styles.heroMetaChip}>
                        <MapPin size={11} color={colors.gold} strokeWidth={1.5} />
                        <Text style={styles.heroMetaText}>{eventSummary.city}</Text>
                      </View>
                    )}
                  </View>
                </View>
              </View>

              {/* Liste des gammes */}
              <Text style={styles.sectionTitle}>DETAILS DES BILLETS</Text>

              {eventTickets.map((ticket) => {
                const quality = getTierQualityInfo(ticket.tier.name);
                const statusConfig = getStatusConfig(getTicketDisplayStatus(ticket));
                const operator = getOperatorName(ticket.payment_method);

                return (
                  <Pressable
                    key={ticket.id}
                    onPress={() => handleTicketPress(ticket.id)}
                    style={({ pressed }) => [
                      styles.ticketCard,
                      pressed && styles.cardPressed,
                    ]}
                    accessibilityRole="button"
                    accessibilityLabel={`Billet ${ticket.tier.name}`}
                  >
                    {/* En-tete : badge qualite + nom + chevron */}
                    <View style={styles.ticketHeaderRow}>
                      <LinearGradient
                        colors={[`${quality.color}3D`, `${quality.color}14`]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.tierIconTile}
                      >
                        {(() => {
                          const QualityIcon = quality.icon;
                          return <QualityIcon width={26} height={26} />;
                        })()}
                      </LinearGradient>

                      <Text style={styles.tierName} numberOfLines={1}>
                        {ticket.tier.name}
                      </Text>

                      <View style={styles.chevronCircle}>
                        <ChevronRight size={15} color={colors.stone} strokeWidth={2} />
                      </View>
                    </View>

                    {/* Sous-titre : quantite · operateur */}
                    <Text style={styles.ticketSub} numberOfLines={1}>
                      {ticket.quantity} billet{ticket.quantity > 1 ? 's' : ''}
                      {operator ? ` · Paye via ${operator}` : ''}
                    </Text>

                    {/* Liseret perfore avec losange or */}
                    <View style={styles.ticketDividerRow}>
                      <View style={styles.ticketDashedLine} />
                      <View style={styles.ticketDiamond} />
                      <View style={styles.ticketDashedLine} />
                    </View>

                    {/* Pied : statut + prix */}
                    <View style={styles.ticketFooterRow}>
                      <View style={[styles.statusBadge, { backgroundColor: statusConfig.bg }]}>
                        {statusConfig.icon}
                        <Text style={[styles.statusBadgeText, { color: statusConfig.color }]}>
                          {statusConfig.label}
                        </Text>
                      </View>
                      <Text style={styles.tierPrice}>
                        {formatPrice(ticket.total_price)}
                      </Text>
                    </View>
                  </Pressable>
                );
              })}

              {/* Total paye : coupon onyx */}
              <LinearGradient
                colors={['#26221E', colors.onyx]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.totalStub}
              >
                <View style={styles.totalTopRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.totalLabel}>TOTAL PAYE</Text>
                    <Text style={styles.totalCaption}>
                      {totalQuantity} billet{totalQuantity > 1 ? 's' : ''} ·{' '}
                      {eventTickets.length} gamme{eventTickets.length > 1 ? 's' : ''}
                    </Text>
                  </View>
                  <Text style={styles.totalValue}>{formatPrice(totalAmount)}</Text>
                </View>

                <View style={styles.dividerRow}>
                  <View style={styles.dashedLine} />
                  <View style={styles.dividerDiamond} />
                  <View style={styles.dashedLine} />
                  <View style={styles.notchLeft} pointerEvents="none" />
                  <View style={styles.notchRight} pointerEvents="none" />
                </View>
              </LinearGradient>
            </>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
