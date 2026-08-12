/**
 * Page des billets d'un evenement - Espace client.
 *
 * Accessible depuis "Mes billets" (tap sur une carte d'evenement).
 * Liste toutes les gammes achetees pour cet evenement, avec leur
 * statut individuel. Tap sur une gamme → detail du billet (tickets/[id]).
 *
 * Design « Noir & Or » premium :
 * - En-tête simple : retour pastille verre + titre Playfair
 * - En-tête événement : image 120px cercelee d'or + titre + date + ville
 * - Cartes par gamme : liseret statut, tuile qualite SVG en degrade,
 *   nom, quantite, operateur, statut pill, prix or champagne
 * - Total paye en "coupon" noir profond avec liseret perfore et losange or
 * - Etat vide premium
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
  type ViewStyle,
  type TextStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  ChevronLeft,
  ChevronRight,
  Ticket,
  CalendarDays,
  MapPin,
} from 'lucide-react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';

import QualityPremiumIcon from '@/assets/icons/quality-premium.svg';
import QualityVipIcon from '@/assets/icons/quality-VIP.svg';
import QualityStandardIcon from '@/assets/icons/quality-standart.svg';

import { colors, spacing, radius, gradients, shadows, ROUTES } from '@/lib/constants';
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
} {
  switch (status) {
    case 'valid':
      return { color: colors.success, bg: 'rgba(91,196,139,0.12)', label: 'Valide' };
    case 'used':
      return { color: colors.textSecondary, bg: 'rgba(181,172,156,0.12)', label: 'Utilise' };
    case 'expired':
      return { color: colors.danger, bg: 'rgba(255,107,94,0.12)', label: 'Expire' };
    case 'pending':
      return { color: colors.warning, bg: 'rgba(232,182,76,0.12)', label: 'En attente' };
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
  root: { flex: 1, backgroundColor: colors.background },

  /* Header */
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  headerBackButton: {
    width: 44,
    height: 44,
    borderRadius: radius.full,
    backgroundColor: colors.glass,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  headerTitleArea: {
    flex: 1,
  },
  headerTitle: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 22,
    lineHeight: 28,
    color: colors.text,
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    lineHeight: 18,
    color: colors.textMuted,
    marginTop: 1,
  },

  /* Contenu */
  content: {
    paddingHorizontal: spacing.lg,
  },

  /* En-tete evenement : image 120px + titre + date */
  eventHeaderCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.elevated,
    borderWidth: 1,
    borderColor: `${colors.gold}1F`,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
    ...shadows.card,
  } as ViewStyle,
  eventThumb: {
    width: 120,
    height: 120,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: `${colors.gold}45`,
    overflow: 'hidden',
  } as ViewStyle,
  eventThumbImage: {
    width: '100%',
    height: '100%',
  },
  eventThumbPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.surfaceAlt,
    justifyContent: 'center',
    alignItems: 'center',
  },
  eventBody: {
    flex: 1,
  } as ViewStyle,
  eventOverline: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 11,
    lineHeight: 15,
    letterSpacing: 1.4,
    color: colors.goldMuted,
    textTransform: 'uppercase',
    marginBottom: 4,
  } as TextStyle,
  eventTitle: {
    fontFamily: 'PlayfairDisplay_600SemiBold',
    fontSize: 18,
    lineHeight: 24,
    color: colors.text,
    letterSpacing: -0.2,
    marginBottom: spacing.sm,
  } as TextStyle,
  eventMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: 5,
  } as ViewStyle,
  eventMetaText: {
    flex: 1,
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    lineHeight: 16,
    color: colors.textSecondary,
  } as TextStyle,
  eventCountBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: 'rgba(216,180,90,0.12)',
    borderWidth: 1,
    borderColor: `${colors.gold}40`,
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 4,
    alignSelf: 'flex-start',
  } as ViewStyle,
  eventCountText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 11,
    lineHeight: 15,
    color: colors.goldBright,
  } as TextStyle,

  /* Titre section */
  sectionTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 11,
    lineHeight: 15,
    letterSpacing: 1.4,
    color: colors.goldMuted,
    textTransform: 'uppercase',
    marginBottom: spacing.md,
  } as TextStyle,

  /* Carte gamme type coupon */
  ticketCard: {
    backgroundColor: colors.elevated,
    borderWidth: 1,
    borderColor: `${colors.gold}1F`,
    borderRadius: radius.lg,
    padding: spacing.md + 2,
    marginBottom: spacing.md,
    ...shadows.card,
  } as ViewStyle,
  cardPressed: {
    opacity: 0.88,
    transform: [{ scale: 0.99 }],
  },
  ticketHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  } as ViewStyle,
  tierIconTile: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: `${colors.gold}2E`,
    backgroundColor: colors.glassGold,
  } as ViewStyle,
  tierName: {
    flex: 1,
    fontFamily: 'PlayfairDisplay_600SemiBold',
    fontSize: 17,
    lineHeight: 23,
    color: colors.text,
    letterSpacing: -0.2,
  } as TextStyle,
  chevronCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.glass,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  } as ViewStyle,
  ticketSub: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    lineHeight: 16,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    paddingLeft: 60,
  } as TextStyle,
  ticketDividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing.md,
  } as ViewStyle,
  ticketDashedLine: {
    flex: 1,
    height: 1,
    borderTopWidth: 1,
    borderStyle: 'dashed',
    borderColor: `${colors.gold}35`,
  } as ViewStyle,
  ticketDiamond: {
    width: 6,
    height: 6,
    backgroundColor: colors.gold,
    transform: [{ rotate: '45deg' }],
    marginHorizontal: spacing.sm,
  } as ViewStyle,
  ticketFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  } as ViewStyle,
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 4,
    gap: 5,
    borderWidth: 1,
    borderColor: `${colors.gold}26`,
  } as ViewStyle,
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  } as ViewStyle,
  statusBadgeText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 11,
    lineHeight: 15,
    letterSpacing: 0.2,
  } as TextStyle,
  tierPrice: {
    fontFamily: 'Inter_700Bold',
    fontSize: 17,
    lineHeight: 22,
    color: colors.goldBright,
    letterSpacing: 0.2,
  } as TextStyle,

  /* Total paye : coupon noir profond */
  totalStub: {
    borderRadius: radius.xxl,
    padding: spacing.lg,
    marginTop: spacing.xs,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: `${colors.gold}30`,
    ...shadows.eventCard,
  } as ViewStyle,
  totalTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: spacing.md,
  } as ViewStyle,
  totalLabel: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 10,
    lineHeight: 14,
    letterSpacing: 1.6,
    color: colors.goldMuted,
    textTransform: 'uppercase',
  } as TextStyle,
  totalCaption: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    lineHeight: 16,
    color: colors.textSecondary,
    marginTop: 3,
  } as TextStyle,
  totalValue: {
    fontFamily: 'PlayfairDisplay_600SemiBold',
    fontSize: 26,
    lineHeight: 32,
    color: colors.goldBright,
    letterSpacing: -0.2,
  } as TextStyle,
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.md,
  } as ViewStyle,
  dashedLine: {
    flex: 1,
    height: 1,
    borderTopWidth: 1,
    borderStyle: 'dashed',
    borderColor: `${colors.gold}40`,
  } as ViewStyle,
  dividerDiamond: {
    width: 8,
    height: 8,
    backgroundColor: colors.gold,
    transform: [{ rotate: '45deg' }],
    marginHorizontal: spacing.sm,
  } as ViewStyle,

  /* Etat vide */
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxxl * 2,
    paddingHorizontal: spacing.xl,
  } as ViewStyle,
  emptyIconWrap: {
    width: 88,
    height: 88,
    borderRadius: radius.xxl,
    backgroundColor: colors.glassGold,
    borderWidth: 1,
    borderColor: colors.borderGold,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
    ...shadows.goldGlowSoft,
  } as ViewStyle,
  emptyTitle: {
    fontFamily: 'PlayfairDisplay_600SemiBold',
    fontSize: 18,
    lineHeight: 24,
    color: colors.text,
    marginBottom: spacing.sm,
    textAlign: 'center',
  } as TextStyle,
  emptySubtitle: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    lineHeight: 20,
    color: colors.textMuted,
    textAlign: 'center',
  } as TextStyle,
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
            <ChevronLeft size={22} color={colors.goldBright} strokeWidth={1.75} />
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
            /* Etat vide premium */
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconWrap}>
                <Ticket size={30} color={colors.gold} strokeWidth={1.5} />
              </View>
              <Text style={styles.emptyTitle}>Aucun billet pour cet evenement</Text>
              <Text style={styles.emptySubtitle}>
                Vos billets achetes pour cet evenement apparaitront ici.
              </Text>
            </View>
          ) : (
            <>
              {/* En-tete evenement : image + titre + date */}
              <View style={styles.eventHeaderCard}>
                <View style={styles.eventThumb}>
                  {eventSummary?.cover_image ? (
                    <Image
                      source={{ uri: eventSummary.cover_image }}
                      style={styles.eventThumbImage}
                      contentFit="cover"
                      transition={300}
                      cachePolicy="memory-disk"
                    />
                  ) : (
                    <View style={styles.eventThumbPlaceholder}>
                      <Ticket size={28} color={colors.goldMuted} strokeWidth={1.5} />
                    </View>
                  )}
                </View>

                <View style={styles.eventBody}>
                  <Text style={styles.eventOverline}>VOS BILLETS</Text>
                  <Text style={styles.eventTitle} numberOfLines={2}>
                    {eventSummary?.title ?? 'Evenement'}
                  </Text>

                  {eventSummary?.start_date && (
                    <View style={styles.eventMetaRow}>
                      <CalendarDays size={12} color={colors.goldMuted} strokeWidth={1.75} />
                      <Text style={styles.eventMetaText} numberOfLines={1}>
                        {formatDate(eventSummary.start_date)}
                      </Text>
                    </View>
                  )}
                  {eventSummary?.city && (
                    <View style={styles.eventMetaRow}>
                      <MapPin size={12} color={colors.goldMuted} strokeWidth={1.75} />
                      <Text style={styles.eventMetaText} numberOfLines={1}>
                        {eventSummary.city}
                      </Text>
                    </View>
                  )}

                  <View style={styles.eventCountBadge}>
                    <Ticket size={12} color={colors.gold} strokeWidth={2} />
                    <Text style={styles.eventCountText}>
                      {totalQuantity} billet{totalQuantity > 1 ? 's' : ''}
                    </Text>
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
                        <ChevronRight size={15} color={colors.goldMuted} strokeWidth={1.75} />
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
                        <View style={[styles.statusDot, { backgroundColor: statusConfig.color }]} />
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

              {/* Total paye : coupon noir profond */}
              <LinearGradient
                colors={[...gradients.surfaceInvert] as unknown as readonly [string, string, ...string[]]}
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
                </View>
              </LinearGradient>
            </>
          )}
        </View>
      </ScrollView>
    </View>
  );
}