/**
 * Page detail d'un billet - Espace client.
 *
 * Design premium "Minimalisme Africain Camerounais" :
 * - Carte billet avec bordure stylee selon le statut
 * - QR code (placeholder react-native-qrcode-svg en dev build,
 *   image placeholder en Expo Go)
 * - Infos evenement : titre, date, lieu, tier, prix
 * - Infos paiement : operateur, montant, date achat
 * - Badge statut (valide/utilise/expire/en attente)
 * - Bouton "Afficher QR en plein ecran"
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
} from 'lucide-react-native';
import { Image } from 'expo-image';

import { colors, spacing, radii, shadows } from '@/lib/constants';
import { useHaptics } from '@/hooks/useHaptics';
import { formatPrice, formatDate } from '@/services/event.service';
import { getMockTicketById } from '@/data/mock';
import type { MockTicket } from '@/data/mock';

// ============================================================
// Helpers
// ============================================================

function getTicketDisplayStatus(ticket: MockTicket): 'valid' | 'used' | 'expired' | 'pending' {
  if (ticket.payment_status === 'pending') return 'pending';
  if (ticket.is_scanned) return 'used';
  if (ticket.expires_at && new Date(ticket.expires_at) < new Date()) return 'expired';
  return 'valid';
}

function getStatusConfig(status: string): { color: string; bg: string; label: string; icon: string } {
  switch (status) {
    case 'valid':
      return { color: colors.forest, bg: `${colors.forest}15`, label: 'Billet valide', icon: 'check' };
    case 'used':
      return { color: colors.stone, bg: `${colors.stone}15`, label: 'Billet utilise', icon: 'used' };
    case 'expired':
      return { color: colors.danger, bg: `${colors.danger}15`, label: 'Billet expire', icon: 'expired' };
    case 'pending':
      return { color: colors.mango, bg: `${colors.mango}15`, label: 'Paiement en attente', icon: 'pending' };
    default:
      return { color: colors.stone, bg: `${colors.stone}15`, label: status, icon: '' };
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
    fontFamily: 'PlayfairDisplay-SemiBold',
    fontSize: 20,
    lineHeight: 26,
    color: colors.onyx,
  },

  /* Contenu */
  content: { paddingHorizontal: spacing.lg },

  /* Carte principale */
  mainCard: {
    backgroundColor: colors.white,
    borderRadius: radii.xl,
    marginBottom: spacing.lg,
    overflow: 'hidden',
    ...shadows.eventCard,
  },
  mainCardTopBar: {
    height: 4,
  },

  /* Cover evenement */
  coverRow: {
    flexDirection: 'row',
    padding: spacing.lg,
    gap: spacing.md,
  },
  coverImage: {
    width: 80,
    height: 80,
    borderRadius: radii.md,
  },
  coverPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: radii.md,
    backgroundColor: colors.ivory,
    justifyContent: 'center',
    alignItems: 'center',
  },
  eventInfo: { flex: 1, justifyContent: 'center' },
  eventTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    lineHeight: 22,
    color: colors.onyx,
    marginBottom: spacing.xs,
  },
  eventMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  eventMetaText: {
    fontFamily: 'Inter-Regular',
    fontSize: 13,
    lineHeight: 18,
    color: colors.stone,
  },

  /* Section QR code */
  qrSection: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    marginHorizontal: spacing.lg,
  },
  qrContainer: {
    width: 200,
    height: 200,
    backgroundColor: colors.ivory,
    borderRadius: radii.lg,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
    ...shadows.search,
  },
  qrPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  qrPlaceholderText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    lineHeight: 20,
    color: colors.stone,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  qrExpandButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: `${colors.forest}10`,
    borderRadius: radii.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  qrExpandText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 13,
    lineHeight: 18,
    color: colors.forest,
  },

  /* Badge statut */
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    borderRadius: radii.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    alignSelf: 'center',
    marginTop: spacing.md,
    marginBottom: spacing.lg,
  },
  statusBadgeText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    lineHeight: 20,
  },

  /* Section titre */
  sectionTitle: {
    fontFamily: 'PlayfairDisplay-SemiBold',
    fontSize: 16,
    lineHeight: 22,
    color: colors.onyx,
    marginBottom: spacing.md,
  },

  /* Carte info */
  infoCard: {
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    ...shadows.card,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  infoLabel: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    lineHeight: 20,
    color: colors.stone,
  },
  infoValue: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    lineHeight: 20,
    color: colors.onyx,
    textAlign: 'right',
    flex: 1,
    marginLeft: spacing.md,
  },
  infoSeparator: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.xs,
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

  // -- Donnees --
  const ticket = useMemo(() => {
    return getMockTicketById(ticketId ?? '');
  }, [ticketId]);

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
      <View style={[styles.root, { justifyContent: 'center', alignItems: 'center', paddingTop: insets.top }]}>
        <Text style={styles.headerTitle}>Billet introuvable</Text>
        <Pressable onPress={handleBack} style={{ marginTop: spacing.lg }}>
          <Text style={{ color: colors.terracotta, fontFamily: 'Inter-SemiBold' }}>Retour</Text>
        </Pressable>
      </View>
    );
  }

  // -- Donnees derivees --
  const displayStatus = getTicketDisplayStatus(ticket);
  const statusConfig = getStatusConfig(displayStatus);
  const operatorName = getOperatorName(ticket.payment_method);
  const isValid = displayStatus === 'valid';

  // Couleur de la barre laterale selon le statut
  const statusBarColor = isValid ? colors.forest : displayStatus === 'pending' ? colors.mango : colors.stone;

  // ============================================================
  // Rendu
  // ============================================================

  return (
    <View style={styles.root}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingTop: insets.top,
          paddingBottom: insets.bottom + spacing.xl,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={handleBack} style={styles.headerBackButton} hitSlop={12}>
            <ChevronLeft size={22} color={colors.onyx} strokeWidth={2} />
          </Pressable>
          <Text style={styles.headerTitle}>Mon billet</Text>
        </View>

        <View style={styles.content}>
          {/* =============================================
              CARTE PRINCIPALE : evenement + QR
              ============================================= */}
          <View style={styles.mainCard}>
            {/* Barre statut */}
            <View style={[styles.mainCardTopBar, { backgroundColor: statusBarColor }]} />

            {/* Cover + infos evenement */}
            <View style={styles.coverRow}>
              {ticket.event?.cover_image ? (
                <Image
                  source={{ uri: ticket.event.cover_image }}
                  style={styles.coverImage}
                  contentFit="cover"
                  transition={300}
                  cachePolicy="memory-disk"
                />
              ) : (
                <View style={styles.coverPlaceholder}>
                  <Ticket size={28} color={colors.stone} strokeWidth={1.5} />
                </View>
              )}

              <View style={styles.eventInfo}>
                <Text style={styles.eventTitle} numberOfLines={2}>
                  {ticket.event?.title ?? 'Evenement'}
                </Text>
                {ticket.event?.start_date && (
                  <View style={styles.eventMeta}>
                    <CalendarDays size={13} color={colors.stone} strokeWidth={1.5} />
                    <Text style={styles.eventMetaText}>
                      {formatDate(ticket.event.start_date)}
                    </Text>
                  </View>
                )}
                {ticket.event?.city && (
                  <View style={styles.eventMeta}>
                    <MapPin size={13} color={colors.stone} strokeWidth={1.5} />
                    <Text style={styles.eventMetaText}>{ticket.event.city}</Text>
                  </View>
                )}
              </View>
            </View>

            {/* Section QR code */}
            <View style={styles.qrSection}>
              <View style={styles.qrContainer}>
                {ticket.qr_code && isValid ? (
                  <View style={styles.qrPlaceholder}>
                    <QrCode size={120} color={colors.onyx} strokeWidth={0.5} />
                    <Text style={styles.qrPlaceholderText}>QR Code</Text>
                  </View>
                ) : (
                  <View style={styles.qrPlaceholder}>
                    <QrCode size={80} color={colors.border} strokeWidth={0.5} />
                    <Text style={styles.qrPlaceholderText}>
                      {displayStatus === 'pending'
                        ? 'QR disponible apres\nconfirmation du paiement'
                        : displayStatus === 'used'
                          ? 'Billet deja utilise'
                          : displayStatus === 'expired'
                            ? 'Billet expire'
                            : 'QR Code'}
                    </Text>
                  </View>
                )}
              </View>

              {/* Bouton agrandir QR */}
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

            {/* Badge statut */}
            <View style={[styles.statusBadge, { backgroundColor: statusConfig.bg }]}>
              <Text style={[styles.statusBadgeText, { color: statusConfig.color }]}>
                {statusConfig.label}
              </Text>
            </View>
          </View>

          {/* =============================================
              INFOS DU BILLET
              ============================================= */}
          <Text style={styles.sectionTitle}>Details du billet</Text>

          <View style={styles.infoCard}>
            {/* Tier */}
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Tier</Text>
              <Text style={styles.infoValue}>{ticket.tier?.name ?? 'Standard'}</Text>
            </View>
            <View style={styles.infoSeparator} />

            {/* Quantite */}
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Quantite</Text>
              <Text style={styles.infoValue}>{ticket.quantity} billet{ticket.quantity > 1 ? 's' : ''}</Text>
            </View>
            <View style={styles.infoSeparator} />

            {/* Prix total */}
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Montant total</Text>
              <Text style={[styles.infoValue, { color: colors.gold, fontFamily: 'PlayfairDisplay-Bold', fontSize: 16 }]}>
                {formatPrice(ticket.total_price)}
              </Text>
            </View>
            <View style={styles.infoSeparator} />

            {/* Operateur */}
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Operateur</Text>
              <Text style={styles.infoValue}>{operatorName}</Text>
            </View>
            <View style={styles.infoSeparator} />

            {/* Date achat */}
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Date d&apos;achat</Text>
              <Text style={styles.infoValue}>
                {ticket.created_at ? formatDate(ticket.created_at) : 'Non precise'}
              </Text>
            </View>
            <View style={styles.infoSeparator} />

            {/* Expiration */}
            {ticket.expires_at && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Expiration</Text>
                <Text style={styles.infoValue}>{formatDate(ticket.expires_at)}</Text>
              </View>
            )}
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
