/**
 * Page selection de billets - Tunnel d'achat.
 *
 * Design system « Noir & Or » premium :
 * - En-tete ScreenHeader (degrade sombre + halo or + retour pastille verre)
 * - Carte evenement ornee : image 100px + titre serif + date / lieu
 * - Liste de cartes TicketTierCard (deja refondues) avec quantites
 * - Barre recapitulative basse collante : total calcule + Button primary
 *   « Continuer » pleine largeur, filet or haut
 * - Etats : LoadingScreen (attente), EmptyState (evenement introuvable)
 *
 * Navigation :
 * - Recoit { id } en parametre (identifiant evenement)
 * - CTA "Continuer" navigue vers ROUTES.PAYMENT avec les tiers selectionnes
 *   et enregistre la reservation dans le purchase-flow-store
 *
 * Conventions :
 * - Design tokens depuis lib/constants.ts
 * - expo-image pour les images
 * - lucide-react-native pour les icones
 * - Pas de type any (sauf router.push as never), pas d'emojis
 * - Imports @/
 * - Commentaires en francais
 * - StyleSheet pour les styles
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  CalendarDays,
  MapPin,
  Ticket,
  Info,
} from 'lucide-react-native';
import { Image } from 'expo-image';

import TicketTierCard from '@/components/tickets/TicketTierCard';
import { ScreenHeader } from '@/components/profile/ScreenHeader';
import { Button } from '@/components/ui/Button';
import { LoadingScreen } from '@/components/ui/LoadingScreen';
import { EmptyState } from '@/components/ui/EmptyState';

import { colors, spacing, radius, shadows, ROUTES } from '@/lib/constants';
import { useHaptics } from '@/hooks/useHaptics';
import { useOffline } from '@/hooks/useOffline';
import { formatPrice, formatDate, formatTime } from '@/services/event.service';
import { getMockEventDetailWithFallback } from '@/data/mock';
import { logger } from '@/lib/logger';
import { usePurchaseFlowStore } from '@/stores/purchase-flow-store';
import type { MockEventDetail } from '@/data/mock';

// ============================================================
// Constantes
// ============================================================

const BOTTOM_BAR_HEIGHT = 120;

// ============================================================
// Composant principal
// ============================================================

export default function SelectTickets() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string }>();
  const { impact } = useHaptics();
  const isOffline = useOffline();

  const eventId = params.id;

  // -- State --
  const [eventDetail, setEventDetail] = useState<MockEventDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [quantities, setQuantities] = useState<Record<string, number>>({});

  // -- Chargement des donnees --
  useEffect(() => {
    if (!eventId) return;
    let cancelled = false;

    const load = async () => {
      setIsLoading(true);
      try {
        const detail = getMockEventDetailWithFallback(eventId);
        if (cancelled) return;
        setEventDetail(detail);

        if (detail) {
          const initialQuantities: Record<string, number> = {};
          for (const tier of detail.ticket_tiers) {
            initialQuantities[tier.id] = 0;
          }
          setQuantities(initialQuantities);
        }
      } catch (err) {
        logger.error('[SelectTickets] load error:', err);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    load();
    return () => { cancelled = true; };
  }, [eventId]);

  // -- Handler : changer la quantite d'un tier --
  const handleQuantityChange = useCallback((tierId: string, newQuantity: number) => {
    setQuantities((prev) => ({ ...prev, [tierId]: newQuantity }));
  }, []);

  // -- Handler : retour --
  const handleBack = useCallback(() => {
    impact('light');
    router.back();
  }, [impact, router]);

  // -- Donnees derivees --
  const { totalQuantity, totalAmount, selectedTiers } = useMemo(() => {
    let qty = 0;
    let amount = 0;
    const tiers: { tierId: string; tierName: string; quantity: number; unitPrice: number; subtotal: number }[] = [];

    if (eventDetail) {
      for (const tier of eventDetail.ticket_tiers) {
        const q = quantities[tier.id] ?? 0;
        if (q > 0) {
          qty += q;
          const sub = q * tier.price;
          amount += sub;
          tiers.push({
            tierId: tier.id,
            tierName: tier.name,
            quantity: q,
            unitPrice: tier.price,
            subtotal: sub,
          });
        }
      }
    }

    return { totalQuantity: qty, totalAmount: amount, selectedTiers: tiers };
  }, [eventDetail, quantities]);

  // -- Handler : payer --
  const handleProceedToPayment = useCallback(() => {
    if (totalQuantity === 0) return;
    if (isOffline) return;
    impact('medium');

    // Stocker les infos de reservation dans le purchase-flow-store
    // pour que la page de paiement puisse les utiliser
    usePurchaseFlowStore.getState().setReservation({
      eventId: eventId ?? '',
      eventTitle: eventDetail?.title ?? '',
      eventCoverImage: eventDetail?.cover_image ?? null,
      eventStartDate: eventDetail?.start_date ?? null,
      eventCity: eventDetail?.city ?? null,
      selectedTiers: selectedTiers.map((t) => ({
        tierId: t.tierId,
        tierName: t.tierName,
        quantity: t.quantity,
        unitPrice: t.unitPrice,
      })),
      totalAmount,
      operator: 'mtn', // Sera mis a jour par la page de paiement
      phoneNumber: '',
    });

    router.push({
      pathname: ROUTES.PAYMENT,
      params: {
        eventId: eventId ?? '',
        tiers: JSON.stringify(selectedTiers.map((t) => ({
          tierId: t.tierId,
          quantity: t.quantity,
        }))),
        totalAmount: String(totalAmount),
      },
    } as never);
  }, [totalQuantity, isOffline, impact, router, eventId, eventDetail, selectedTiers, totalAmount]);

  // ============================================================
  // Loading state
  // ============================================================

  if (isLoading) {
    return <LoadingScreen message="Chargement des billets..." />;
  }

  if (!eventDetail) {
    return (
      <View style={styles.errorWrap}>
        <ScreenHeader title="Billets" subtitle="Billetterie" />
        <EmptyState
          icon={<Ticket size={34} color={colors.gold} strokeWidth={1.5} />}
          title="Evenement introuvable"
          description="Cet evenement n'existe pas ou a ete supprime."
          actionLabel="Retour"
          onAction={handleBack}
        />
      </View>
    );
  }

  // ============================================================
  // Donnees pour le rendu
  // ============================================================

  const displayDate = eventDetail.start_date
    ? `${formatDate(eventDetail.start_date)} - ${formatTime(eventDetail.start_date)}`
    : 'Date a confirmer';
  const displayLocation = eventDetail.address ?? eventDetail.city ?? 'Lieu a confirmer';

  // ============================================================
  // Rendu
  // ============================================================

  return (
    <View style={styles.root}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingBottom: BOTTOM_BAR_HEIGHT + insets.bottom + spacing.xl,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* =============================================
            EN-TETE — ScreenHeader premium
            ============================================= */}
        <ScreenHeader
          title="Choix des billets"
          subtitle="Selectionnez le type de billet et la quantite souhaitee"
        />

        {/* =============================================
            CARTE EVENEMENT ORNEE — image + titre + meta
            ============================================= */}
        <View style={styles.eventCard}>
          {eventDetail.cover_image ? (
            <Image
              source={{ uri: eventDetail.cover_image }}
              style={styles.eventImage}
              contentFit="cover"
              transition={300}
              cachePolicy="memory-disk"
            />
          ) : (
            <View style={styles.eventImagePlaceholder}>
              <Ticket size={30} color={colors.goldMuted} strokeWidth={1.5} />
            </View>
          )}

          <View style={styles.eventInfo}>
            <Text style={styles.eventOverline}>BILLETERIE</Text>
            <Text style={styles.eventTitle} numberOfLines={2}>
              {eventDetail.title}
            </Text>

            <View style={styles.eventMetaRow}>
              <View style={styles.eventMetaChip}>
                <CalendarDays size={13} color={colors.goldBright} strokeWidth={1.75} />
                <Text style={styles.eventMetaText} numberOfLines={1}>
                  {displayDate}
                </Text>
              </View>
              <View style={styles.eventMetaChip}>
                <MapPin size={13} color={colors.goldBright} strokeWidth={1.75} />
                <Text style={styles.eventMetaText} numberOfLines={1}>
                  {displayLocation}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* =============================================
            CONTENU PRINCIPAL
            ============================================= */}
        <View style={styles.content}>
          {/* Info bar */}
          <View style={styles.infoBar}>
            <Info size={16} color={colors.goldBright} strokeWidth={1.75} />
            <Text style={styles.infoBarText}>
              Les prix sont indiques par billet. Vous pouvez selectionner plusieurs types de billets.
            </Text>
          </View>

          {/* Evenement epuise */}
          {eventDetail.is_sold_out ? (
            <View style={styles.soldOutBanner}>
              <Ticket size={24} color={colors.danger} strokeWidth={1.5} />
              <Text style={styles.soldOutText}>
                Tous les billets sont epuises pour cet evenement
              </Text>
            </View>
          ) : (
            /* Cartes de tiers premium (TicketTierCard) */
            <View>
              {eventDetail.ticket_tiers.map((tier) => (
                <TicketTierCard
                  key={tier.id}
                  tier={tier}
                  quantity={quantities[tier.id] ?? 0}
                  onQuantityChange={handleQuantityChange}
                />
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      {/* =============================================
          BARRE RECAPITULATIVE BASSE COLLANTE
          ============================================= */}
      <View style={[styles.bottomBar, { paddingBottom: insets.bottom || spacing.md }]}>
        <View style={styles.summaryRow}>
          <View style={styles.summaryTextBlock}>
            <Text style={styles.summaryCaption}>
              {totalQuantity > 0
                ? `${totalQuantity} billet${totalQuantity > 1 ? 's' : ''} selectionne${totalQuantity > 1 ? 's' : ''}`
                : 'Aucun billet selectionne'}
            </Text>
            <Text style={[
              styles.summaryTotal,
              totalQuantity === 0 && styles.summaryTotalEmpty,
            ]}>
              {totalQuantity > 0 ? formatPrice(totalAmount) : '0 FCFA'}
            </Text>
          </View>
        </View>

        <Button
          variant="primary"
          size="lg"
          fullWidth
          disabled={totalQuantity === 0}
          onPress={handleProceedToPayment}
        >
          Continuer
        </Button>
      </View>
    </View>
  );
}

// ============================================================
// Styles
// ============================================================

const styles = StyleSheet.create({
  /* -- Racine -- */
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  errorWrap: {
    flex: 1,
    backgroundColor: colors.background,
  },

  /* -- Carte evenement ornee -- */
  eventCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    backgroundColor: colors.elevated,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: `${colors.gold}1F`,
    padding: spacing.md,
    ...shadows.card,
  },
  eventImage: {
    width: 100,
    height: 100,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: `${colors.gold}26`,
  },
  eventImagePlaceholder: {
    width: 100,
    height: 100,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: `${colors.gold}26`,
    backgroundColor: colors.glass,
    alignItems: 'center',
    justifyContent: 'center',
  },
  eventInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  eventOverline: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 11,
    lineHeight: 15,
    letterSpacing: 1.6,
    color: colors.goldMuted,
    marginBottom: 3,
  },
  eventTitle: {
    fontFamily: 'PlayfairDisplay_600SemiBold',
    fontSize: 18,
    lineHeight: 24,
    color: colors.text,
    letterSpacing: -0.3,
    marginBottom: spacing.sm,
  },
  eventMetaRow: {
    gap: spacing.sm,
  },
  eventMetaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  eventMetaText: {
    flex: 1,
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    lineHeight: 16,
    color: colors.textSecondary,
  },

  /* -- Contenu principal -- */
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },

  /* Info bar */
  infoBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.glass,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    gap: spacing.sm,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  infoBarText: {
    flex: 1,
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    lineHeight: 16,
    color: colors.textSecondary,
  },

  /* Sold out */
  soldOutBanner: {
    backgroundColor: 'rgba(255,107,94,0.08)',
    borderRadius: radius.lg,
    padding: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255,107,94,0.24)',
  },
  soldOutText: {
    flex: 1,
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    lineHeight: 20,
    color: colors.danger,
  },

  /* -- Barre recapitulative basse collante -- */
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    backgroundColor: 'rgba(19,17,16,0.94)',
    borderTopWidth: 1,
    borderTopColor: `${colors.gold}2E`,
  },
  summaryRow: {
    marginBottom: spacing.md,
  },
  summaryTextBlock: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summaryCaption: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    lineHeight: 17,
    color: colors.textSecondary,
  },
  summaryTotal: {
    fontFamily: 'Inter_700Bold',
    fontSize: 20,
    lineHeight: 27,
    color: colors.goldBright,
    letterSpacing: -0.2,
  },
  summaryTotalEmpty: {
    color: colors.textFaint,
  },
});