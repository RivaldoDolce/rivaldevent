/**
 * Modal QR code plein ecran.
 *
 * Route : /(modal)/qr-fullscreen
 * Param : ticketId (identifiant du billet)
 *
 * Design "Minimalisme Africain Camerounais" :
 * - Fond sombre (onyx) pour contraste maximal
 * - QR code centre, grande taille
 * - Resume du billet en dessous (evenement, tier)
 * - Bouton fermer en haut a droite
 * - Indication "Presentez ce code a l'entree"
 *
 * Conventions :
 * - Design tokens depuis lib/constants.ts
 * - react-native-qrcode-svg pour le QR code
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
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import QRCode from 'react-native-qrcode-svg';
import { X, Shield } from 'lucide-react-native';

import { colors, spacing, radii } from '@/lib/constants';
import { useHaptics } from '@/hooks/useHaptics';
import { formatPrice } from '@/services/event.service';
import { getMockTicketById } from '@/data/mock';

// ============================================================
// Constantes
// ============================================================

const QR_SIZE_FULL = 280;

// ============================================================
// Composant
// ============================================================

export default function QRFullscreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { ticketId } = useLocalSearchParams<{ ticketId: string }>();
  const { impact } = useHaptics();

  // -- Donnees du billet --
  const ticket = useMemo(() => {
    if (!ticketId) return null;
    return getMockTicketById(ticketId);
  }, [ticketId]);

  // -- Handler --
  const handleClose = useCallback(() => {
    impact('light');
    if (router.canGoBack()) router.back();
  }, [impact, router]);

  // -- Si billet non trouve ou pas de QR --
  if (!ticket || !ticket.qr_code) {
    return (
      <View style={styles.root}>
        <Pressable
          style={[styles.closeButton, { top: insets.top + spacing.sm }]}
          onPress={handleClose}
          accessibilityRole="button"
          accessibilityLabel="Fermer"
          hitSlop={8}
        >
          <X size={24} color={colors.white} strokeWidth={2} />
        </Pressable>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>QR code non disponible</Text>
        </View>
      </View>
    );
  }

  const eventTitle = ticket.event?.title ?? 'Evenement';
  const tierName = ticket.tier?.name ?? 'Billet';

  return (
    <View style={styles.root}>
      {/* Bouton fermer */}
      <Pressable
        style={[styles.closeButton, { top: insets.top + spacing.sm }]}
        onPress={handleClose}
        accessibilityRole="button"
        accessibilityLabel="Fermer"
        hitSlop={8}
      >
        <X size={24} color={colors.white} strokeWidth={2} />
      </Pressable>

      {/* Contenu centre */}
      <View style={styles.content}>
        {/* Instruction */}
        <Text style={styles.instruction}>
          Presentez ce code a l'entree
        </Text>

        {/* QR Code */}
        <View style={styles.qrContainer}>
          <QRCode
            value={ticket.qr_code}
            size={QR_SIZE_FULL}
            color={colors.onyx}
            backgroundColor={colors.white}
          />
        </View>

        {/* Securite */}
        <View style={styles.shieldRow}>
          <Shield size={14} color={`${colors.sand}88`} strokeWidth={1.5} />
          <Text style={styles.shieldText}>Code securise HMAC-SHA256</Text>
        </View>

        {/* Resume du billet */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryEvent} numberOfLines={1}>
            {eventTitle}
          </Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryTier}>{tierName}</Text>
            <Text style={styles.summarySeparator}>|</Text>
            <Text style={styles.summaryQuantity}>
              {ticket.quantity} billet{ticket.quantity > 1 ? 's' : ''}
            </Text>
          </View>
          <Text style={styles.summaryPrice}>
            {formatPrice(ticket.total_price)}
          </Text>
        </View>
      </View>
    </View>
  );
}

// ============================================================
// Styles
// ============================================================

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.onyx,
  },

  /* Bouton fermer */
  closeButton: {
    position: 'absolute',
    right: spacing.md,
    zIndex: 10,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* Contenu */
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },

  /* Instruction */
  instruction: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    lineHeight: 22,
    color: colors.sand,
    marginBottom: spacing.xl,
    textAlign: 'center',
  },

  /* QR Code */
  qrContainer: {
    padding: spacing.lg,
    backgroundColor: colors.white,
    borderRadius: radii.lg,
  },

  /* Securite */
  shieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.md,
    marginBottom: spacing.xl,
  },
  shieldText: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    lineHeight: 16,
    color: `${colors.sand}88`,
  },

  /* Resume */
  summaryCard: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: radii.lg,
    padding: spacing.md,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    width: '100%',
  },
  summaryEvent: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    lineHeight: 20,
    color: colors.sand,
    marginBottom: spacing.xs,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  summaryTier: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    lineHeight: 16,
    color: `${colors.sand}AA`,
  },
  summarySeparator: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    lineHeight: 16,
    color: `${colors.sand}44`,
  },
  summaryQuantity: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    lineHeight: 16,
    color: `${colors.sand}AA`,
  },
  summaryPrice: {
    fontFamily: 'PlayfairDisplay-Bold',
    fontSize: 18,
    lineHeight: 24,
    color: colors.sand,
  },

  /* Erreur */
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    lineHeight: 22,
    color: colors.sand,
  },
});
