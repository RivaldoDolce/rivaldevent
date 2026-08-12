/**
 * Modal QR code plein ecran.
 *
 * Route : /(modal)/qr-fullscreen
 * Param : ticketId (identifiant du billet)
 *
 * Design "Noir & Or" :
 * - Fond noir integral (colors.background), halo dore subtil
 * - Logo sm en filigrane en haut
 * - Cadre QR premium : surface elevee, filet dore, coins dores accentues
 * - Resume du billet en dessous (evenement, tier, prix)
 * - Bouton Fermer : pastille verre 48px centree en bas
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
import { LinearGradient } from 'expo-linear-gradient';
import { X, ShieldCheck } from 'lucide-react-native';

import { colors, spacing, radius, shadows } from '@/lib/constants';
import { Logo } from '@/components/icons/Logo';
import { useHaptics } from '@/hooks/useHaptics';
import { formatPrice } from '@/services/event.service';
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

  // -- Donnees du billet : store d'abord, repli mock --
  const purchasedTicket = useTicketsStore((state) =>
    state.tickets.find((t) => t.id === ticketId),
  );

  const ticket = useMemo<TicketView | null>(() => {
    if (purchasedTicket) return purchasedTicket;
    if (!ticketId) return null;
    return getMockTicketById(ticketId);
  }, [purchasedTicket, ticketId]);

  // -- Handler --
  const handleClose = useCallback(() => {
    impact('light');
    if (router.canGoBack()) router.back();
  }, [impact, router]);

  // -- Si billet non trouve ou pas de QR --
  if (!ticket || !ticket.qr_code) {
    return (
      <View style={styles.root}>
        <LinearGradient
          pointerEvents="none"
          colors={['rgba(216,180,90,0.10)', 'rgba(216,180,90,0.02)', 'transparent']}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={styles.halo}
        />
        <Pressable
          style={[styles.closeButton, { bottom: insets.bottom + spacing.lg }]}
          onPress={handleClose}
          accessibilityRole="button"
          accessibilityLabel="Fermer"
          hitSlop={8}
        >
          <X size={22} color={colors.goldBright} strokeWidth={1.75} />
        </Pressable>
        <View style={styles.errorContainer}>
          <View style={styles.errorMedallion}>
            <ShieldCheck size={30} color={colors.goldMuted} strokeWidth={1.5} />
          </View>
          <Text style={styles.errorText}>QR code non disponible</Text>
        </View>
      </View>
    );
  }

  const eventTitle = ticket.event?.title ?? 'Evenement';
  const tierName = ticket.tier?.name ?? 'Billet';

  return (
    <View style={styles.root}>
      {/* Halo dore subtil */}
      <LinearGradient
        pointerEvents="none"
        colors={['rgba(216,180,90,0.10)', 'rgba(216,180,90,0.02)', 'transparent']}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={styles.halo}
      />

      {/* Logo en filigrane */}
      <View style={[styles.watermarkLogo, { top: insets.top + spacing.md }]} pointerEvents="none">
        <View style={styles.watermarkOpacity}>
          <Logo size="sm" />
        </View>
      </View>

      {/* Bouton Fermer — pastille verre centree en bas */}
      <Pressable
        style={[styles.closeButton, { bottom: insets.bottom + spacing.lg }]}
        onPress={handleClose}
        accessibilityRole="button"
        accessibilityLabel="Fermer"
        hitSlop={8}
      >
        <X size={22} color={colors.goldBright} strokeWidth={1.75} />
      </Pressable>

      {/* Contenu centre */}
      <View style={styles.content}>
        {/* Instruction */}
        <Text style={styles.instruction}>
          Presentez ce code a l'entree
        </Text>

        {/* Cadre QR premium avec coins dores */}
        <View style={styles.qrContainer}>
          <View style={styles.cornerTopLeft} />
          <View style={styles.cornerTopRight} />
          <View style={styles.cornerBottomLeft} />
          <View style={styles.cornerBottomRight} />
          <QRCode
            value={ticket.qr_code}
            size={QR_SIZE_FULL}
            color={colors.onyx}
            backgroundColor={colors.text}
          />
        </View>

        {/* Securite */}
        <View style={styles.shieldRow}>
          <ShieldCheck size={14} color={colors.goldMuted} strokeWidth={1.75} />
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
    backgroundColor: colors.background,
  },

  halo: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 240,
  },

  /* Logo en filigrane */
  watermarkLogo: {
    position: 'absolute',
    alignSelf: 'center',
    zIndex: 5,
  },
  watermarkOpacity: {
    opacity: 0.45,
  },

  /* Bouton fermer — pastille verre */
  closeButton: {
    position: 'absolute',
    alignSelf: 'center',
    zIndex: 10,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.glass,
    borderWidth: 1,
    borderColor: colors.border,
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
    fontFamily: 'Inter_500Medium',
    fontSize: 15,
    lineHeight: 21,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
    textAlign: 'center',
    letterSpacing: 0.3,
  },

  /* Cadre QR premium */
  qrContainer: {
    position: 'relative',
    padding: 18,
    backgroundColor: colors.elevated,
    borderWidth: 1,
    borderColor: `${colors.gold}40`,
    borderRadius: radius.lg,
    ...shadows.card,
  },

  /* Coins dores accentues (cotes exterieurs uniquement) */
  cornerTopLeft: {
    position: 'absolute',
    top: -1,
    left: -1,
    width: 24,
    height: 24,
    borderTopWidth: 2,
    borderLeftWidth: 2,
    borderTopColor: colors.goldBright,
    borderLeftColor: colors.goldBright,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: 6,
    borderBottomLeftRadius: 6,
  },
  cornerTopRight: {
    position: 'absolute',
    top: -1,
    right: -1,
    width: 24,
    height: 24,
    borderTopWidth: 2,
    borderRightWidth: 2,
    borderTopColor: colors.goldBright,
    borderRightColor: colors.goldBright,
    borderTopRightRadius: radius.lg,
    borderTopLeftRadius: 6,
    borderBottomRightRadius: 6,
  },
  cornerBottomLeft: {
    position: 'absolute',
    bottom: -1,
    left: -1,
    width: 24,
    height: 24,
    borderBottomWidth: 2,
    borderLeftWidth: 2,
    borderBottomColor: colors.goldBright,
    borderLeftColor: colors.goldBright,
    borderBottomLeftRadius: radius.lg,
    borderTopLeftRadius: 6,
    borderBottomRightRadius: 6,
  },
  cornerBottomRight: {
    position: 'absolute',
    bottom: -1,
    right: -1,
    width: 24,
    height: 24,
    borderBottomWidth: 2,
    borderRightWidth: 2,
    borderBottomColor: colors.goldBright,
    borderRightColor: colors.goldBright,
    borderBottomRightRadius: radius.lg,
    borderTopRightRadius: 6,
    borderBottomLeftRadius: 6,
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
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    lineHeight: 17,
    color: colors.textMuted,
    letterSpacing: 0.2,
  },

  /* Resume */
  summaryCard: {
    backgroundColor: colors.glass,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.md,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    width: '100%',
  },
  summaryEvent: {
    fontFamily: 'PlayfairDisplay_600SemiBold',
    fontSize: 16,
    lineHeight: 22,
    color: colors.text,
    marginBottom: spacing.xs,
    letterSpacing: -0.2,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  summaryTier: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    lineHeight: 17,
    color: colors.textSecondary,
  },
  summarySeparator: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    lineHeight: 17,
    color: colors.textFaint,
  },
  summaryQuantity: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    lineHeight: 17,
    color: colors.textSecondary,
  },
  summaryPrice: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 18,
    lineHeight: 24,
    color: colors.goldBright,
  },

  /* Erreur */
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
  },
  errorMedallion: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.glass,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 16,
    lineHeight: 24,
    color: colors.textSecondary,
  },
});