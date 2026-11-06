/**
 * Carte d'un billet pour la liste "Mes billets".
 *
 * Design « Noir & Or » premium :
 * - Surface élevée avec filet doré subtil (`${colors.gold}28`)
 * - Image événement à gauche, contenu à droite
 * - Titre Playfair, tier + date avec icônes or tamisées
 * - Badge statut pill (point indicateur + texte)
 * - Indication QR miniature, prix or champagne, chevron
 *
 * Statuts visuels :
 * - valid   : success, QR disponible
 * - pending : warning, paiement en cours
 * - scanned : textSecondary, déjà utilisé
 * - expired : danger, date dépassée
 *
 * Props :
 * - ticket : donnees du billet (MockTicket)
 * - onPress : callback de navigation
 *
 * Conventions :
 * - Design tokens depuis lib/constants.ts
 * - expo-image pour les images
 * - lucide-react-native pour les icones
 * - Pas de type any, pas d'emojis
 * - Imports @/
 * - Commentaires en francais
 */

import { useCallback, useMemo } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  type ViewStyle,
  type TextStyle,
} from 'react-native';
import { Image } from 'expo-image';
import { Calendar, QrCode, Ticket, ChevronRight } from 'lucide-react-native';

import { colors, spacing, radius, shadows } from '@/lib/constants';
import { formatPrice, formatDate, formatTime } from '@/services/event.service';
import type { MockTicket } from '@/data/mock';

// ============================================================
// Types
// ============================================================

interface TicketCardProps {
  /** Donnees du billet */
  readonly ticket: MockTicket;
  /** Callback quand on appuie sur la carte */
  readonly onPress: (ticketId: string) => void;
}

/** Statut visuel derive du billet */
type TicketVisualStatus = 'valid' | 'pending' | 'scanned' | 'expired';

// ============================================================
// Helpers
// ============================================================

/**
 * Determine le statut visuel d'un billet.
 * Ordre de priorite : pending > scanned > expired > valid
 */
function getVisualStatus(ticket: MockTicket): TicketVisualStatus {
  if (ticket.payment_status !== 'completed') return 'pending';
  if (ticket.is_scanned) return 'scanned';
  if (ticket.expires_at && new Date(ticket.expires_at) < new Date()) return 'expired';
  return 'valid';
}

/**
 * Configuration du badge de statut — pastille pill avec point doré.
 * Couleurs : Valide success, En attente warning, Scanné textSecondary, Expiré danger.
 */
function getStatusConfig(status: TicketVisualStatus): {
  label: string;
  color: string;
  bgColor: string;
} {
  switch (status) {
    case 'valid':
      return {
        label: 'Valide',
        color: colors.success,
        bgColor: 'rgba(91,196,139,0.12)',
      };
    case 'pending':
      return {
        label: 'En attente',
        color: colors.warning,
        bgColor: 'rgba(232,182,76,0.12)',
      };
    case 'scanned':
      return {
        label: 'Scanne',
        color: colors.textSecondary,
        bgColor: 'rgba(181,172,156,0.12)',
      };
    case 'expired':
      return {
        label: 'Expire',
        color: colors.danger,
        bgColor: 'rgba(255,107,94,0.12)',
      };
  }
}

// ============================================================
// Composant
// ============================================================

