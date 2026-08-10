/**
 * Page detail d'un billet - Espace client.
 *
 * Design ultra-premium "boarding pass" (Apple Wallet) :
 * - Carte billet unique type coupon avec :
 *   - Bandeau cover evenement + overlay + badge statut flottant
 *   - Sur-titre gamme (BILLET · PREMIUM) + titre evenement
 *   - Zone QR code (placeholder en Expo Go, plein ecran en dev build)
 *   - Liseret perfore avec losange or (meme langage que le recap paiement)
 *   - Gamme + prix, meta "x billets"
 * - Carte "Details du billet" en grille 2x2 : operateur, date d'achat,
 *   expiration, quantite
 * - Bandeau securite HMAC-SHA256
 * - Bouton retour
 *
 * Conventions :
 * - Design tokens depuis lib/constants.ts
 * - expo-image pour les images
 * - Pas de type any, pas d'emojis
 * - Imports @/
 * - Commentaires en francais
 */

import { useCallback, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Alert,
  StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  ChevronLeft,
  CalendarDays,
  MapPin,
  Ticket,
  Maximize2,
  ShieldCheck,
  QrCode,
  Smartphone,
  Clock,
  CircleCheck,
  CircleX,
} from 'lucide-react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';

import QualityPremiumIcon from '@/assets/icons/quality-premium.svg';
import QualityVipIcon from '@/assets/icons/quality-VIP.svg';
import QualityStandardIcon from '@/assets/icons/quality-standart.svg';

import { colors, spacing, radii, shadows } from '@/lib/constants';
import { useHaptics } from '@/hooks/useHaptics';
import { formatPrice, formatDate } from '@/services/event.service';
import { useTicketsStore } from '@/stores/tickets-store';
import { getMockTicketById } from '@/data/mock';
import type { PurchasedTicket } from '@/stores/tickets-store';
import type { MockTicket } from '@/data/mock';

// ============================================================
// Types
// ============================================================

/** Billet issu du store (achat reel) ou des donnees mock (developpement) */
type TicketView = (PurchasedTicket | MockTicket) & {
  readonly qr_code?: string | null;
  readonly qr_secret?: string | null;
  readonly scanned_at?: string | null;
  readonly buyer_id?: string | null;
};

type TicketStatus = 'valid' | 'used' | 'expired' | 'pending';

// ============================================================
// Helpers
// ============================================================

function getTicketDisplayStatus(ticket: {
  payment_status: string;
  is_scanned: boolean;
  expires_at: string | null;
}): TicketStatus {
  if (ticket.payment_status === 'pending') return 'pending';
  if (ticket.is_scanned) return 'used';
  if (ticket.expires_at && new Date(ticket.expires_at) < new Date()) return 'expired';
  return 'valid';
}

function getStatusConfig(status: TicketStatus): {
  color: string;
  label: string;
  icon: React.ReactNode;
} {
  switch (status) {
    case 'valid':
      return {
        color: colors.forest,
        label: 'Billet valide',
        icon: <CircleCheck size={12} color={colors.forest} strokeWidth={2.5} />,
      };
    case 'used':
      return {
        color: colors.stone,
        label: 'Billet utilise',
        icon: <CircleX size={12} color={colors.stone} strokeWidth={2.5} />,
      };
    case 'expired':
      return {
        color: colors.danger,
        label: 'Billet expire',
        icon: <CircleX size={12} color={colors.danger} strokeWidth={2.5} />,
      };
    case 'pending':
      return {
        color: colors.mango,
        label: 'Paiement en attente',
        icon: <Clock size={12} color={colors.mango} strokeWidth={2.5} />,
      };
    default:
      return {
        color: colors.stone,
        label: status,
        icon: <CircleCheck size={12} color={colors.stone} strokeWidth={2.5} />,
      };
  }
}

function getOperatorName(method: string | null): string {
  switch (method) {
    case 'mtn': return 'MTN Mobile Money';
    case 'orange': return 'Orange Money';
    case 'moov': return 'Moov Money';
    default: return 'Non precise';
  }
}

/** Etiquette de gamme (PREMIUM / VIP / STANDARD) pour le sur-titre */
function getTierLabel(name: string | null): string {
  if (!name) return 'STANDARD';
  const lower = name.toLowerCase();
  if (lower.includes('vvip') || lower.includes('premium')) return 'PREMIUM';
  if (lower.includes('vip')) return 'VIP';
  return 'STANDARD';
}

