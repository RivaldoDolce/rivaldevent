/**
 * Page detail d'un billet - Espace client.
 *
 * Design « Noir & Or » — billet physique premium :
 * - Bandeau héros dégradé avec filet or, retour pastille verre, titre serif
 * - Carte « billet physique » : surface élevée, filet or, coins perforés
 *   (pastilles rondes sur les bords), séparateur pointillé central
 * - QR code réel (react-native-qrcode-svg) dans un médaillon doré
 * - Référence billet en overline, infos événement (titre, date, lieu, tier)
 * - Bouton « Agrandir le QR » ghost → plein écran (ROUTES.QR_FULLSCREEN)
 * - Grille de détails 2x2 (opérateur, quantité, achat, expiration)
 * - Bandeau sécurité HMAC-SHA256
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
  StyleSheet,
  Platform,
  type ViewStyle,
  type TextStyle,
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
} from 'lucide-react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import QRCode from 'react-native-qrcode-svg';

import QualityPremiumIcon from '@/assets/icons/quality-premium.svg';
import QualityVipIcon from '@/assets/icons/quality-VIP.svg';
import QualityStandardIcon from '@/assets/icons/quality-standart.svg';

import { colors, spacing, radius, gradients, shadows, ROUTES } from '@/lib/constants';
import { Button } from '@/components/ui/Button';
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
} {
  switch (status) {
    case 'valid':
      return { color: colors.success, label: 'Billet valide' };
    case 'used':
      return { color: colors.textSecondary, label: 'Billet utilise' };
    case 'expired':
      return { color: colors.danger, label: 'Billet expire' };
    case 'pending':
      return { color: colors.warning, label: 'Paiement en attente' };
    default:
      return { color: colors.textSecondary, label: status };
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
  root: { flex: 1, backgroundColor: colors.background },

  /* Bandeau héros dégradé avec filet or */
  hero: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: `${colors.gold}1F`,
  },
  heroRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  heroBackButton: {
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
  heroTexts: {
    flex: 1,
  },
  heroOverline: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 11,
    lineHeight: 15,
    letterSpacing: 1.4,
    color: colors.goldMuted,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  heroTitle: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 24,
    lineHeight: 30,
    color: colors.text,
    letterSpacing: -0.3,
  },
  heroSpacer: {
    width: 44,
  },

  /* Contenu */
  content: { paddingHorizontal: spacing.lg },

  /* Carte principale type billet physique */
  mainCard: {
    backgroundColor: colors.elevated,
    borderWidth: 1,
    borderColor: `${colors.gold}30`,
    borderRadius: radius.xxl,
    marginTop: spacing.lg,
    marginBottom: spacing.xl,
    ...shadows.card,
  } as ViewStyle,
  mainCardTopBar: {
    height: 3,
    borderTopLeftRadius: radius.xxl - 1,
    borderTopRightRadius: radius.xxl - 1,
  },

  /* Coins perforés : pastilles rondes sur les bords dorés */
  perforation: {
    position: 'absolute',
    width: 9,
    height: 9,
    borderRadius: 4.5,
    backgroundColor: colors.background,
    zIndex: 2,
  } as ViewStyle,
  perforationLeftTop: {
    left: -4.5,
    top: '42%',
  } as ViewStyle,
  perforationLeftBottom: {
    left: -4.5,
    top: '68%',
  } as ViewStyle,
  perforationRightTop: {
    right: -4.5,
    top: '42%',
  } as ViewStyle,
  perforationRightBottom: {
    right: -4.5,
    top: '68%',
  } as ViewStyle,

  /* Bandeau cover evenement */
  cover: {
    height: 136,
    position: 'relative',
    overflow: 'hidden',
    borderTopLeftRadius: radius.xxl - 1,
    borderTopRightRadius: radius.xxl - 1,
  } as ViewStyle,
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
  } as ViewStyle,
  coverPlaceholder: {
    width: '100%',
    height: 136,
    justifyContent: 'center',
    alignItems: 'center',
  } as ViewStyle,
  coverContent: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.md,
  } as ViewStyle,
  coverOverline: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 10,
    lineHeight: 14,
    letterSpacing: 1.6,
    color: colors.goldBright,
    textTransform: 'uppercase',
    marginBottom: 2,
  } as TextStyle,
  coverTitle: {
    fontFamily: 'PlayfairDisplay_600SemiBold',
    fontSize: 22,
    lineHeight: 28,
    color: colors.text,
    letterSpacing: -0.2,
  } as TextStyle,
  coverMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.xs,
  } as ViewStyle,
  coverMetaText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    lineHeight: 16,
    color: colors.textSecondary,
  } as TextStyle,

  /* Pastille statut flottante (verre sombre) */
  statusPill: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(10,9,8,0.68)',
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 1,
    gap: spacing.xs,
    borderWidth: 1,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 2,
  } as ViewStyle,
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  } as ViewStyle,
  statusPillText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 11,
    lineHeight: 15,
    letterSpacing: 0.3,
  } as TextStyle,

  /* Corps du billet */
  body: {
    padding: spacing.lg,
  } as ViewStyle,

  /* Zone QR code — médaillon doré */
  qrWrap: {
    alignItems: 'center',
  } as ViewStyle,
  qrMedallion: {
    padding: 12,
    backgroundColor: colors.glassGold,
    borderWidth: 1,
    borderColor: `${colors.gold}40`,
    borderRadius: radius.lg,
    ...shadows.goldGlowSoft,
  } as ViewStyle,
  qrPlaceholder: {
    width: 140,
    height: 140,
    backgroundColor: colors.glassGold,
    borderWidth: 1,
    borderColor: `${colors.gold}40`,
    borderRadius: radius.lg,
    justifyContent: 'center',
    alignItems: 'center',
  } as ViewStyle,
  qrCaption: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    lineHeight: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.md,
  } as TextStyle,
  qrRefRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.md,
  } as ViewStyle,
  qrRefLabel: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 10,
    lineHeight: 14,
    letterSpacing: 1.4,
    color: colors.goldMuted,
    textTransform: 'uppercase',
    marginRight: spacing.sm,
  } as TextStyle,
  qrRefValue: {
    fontFamily: Platform.select({
      ios: 'Menlo',
      android: 'monospace',
      default: 'monospace',
    }),
    fontSize: 11,
    lineHeight: 15,
    letterSpacing: 0.6,
    color: colors.goldMuted,
    flexShrink: 1,
  } as TextStyle,
  qrExpandWrap: {
    marginTop: spacing.md,
  } as ViewStyle,

  /* Liseret perfore central */
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing.md,
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

  /* Gamme + prix */
  tierRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
    lineHeight: 22,
    color: colors.text,
  } as TextStyle,
  tierSub: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    lineHeight: 16,
    color: colors.textSecondary,
    marginTop: 2,
  } as TextStyle,
  tierPrice: {
    fontFamily: 'PlayfairDisplay_600SemiBold',
    fontSize: 22,
    lineHeight: 28,
    color: colors.goldBright,
    letterSpacing: -0.2,
  } as TextStyle,

  /* Ligne date achat / expiration */
  datesRow: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: colors.divider,
    paddingTop: spacing.md,
    marginTop: spacing.md,
    gap: spacing.lg,
  } as ViewStyle,
  dateCell: {
    flex: 1,
  } as ViewStyle,
  dateLabel: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 10,
    lineHeight: 14,
    letterSpacing: 1.3,
    color: colors.goldMuted,
    textTransform: 'uppercase',
    marginBottom: 2,
  } as TextStyle,
  dateValue: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 13,
    lineHeight: 18,
    color: colors.text,
  } as TextStyle,

  /* Section titre */
  sectionTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 11,
    lineHeight: 15,
    letterSpacing: 1.4,
    color: colors.goldMuted,
    textTransform: 'uppercase',
    marginBottom: spacing.md,
  } as TextStyle,

  /* Carte details (grille 2x2) */
  infoCard: {
    backgroundColor: colors.elevated,
    borderWidth: 1,
    borderColor: `${colors.gold}1F`,
    borderRadius: radius.xl,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    ...shadows.card,
  } as ViewStyle,
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    rowGap: spacing.lg,
  } as ViewStyle,
  infoCell: {
    width: '50%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingRight: spacing.md,
  } as ViewStyle,
  infoIconTile: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.glass,
    borderWidth: 1,
    borderColor: colors.border,
  } as ViewStyle,
  infoCellTexts: {
    flex: 1,
  } as ViewStyle,
  infoLabel: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    lineHeight: 15,
    color: colors.textMuted,
  } as TextStyle,
  infoValue: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 13,
    lineHeight: 18,
    color: colors.text,
    marginTop: 1,
  } as TextStyle,

  /* Securite */
  securityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(216,180,90,0.08)',
    borderWidth: 1,
    borderColor: `${colors.gold}26`,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginBottom: spacing.lg,
    gap: spacing.sm,
  } as ViewStyle,
  securityText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    lineHeight: 16,
    color: colors.textSecondary,
    flex: 1,
  } as TextStyle,

  /* Etat introuvable */
  notFound: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  } as ViewStyle,
  notFoundIconWrap: {
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
  notFoundTitle: {
    fontFamily: 'PlayfairDisplay_600SemiBold',
    fontSize: 20,
    lineHeight: 26,
    color: colors.text,
    marginBottom: spacing.lg,
  } as TextStyle,
  notFoundButtonWrap: {
    width: 200,
  } as ViewStyle,
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
    if (!ticket) return;
    impact('light');
    router.push({
      pathname: ROUTES.QR_FULLSCREEN,
      params: { ticketId: ticket.id },
    } as never);
  }, [impact, router, ticket]);

  // -- Si billet introuvable --
  if (!ticket) {
    return (
      <View style={[styles.root, styles.notFound, { paddingTop: insets.top }]}>
        <View style={styles.notFoundIconWrap}>
          <Ticket size={30} color={colors.gold} strokeWidth={1.5} />
        </View>
        <Text style={styles.notFoundTitle}>Billet introuvable</Text>
        <View style={styles.notFoundButtonWrap}>
          <Button variant="outline" size="md" onPress={handleBack}>
            Retour
          </Button>
        </View>
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
      ? colors.success
      : displayStatus === 'pending'
        ? colors.warning
        : displayStatus === 'expired'
          ? colors.danger
          : colors.textMuted;

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
      {/* Bandeau héros dégradé avec filet or */}
      <LinearGradient
        colors={[...gradients.heroGold] as unknown as readonly [string, string, ...string[]]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={[styles.hero, { paddingTop: insets.top + spacing.md }]}
      >
        <View style={styles.heroRow}>
          <Pressable onPress={handleBack} style={styles.heroBackButton} hitSlop={12}>
            <ChevronLeft size={22} color={colors.goldBright} strokeWidth={1.75} />
          </Pressable>
          <View style={styles.heroTexts}>
            <Text style={styles.heroOverline}>BILLET {'\u00B7'} {tierLabel}</Text>
            <Text style={styles.heroTitle}>Mon billet</Text>
          </View>
          <View style={styles.heroSpacer} />
        </View>
      </LinearGradient>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          // Compense la TabBar flottante (60px + inset) pour que le
          // contenu ne soit jamais masque en bas d'ecran.
          paddingBottom: insets.bottom + 60 + spacing.xl,
        }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          {/* =============================================
              CARTE PRINCIPALE : billet physique premium
              ============================================= */}
          <View style={styles.mainCard}>
            {/* Barre statut */}
            <View style={[styles.mainCardTopBar, { backgroundColor: statusBarColor }]} />

            {/* Coins perforés simulés sur les bords dorés */}
            <View style={[styles.perforation, styles.perforationLeftTop]} pointerEvents="none" />
            <View style={[styles.perforation, styles.perforationLeftBottom]} pointerEvents="none" />
            <View style={[styles.perforation, styles.perforationRightTop]} pointerEvents="none" />
            <View style={[styles.perforation, styles.perforationRightBottom]} pointerEvents="none" />

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
                    colors={['rgba(10,9,8,0.10)', 'rgba(10,9,8,0.78)']}
                    style={styles.coverOverlay}
                    pointerEvents="none"
                  />
                </>
              ) : (
                <LinearGradient
                  colors={[...gradients.heroGold] as unknown as readonly [string, string, ...string[]]}
                  style={styles.coverPlaceholder}
                >
                  <Ticket size={26} color={colors.goldMuted} strokeWidth={1.5} />
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
                    <MapPin size={12} color={colors.goldMuted} strokeWidth={1.75} />
                    <Text style={styles.coverMetaText} numberOfLines={1}>
                      {coverMeta}
                    </Text>
                  </View>
                )}
              </View>

              {/* Badge statut flottant */}
              <View style={[styles.statusPill, { borderColor: `${statusConfig.color}45` }]}>
                <View style={[styles.statusDot, { backgroundColor: statusConfig.color }]} />
                <Text style={[styles.statusPillText, { color: statusConfig.color }]}>
                  {statusConfig.label}
                </Text>
              </View>
            </View>

            {/* Corps du billet */}
            <View style={styles.body}>
              {/* QR code — médaillon doré */}
              <View style={styles.qrWrap}>
                {hasQr ? (
                  <View style={styles.qrMedallion}>
                    <QRCode
                      value={ticket.qr_code ?? ''}
                      size={140}
                      color={colors.onyx}
                      backgroundColor={colors.text}
                    />
                  </View>
                ) : (
                  <View style={styles.qrPlaceholder}>
                    <QrCode
                      size={84}
                      color={displayStatus === 'valid' ? colors.goldMuted : colors.textFaint}
                      strokeWidth={0.75}
                    />
                  </View>
                )}
                <Text style={styles.qrCaption}>{qrCaption}</Text>

                {/* Reference du billet */}
                <View style={styles.qrRefRow}>
                  <Text style={styles.qrRefLabel}>Ref</Text>
                  <Text style={styles.qrRefValue} numberOfLines={1}>
                    {ticket.id}
                  </Text>
                </View>

                {isValid && (
                  <View style={styles.qrExpandWrap}>
                    <Button
                      variant="ghost"
                      size="sm"
                      onPress={handleExpandQR}
                      icon={<Maximize2 size={15} strokeWidth={1.75} />}
                      iconPosition="left"
                    >
                      Agrandir le QR
                    </Button>
                  </View>
                )}
              </View>

              {/* Liseret perfore central */}
              <View style={styles.dividerRow}>
                <View style={styles.dashedLine} />
                <View style={styles.dividerDiamond} />
                <View style={styles.dashedLine} />
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
                <View style={styles.infoIconTile}>
                  <Smartphone size={17} color={colors.gold} strokeWidth={1.75} />
                </View>
                <View style={styles.infoCellTexts}>
                  <Text style={styles.infoLabel}>Operateur</Text>
                  <Text style={styles.infoValue} numberOfLines={1}>{operatorName}</Text>
                </View>
              </View>

              {/* Quantite */}
              <View style={styles.infoCell}>
                <View style={styles.infoIconTile}>
                  <Ticket size={17} color={colors.gold} strokeWidth={1.75} />
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
                <View style={styles.infoIconTile}>
                  <CalendarDays size={17} color={colors.gold} strokeWidth={1.75} />
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
                <View style={styles.infoIconTile}>
                  <Clock size={17} color={colors.gold} strokeWidth={1.75} />
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
            <ShieldCheck size={18} color={colors.gold} strokeWidth={1.75} />
            <Text style={styles.securityText}>
              Ce QR code est securise par HMAC-SHA256. Toute tentative de falsification sera detectee a l&apos;entree.
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}