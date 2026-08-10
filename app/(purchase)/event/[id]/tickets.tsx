/**
 * Page selection de billets - Tunnel d'achat.
 *
 * Design ultra-premium inspire de Fever, DICE et des flux checkout
 * de Ticketmaster / AXS :
 * - Hero image plein ecran (280px) avec gradient cinematique,
 *   surtitre or et titre evenement en blanc
 * - Cartes de tiers style "accréditation premium" :
 *   badge qualite SVG (VIP/Premium/Standard) sur tuile teintee,
 *   nom en Playfair, prix en or, benefits en chips,
 *   selecteur quantite pilule premium
 * - Recapitulatif elegant avec icones qualite
 * - Dock de paiement flottant : panneau sombre, filet or,
 *   total en Playfair + CTA terracotta "Payer"
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

import QualityPremiumIcon from '@/assets/icons/quality-premium.svg';
import QualityVipIcon from '@/assets/icons/quality-VIP.svg';
import QualityStandardIcon from '@/assets/icons/quality-standart.svg';

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
const BOTTOM_BAR_HEIGHT = 84;

// ============================================================
// Types
// ============================================================

interface TierQuality {
  readonly source: React.ComponentType<{ width?: number; height?: number }>;
  readonly label: string;
  readonly color: string;
  readonly bg: string;
}

// ============================================================
// Helper : qualite du tier (badge SVG + couleur d'accent)
// ============================================================

function getTierQuality(name: string): TierQuality {
  const lower = name.toLowerCase();
  if (lower.includes('vvip') || lower.includes('premium')) {
    return {
      source: QualityPremiumIcon,
      label: 'PREMIUM',
      color: colors.gold,
      bg: `${colors.gold}18`,
    };
  }
  if (lower.includes('vip')) {
    return {
      source: QualityVipIcon,
      label: 'VIP',
      color: colors.terracotta,
      bg: `${colors.terracotta}18`,
    };
  }
  return {
    source: QualityStandardIcon,
    label: 'STANDARD',
    color: colors.forest,
    bg: `${colors.forest}18`,
  };
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
  heroOverline: {
    fontFamily: 'Inter-Bold',
    fontSize: 11,
    lineHeight: 15,
    letterSpacing: 2,
    color: colors.gold,
    marginBottom: spacing.xs,
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
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  sectionIconTile: {
    width: 40,
    height: 40,
    borderRadius: radii.md,
    backgroundColor: `${colors.terracotta}12`,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.xs,
  },
  sectionTitle: {
    fontFamily: 'PlayfairDisplay-SemiBold',
    fontSize: 22,
    lineHeight: 28,
    color: colors.onyx,
    letterSpacing: -0.3,
  },
  sectionSubtitle: {
    fontFamily: 'Inter-Regular',
    fontSize: 13,
    lineHeight: 18,
    color: colors.stone,
    marginBottom: spacing.lg,
  },

  /* Info bar */
  infoBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${colors.forest}08`,
    borderRadius: radii.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    gap: spacing.sm,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: `${colors.forest}15`,
  },
  infoBarText: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    lineHeight: 16,
    color: colors.forest,
    flex: 1,
  },

  /* -- Carte de tier premium -- */
  tierCard: {
    backgroundColor: colors.white,
    borderRadius: radii.xl,
    marginBottom: spacing.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: `${colors.gold}22`,
    ...shadows.eventCard,
  },
  tierCardGradient: {
    borderRadius: radii.xl,
    overflow: 'hidden',
  },
  /* Bandeau superieur en degrade - halo de qualite (au-dessus de la carte) */
  tierAccentBand: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 100,
    zIndex: 2,
  },
  tierCardBody: {
    padding: spacing.lg,
  },
  tierTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  tierQualityTile: {
    width: 50,
    height: 50,
    borderRadius: radii.lg,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
    borderWidth: 1,
    borderColor: `${colors.white}AA`,
  },
  tierNameArea: {
    flex: 1,
    marginRight: spacing.md,
  },
  tierName: {
    flexShrink: 1,
    fontFamily: 'PlayfairDisplay-Bold',
    fontSize: 20,
    lineHeight: 26,
    color: colors.onyx,
    letterSpacing: -0.2,
    marginBottom: 4,
  },
  tierLabelBadge: {
    flexShrink: 0,
    alignSelf: 'flex-start',
    borderRadius: radii.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderWidth: 1,
  },
  tierLabelText: {
    fontFamily: 'Inter-Bold',
    fontSize: 10,
    lineHeight: 13,
    letterSpacing: 0.8,
  },
  tierPriceArea: {
    alignItems: 'flex-end',
  },
  tierPriceChip: {
    borderRadius: radii.md,
    paddingHorizontal: spacing.sm + 4,
    paddingVertical: spacing.xs,
    borderWidth: 1,
    borderColor: `${colors.gold}38`,
    backgroundColor: `${colors.gold}0F`,
  },
  tierPriceLabel: {
    fontFamily: 'Inter-Regular',
    fontSize: 10,
    lineHeight: 14,
    color: colors.stone,
    marginBottom: 3,
  },
  tierPrice: {
    fontFamily: 'PlayfairDisplay-Bold',
    fontSize: 20,
    lineHeight: 26,
    color: colors.gold,
    letterSpacing: -0.2,
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
    borderRadius: radii.full,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.xs + 1,
    gap: spacing.xs,
    borderWidth: 1,
    borderColor: `${colors.border}`,
  },
  benefitCheck: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: `${colors.forest}18`,
    justifyContent: 'center',
    alignItems: 'center',
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
    borderTopColor: `${colors.gold}1F`,
    paddingTop: spacing.md,
  },
  stockInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  stockDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  stockText: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    lineHeight: 16,
    color: colors.stone,
    flexShrink: 1,
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

  /* Selecteur quantite premium - pilule dans pilule */
  quantitySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.ivory,
    borderRadius: radii.full,
    borderWidth: 1,
    borderColor: `${colors.gold}33`,
    padding: 4,
  },
  qtyButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.search,
  },
  qtyButtonDisabled: {
    opacity: 0.4,
  },
  qtyNumber: {
    fontFamily: 'Inter-Bold',
    fontSize: 17,
    lineHeight: 24,
    color: colors.onyx,
    minWidth: 42,
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
    borderRadius: radii.xl,
    marginBottom: spacing.lg,
    marginTop: spacing.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: `${colors.gold}30`,
    ...shadows.card,
  },
  recapCardInner: {
    padding: spacing.lg,
  },
  recapHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  recapHeaderIcon: {
    width: 30,
    height: 30,
    borderRadius: 10,
    backgroundColor: `${colors.gold}1F`,
    justifyContent: 'center',
    alignItems: 'center',
  },
  recapHeaderText: {
    fontFamily: 'PlayfairDisplay-SemiBold',
    fontSize: 18,
    lineHeight: 24,
    color: colors.onyx,
  },
  recapRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  recapQualityIconWrap: {
    marginRight: spacing.sm,
  },
  recapTierName: {
    flex: 1,
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

  /* =============================================
     Dock de paiement - panneau flottant premium
     ============================================= */
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  dockOuter: {
    paddingHorizontal: spacing.md,
  },
  dockPanel: {
    borderRadius: radii.xxl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: `${colors.gold}40`,
    ...shadows.eventCard,
  },
  dockRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  dockSummary: {
    flex: 1,
    marginRight: spacing.md,
  },
  dockCaption: {
    fontFamily: 'Inter-Regular',
    fontSize: 11,
    lineHeight: 15,
    color: `${colors.white}80`,
    marginBottom: 1,
  },
  dockTotal: {
    fontFamily: 'PlayfairDisplay-Bold',
    fontSize: 24,
    lineHeight: 30,
    color: colors.goldBright,
  },
  dockTotalEmpty: {
    color: `${colors.white}55`,
  },
  /* CTA or degrade - pilule */
  dockCtaButton: {
    borderRadius: radii.full,
    minWidth: 132,
    shadowColor: colors.gold,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
  },
  dockCtaInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md + 2,
    borderRadius: radii.full,
  },
  dockCtaText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    lineHeight: 24,
    color: colors.onyx,
  },
  dockCtaTextDisabled: {
    color: colors.stone,
  },
  dockCtaDisabled: {
    shadowOpacity: 0,
    elevation: 0,
    opacity: 0.85,
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
              'rgba(26,24,22,0.88)',
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
            <Text style={styles.heroOverline}>BILLETERIE</Text>
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
            <LinearGradient
              colors={[`${colors.terracotta}1F`, `${colors.terracotta}0D`]}
              style={styles.sectionIconTile}
            >
              <Ticket size={20} color={colors.terracotta} strokeWidth={1.75} />
            </LinearGradient>
            <Text style={styles.sectionTitle}>Choix des billets</Text>
          </View>
          <Text style={styles.sectionSubtitle}>
            Selectionnez le type de billet et la quantite souhaitee
          </Text>

          {/* Info bar */}
          <LinearGradient
            colors={[`${colors.forest}12`, `${colors.forest}06`]}
            style={styles.infoBar}
          >
            <Info size={16} color={colors.forest} strokeWidth={2} />
            <Text style={styles.infoBarText}>
              Les prix sont indiques par billet. Vous pouvez selectionner plusieurs types de billets.
            </Text>
          </LinearGradient>

          {/* Evenement epuise */}
          {eventDetail.is_sold_out ? (
            <LinearGradient
              colors={[`${colors.danger}12`, `${colors.danger}05`]}
              style={styles.soldOutBanner}
            >
              <Ticket size={24} color={colors.danger} strokeWidth={1.5} />
              <Text style={styles.soldOutText}>
                Tous les billets sont epuises pour cet evenement
              </Text>
            </LinearGradient>
          ) : (
            /* Cartes de tiers premium */
            <View>
              {eventDetail.ticket_tiers.map((tier) => {
                const quality = getTierQuality(tier.name);
                const currentQty = quantities[tier.id] ?? 0;
                const canIncrement = !tier.is_sold_out && currentQty < tier.available_quantity;
                const canDecrement = currentQty > 0;
                const pourcentageVendu = tier.quantity_total > 0
                  ? Math.round(((tier.quantity_total - tier.available_quantity) / tier.quantity_total) * 100)
                  : 0;

                return (
                  <View
                    key={tier.id}
                    style={[styles.tierCard, { borderColor: `${quality.color}38` }]}
                  >
                    <LinearGradient
                      colors={['#FFFFFF', `${quality.color}16`]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 0.5, y: 1 }}
                      style={styles.tierCardGradient}
                    >
                      <View style={styles.tierCardBody}>
                        {/* Ligne superieure : badge qualite + nom + prix */}
                        <View style={styles.tierTopRow}>
                          <LinearGradient
                            colors={[`${quality.color}3D`, `${quality.color}14`]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={styles.tierQualityTile}
                          >
                            {(() => {
                              const QualityIcon = quality.source;
                              return <QualityIcon width={34} height={34} />;
                            })()}
                          </LinearGradient>

                          <View style={styles.tierNameArea}>
                            <Text style={styles.tierName} numberOfLines={1}>
                              {tier.name}
                            </Text>
                            <View style={[
                              styles.tierLabelBadge,
                              {
                                backgroundColor: `${quality.color}14`,
                                borderColor: `${quality.color}40`,
                              },
                            ]}>
                              <Text
                                style={[styles.tierLabelText, { color: quality.color }]}
                                numberOfLines={1}
                                allowFontScaling={false}
                              >
                                {quality.label}
                              </Text>
                            </View>
                          </View>

                          <View style={styles.tierPriceArea}>
                            <Text style={styles.tierPriceLabel}>par billet</Text>
                            <View style={styles.tierPriceChip}>
                              <Text style={styles.tierPrice}>{formatTierPrice(tier.price)}</Text>
                            </View>
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
                                <View style={styles.benefitCheck}>
                                  <Check size={9} color={colors.forest} strokeWidth={3} />
                                </View>
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
                              <>
                                <View style={[styles.stockDot, { backgroundColor: colors.mango }]} />
                                <View style={[styles.stockBadge, { backgroundColor: `${colors.mango}15` }]}>
                                  <Text style={[styles.stockBadgeText, { color: colors.mango }]}>Stock faible</Text>
                                </View>
                              </>
                            ) : (
                              <>
                                <View style={[styles.stockDot, { backgroundColor: colors.forest }]} />
                                <Text style={styles.stockText}>
                                  {tier.available_quantity} dispo{tier.available_quantity > 1 ? 's' : ''} ({pourcentageVendu}% vendu)
                                </Text>
                              </>
                            )}
                          </View>

                          {/* Selecteur quantite premium - pilule dans pilule */}
                          <View style={styles.quantitySelector}>
                            <Pressable
                              onPress={() => {
                                if (!canDecrement) return;
                                impact('light');
                                handleQuantityChange(tier.id, currentQty - 1);
                              }}
                              style={({ pressed }) => [
                                styles.qtyButton,
                                !canDecrement && styles.qtyButtonDisabled,
                                pressed && { transform: [{ scale: 0.94 }] },
                              ]}
                              disabled={!canDecrement}
                              hitSlop={8}
                              accessibilityRole="button"
                              accessibilityLabel="Diminuer"
                            >
                              <Minus size={16} color={canDecrement ? colors.onyx : colors.stone} strokeWidth={2.5} />
                            </Pressable>

                            <Text style={styles.qtyNumber}>{currentQty}</Text>

                            <Pressable
                              onPress={() => {
                                if (!canIncrement) return;
                                impact('light');
                                handleQuantityChange(tier.id, currentQty + 1);
                              }}
                              style={({ pressed }) => [
                                styles.qtyButton,
                                !canIncrement && styles.qtyButtonDisabled,
                                pressed && { transform: [{ scale: 0.94 }] },
                              ]}
                              disabled={!canIncrement}
                              hitSlop={8}
                              accessibilityRole="button"
                              accessibilityLabel="Augmenter"
                            >
                              <Plus size={16} color={canIncrement ? quality.color : colors.stone} strokeWidth={2.5} />
                            </Pressable>
                          </View>
                        </View>
                      </View>
                    </LinearGradient>

                    {/* Halo superieur en degrade - rendu au-dessus de la carte */}
                    <LinearGradient
                      colors={[`${quality.color}40`, 'rgba(255,255,255,0)']}
                      style={styles.tierAccentBand}
                      pointerEvents="none"
                    />
                  </View>
                );
              })}
            </View>
          )}

          {/* Recapitulatif */}
          {totalQuantity > 0 && (
            <LinearGradient
              colors={['#FFFFFF', '#FDF9F0']}
              style={styles.recapCard}
            >
              <View style={styles.recapCardInner}>
                <View style={styles.recapHeader}>
                  <View style={styles.recapHeaderIcon}>
                    <Sparkles size={15} color={colors.gold} strokeWidth={2} />
                  </View>
                  <Text style={styles.recapHeaderText}>Recapitulatif</Text>
                </View>

                {selectedTiers.map((tier) => {
                  const quality = getTierQuality(tier.tierName);
                  return (
                    <View key={tier.tierId} style={styles.recapRow}>
                      {(() => {
                        const QualityIcon = quality.source;
                        return (
                          <View style={styles.recapQualityIconWrap}>
                            <QualityIcon width={20} height={20} />
                          </View>
                        );
                      })()}
                      <Text style={styles.recapTierName}>
                        {tier.quantity}x {tier.tierName}
                      </Text>
                      <Text style={styles.recapTierDetail}>{formatPrice(tier.subtotal)}</Text>
                    </View>
                  );
                })}

                <View style={styles.recapSeparator} />

                <View style={styles.recapTotalRow}>
                  <Text style={styles.recapTotalLabel}>Total</Text>
                  <Text style={styles.recapTotalValue}>{formatPrice(totalAmount)}</Text>
                </View>
              </View>
            </LinearGradient>
          )}
        </View>
      </ScrollView>

      {/* =============================================
          DOCK DE PAIEMENT - panneau flottant premium
          ============================================= */}
      <View style={[styles.bottomBar, { paddingBottom: insets.bottom || spacing.md }]}>
        <View style={styles.dockOuter}>
          <LinearGradient
            colors={['rgba(30,27,24,0.97)', 'rgba(18,16,14,1)']}
            style={styles.dockPanel}
          >
            <View style={styles.dockRow}>
              <View style={styles.dockSummary}>
                <Text style={styles.dockCaption}>
                  {totalQuantity > 0
                    ? `${totalQuantity} billet${totalQuantity > 1 ? 's' : ''} selectionne${totalQuantity > 1 ? 's' : ''}`
                    : 'Aucun billet selectionne'}
                </Text>
                <Text style={[
                  styles.dockTotal,
                  totalQuantity === 0 && styles.dockTotalEmpty,
                ]}>
                  {totalQuantity > 0 ? formatPrice(totalAmount) : '0 FCFA'}
                </Text>
              </View>

              <Pressable
                onPress={handleProceedToPayment}
                style={({ pressed }) => [
                  styles.dockCtaButton,
                  totalQuantity === 0 && styles.dockCtaDisabled,
                  pressed && totalQuantity > 0 && { opacity: 0.9, transform: [{ scale: 0.98 }] },
                ]}
                disabled={totalQuantity === 0}
                accessibilityRole="button"
                accessibilityLabel="Payer les billets"
                accessibilityState={{ disabled: totalQuantity === 0 }}
              >
                <LinearGradient
                  colors={
                    totalQuantity > 0
                      ? ['#F0CD77', '#C9A84C']
                      : ['#EBE5DA', '#D8CFBE']
                  }
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.dockCtaInner}
                >
                  <Text style={[
                    styles.dockCtaText,
                    totalQuantity === 0 && styles.dockCtaTextDisabled,
                  ]}>
                    {totalQuantity > 0 ? 'Payer' : 'Choisir'}
                  </Text>
                  <ArrowRight
                    size={20}
                    color={totalQuantity > 0 ? colors.onyx : colors.stone}
                    strokeWidth={2.25}
                  />
                </LinearGradient>
              </Pressable>
            </View>
          </LinearGradient>
        </View>
      </View>
    </View>
  );
}