interface TierQualityInfo {
  readonly icon: React.ComponentType<{ width?: number; height?: number }>;
  readonly label: string;
  readonly color: string;
}

/** Badge SVG + couleur selon la gamme du billet */
function getTierQualityInfo(name: string | null): TierQualityInfo {
  const lower = (name ?? '').toLowerCase();
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
  headerTitle: {
    flex: 1,
    fontFamily: 'PlayfairDisplay-SemiBold',
    fontSize: 20,
    lineHeight: 26,
    color: colors.onyx,
  },
  headerSpacer: {
    width: 40,
  },

  /* Contenu */
  content: { paddingHorizontal: spacing.lg },

  /* Carte principale type coupon */
  mainCard: {
    backgroundColor: colors.white,
    borderRadius: radii.xxl,
    marginBottom: spacing.xl,
    overflow: 'hidden',
    ...shadows.eventCard,
  },
  mainCardTopBar: {
    height: 4,
  },

  /* Bandeau cover evenement */
  cover: {
    height: 136,
    position: 'relative',
  },
  coverImage: {
    width: '100%',
    height: 136,
  },
  coverOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  coverPlaceholder: {
    width: '100%',
    height: 136,
    justifyContent: 'center',
    alignItems: 'center',
  },
  coverPlaceholderIcon: {
    marginBottom: spacing.xs,
  },
  coverContent: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.md,
  },
  coverOverline: {
    fontFamily: 'Inter-Bold',
    fontSize: 10,
    lineHeight: 14,
    letterSpacing: 2,
    color: colors.gold,
    marginBottom: 2,
  },
  coverTitle: {
    fontFamily: 'PlayfairDisplay-SemiBold',
    fontSize: 22,
    lineHeight: 28,
    color: colors.white,
  },
  coverMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  coverMetaText: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    lineHeight: 16,
    color: 'rgba(255,255,255,0.85)',
  },

  /* Pastille statut flottante */
  statusPill: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.94)',
    borderRadius: radii.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 1,
    gap: spacing.xs,
    borderWidth: 1,
    shadowColor: colors.onyx,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  statusPillText: {
    fontFamily: 'Inter-Bold',
    fontSize: 11,
    lineHeight: 15,
    letterSpacing: 0.3,
  },

  /* Corps du coupon */
  body: {
    padding: spacing.lg,
  },

  /* Zone QR code */
  qrWrap: {
    alignItems: 'center',
  },
  qrContainer: {
    width: 176,
    height: 176,
    backgroundColor: colors.ivory,
    borderRadius: radii.lg,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: `${colors.gold}30`,
    ...shadows.search,
  },
  qrCaption: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    lineHeight: 16,
    color: colors.stone,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  qrExpandButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: `${colors.forest}10`,
    borderRadius: radii.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginTop: spacing.md,
  },
  qrExpandText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 13,
    lineHeight: 18,
    color: colors.forest,
  },

  /* Liseret perfore (meme langage que le recap paiement) */
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing.md,
    position: 'relative',
  },
  dashedLine: {
    flex: 1,
    height: 1,
    borderTopWidth: 1,
    borderStyle: 'dashed',
    borderColor: `${colors.onyx}25`,
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
    left: -48,
    top: 0,
    marginTop: -16,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.sand,
  },
  notchRight: {
    position: 'absolute',
    right: -48,
    top: 0,
    marginTop: -16,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.sand,
  },

  /* Gamme + prix */
  tierRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  tierIconTile: {
    width: 44,
    height: 44,
    borderRadius: radii.md,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: `${colors.white}CC`,
  },
  tierName: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    lineHeight: 22,
    color: colors.onyx,
  },
  tierSub: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    lineHeight: 16,
    color: colors.stone,
    marginTop: 2,
  },
  tierPrice: {
    fontFamily: 'PlayfairDisplay-Bold',
    fontSize: 22,
    lineHeight: 28,
    color: colors.gold,
  },

  /* Ligne date achat / expiration */
  datesRow: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.md,
    marginTop: spacing.md,
    gap: spacing.lg,
  },
  dateCell: {
    flex: 1,
  },
  dateLabel: {
    fontFamily: 'Inter-Bold',
    fontSize: 10,
    lineHeight: 14,
    letterSpacing: 1,
    color: colors.stone,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  dateValue: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 13,
    lineHeight: 18,
    color: colors.onyx,
  },

  /* Section titre */
  sectionTitle: {
    fontFamily: 'PlayfairDisplay-SemiBold',
    fontSize: 16,
    lineHeight: 22,
    color: colors.onyx,
    marginBottom: spacing.md,
  },

  /* Carte details (grille 2x2) */
  infoCard: {
    backgroundColor: colors.white,
    borderRadius: radii.xl,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    ...shadows.card,
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    rowGap: spacing.lg,
  },
  infoCell: {
    width: '50%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingRight: spacing.md,
  },
  infoIconTile: {
    width: 36,
    height: 36,
    borderRadius: radii.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoCellTexts: {
    flex: 1,
  },
  infoLabel: {
    fontFamily: 'Inter-Regular',
    fontSize: 11,
    lineHeight: 15,
    color: colors.stone,
  },
  infoValue: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 13,
    lineHeight: 18,
    color: colors.onyx,
    marginTop: 1,
  },

  /* Securite */
  securityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${colors.forest}08`,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  securityText: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    lineHeight: 16,
    color: colors.forest,
    flex: 1,
  },

  /* Etat introuvable */
  notFound: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  notFoundIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.ivory,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  notFoundTitle: {
    fontFamily: 'PlayfairDisplay-SemiBold',
    fontSize: 20,
    lineHeight: 26,
    color: colors.onyx,
    marginBottom: spacing.md,
  },
  notFoundButton: {
    backgroundColor: colors.terracotta,
    borderRadius: radii.xl,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
  },
  notFoundButtonText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    lineHeight: 20,
    color: colors.white,
  },
});

// ============================================================
// Composant principal
// ============================================================

export default function TicketDetail() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string }>();
  const { impact } = useHaptics();

  const ticketId = params.id;

  // -- Donnees : store d'abord (billets achetes), repli mock (developpement) --
  const purchasedTicket = useTicketsStore((state) =>
    state.tickets.find((t) => t.id === ticketId),
  );

  const ticket = useMemo<TicketView | null>(() => {
    if (purchasedTicket) return purchasedTicket;
    return getMockTicketById(ticketId ?? '');
  }, [purchasedTicket, ticketId]);

  // -- Handlers --
  const handleBack = useCallback(() => {
    impact('light');
    router.back();
  }, [impact, router]);

  const handleExpandQR = useCallback(() => {
    impact('light');
    Alert.alert(
      'QR plein ecran',
      'Le mode plein ecran QR sera disponible avec le development build (expo-camera).',
    );
  }, [impact]);

  // -- Si billet introuvable --
  if (!ticket) {
    return (
      <View style={[styles.root, styles.notFound, { paddingTop: insets.top }]}>
        <View style={styles.notFoundIconWrap}>
          <Ticket size={28} color={colors.stone} strokeWidth={1.5} />
        </View>
        <Text style={styles.notFoundTitle}>Billet introuvable</Text>
        <Pressable onPress={handleBack} style={styles.notFoundButton} accessibilityRole="button">
          <Text style={styles.notFoundButtonText}>Retour</Text>
        </Pressable>
      </View>
    );
  }

  // -- Donnees derivees --
  const displayStatus = getTicketDisplayStatus(ticket);
  const statusConfig = getStatusConfig(displayStatus);
  const operatorName = getOperatorName(ticket.payment_method);
  const tierLabel = getTierLabel(ticket.tier?.name ?? null);
  const quality = getTierQualityInfo(ticket.tier?.name ?? null);
  const isValid = displayStatus === 'valid';

  // Couleur de la barre laterale selon le statut
  const statusBarColor =
    displayStatus === 'valid'
      ? colors.forest
      : displayStatus === 'pending'
        ? colors.mango
        : displayStatus === 'expired'
          ? colors.danger
          : colors.stone;

  // Ligne meta du bandeau : "12 Aout 2026 · Yaounde"
  const coverMeta = [
    ticket.event?.start_date ? formatDate(ticket.event.start_date) : null,
    ticket.event?.city ?? null,
  ].filter(Boolean).join(' \u00B7 ');

  // Legende du QR selon le statut
  const qrCaption =
    displayStatus === 'pending'
      ? 'QR disponible apres confirmation du paiement'
      : displayStatus === 'used'
        ? 'Billet deja utilise'
        : displayStatus === 'expired'
          ? 'Billet expire'
          : 'Presentez ce QR code a l\u2019entree';

  const hasQr = Boolean(ticket.qr_code) && isValid;

  // ============================================================
  // Rendu
  // ============================================================

  return (
    <View style={styles.root}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingTop: insets.top,
          // Compense la TabBar flottante (60px + inset) pour que le
          // contenu ne soit jamais masque en bas d'ecran.
          paddingBottom: insets.bottom + 60 + spacing.xl,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={handleBack} style={styles.headerBackButton} hitSlop={12}>
            <ChevronLeft size={22} color={colors.onyx} strokeWidth={2} />
          </Pressable>
          <Text style={styles.headerTitle}>Mon billet</Text>
          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.content}>
          {/* =============================================
              CARTE PRINCIPALE : type coupon / boarding pass
              ============================================= */}
          <View style={styles.mainCard}>
            {/* Barre statut */}
            <View style={[styles.mainCardTopBar, { backgroundColor: statusBarColor }]} />

            {/* Bandeau cover evenement */}
            <View style={styles.cover}>
              {ticket.event?.cover_image ? (
                <>
                  <Image
                    source={{ uri: ticket.event.cover_image }}
                    style={styles.coverImage}
                    contentFit="cover"
                    transition={300}
                    cachePolicy="memory-disk"
                  />
                  <LinearGradient
                    colors={['rgba(26,24,22,0.15)', 'rgba(26,24,22,0.82)']}
                    style={styles.coverOverlay}
                    pointerEvents="none"
                  />
                </>
              ) : (
                <LinearGradient
                  colors={['#2A2723', '#141210']}
                  style={styles.coverPlaceholder}
                >
                  <View style={styles.coverPlaceholderIcon}>
                    <Ticket size={24} color={`${colors.gold}88`} strokeWidth={1.2} />
                  </View>
                </LinearGradient>
              )}

              {/* Texte sur le bandeau */}
              <View style={styles.coverContent}>
                <Text style={styles.coverOverline}>BILLET {'\u00B7'} {tierLabel}</Text>
                <Text style={styles.coverTitle} numberOfLines={2}>
                  {ticket.event?.title ?? 'Evenement'}
                </Text>
                {coverMeta.length > 0 && (
                  <View style={styles.coverMetaRow}>
                    <MapPin size={12} color="rgba(255,255,255,0.85)" strokeWidth={1.5} />
                    <Text style={styles.coverMetaText} numberOfLines={1}>
                      {coverMeta}
                    </Text>
                  </View>
                )}
              </View>

              {/* Badge statut flottant */}
              <View style={[styles.statusPill, { borderColor: `${statusConfig.color}33` }]}>
                {statusConfig.icon}
                <Text style={[styles.statusPillText, { color: statusConfig.color }]}>
                  {statusConfig.label}
                </Text>
              </View>
            </View>

            {/* Corps du coupon */}
            <View style={styles.body}>
              {/* QR code */}
              <View style={styles.qrWrap}>
                <View style={styles.qrContainer}>
                  {hasQr ? (
                    <QrCode size={92} color={colors.onyx} strokeWidth={0.5} />
                  ) : (
                    <QrCode
                      size={92}
                      color={displayStatus === 'valid' ? colors.onyx : colors.border}
                      strokeWidth={0.5}
                    />
                  )}
                </View>
                <Text style={styles.qrCaption}>{qrCaption}</Text>

                {isValid && (
                  <Pressable
                    onPress={handleExpandQR}
                    style={styles.qrExpandButton}
                    accessibilityRole="button"
                    accessibilityLabel="Afficher QR en plein ecran"
                  >
                    <Maximize2 size={14} color={colors.forest} strokeWidth={2} />
                    <Text style={styles.qrExpandText}>Plein ecran</Text>
                  </Pressable>
                )}
              </View>

              {/* Liseret perfore */}
              <View style={styles.dividerRow}>
                <View style={styles.dashedLine} />
                <View style={styles.dividerDiamond} />
                <View style={styles.dashedLine} />
                <View style={styles.notchLeft} pointerEvents="none" />
                <View style={styles.notchRight} pointerEvents="none" />
              </View>

              {/* Gamme + prix */}
              <View style={styles.tierRow}>
                <LinearGradient
                  colors={[`${quality.color}3D`, `${quality.color}14`]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.tierIconTile}
                >
                  {(() => {
                    const QualityIcon = quality.icon;
                    return <QualityIcon width={24} height={24} />;
                  })()}
                </LinearGradient>
                <View style={{ flex: 1 }}>
                  <Text style={styles.tierName} numberOfLines={1}>
                    {ticket.tier?.name ?? 'Standard'}
                  </Text>
                  <Text style={styles.tierSub} numberOfLines={1}>
                    {ticket.quantity} billet{ticket.quantity > 1 ? 's' : ''} {'\u00B7'} {tierLabel}
                  </Text>
                </View>
                <Text style={styles.tierPrice}>{formatPrice(ticket.total_price)}</Text>
              </View>

              {/* Date d'achat + expiration */}
              <View style={styles.datesRow}>
                <View style={styles.dateCell}>
                  <Text style={styles.dateLabel}>Date d&apos;achat</Text>
                  <Text style={styles.dateValue}>
                    {ticket.created_at ? formatDate(ticket.created_at) : 'Non precise'}
                  </Text>
                </View>
                <View style={styles.dateCell}>
                  <Text style={styles.dateLabel}>Expiration</Text>
                  <Text style={styles.dateValue}>
                    {ticket.expires_at ? formatDate(ticket.expires_at) : 'Sans date'}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* =============================================
              DETAILS DU BILLET (grille 2x2)
              ============================================= */}
          <Text style={styles.sectionTitle}>Details du billet</Text>

          <View style={styles.infoCard}>
            <View style={styles.infoGrid}>
              {/* Operateur */}
              <View style={styles.infoCell}>
                <View style={[styles.infoIconTile, { backgroundColor: `${colors.terracotta}12` }]}>
                  <Smartphone size={17} color={colors.terracotta} strokeWidth={1.8} />
                </View>
                <View style={styles.infoCellTexts}>
                  <Text style={styles.infoLabel}>Operateur</Text>
                  <Text style={styles.infoValue} numberOfLines={1}>{operatorName}</Text>
                </View>
              </View>

              {/* Quantite */}
              <View style={styles.infoCell}>
                <View style={[styles.infoIconTile, { backgroundColor: `${colors.gold}14` }]}>
                  <Ticket size={17} color={colors.gold} strokeWidth={1.8} />
                </View>
                <View style={styles.infoCellTexts}>
                  <Text style={styles.infoLabel}>Quantite</Text>
                  <Text style={styles.infoValue}>
                    {ticket.quantity} billet{ticket.quantity > 1 ? 's' : ''}
                  </Text>
                </View>
              </View>

              {/* Date d'achat */}
              <View style={styles.infoCell}>
                <View style={[styles.infoIconTile, { backgroundColor: `${colors.forest}12` }]}>
                  <CalendarDays size={17} color={colors.forest} strokeWidth={1.8} />
                </View>
                <View style={styles.infoCellTexts}>
                  <Text style={styles.infoLabel}>Date d&apos;achat</Text>
                  <Text style={styles.infoValue}>
                    {ticket.created_at ? formatDate(ticket.created_at) : 'Non precise'}
                  </Text>
                </View>
              </View>

              {/* Expiration */}
              <View style={styles.infoCell}>
                <View style={[styles.infoIconTile, { backgroundColor: `${colors.mango}16` }]}>
                  <Clock size={17} color={colors.mango} strokeWidth={1.8} />
                </View>
                <View style={styles.infoCellTexts}>
                  <Text style={styles.infoLabel}>Expiration</Text>
                  <Text style={styles.infoValue}>
                    {ticket.expires_at ? formatDate(ticket.expires_at) : 'Sans date'}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Securite */}
          <View style={styles.securityRow}>
            <ShieldCheck size={18} color={colors.forest} strokeWidth={2} />
            <Text style={styles.securityText}>
              Ce QR code est securise par HMAC-SHA256. Toute tentative de falsification sera detectee a l&apos;entree.
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
