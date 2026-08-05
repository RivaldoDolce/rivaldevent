/**
 * Page selection de billets - Tunnel d'achat.
 *
 * Design ultra-premium inspire de Fever, DICE et Eventbrite :
 * - Hero image plein ecran (280px) avec gradient cinematique
 * - Titre evenement en blanc superpose sur l'image
 * - Chips date/lieu elegantes
 * - Cartes de tiers spacieuses avec barre d'accent coloree,
 *   prix en or, benefits en chips, selecteur quantite premium
 * - Recapitulatif elegant avec animation
 * - Barre fixe glassmorphism en bas avec total + CTA "Payer"
 * - Espacement genereux, typographie soignee
 *
 * Navigation :
 * - Recoit { id } en parametre (identifiant evenement)
 * - CTA "Payer" navigue vers ROUTES.PAYMENT avec les tiers selectionnes
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
  Pressable,
  ActivityIndicator,
  StyleSheet,
  type LayoutChangeEvent,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  ChevronLeft,
  CalendarDays,
  MapPin,
  Ticket,
  ArrowRight,
  Minus,
  Plus,
  Check,
  Sparkles,
  Info,
} from 'lucide-react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';

import { colors, spacing, radii, shadows, ROUTES } from '@/lib/constants';
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

const HERO_HEIGHT = 280;
const BOTTOM_BAR_HEIGHT = 88;

// ============================================================
// Helper : couleur d'accent selon le tier
// ============================================================

function getTierAccent(name: string): { readonly color: string; readonly bg: string; readonly label: string } {
  const lower = name.toLowerCase();
  if (lower.includes('vvip') || lower.includes('premium')) {
    return { color: colors.gold, bg: `${colors.gold}18`, label: 'PREMIUM' };
  }
  if (lower.includes('vip')) {
    return { color: colors.terracotta, bg: `${colors.terracotta}18`, label: 'VIP' };
  }
  return { color: colors.forest, bg: `${colors.forest}18`, label: 'STANDARD' };
}

// ============================================================
// Helper : formater prix
// ============================================================

function formatTierPrice(price: number): string {
  const absPrice = Math.abs(price);
  if (absPrice >= 1000) {
    const formatted = absPrice.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '\u202F');
    return `${price < 0 ? '-' : ''}${formatted} F`;
  }
  return `${price} F`;
}

// ============================================================
// Styles
// ============================================================

const styles = StyleSheet.create({
  /* -- Racine -- */
  root: {
    flex: 1,
    backgroundColor: colors.sand,
  },

  /* -- Chargement -- */
  loadingContainer: {
    flex: 1,
    backgroundColor: colors.sand,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: colors.stone,
    marginTop: spacing.md,
  },

  /* -- Erreur -- */
  errorContainer: {
    flex: 1,
    backgroundColor: colors.sand,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  errorTitle: {
    fontFamily: 'PlayfairDisplay-SemiBold',
    fontSize: 18,
    color: colors.onyx,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  errorSubtitle: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: colors.stone,
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  errorButton: {
    backgroundColor: colors.forest,
    borderRadius: radii.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  errorButtonText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: colors.white,
  },

  /* -- Hero -- */
  heroContainer: {
    height: HERO_HEIGHT,
    position: 'relative',
    overflow: 'hidden',
  },
  heroImage: {
    width: '100%',
    height: HERO_HEIGHT,
  },
  heroPlaceholder: {
    width: '100%',
    height: HERO_HEIGHT,
    backgroundColor: colors.indigo,
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroContent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },
  heroTitle: {
    fontFamily: 'PlayfairDisplay-Bold',
    fontSize: 26,
    lineHeight: 34,
    color: colors.white,
    letterSpacing: -0.3,
    marginBottom: spacing.sm,
  },
  heroChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  heroChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${colors.white}20`,
    borderRadius: radii.full,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.xs + 1,
    gap: spacing.xs,
  },
  heroChipText: {
    fontFamily: 'Inter-Medium',
    fontSize: 12,
    lineHeight: 16,
    color: `${colors.white}DD`,
  },

  /* -- Bouton retour -- */
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: `${colors.onyx}55`,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    left: spacing.md,
  },

  /* -- Contenu principal -- */
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },

  /* -- Section header -- */
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  sectionTitle: {
    fontFamily: 'PlayfairDisplay-SemiBold',
    fontSize: 20,
    lineHeight: 26,
    color: colors.onyx,
  },
  sectionSubtitle: {
    fontFamily: 'Inter-Regular',
    fontSize: 13,
    lineHeight: 18,
    color: colors.stone,
    marginBottom: spacing.lg,
  },

  /* -- Carte de tier premium -- */
  tierCard: {
    backgroundColor: colors.white,
    borderRadius: radii.xl,
    marginBottom: spacing.md,
    overflow: 'hidden',
    ...shadows.eventCard,
  },
  tierAccentBar: {
    height: 4,
    width: '100%',
  },
  tierCardBody: {
    padding: spacing.lg,
  },
  tierTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  tierNameArea: {
    flex: 1,
    marginRight: spacing.md,
  },
  tierLabelBadge: {
    borderRadius: radii.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    alignSelf: 'flex-start',
    marginBottom: spacing.xs,
  },
  tierLabelText: {
    fontFamily: 'Inter-Bold',
    fontSize: 10,
    lineHeight: 14,
    letterSpacing: 1,
  },
  tierName: {
    fontFamily: 'PlayfairDisplay-Bold',
    fontSize: 22,
    lineHeight: 28,
    color: colors.onyx,
  },
  tierPriceArea: {
    alignItems: 'flex-end',
  },
  tierPriceLabel: {
    fontFamily: 'Inter-Regular',
    fontSize: 11,
    lineHeight: 15,
    color: colors.stone,
    marginBottom: 2,
  },
  tierPrice: {
    fontFamily: 'PlayfairDisplay-Bold',
    fontSize: 22,
    lineHeight: 28,
    color: colors.gold,
  },

  /* Description du tier */
  tierDescription: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    lineHeight: 20,
    color: colors.stone,
    marginBottom: spacing.md,
  },

  /* Benefits */
  benefitsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  benefitChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.ivory,
    borderRadius: radii.md,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.xs + 1,
    gap: spacing.xs,
  },
  benefitText: {
    fontFamily: 'Inter-Medium',
    fontSize: 12,
    lineHeight: 16,
    color: colors.text,
  },

  /* Ligne du bas : stock + selecteur */
  tierBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.md,
  },
  stockInfo: {
    flex: 1,
  },
  stockText: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    lineHeight: 16,
    color: colors.stone,
  },
  stockBadge: {
    alignSelf: 'flex-start',
    borderRadius: radii.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  stockBadgeText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 11,
    lineHeight: 15,
  },

  /* Selecteur quantite premium */
  quantitySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.ivory,
    borderRadius: radii.lg,
    overflow: 'hidden',
  },
  qtyButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  qtyButtonDisabled: {
    opacity: 0.3,
  },
  qtyNumber: {
    fontFamily: 'Inter-Bold',
    fontSize: 20,
    lineHeight: 26,
    color: colors.onyx,
    minWidth: 44,
    textAlign: 'center',
  },

  /* Sold out */
  soldOutBanner: {
    backgroundColor: `${colors.danger}08`,
    borderRadius: radii.lg,
    padding: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: `${colors.danger}20`,
  },
  soldOutText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 15,
    lineHeight: 22,
    color: colors.danger,
  },

  /* Recapitulatif */
  recapCard: {
    backgroundColor: colors.white,
    borderRadius: radii.xl,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    marginTop: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  recapRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  recapTierName: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    lineHeight: 20,
    color: colors.text,
  },
  recapTierDetail: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    lineHeight: 20,
    color: colors.onyx,
  },
  recapSeparator: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.sm,
  },
  recapTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  recapTotalLabel: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    lineHeight: 22,
    color: colors.onyx,
  },
  recapTotalValue: {
    fontFamily: 'PlayfairDisplay-Bold',
    fontSize: 24,
    lineHeight: 30,
    color: colors.gold,
  },

  /* Barre fixe bas glassmorphism */
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  bottomBarInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  bottomSummary: {
    flexDirection: 'column',
  },
  bottomTicketCount: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    lineHeight: 16,
    color: `${colors.white}99`,
  },
  bottomTotal: {
    fontFamily: 'PlayfairDisplay-Bold',
    fontSize: 22,
    lineHeight: 28,
    color: colors.white,
  },
  bottomCtaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.terracotta,
    borderRadius: radii.xl,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md + 2,
    gap: spacing.sm,
    ...shadows.eventCard,
  },
  bottomCtaText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    lineHeight: 24,
    color: colors.white,
  },
  bottomCtaDisabled: {
    opacity: 0.5,
  },

  /* Info bar */
  infoBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${colors.forest}08`,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  infoBarText: {
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
  const [_contentHeight, setContentHeight] = useState(0);

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

  // -- Layout handler --
  const _handleContentLayout = useCallback((e: LayoutChangeEvent) => {
    setContentHeight(e.nativeEvent.layout.height);
  }, []);

  // ============================================================
  // Loading state
  // ============================================================

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={colors.terracotta} />
        <Text style={styles.loadingText}>Chargement des billets...</Text>
      </View>
    );
  }

  if (!eventDetail) {
    return (
      <View style={[styles.errorContainer, { paddingTop: insets.top }]}>
        <Text style={styles.errorTitle}>Evenement introuvable</Text>
        <Text style={styles.errorSubtitle}>
          Cet evenement n&apos;existe pas ou a ete supprime.
        </Text>
        <Pressable onPress={handleBack} style={styles.errorButton}>
          <Text style={styles.errorButtonText}>Retour</Text>
        </Pressable>
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
          paddingBottom: BOTTOM_BAR_HEIGHT + insets.bottom + spacing.lg,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* =============================================
            HERO IMAGE - 280px avec gradient cinematique
            ============================================= */}
        <View style={styles.heroContainer}>
          {eventDetail.cover_image ? (
            <Image
              source={{ uri: eventDetail.cover_image }}
              style={styles.heroImage}
              contentFit="cover"
              transition={400}
              cachePolicy="memory-disk"
            />
          ) : (
            <View style={styles.heroPlaceholder}>
              <Text style={{ fontFamily: 'PlayfairDisplay-Bold', fontSize: 64, color: `${colors.white}30` }}>
                {eventDetail.title.charAt(0)}
              </Text>
            </View>
          )}

          {/* Gradient cinematique */}
          <LinearGradient
            colors={[
              'rgba(26,24,22,0.0)',
              'rgba(26,24,22,0.3)',
              'rgba(26,24,22,0.85)',
            ]}
            locations={[0.0, 0.4, 1.0]}
            style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
            pointerEvents="none"
          />

          {/* Bouton retour */}
          <Pressable
            onPress={handleBack}
            style={[styles.backButton, { top: insets.top + spacing.sm }]}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel="Retour"
          >
            <ChevronLeft size={22} color={colors.white} strokeWidth={2.5} />
          </Pressable>

          {/* Contenu superpose */}
          <View style={[styles.heroContent, { paddingBottom: spacing.lg }]}>
            <Text style={styles.heroTitle}>{eventDetail.title}</Text>
            <View style={styles.heroChipsRow}>
              <View style={styles.heroChip}>
                <CalendarDays size={13} color={`${colors.white}DD`} strokeWidth={1.5} />
                <Text style={styles.heroChipText} numberOfLines={1}>{displayDate}</Text>
              </View>
              <View style={styles.heroChip}>
                <MapPin size={13} color={`${colors.white}DD`} strokeWidth={1.5} />
                <Text style={styles.heroChipText} numberOfLines={1}>{displayLocation}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* =============================================
            CONTENU PRINCIPAL
            ============================================= */}
        <View style={styles.content} onLayout={_handleContentLayout}>
          {/* Section Choix des billets */}
          <View style={styles.sectionHeader}>
            <Ticket size={22} color={colors.terracotta} strokeWidth={1.5} />
            <Text style={styles.sectionTitle}>Choix des billets</Text>
          </View>
          <Text style={styles.sectionSubtitle}>
            Selectionnez le type de billet et la quantite souhaitee
          </Text>

          {/* Info bar */}
          <View style={styles.infoBar}>
            <Info size={16} color={colors.forest} strokeWidth={2} />
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
            /* Cartes de tiers premium */
            <View>
              {eventDetail.ticket_tiers.map((tier) => {
                const accent = getTierAccent(tier.name);
                const currentQty = quantities[tier.id] ?? 0;
                const canIncrement = !tier.is_sold_out && currentQty < tier.available_quantity;
                const canDecrement = currentQty > 0;
                const pourcentageVendu = tier.quantity_total > 0
                  ? Math.round(((tier.quantity_total - tier.available_quantity) / tier.quantity_total) * 100)
                  : 0;

                return (
                  <View key={tier.id} style={styles.tierCard}>
                    {/* Barre d'accent coloree en haut */}
                    <View style={[styles.tierAccentBar, { backgroundColor: accent.color }]} />

                    <View style={styles.tierCardBody}>
                      {/* Ligne superieure : nom + prix */}
                      <View style={styles.tierTopRow}>
                        <View style={styles.tierNameArea}>
                          <View style={[styles.tierLabelBadge, { backgroundColor: accent.bg }]}>
                            <Text style={[styles.tierLabelText, { color: accent.color }]}>
                              {accent.label}
                            </Text>
                          </View>
                          <Text style={styles.tierName}>{tier.name}</Text>
                        </View>
                        <View style={styles.tierPriceArea}>
                          <Text style={styles.tierPriceLabel}>par billet</Text>
                          <Text style={styles.tierPrice}>{formatTierPrice(tier.price)}</Text>
                        </View>
                      </View>

                      {/* Description */}
                      {tier.description && (
                        <Text style={styles.tierDescription} numberOfLines={2}>
                          {tier.description}
                        </Text>
                      )}

                      {/* Benefits */}
                      {tier.benefits.length > 0 && (
                        <View style={styles.benefitsContainer}>
                          {tier.benefits.map((benefit, index) => (
                            <View key={index} style={styles.benefitChip}>
                              <Check size={12} color={colors.forest} strokeWidth={2.5} />
                              <Text style={styles.benefitText}>{benefit}</Text>
                            </View>
                          ))}
                        </View>
                      )}

                      {/* Ligne du bas : stock + selecteur quantite */}
                      <View style={styles.tierBottomRow}>
                        <View style={styles.stockInfo}>
                          {tier.is_sold_out ? (
                            <View style={[styles.stockBadge, { backgroundColor: `${colors.danger}15` }]}>
                              <Text style={[styles.stockBadgeText, { color: colors.danger }]}>Epuise</Text>
                            </View>
                          ) : tier.is_low_stock ? (
                            <View style={[styles.stockBadge, { backgroundColor: `${colors.mango}15` }]}>
                              <Text style={[styles.stockBadgeText, { color: colors.mango }]}>Stock faible</Text>
                            </View>
                          ) : (
                            <Text style={styles.stockText}>
                              {tier.available_quantity} dispo{tier.available_quantity > 1 ? 's' : ''} ({pourcentageVendu}% vendu)
                            </Text>
                          )}
                        </View>

                        {/* Selecteur quantite premium */}
                        <View style={styles.quantitySelector}>
                          <Pressable
                            onPress={() => {
                              if (!canDecrement) return;
                              impact('light');
                              handleQuantityChange(tier.id, currentQty - 1);
                            }}
                            style={[styles.qtyButton, !canDecrement && styles.qtyButtonDisabled]}
                            disabled={!canDecrement}
                            hitSlop={8}
                            accessibilityRole="button"
                            accessibilityLabel="Diminuer"
                          >
                            <Minus size={20} color={canDecrement ? colors.onyx : colors.stone} strokeWidth={2.5} />
                          </Pressable>

                          <Text style={styles.qtyNumber}>{currentQty}</Text>

                          <Pressable
                            onPress={() => {
                              if (!canIncrement) return;
                              impact('light');
                              handleQuantityChange(tier.id, currentQty + 1);
                            }}
                            style={[styles.qtyButton, !canIncrement && styles.qtyButtonDisabled]}
                            disabled={!canIncrement}
                            hitSlop={8}
                            accessibilityRole="button"
                            accessibilityLabel="Augmenter"
                          >
                            <Plus size={20} color={canIncrement ? accent.color : colors.stone} strokeWidth={2.5} />
                          </Pressable>
                        </View>
                      </View>
                    </View>
                  </View>
                );
              })}
            </View>
          )}

          {/* Recapitulatif */}
          {totalQuantity > 0 && (
            <View style={styles.recapCard}>
              <View style={styles.sectionHeader}>
                <Sparkles size={18} color={colors.gold} strokeWidth={1.5} />
                <Text style={{ fontFamily: 'PlayfairDisplay-SemiBold', fontSize: 18, lineHeight: 24, color: colors.onyx }}>
                  Recapitulatif
                </Text>
              </View>

              {selectedTiers.map((tier) => (
                <View key={tier.tierId} style={styles.recapRow}>
                  <Text style={styles.recapTierName}>
                    {tier.quantity}x {tier.tierName}
                  </Text>
                  <Text style={styles.recapTierDetail}>{formatPrice(tier.subtotal)}</Text>
                </View>
              ))}

              <View style={styles.recapSeparator} />

              <View style={styles.recapTotalRow}>
                <Text style={styles.recapTotalLabel}>Total</Text>
                <Text style={styles.recapTotalValue}>{formatPrice(totalAmount)}</Text>
              </View>
            </View>
          )}
        </View>
      </ScrollView>

      {/* =============================================
          BARRE FIXE EN BAS - glassmorphism premium
          ============================================= */}
      <View style={[styles.bottomBar, { paddingBottom: insets.bottom || spacing.md }]}>
        <LinearGradient
          colors={['rgba(26,24,22,0.92)', 'rgba(26,24,22,0.98)']}
          style={{ borderTopLeftRadius: radii.xl, borderTopRightRadius: radii.xl }}
        >
          <View style={styles.bottomBarInner}>
            <View style={styles.bottomSummary}>
              <Text style={styles.bottomTicketCount}>
                {totalQuantity > 0
                  ? `${totalQuantity} billet${totalQuantity > 1 ? 's' : ''} selectionne${totalQuantity > 1 ? 's' : ''}`
                  : 'Aucun billet selectionne'}
              </Text>
              <Text style={styles.bottomTotal}>
                {totalQuantity > 0 ? formatPrice(totalAmount) : '0 F'}
              </Text>
            </View>

            <Pressable
              onPress={handleProceedToPayment}
              style={[styles.bottomCtaButton, totalQuantity === 0 && styles.bottomCtaDisabled]}
              disabled={totalQuantity === 0}
              accessibilityRole="button"
              accessibilityLabel="Payer les billets"
            >
              <Text style={styles.bottomCtaText}>Payer</Text>
              <ArrowRight size={20} color={colors.white} strokeWidth={2} />
            </Pressable>
          </View>
        </LinearGradient>
      </View>
    </View>
  );
}