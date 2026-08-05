/**
 * Carte d'un billet pour la liste "Mes billets".
 *
 * Design "Minimalisme Africain Camerounais" :
 * - Image couverture de l'evenement a gauche
 * - Titre de l'evenement, nom du tier, date
 * - Badge de statut (valide, en attente, scanne, expire)
 * - Prix total en FCFA
 * - Quantite de billets
 * - Pressable pour naviguer vers le detail
 *
 * Statuts visuels :
 * - valid   : badge vert, QR disponible
 * - pending : badge mango/orange, paiement en cours
 * - scanned : badge stone/gris, deja utilise
 * - expired : badge danger/rouge, date depassee
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
} from 'react-native';
import { Image } from 'expo-image';
import {
  CheckCircle2,
  Clock,
  ScanLine,
  AlertTriangle,
  ChevronRight,
} from 'lucide-react-native';

import { colors, spacing, radii, shadows } from '@/lib/constants';
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
 * Configuration du badge de statut.
 */
function getStatusConfig(status: TicketVisualStatus): {
  label: string;
  color: string;
  bgColor: string;
} {
  switch (status) {
    case 'valid':
      return { label: 'Valide', color: colors.forest, bgColor: `${colors.forest}12` };
    case 'pending':
      return { label: 'En attente', color: colors.mango, bgColor: `${colors.mango}12` };
    case 'scanned':
      return { label: 'Scanne', color: colors.stone, bgColor: `${colors.stone}15` };
    case 'expired':
      return { label: 'Expire', color: colors.danger, bgColor: `${colors.danger}12` };
  }
}

/**
 * Icone du badge selon le statut.
 */
function StatusIcon({ status, color }: { status: TicketVisualStatus; color: string }) {
  const size = 12;
  const strokeWidth = 2;
  switch (status) {
    case 'valid':
      return <CheckCircle2 size={size} color={color} strokeWidth={strokeWidth} />;
    case 'pending':
      return <Clock size={size} color={color} strokeWidth={strokeWidth} />;
    case 'scanned':
      return <ScanLine size={size} color={color} strokeWidth={strokeWidth} />;
    case 'expired':
      return <AlertTriangle size={size} color={color} strokeWidth={strokeWidth} />;
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
            <ScanLine size={20} color={colors.stone} strokeWidth={1.5} />
          </View>
        )}
        {/* Badge statut sur l'image */}
        <View style={[styles.statusBadge, { backgroundColor: statusConfig.bgColor }]}>
          <StatusIcon status={visualStatus} color={statusConfig.color} />
          <Text style={[styles.statusBadgeText, { color: statusConfig.color }]}>
            {statusConfig.label}
          </Text>
        </View>
      </View>

      {/* Contenu */}
      <View style={styles.content}>
        {/* Titre evenement */}
        <Text style={styles.eventTitle} numberOfLines={2}>
          {eventTitle}
        </Text>

        {/* Tier + quantite */}
        <View style={styles.tierRow}>
          <Text style={styles.tierName}>
            {tierName} {ticket.quantity > 1 ? `x${ticket.quantity}` : ''}
          </Text>
          <Text style={styles.price}>
            {formatPrice(ticket.total_price)}
          </Text>
        </View>

        {/* Date + ville */}
        {eventDate ? (
          <Text style={styles.dateText} numberOfLines={1}>
            {formatDate(eventDate)} - {formatTime(eventDate)}
            {eventCity ? `, ${eventCity}` : ''}
          </Text>
        ) : null}

        {/* Indicateur fleche */}
        <View style={styles.chevronContainer}>
          <ChevronRight size={16} color={colors.stone} strokeWidth={2} />
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
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    overflow: 'hidden',
    ...shadows.card,
  } as ViewStyle,
  cardDimmed: {
    opacity: 0.6,
  },

  /* Image */
  imageContainer: {
    width: 100,
    position: 'relative',
  } as ViewStyle,
  image: {
    width: 100,
    height: '100%',
  },
  imagePlaceholder: {
    width: 100,
    height: '100%',
    backgroundColor: colors.ivory,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusBadge: {
    position: 'absolute',
    top: spacing.sm,
    left: spacing.xs,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radii.sm,
  },
  statusBadgeText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 9,
    lineHeight: 12,
    letterSpacing: 0.3,
  },

  /* Contenu */
  content: {
    flex: 1,
    padding: spacing.md,
    justifyContent: 'center',
  },
  eventTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    lineHeight: 20,
    color: colors.onyx,
    marginBottom: spacing.xs,
  },
  tierRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  tierName: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    lineHeight: 16,
    color: colors.stone,
  },
  price: {
    fontFamily: 'PlayfairDisplay-Bold',
    fontSize: 14,
    lineHeight: 20,
    color: colors.terracotta,
  },
  dateText: {
    fontFamily: 'Inter-Regular',
    fontSize: 11,
    lineHeight: 15,
    color: colors.stone,
  },
  chevronContainer: {
    position: 'absolute',
    right: spacing.sm,
    top: '50%' as never,
    marginTop: -8,
  },
});
