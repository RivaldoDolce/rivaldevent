import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Animated,
  ImageBackground,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  CalendarDays,
  MapPin,
  Ticket,
  Info,
  Sparkles,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';

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
import { ScreenBackground } from '@/components/ui/ScreenBackground';

const BOTTOM_BAR_HEIGHT = 120;

export default function SelectTickets() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string }>();
  const { impact } = useHaptics();
  const isOffline = useOffline();

  const eventId = params.id;

  const [eventDetail, setEventDetail] = useState<MockEventDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [quantities, setQuantities] = useState<Record<string, number>>({});

  const pulseAnim = useRef(new Animated.Value(0)).current;
  const goldLineAnim = useRef(new Animated.Value(0)).current;

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

  const handleQuantityChange = useCallback((tierId: string, newQuantity: number) => {
    setQuantities((prev) => ({ ...prev, [tierId]: newQuantity }));
  }, []);

  const handleBack = useCallback(() => {
    impact('light');
    router.back();
  }, [impact, router]);

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

  useEffect(() => {
    if (totalQuantity > 0) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1, duration: 900, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 0, duration: 900, useNativeDriver: true }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(0);
    }
  }, [totalQuantity, pulseAnim]);

  useEffect(() => {
    Animated.loop(
      Animated.timing(goldLineAnim, { toValue: 1, duration: 2200, useNativeDriver: true })
    ).start();
  }, [goldLineAnim]);

  const handleProceedToPayment = useCallback(() => {
    if (totalQuantity === 0) return;
    if (isOffline) return;
    impact('medium');
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
      operator: 'mtn',
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

  const displayDate = eventDetail.start_date
    ? `${formatDate(eventDetail.start_date)} - ${formatTime(eventDetail.start_date)}`
    : 'Date a confirmer';
  const displayLocation = eventDetail.address ?? eventDetail.city ?? 'Lieu a confirmer';
  const pulseScale = pulseAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.04] });
  const goldLineTranslate = goldLineAnim.interpolate({ inputRange: [0, 1], outputRange: [-260, 260] });

  return (
    <ScreenBackground><View style={[styles.root, { backgroundColor: 'transparent' }]}>
      <View pointerEvents="none" style={styles.particlesWrap}>
        <View style={[styles.particle, { top: 140, left: 28, width: 180, height: 180, backgroundColor: 'rgba(216,180,90,0.06)' }]} />
        <View style={[styles.particle, { top: 380, right: -40, width: 220, height: 220, backgroundColor: 'rgba(216,180,90,0.04)' }]} />
        <View style={[styles.particle, { top: 620, left: -30, width: 160, height: 160, backgroundColor: 'rgba(255,255,255,0.03)' }]} />
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingBottom: BOTTOM_BAR_HEIGHT + insets.bottom + spacing.xl,
        }}
        showsVerticalScrollIndicator={false}
      >
        <ScreenHeader
          title="Choix des billets"
          subtitle="Selectionnez le type de billet et la quantite souhaitee"
        />

        <View style={styles.heroWrap}>
          <ImageBackground
            source={eventDetail.cover_image ? { uri: eventDetail.cover_image } : undefined}
            style={styles.heroImageBg}
            imageStyle={styles.heroImageStyle}
            resizeMode="cover"
          >
            {!eventDetail.cover_image && (
              <View style={styles.heroPlaceholder}>
                <Ticket size={36} color={colors.goldMuted} strokeWidth={1.5} />
              </View>
            )}
            <LinearGradient
              colors={['rgba(10,9,8,0.10)', 'rgba(10,9,8,0.55)', 'rgba(10,9,8,0.92)']}
              style={StyleSheet.absoluteFill}
            />
            <View pointerEvents="none" style={styles.heroHalo} />
            <View pointerEvents="none" style={styles.heroRing} />
            <View pointerEvents="none" style={styles.heroRing2} />
            <View style={styles.heroSparkle}>
              <Sparkles size={16} color={colors.goldBright} strokeWidth={1.75} />
            </View>
            <View style={styles.heroContent}>
              <View style={styles.heroBadge}>
                <Ticket size={12} color={colors.goldBright} strokeWidth={2} />
                <Text style={styles.heroBadgeText}>BILLETTERIE PREMIUM</Text>
              </View>
              <Text style={styles.heroTitle} numberOfLines={2}>
                {eventDetail.title}
              </Text>
              <View style={styles.heroMetaRow}>
                <View style={styles.heroMetaChip}>
                  <CalendarDays size={13} color={colors.goldBright} strokeWidth={1.75} />
                  <Text style={styles.heroMetaText} numberOfLines={1}>{displayDate}</Text>
                </View>
                <View style={styles.heroMetaChip}>
                  <MapPin size={13} color={colors.goldBright} strokeWidth={1.75} />
                  <Text style={styles.heroMetaText} numberOfLines={1}>{displayLocation}</Text>
                </View>
              </View>
            </View>
          </ImageBackground>
          <View style={styles.ticketPerforation} pointerEvents="none">
            {Array.from({ length: 20 }).map((_, i) => (
              <View key={i} style={styles.perfoDot} />
            ))}
          </View>
          <LinearGradient
            colors={['rgba(216,180,90,0.0)', 'rgba(216,180,90,0.18)', 'rgba(216,180,90,0.0)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.heroGoldLine}
          />
        </View>

        <View style={styles.content}>
          <View style={styles.infoBar}>
            <View style={styles.infoIconWrap}>
              <Info size={15} color={colors.goldBright} strokeWidth={2} />
            </View>
            <Text style={styles.infoBarText}>
              Les prix sont indiques par billet. Vous pouvez selectionner plusieurs types de billets.
            </Text>
          </View>

          {eventDetail.is_sold_out ? (
            <View style={styles.soldOutBanner}>
              <Ticket size={24} color={colors.danger} strokeWidth={1.5} />
              <Text style={styles.soldOutText}>
                Tous les billets sont epuises pour cet evenement
              </Text>
            </View>
          ) : (
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

      <BlurView intensity={42} tint="dark" style={[styles.bottomBar, { paddingBottom: insets.bottom || spacing.md }]}>
        <View style={styles.bottomBarGoldLineWrap}>
          <Animated.View style={[styles.bottomBarGoldShimmer, { transform: [{ translateX: goldLineTranslate }] }]}>
            <LinearGradient colors={['transparent', 'rgba(242,220,155,0.9)', 'transparent']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ flex: 1 }} />
          </Animated.View>
          <View style={styles.bottomBarGoldLine} />
        </View>
        <View style={styles.summaryRow}>
          <View style={styles.summaryTextBlock}>
            <Text style={styles.summaryCaption}>
              {totalQuantity > 0
                ? `${totalQuantity} billet${totalQuantity > 1 ? 's' : ''} selectionne${totalQuantity > 1 ? 's' : ''}`
                : 'Aucun billet selectionne'}
            </Text>
            <Animated.Text style={[
              styles.summaryTotal,
              totalQuantity === 0 && styles.summaryTotalEmpty,
              { transform: [{ scale: pulseScale }] },
            ]}>
              {totalQuantity > 0 ? formatPrice(totalAmount) : '0 FCFA'}
            </Animated.Text>
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
      </BlurView>
    </View></ScreenBackground>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  errorWrap: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  particlesWrap: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 0,
  },
  particle: {
    position: 'absolute',
    borderRadius: 9999,
  },
  heroWrap: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    borderRadius: radius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: `${colors.gold}2E`,
    ...shadows.eventCard,
    height: 190,
  },
  heroImageBg: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  heroImageStyle: {
    borderRadius: radius.lg,
  },
  heroPlaceholder: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.elevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroHalo: {
    position: 'absolute',
    top: -40,
    right: -30,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(216,180,90,0.13)',
  },
  heroRing: {
    position: 'absolute',
    top: -20,
    right: -10,
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 1,
    borderColor: 'rgba(216,180,90,0.18)',
  },
  heroRing2: {
    position: 'absolute',
    top: -8,
    right: 2,
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 1,
    borderColor: 'rgba(216,180,90,0.09)',
  },
  heroSparkle: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(216,180,90,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroContent: {
    padding: spacing.md,
    paddingTop: spacing.lg,
  },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(216,180,90,0.14)',
    borderWidth: 1,
    borderColor: 'rgba(216,180,90,0.32)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.full,
    alignSelf: 'flex-start',
    marginBottom: spacing.sm,
  },
  heroBadgeText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 10,
    lineHeight: 13,
    letterSpacing: 1.4,
    color: colors.goldBright,
  },
  heroTitle: {
    fontFamily: 'PlayfairDisplay_600SemiBold',
    fontSize: 20,
    lineHeight: 26,
    color: colors.text,
    letterSpacing: -0.3,
    textShadowColor: 'rgba(0,0,0,0.55)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 6,
    marginBottom: spacing.sm,
  },
  heroMetaRow: {
    gap: spacing.xs,
  },
  heroMetaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  heroMetaText: {
    flex: 1,
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    lineHeight: 16,
    color: 'rgba(245,240,230,0.85)',
  },
  ticketPerforation: {
    position: 'absolute',
    bottom: -6,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 6,
  },
  perfoDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: `${colors.gold}18`,
  },
  heroGoldLine: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 1.5,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  infoBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    gap: spacing.sm,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(216,180,90,0.18)',
    overflow: 'hidden',
  },
  infoIconWrap: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(216,180,90,0.14)',
    borderWidth: 1,
    borderColor: 'rgba(216,180,90,0.28)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoBarText: {
    flex: 1,
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    lineHeight: 16,
    color: colors.textSecondary,
  },
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
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    backgroundColor: 'rgba(19,17,16,0.88)',
    borderTopWidth: 1,
    borderTopColor: `${colors.gold}18`,
    overflow: 'hidden',
  },
  bottomBarGoldLineWrap: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1.5,
    overflow: 'hidden',
  },
  bottomBarGoldLine: {
    height: 1,
    backgroundColor: `${colors.gold}36`,
  },
  bottomBarGoldShimmer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 120,
    left: 0,
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