export default function TicketCard({ ticket, onPress }: TicketCardProps) {
  const visualStatus = useMemo(() => getVisualStatus(ticket), [ticket]);
  const statusConfig = useMemo(() => getStatusConfig(visualStatus), [visualStatus]);

  const handlePress = useCallback(() => {
    onPress(ticket.id);
  }, [onPress, ticket.id]);

  // Resume de l'evenement (peut etre null)
  const eventTitle = ticket.event?.title ?? 'Evenement';
  const eventImage = ticket.event?.cover_image;
  const eventDate = ticket.event?.start_date;
  const eventCity = ticket.event?.city;

  // Resume du tier
  const tierName = ticket.tier?.name ?? 'Billet';

  // Opacite reduite pour les billets scannees ou expires
  const isDimmed = visualStatus === 'scanned' || visualStatus === 'expired';

  // Ligne date : "12 Aout 2026 - 20:00, Yaounde"
  const dateLine = eventDate
    ? `${formatDate(eventDate)} - ${formatTime(eventDate)}${eventCity ? `, ${eventCity}` : ''}`
    : null;

  return (
    <Pressable
      onPress={handlePress}
      style={[styles.card, isDimmed && styles.cardDimmed]}
      accessibilityRole="button"
      accessibilityLabel={`Billet ${eventTitle} - ${tierName}`}
    >
      {/* Image couverture */}
      <View style={styles.imageContainer}>
        {eventImage ? (
          <Image
            source={{ uri: eventImage }}
            style={styles.image}
            contentFit="cover"
            transition={200}
            cachePolicy="memory-disk"
          />
        ) : (
          <View style={styles.imagePlaceholder}>
            <Ticket size={24} color={colors.goldMuted} strokeWidth={1.5} />
          </View>
        )}
      </View>

      {/* Contenu */}
      <View style={styles.content}>
        {/* Titre evenement + badge statut */}
        <View style={styles.titleRow}>
          <Text style={styles.eventTitle} numberOfLines={2}>
            {eventTitle}
          </Text>
          <View style={[styles.statusBadge, { backgroundColor: statusConfig.bgColor }]}>
            <View style={[styles.statusDot, { backgroundColor: statusConfig.color }]} />
            <Text style={[styles.statusBadgeText, { color: statusConfig.color }]}>
              {statusConfig.label}
            </Text>
          </View>
        </View>

        {/* Date avec icone or tamisee */}
        {dateLine ? (
          <View style={styles.dateRow}>
            <Calendar size={13} color={colors.goldMuted} strokeWidth={1.75} />
            <Text style={styles.dateText} numberOfLines={1}>
              {dateLine}
            </Text>
          </View>
        ) : null}

        {/* Pied : QR miniature + tier · prix · chevron */}
        <View style={styles.footerRow}>
          <View style={styles.qrIndication}>
            <QrCode size={14} color={colors.goldMuted} strokeWidth={1.75} />
          </View>
          <Text style={styles.tierName} numberOfLines={1}>
            {tierName}
            {ticket.quantity > 1 ? ` x${ticket.quantity}` : ''}
          </Text>
          <Text style={styles.price}>{formatPrice(ticket.total_price)}</Text>
          <ChevronRight size={16} color={colors.goldMuted} strokeWidth={1.75} />
        </View>
      </View>
    </Pressable>
  );
}

// ============================================================
// Styles
// ============================================================

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: colors.elevated,
    borderWidth: 1,
    borderColor: `${colors.gold}28`,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.md,
    ...shadows.card,
  } as ViewStyle,
  cardDimmed: {
    opacity: 0.55,
  },

  /* Image */
  imageContainer: {
    width: 84,
    height: 84,
    borderRadius: radius.md,
    overflow: 'hidden',
  } as ViewStyle,
  image: {
    width: 84,
    height: 84,
  },
  imagePlaceholder: {
    width: 84,
    height: 84,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  } as ViewStyle,

  /* Contenu */
  content: {
    flex: 1,
    justifyContent: 'center',
  } as ViewStyle,

  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    marginBottom: 6,
  } as ViewStyle,
  eventTitle: {
    flex: 1,
    fontFamily: 'PlayfairDisplay_600SemiBold',
    fontSize: 16,
    lineHeight: 22,
    color: colors.text,
    letterSpacing: -0.2,
  } as TextStyle,

  /* Badge statut pill */
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: `${colors.gold}26`,
    alignSelf: 'flex-start',
    flexShrink: 0,
  } as ViewStyle,
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  } as ViewStyle,
  statusBadgeText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 11,
    lineHeight: 14,
    letterSpacing: 0.2,
  } as TextStyle,

  /* Date */
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  } as ViewStyle,
  dateText: {
    flex: 1,
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    lineHeight: 16,
    color: colors.textSecondary,
  } as TextStyle,

  /* Pied */
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  } as ViewStyle,
  qrIndication: {
    width: 24,
    height: 24,
    borderRadius: radius.sm,
    backgroundColor: colors.glassGold,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.xs,
  } as ViewStyle,
  tierName: {
    flex: 1,
    fontFamily: 'Inter_500Medium',
    fontSize: 12,
    lineHeight: 16,
    color: colors.textSecondary,
  } as TextStyle,
  price: {
    fontFamily: 'Inter_700Bold',
    fontSize: 15,
    lineHeight: 20,
    color: colors.goldBright,
    letterSpacing: 0.2,
  } as TextStyle,
});