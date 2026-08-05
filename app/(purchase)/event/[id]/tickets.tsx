/**
 * Page selection de billets - Tunnel d'achat.
 *
 * Route : /(purchase)/event/[id]/tickets
 * Param : id (identifiant de l'evenement)
 *
 * Design "Minimalisme Africain Camerounais" :
 * - Image hero de l'evenement avec gradient overlay
 * - Bouton retour flottant
 * - Titre + date de l'evenement
 * - Liste des tiers de billets (TicketTierCard)
 *   avec selecteur de quantite par tier
 * - Section resume : recapitulatif des billets selectionnes
 * - Total en FCFA bien visible
 * - CTA "Payer" fixe en bas qui navigue vers le paiement
 * - Etat vide si aucun billet selectionne
 *
 * Conventions :
 * - Design tokens depuis lib/constants.ts
 * - expo-image pour les images
 * - lucide-react-native pour les icones
 * - Pas de type any, pas d'emojis
 * - Imports @/
 * - Commentaires en francais
 */

import { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  type ViewStyle,
  type TextStyle,
  type ImageStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import {
  ChevronLeft,
  CalendarDays,
  MapPin,
  Ticket,
  ShoppingCart,
  ArrowRight,
} from 'lucide-react-native';

import { colors, spacing, radii, shadows, ROUTES } from '@/lib/constants';
import { useHaptics } from '@/hooks/useHaptics';
import { formatPrice, formatDate, formatTime } from '@/services/event.service';
import { getMockEventDetailWithFallback } from '@/data/mock';
import type { MockTicketTier } from '@/data/mock';
import TicketTierCard from '@/components/tickets/TicketTierCard';

// ============================================================
// Types
// ============================================================

/** Selection d'un tier avec quantite */
interface TierSelection {
  readonly tierId: string;
  readonly tierName: string;
  readonly unitPrice: number;
  readonly quantity: number;
}

// ============================================================
// Constantes
// ============================================================

/** Hauteur du hero image */
const HERO_HEIGHT = 200;

// ============================================================
// Composant principal
// ============================================================

export default function SelectTickets() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { impact, notification } = useHaptics();

  // -- Donnees de l'evenement --
  const eventDetail = useMemo(() => {
    if (!id) return null;
    return getMockEventDetailWithFallback(id);
  }, [id]);

  // -- Quantites selectionnees par tier --
  const [quantities, setQuantities] = useState<Record<string, number>>({});

  const handleQuantityChange = useCallback((tierId: string, newQuantity: number) => {
    impact('light');
    setQuantities((prev) => ({
      ...prev,
      [tierId]: newQuantity,
    }));
  }, [impact]);

  // -- Selections calculees --
  const tierSelections = useMemo((): TierSelection[] => {
    if (!eventDetail) return [];
    return eventDetail.ticket_tiers
      .filter((tier) => (quantities[tier.id] ?? 0) > 0)
      .map((tier) => ({
        tierId: tier.id,
        tierName: tier.name,
        unitPrice: tier.price,
        quantity: quantities[tier.id] ?? 0,
      }));
  }, [eventDetail, quantities]);

  const totalAmount = useMemo(() => {
    return tierSelections.reduce((sum, sel) => sum + sel.unitPrice * sel.quantity, 0);
  }, [tierSelections]);

  const totalTickets = useMemo(() => {
    return tierSelections.reduce((sum, sel) => sum + sel.quantity, 0);
  }, [tierSelections]);

  // -- Navigation --
  const handleBack = useCallback(() => {
    impact('light');
    if (router.canGoBack()) {
      router.back();
    }
  }, [impact, router]);

  const handlePay = useCallback(() => {
    if (tierSelections.length === 0) {
      notification('warning');
      return;
    }
    impact('medium');
    // Navigation vers la selection de l'operateur de paiement
    router.push({
      pathname: ROUTES.PAYMENT,
      params: {
        eventId: id ?? '',
        tiers: JSON.stringify(tierSelections.map((s) => ({
          tierId: s.tierId,
          quantity: s.quantity,
        }))),
        totalAmount: String(totalAmount),
      },
    } as never);
  }, [tierSelections, impact, notification, router, id, totalAmount]);

  // ============================================================
  // Rendu
  // ============================================================

  // Etat si evenement non trouve
  if (!eventDetail) {
    return (
      <View style={styles.notFound}>
        <Ticket size={48} color={colors.stone} strokeWidth={1.5} />
        <Text style={styles.notFoundTitle}>Evenement introuvable</Text>
        <Text style={styles.notFoundSubtitle}>
          Cet evenement n'existe pas ou a ete supprime.
        </Text>
        <Pressable style={styles.notFoundButton} onPress={handleBack}>
          <Text style={styles.notFoundButtonText}>Retour</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingTop: insets.top,
          paddingBottom: insets.bottom + 100, // Espace pour la barre fixe
        }}
        showsVerticalScrollIndicator={false}
        stickyHeaderIndices={[0]}
      >
        {/* Hero image */}
        <View style={styles.heroContainer}>
          {eventDetail.cover_image ? (
            <Image
              source={{ uri: eventDetail.cover_image }}
              style={styles.heroImage}
              contentFit="cover"
              transition={300}
              cachePolicy="memory-disk"
            />
          ) : (
            <View style={styles.heroPlaceholder} />
          )}
          <LinearGradient
            colors={['transparent', 'rgba(26,24,22,0.7)']}
            style={styles.heroGradient}
          />

          {/* Bouton retour */}
          <Pressable
            style={[styles.backButton, { top: insets.top + spacing.sm }]}
            onPress={handleBack}
            accessibilityRole="button"
            accessibilityLabel="Retour"
            hitSlop={8}
          >
            <ChevronLeft size={20} color={colors.white} strokeWidth={2} />
          </Pressable>

          {/* Titre sur l'image */}
          <View style={styles.heroTextContainer}>
            <Text style={styles.heroTitle} numberOfLines={2}>
              {eventDetail.title}
            </Text>
            <View style={styles.heroMetaRow}>
              <CalendarDays size={13} color={`${colors.sand}CC`} strokeWidth={1.5} />
              <Text style={styles.heroMetaText}>
                {formatDate(eventDetail.start_date)} - {formatTime(eventDetail.start_date)}
              </Text>
            </View>
            {eventDetail.city && (
              <View style={styles.heroMetaRow}>
                <MapPin size={13} color={`${colors.sand}CC`} strokeWidth={1.5} />
                <Text style={styles.heroMetaText}>{eventDetail.city}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Section : Choisir vos billets */}
        <View style={styles.sectionHeader}>
          <Ticket size={20} color={colors.terracotta} strokeWidth={1.5} />
          <Text style={styles.sectionTitle}>Choisir vos billets</Text>
        </View>
        <Text style={styles.sectionSubtitle}>
          Selectionnez le nombre de billets pour chaque categorie
        </Text>

        {/* Liste des tiers */}
        <View style={styles.tiersContainer}>
          {eventDetail.ticket_tiers.map((tier: MockTicketTier) => (
            <TicketTierCard
              key={tier.id}
              tier={tier}
              quantity={quantities[tier.id] ?? 0}
              onQuantityChange={handleQuantityChange}
            />
          ))}
        </View>

        {/* Resume de la selection */}
        {tierSelections.length > 0 && (
          <View style={styles.summaryContainer}>
            <View style={styles.summaryHeader}>
              <ShoppingCart size={18} color={colors.forest} strokeWidth={1.5} />
              <Text style={styles.summaryTitle}>Resume</Text>
            </View>

            {tierSelections.map((sel) => (
              <View key={sel.tierId} style={styles.summaryRow}>
                <Text style={styles.summaryTierName}>
                  {sel.quantity} x {sel.tierName}
                </Text>
                <Text style={styles.summaryTierPrice}>
                  {formatPrice(sel.unitPrice * sel.quantity)}
                </Text>
              </View>
            ))}

            {/* Separateur */}
            <View style={styles.summaryDivider} />

            {/* Total */}
            <View style={styles.summaryTotalRow}>
              <Text style={styles.summaryTotalLabel}>Total</Text>
              <Text style={styles.summaryTotalValue}>
                {formatPrice(totalAmount)}
              </Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Barre fixe en bas : total + CTA */}
      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + spacing.md }]}>
        <View style={styles.bottomBarContent}>
          {/* Total */}
          <View style={styles.bottomBarLeft}>
            <Text style={styles.bottomBarLabel}>Total</Text>
            <Text style={styles.bottomBarTotal}>
              {totalTickets > 0 ? formatPrice(totalAmount) : '0 FCFA'}
            </Text>
            {totalTickets > 0 && (
              <Text style={styles.bottomBarCount}>
                {totalTickets} billet{totalTickets > 1 ? 's' : ''}
              </Text>
            )}
          </View>

          {/* CTA Payer */}
          <Pressable
            style={[
              styles.payButton,
              tierSelections.length === 0 && styles.payButtonDisabled,
            ]}
            onPress={handlePay}
            disabled={tierSelections.length === 0}
            accessibilityRole="button"
            accessibilityLabel={tierSelections.length === 0 ? 'Selectionnez des billets' : 'Payer'}
          >
            <Text style={styles.payButtonText}>
              {tierSelections.length === 0 ? 'Selectionner' : 'Payer'}
            </Text>
            {tierSelections.length > 0 && (
              <ArrowRight size={18} color={colors.white} strokeWidth={2} />
            )}
          </Pressable>
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
    backgroundColor: colors.sand,
  },

  /* Hero */
  heroContainer: {
    height: HERO_HEIGHT,
    position: 'relative',
    overflow: 'hidden',
  } as ViewStyle,
  heroImage: {
    width: '100%',
    height: '100%',
  } as ImageStyle,
  heroPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.ivory,
  },
  heroGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: HERO_HEIGHT * 0.7,
  },
  backButton: {
    position: 'absolute',
    left: spacing.md,
    zIndex: 10,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(26,24,22,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroTextContainer: {
    position: 'absolute',
    bottom: spacing.md,
    left: spacing.lg,
    right: spacing.lg,
  },
  heroTitle: {
    fontFamily: 'PlayfairDisplay-Bold',
    fontSize: 22,
    lineHeight: 28,
    color: colors.white,
    letterSpacing: -0.3,
    marginBottom: spacing.xs,
  } as TextStyle,
  heroMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: 2,
  },
  heroMetaText: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    lineHeight: 16,
    color: `${colors.sand}CC`,
  },

  /* Section */
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xs,
  },
  sectionTitle: {
    fontFamily: 'PlayfairDisplay-Bold',
    fontSize: 20,
    lineHeight: 26,
    color: colors.onyx,
    letterSpacing: -0.3,
  },
  sectionSubtitle: {
    fontFamily: 'Inter-Regular',
    fontSize: 13,
    lineHeight: 18,
    color: colors.stone,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },

  /* Tiers */
  tiersContainer: {
    paddingHorizontal: spacing.lg,
  },

  /* Resume */
  summaryContainer: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
    backgroundColor: colors.ivory,
    borderRadius: radii.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: `${colors.terracotta}20`,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  summaryTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    lineHeight: 22,
    color: colors.forest,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  summaryTierName: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    lineHeight: 20,
    color: colors.onyx,
  },
  summaryTierPrice: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    lineHeight: 20,
    color: colors.onyx,
  },
  summaryDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
    marginVertical: spacing.sm,
  },
  summaryTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryTotalLabel: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    lineHeight: 22,
    color: colors.onyx,
  },
  summaryTotalValue: {
    fontFamily: 'PlayfairDisplay-Bold',
    fontSize: 20,
    lineHeight: 26,
    color: colors.terracotta,
    letterSpacing: -0.3,
  },

  /* Barre fixe basse */
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.white,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    paddingTop: spacing.md,
    ...shadows.card,
  },
  bottomBarContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
  },
  bottomBarLeft: {
    flex: 1,
  },
  bottomBarLabel: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    lineHeight: 16,
    color: colors.stone,
    marginBottom: 2,
  },
  bottomBarTotal: {
    fontFamily: 'PlayfairDisplay-Bold',
    fontSize: 22,
    lineHeight: 28,
    color: colors.onyx,
    letterSpacing: -0.3,
  },
  bottomBarCount: {
    fontFamily: 'Inter-Regular',
    fontSize: 11,
    lineHeight: 15,
    color: colors.stone,
  },

  /* CTA Payer */
  payButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.terracotta,
    borderRadius: radii.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    minHeight: 52,
  },
  payButtonDisabled: {
    backgroundColor: colors.stone,
    opacity: 0.5,
  },
  payButtonText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    lineHeight: 24,
    color: colors.white,
  },

  /* Etat non trouve */
  notFound: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.sand,
    paddingHorizontal: spacing.xl,
  },
  notFoundTitle: {
    fontFamily: 'PlayfairDisplay-SemiBold',
    fontSize: 20,
    lineHeight: 26,
    color: colors.onyx,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  notFoundSubtitle: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    lineHeight: 20,
    color: colors.stone,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  notFoundButton: {
    backgroundColor: colors.terracotta,
    borderRadius: radii.lg,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
  },
  notFoundButtonText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    lineHeight: 24,
    color: colors.white,
  },
});