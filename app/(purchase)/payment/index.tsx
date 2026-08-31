import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  Pressable,
  KeyboardAvoidingView,
  ImageBackground,
  Platform,
  StyleSheet,
  Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import {
  ShieldCheck,
  Phone,
  ArrowRight,
  Ticket,
  CircleCheck,
  CircleAlert,
  Info,
  CalendarDays,
  MapPin,
  Check,
  Sparkles,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

import MtnLogo from '@/assets/icons/mtn-logo.svg';
import OrangeLogo from '@/assets/icons/orange-logo.svg';
import MoovLogo from '@/assets/icons/moov-logo.svg';

import { ScreenHeader } from '@/components/profile/ScreenHeader';
import { Button } from '@/components/ui/Button';

import { colors, spacing, radius, shadows, gradients, ROUTES } from '@/lib/constants';
import { clientBackgrounds } from '@/lib/images';
import { getTierQualityInfo } from '@/lib/tier-quality';
import { useHaptics } from '@/hooks/useHaptics';
import { useOffline } from '@/hooks/useOffline';
import { formatPrice, formatDate } from '@/services/event.service';
import { usePurchaseFlowStore } from '@/stores/purchase-flow-store';
import type { SelectedTierInfo } from '@/stores/purchase-flow-store';
import type { PaymentMethod } from '@/types';

interface OperatorInfo {
  readonly id: PaymentMethod;
  readonly name: string;
  readonly subtitle: string;
  readonly logoSource: React.ComponentType<{ width?: number; height?: number }>;
  readonly badge?: string;
  readonly brandGradient: readonly [string, string];
  readonly brandColor: string;
  readonly textColor: string;
}

interface RecapRow {
  readonly key: string;
  readonly tierName: string;
  readonly quantity: number;
  readonly subtotal: number | null;
}

const OPERATORS: readonly OperatorInfo[] = [
  {
    id: 'mtn',
    name: 'MTN MoMo',
    subtitle: 'Mobile Money',
    logoSource: MtnLogo,
    badge: 'Populaire',
    brandGradient: ['rgba(255,204,0,0.82)', 'rgba(255,164,0,0.32)'],
    brandColor: '#FFCC00',
    textColor: '#FFF3B0',
  },
  {
    id: 'orange',
    name: 'Orange Money',
    subtitle: 'Paiement mobile',
    logoSource: OrangeLogo,
    brandGradient: ['rgba(255,121,0,0.82)', 'rgba(220,84,0,0.32)'],
    brandColor: '#FF7900',
    textColor: '#FFC9A3',
  },
  {
    id: 'moov',
    name: 'Moov Money',
    subtitle: 'Transfert mobile',
    logoSource: MoovLogo,
    brandGradient: ['rgba(2,103,179,0.82)', 'rgba(0,64,128,0.32)'],
    brandColor: '#0267B3',
    textColor: '#9FD0F5',
  },
] as const;

function isValidCameroonPhone(phone: string): boolean {
  const cleaned = phone.replace(/\s/g, '');
  return /^6\d{8}$/.test(cleaned);
}

function formatPhoneNumber(input: string): string {
  const digits = input.replace(/\D/g, '').slice(0, 9);
  if (digits.length === 0) return '';
  if (digits.length <= 1) return digits;
  if (digits.length <= 3) return `${digits.slice(0, 1)} ${digits.slice(1)}`;
  if (digits.length <= 5) return `${digits.slice(0, 1)} ${digits.slice(1, 3)} ${digits.slice(3)}`;
  if (digits.length <= 7) return `${digits.slice(0, 1)} ${digits.slice(1, 3)} ${digits.slice(3, 5)} ${digits.slice(5)}`;
  return `${digits.slice(0, 1)} ${digits.slice(1, 3)} ${digits.slice(3, 5)} ${digits.slice(5, 7)} ${digits.slice(7)}`;
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  bgImage: {
    ...StyleSheet.absoluteFillObject,
  },
  bgScrim: {
    ...StyleSheet.absoluteFillObject,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  recapCard: {
    backgroundColor: colors.elevated,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: `${colors.gold}1F`,
    padding: spacing.lg,
    marginBottom: spacing.md,
    overflow: 'hidden',
    ...shadows.card,
  },
  recapPerfoLeft: {
    position: 'absolute',
    left: -8,
    top: '50%',
    marginTop: -12,
    width: 16,
    height: 24,
    borderRadius: 8,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: `${colors.gold}22`,
  },
  recapPerfoRight: {
    position: 'absolute',
    right: -8,
    top: '50%',
    marginTop: -12,
    width: 16,
    height: 24,
    borderRadius: 8,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: `${colors.gold}22`,
  },
  recapDashed: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
    bottom: 62,
    height: 1,
    borderTopWidth: 1,
    borderStyle: 'dashed',
    borderColor: `${colors.gold}26`,
  },
  recapTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  ticketIconGlow: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(216,180,90,0.14)',
    borderWidth: 1,
    borderColor: 'rgba(216,180,90,0.30)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.gold,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.45,
    shadowRadius: 10,
  },
  recapOverline: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 11,
    lineHeight: 15,
    letterSpacing: 1.5,
    color: colors.goldMuted,
  },
  recapEventTitle: {
    fontFamily: 'PlayfairDisplay_600SemiBold',
    fontSize: 17,
    lineHeight: 23,
    color: colors.text,
    marginBottom: spacing.sm,
    letterSpacing: -0.2,
  },
  recapMetaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  recapMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.glass,
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: colors.border,
  },
  recapMetaText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    lineHeight: 15,
    color: colors.textSecondary,
  },
  recapTierRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  recapTierIcon: {
    width: 28,
    height: 28,
    borderRadius: radius.sm,
    backgroundColor: colors.glass,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  recapTierName: {
    flex: 1,
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    lineHeight: 18,
    color: colors.textSecondary,
  },
  recapTierSubtotal: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 13,
    lineHeight: 18,
    color: colors.text,
  },
  recapSeparator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: `${colors.gold}2E`,
    marginVertical: spacing.sm,
  },
  recapTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  recapTotalLabel: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    lineHeight: 16,
    color: colors.textMuted,
  },
  recapTotalValue: {
    fontFamily: 'Inter_700Bold',
    fontSize: 21,
    lineHeight: 28,
    color: colors.goldBright,
    letterSpacing: -0.3,
  },
  securityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.glass,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginBottom: spacing.xl,
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  securityText: {
    flex: 1,
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    lineHeight: 16,
    color: colors.textSecondary,
  },
  sectionOverline: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 11,
    lineHeight: 15,
    letterSpacing: 2,
    color: colors.goldMuted,
    marginBottom: spacing.xs,
  },
  sectionTitle: {
    fontFamily: 'PlayfairDisplay_600SemiBold',
    fontSize: 22,
    lineHeight: 28,
    color: colors.text,
    letterSpacing: -0.3,
  },
  sectionSubtitle: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    lineHeight: 18,
    color: colors.textMuted,
    marginTop: 2,
    marginBottom: spacing.md,
  },
  operatorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.md,
    overflow: 'hidden',
    backgroundColor: 'rgba(30,26,22,0.88)',
    ...shadows.card,
  },
  operatorCardSelected: {
    borderWidth: 1.5,
    ...shadows.goldGlowSoft,
  },
  operatorHalo: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(216,180,90,0.08)',
    borderRadius: radius.lg,
  },
  operatorLogoWrap: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    backgroundColor: 'rgba(255,255,255,0.94)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
    ...shadows.card,
  },
  operatorInfo: {
    flex: 1,
  },
  operatorNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: 2,
  },
  operatorName: {
    fontFamily: 'Inter_700Bold',
    fontSize: 16,
    lineHeight: 22,
    color: colors.text,
    letterSpacing: -0.2,
    textShadowColor: 'rgba(10,9,8,0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  operatorBadge: {
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    backgroundColor: 'rgba(216,180,90,0.12)',
    borderWidth: 1,
    borderColor: `${colors.gold}40`,
  },
  operatorBadgeText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 10,
    lineHeight: 13,
    color: colors.goldBright,
    letterSpacing: 0.4,
  },
  operatorSubtitle: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    lineHeight: 17,
    color: colors.textSecondary,
  },
  operatorRadioOuter: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: spacing.sm,
    backgroundColor: 'transparent',
  },
  operatorRadioSelected: {
    borderColor: 'transparent',
  },
  operatorRadioInner: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  operatorHintRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.glass,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  operatorHintRowSelected: {
    backgroundColor: 'rgba(216,180,90,0.10)',
    borderColor: 'rgba(216,180,90,0.26)',
  },
  operatorHintText: {
    flex: 1,
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    lineHeight: 18,
    color: colors.textSecondary,
  },
  operatorHintTextSelected: {
    color: colors.goldBright,
    fontFamily: 'Inter_600SemiBold',
  },
  phoneSection: {
    marginTop: spacing.lg,
    marginBottom: spacing.xl,
  },
  phoneLabel: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 15,
    lineHeight: 20,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  phoneInputOuter: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(30,26,22,0.92)',
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    minHeight: 56,
    borderWidth: 1,
    borderColor: colors.border,
  },
  phoneInputOuterFocused: {
    borderWidth: 1.5,
    borderColor: colors.gold,
    shadowColor: colors.gold,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
  },
  phoneInputOuterError: {
    borderColor: colors.danger,
  },
  phoneInputOuterValid: {
    borderColor: colors.success,
  },
  phonePrefixBadge: {
    backgroundColor: 'rgba(216,180,90,0.12)',
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.xs + 1,
    marginRight: spacing.md,
    borderWidth: 1,
    borderColor: `${colors.gold}40`,
  },
  phonePrefixText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 15,
    lineHeight: 20,
    color: colors.goldBright,
  },
  phoneInput: {
    flex: 1,
    fontFamily: 'Inter_400Regular',
    fontSize: 17,
    lineHeight: 24,
    color: colors.text,
    paddingVertical: 0,
    includeFontPadding: false,
  },
  phoneIcon: {
    marginLeft: spacing.sm,
  },
  phoneHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  phoneHintText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    lineHeight: 16,
    color: colors.textMuted,
  },
  phoneErrorText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 12,
    lineHeight: 16,
    color: colors.danger,
  },
  confirmWrap: {
    borderRadius: radius.md,
    overflow: 'hidden',
    marginBottom: spacing.sm,
  },
  confirmShimmer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 120,
  },
  cancelButton: {
    alignItems: 'center',
    paddingVertical: spacing.md,
    marginBottom: spacing.lg,
  },
  cancelButtonText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    lineHeight: 20,
    color: colors.textMuted,
  },
  ctaHelperText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    lineHeight: 16,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing.md,
  },
});

export default function PaymentIndex() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams<{
    eventId: string;
    tiers: string;
    totalAmount: string;
  }>();
  const { impact } = useHaptics();
  const isOffline = useOffline();
  const flow = usePurchaseFlowStore();

  const phoneInputRef = useRef<TextInput>(null);

  const [selectedOperator, setSelectedOperator] = useState<PaymentMethod | null>(null);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [phoneFocused, setPhoneFocused] = useState(false);

  const shimmerX = useRef(new Animated.Value(-1)).current;
  const validPop = useRef(new Animated.Value(0)).current;
  const shakeX = useRef(new Animated.Value(0)).current;
  const hintPulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(Animated.timing(shimmerX, { toValue: 1, duration: 1700, useNativeDriver: true }));
    loop.start();
    return () => loop.stop();
  }, [shimmerX]);

  useEffect(() => {
    if (selectedOperator) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(hintPulse, { toValue: 1, duration: 900, useNativeDriver: true }),
          Animated.timing(hintPulse, { toValue: 0, duration: 900, useNativeDriver: true }),
        ])
      ).start();
    }
  }, [selectedOperator, hintPulse]);

  const totalAmount = useMemo(() => {
    return parseInt(params.totalAmount ?? '0', 10);
  }, [params.totalAmount]);

  const parsedTiers = useMemo(() => {
    try {
      return JSON.parse(params.tiers ?? '[]') as { tierId: string; quantity: number }[];
    } catch {
      return [];
    }
  }, [params.tiers]);

  const recapRows: RecapRow[] = useMemo(() => {
    if (flow.selectedTiers.length > 0) {
      return flow.selectedTiers
        .filter((tier: SelectedTierInfo) => tier.quantity > 0)
        .map((tier: SelectedTierInfo) => ({
          key: tier.tierId,
          tierName: tier.tierName,
          quantity: tier.quantity,
          subtotal: tier.quantity * tier.unitPrice,
        }));
    }
    return parsedTiers.map((tier) => ({
      key: tier.tierId ?? `${tier.quantity}`,
      tierName: 'Billet',
      quantity: tier.quantity,
      subtotal: null,
    }));
  }, [flow.selectedTiers, parsedTiers]);

  const displayTotal = flow.totalAmount > 0 ? flow.totalAmount : totalAmount;
  const displayEventTitle = flow.eventTitle ?? 'Votre commande';
  const displayEventDate = flow.eventStartDate ? formatDate(flow.eventStartDate) : '';
  const displayEventCity = flow.eventCity ?? '';

  const phoneDigits = phoneNumber.replace(/\s/g, '');
  const isPhoneValid = phoneDigits.length === 0 || isValidCameroonPhone(phoneDigits);
  const isPhoneComplete = isValidCameroonPhone(phoneDigits);

  useEffect(() => {
    if (isPhoneComplete) {
      Animated.spring(validPop, { toValue: 1, useNativeDriver: true, damping: 9, stiffness: 260 }).start();
    } else {
      validPop.setValue(0);
    }
  }, [isPhoneComplete, validPop]);

  useEffect(() => {
    if (!isPhoneValid && phoneDigits.length > 0) {
      Animated.sequence([
        Animated.timing(shakeX, { toValue: 8, duration: 60, useNativeDriver: true }),
        Animated.timing(shakeX, { toValue: -8, duration: 60, useNativeDriver: true }),
        Animated.timing(shakeX, { toValue: 6, duration: 60, useNativeDriver: true }),
        Animated.timing(shakeX, { toValue: 0, duration: 60, useNativeDriver: true }),
      ]).start();
    }
  }, [isPhoneValid, phoneDigits.length, shakeX]);

  const canProceed = useMemo(() => {
    return selectedOperator !== null
      && isPhoneComplete
      && !isOffline;
  }, [selectedOperator, isPhoneComplete, isOffline]);

  const ctaHelper = useMemo(() => {
    if (isOffline) return 'Hors ligne - verifiez votre connexion';
    if (!selectedOperator) return 'Selectionnez un operateur pour continuer';
    if (!isPhoneComplete) return 'Entrez votre numero (9 chiffres) pour continuer';
    return '';
  }, [isOffline, selectedOperator, isPhoneComplete]);

  const handleBack = useCallback(() => {
    impact('light');
    router.back();
  }, [impact, router]);

  const handleOperatorSelect = useCallback((operator: PaymentMethod) => {
    impact('medium');
    setSelectedOperator(operator);
    setTimeout(() => {
      phoneInputRef.current?.focus();
    }, 300);
  }, [impact]);

  const handlePhoneChange = useCallback((text: string) => {
    const formatted = formatPhoneNumber(text);
    setPhoneNumber(formatted);
  }, []);

  const handleConfirmPayment = useCallback(() => {
    if (!canProceed || !selectedOperator) return;
    impact('medium');
    const flowStore = usePurchaseFlowStore.getState();
    flowStore.setReservation({
      eventId: flowStore.eventId ?? '',
      eventTitle: flowStore.eventTitle ?? '',
      eventCoverImage: flowStore.eventCoverImage,
      eventStartDate: flowStore.eventStartDate,
      eventCity: flowStore.eventCity,
      selectedTiers: flowStore.selectedTiers,
      totalAmount: flowStore.totalAmount,
      operator: selectedOperator,
      phoneNumber: phoneDigits,
    });
    const transactionId = `txn-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const routeMap: Record<PaymentMethod, string> = {
      mtn: ROUTES.PAYMENT_MTN,
      orange: ROUTES.PAYMENT_ORANGE,
      moov: ROUTES.PAYMENT_MOOV,
    };
    router.push({
      pathname: routeMap[selectedOperator],
      params: { transactionId },
    } as never);
  }, [canProceed, selectedOperator, impact, router, phoneDigits]);

  const shimmerTranslate = shimmerX.interpolate({ inputRange: [-1, 1], outputRange: [-260, 260] });
  const validScale = validPop.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1] });

  return (
    <ImageBackground
      source={clientBackgrounds.payment}
      style={styles.root}
      imageStyle={styles.bgImage}
      accessibilityIgnoresInvertColors
    >
      <LinearGradient
        colors={['rgba(10,9,8,0.50)', 'rgba(10,9,8,0.82)']}
        style={styles.bgScrim}
        pointerEvents="none"
      />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={insets.top}
      >
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingBottom: insets.bottom + spacing.xxl,
        }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      >
        <ScreenHeader
          title="Paiement"
          subtitle="Choisissez votre operateur Mobile Money"
          background={clientBackgrounds.payment}
        />

        <View style={styles.content}>
          <View style={styles.recapCard}>
            <View style={styles.recapPerfoLeft} />
            <View style={styles.recapPerfoRight} />
            <View style={styles.recapDashed} pointerEvents="none" />
            <View style={styles.recapTopRow}>
              <Text style={styles.recapOverline}>VOTRE COMMANDE</Text>
              <View style={styles.ticketIconGlow}>
                <Ticket size={16} color={colors.goldBright} strokeWidth={1.75} />
              </View>
            </View>

            <Text style={styles.recapEventTitle} numberOfLines={2}>
              {displayEventTitle}
            </Text>

            {(displayEventDate || displayEventCity) && (
              <View style={styles.recapMetaRow}>
                {displayEventDate ? (
                  <View style={styles.recapMetaItem}>
                    <CalendarDays size={12} color={colors.goldMuted} strokeWidth={1.75} />
                    <Text style={styles.recapMetaText} numberOfLines={1}>
                      {displayEventDate}
                    </Text>
                  </View>
                ) : null}
                {displayEventCity ? (
                  <View style={styles.recapMetaItem}>
                    <MapPin size={12} color={colors.goldMuted} strokeWidth={1.75} />
                    <Text style={styles.recapMetaText} numberOfLines={1}>
                      {displayEventCity}
                    </Text>
                  </View>
                ) : null}
              </View>
            )}

            {recapRows.map((row) => {
              const quality = getTierQualityInfo(row.tierName);
              const TierQualityIcon = quality.icon;
              return (
                <View key={row.key} style={styles.recapTierRow}>
                  <View style={[styles.recapTierIcon, { borderColor: `${quality.color}40` }]}>
                    <TierQualityIcon width={18} height={18} />
                  </View>
                  <Text style={styles.recapTierName} numberOfLines={1}>
                    {row.quantity} billet{row.quantity > 1 ? 's' : ''} · {row.tierName}
                  </Text>
                  <Text style={styles.recapTierSubtotal}>
                    {row.subtotal !== null ? formatPrice(row.subtotal) : `${row.quantity}x`}
                  </Text>
                </View>
              );
            })}

            <View style={styles.recapSeparator} />

            <View style={styles.recapTotalRow}>
              <Text style={styles.recapTotalLabel}>Total a payer</Text>
              <Text style={styles.recapTotalValue}>{formatPrice(displayTotal)}</Text>
            </View>
          </View>

          <View style={styles.securityRow}>
            <ShieldCheck size={17} color={colors.goldBright} strokeWidth={1.75} />
            <Text style={styles.securityText}>
              Paiement securise - Donnees chiffrees
            </Text>
          </View>

          <Text style={styles.sectionOverline}>PAIEMENT MOBILE</Text>
          <Text style={styles.sectionTitle}>Operateur Mobile Money</Text>
          <Text style={styles.sectionSubtitle}>
            Selectionnez votre reseau de paiement
          </Text>

          {OPERATORS.map((op) => {
            const isSelected = selectedOperator === op.id;
            return (
              <Pressable
                key={op.id}
                onPress={() => handleOperatorSelect(op.id)}
                style={[
                  styles.operatorCard,
                  isSelected && [styles.operatorCardSelected, { borderColor: op.brandColor, shadowColor: op.brandColor }],
                ]}
                accessibilityRole="button"
                accessibilityLabel={op.name}
                accessibilityState={{ selected: isSelected }}
              >
                {isSelected && <Animated.View style={[styles.operatorHalo, { backgroundColor: `${op.brandColor}14` }]} />}
                <LinearGradient
                  colors={[...op.brandGradient] as unknown as readonly [string, string, ...string[]]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={StyleSheet.absoluteFill}
                  pointerEvents="none"
                />
                <View style={styles.operatorLogoWrap}>
                  {(() => {
                    const OperatorLogo = op.logoSource;
                    return <OperatorLogo width={38} height={38} />;
                  })()}
                </View>
                <View style={styles.operatorInfo}>
                  <View style={styles.operatorNameRow}>
                    <Text style={styles.operatorName}>
                      {op.name}
                    </Text>
                    {op.badge && (
                      <View style={[styles.operatorBadge, { borderColor: `${op.brandColor}66`, backgroundColor: `${op.brandColor}22` }]}>
                        <Text style={[styles.operatorBadgeText, { color: op.textColor }]}>
                          {op.badge}
                        </Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.operatorSubtitle}>
                    {op.subtitle}
                  </Text>
                </View>
                <Animated.View style={[
                  styles.operatorRadioOuter,
                  isSelected && styles.operatorRadioSelected,
                  isSelected && { transform: [{ scale: 1.01 }] },
                ]}>
                  {isSelected && (
                    <LinearGradient
                      colors={[...gradients.gold] as unknown as readonly [string, string, ...string[]]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.operatorRadioInner}
                    >
                      <Check size={14} color={colors.onyx} strokeWidth={3} />
                    </LinearGradient>
                  )}
                </Animated.View>
              </Pressable>
            );
          })}

          <Animated.View style={[styles.operatorHintRow, selectedOperator && styles.operatorHintRowSelected, { opacity: hintPulse.interpolate({ inputRange: [0, 1], outputRange: [1, 0.92] }) }]}>
            {selectedOperator ? (
              <>
                <ArrowRight size={16} color={colors.goldBright} strokeWidth={1.75} />
                <Text style={[styles.operatorHintText, styles.operatorHintTextSelected]}>
                  Redirection vers {OPERATORS.find((op) => op.id === selectedOperator)?.name}
                </Text>
                <Sparkles size={14} color={colors.gold} strokeWidth={1.75} />
              </>
            ) : (
              <>
                <Info size={16} color={colors.goldMuted} strokeWidth={1.75} />
                <Text style={styles.operatorHintText}>
                  Choisissez un operateur, puis entrez votre numero
                </Text>
              </>
            )}
          </Animated.View>

          <View style={styles.phoneSection}>
            <Text style={styles.phoneLabel}>Numero de telephone</Text>

            <Animated.View
              style={[
                { borderRadius: radius.md },
                { transform: [{ translateX: shakeX }] },
              ]}
            >
            <Pressable
              onPress={() => phoneInputRef.current?.focus()}
              style={[
                styles.phoneInputOuter,
                phoneFocused && styles.phoneInputOuterFocused,
                !isPhoneValid && phoneDigits.length > 0 && styles.phoneInputOuterError,
                isPhoneComplete && styles.phoneInputOuterValid,
              ]}
            >
              <View style={styles.phonePrefixBadge}>
                <Text style={styles.phonePrefixText}>+237</Text>
              </View>
              <TextInput
                ref={phoneInputRef}
                style={styles.phoneInput}
                value={phoneNumber}
                onChangeText={handlePhoneChange}
                onFocus={() => setPhoneFocused(true)}
                onBlur={() => setPhoneFocused(false)}
                placeholder="6 XX XX XX XX"
                placeholderTextColor={colors.textMuted}
                keyboardType="phone-pad"
                maxLength={13}
                autoComplete="tel"
                textContentType="telephoneNumber"
                selectionColor={colors.gold}
                cursorColor={colors.gold}
                accessibilityLabel="Numero de telephone"
              />
              <Animated.View style={[styles.phoneIcon, { transform: [{ scale: validScale }] }]}>
                {isPhoneComplete ? (
                  <CircleCheck size={22} color={colors.success} strokeWidth={2} />
                ) : (
                  <Phone size={22} color={phoneFocused ? colors.goldBright : colors.goldMuted} strokeWidth={1.5} />
                )}
              </Animated.View>
            </Pressable>
            </Animated.View>

            <View style={styles.phoneHint}>
              {!isPhoneValid && phoneDigits.length > 0 ? (
                <>
                  <CircleAlert size={14} color={colors.danger} strokeWidth={2} />
                  <Text style={styles.phoneErrorText}>
                    Numero invalide. Format : 6 XX XX XX XX
                  </Text>
                </>
              ) : (
                <Text style={styles.phoneHintText}>
                  {isPhoneComplete
                    ? 'Numero valide ✓'
                    : 'Entrez votre numero Mobile Money (9 chiffres)'}
                </Text>
              )}
            </View>
          </View>

          <View style={styles.confirmWrap}>
            {canProceed && (
              <Animated.View style={[styles.confirmShimmer, { transform: [{ translateX: shimmerTranslate }] }]} pointerEvents="none">
                <LinearGradient colors={['transparent', 'rgba(255,255,255,0.28)', 'transparent']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ flex: 1, borderRadius: radius.md }} />
              </Animated.View>
            )}
            <Button
              variant="primary"
              size="lg"
              fullWidth
              disabled={!canProceed}
              onPress={handleConfirmPayment}
              icon={<ArrowRight size={20} strokeWidth={2.25} />}
            >
              {canProceed ? `Confirmer ${formatPrice(displayTotal)}` : 'Confirmer'}
            </Button>
          </View>

          {!canProceed && ctaHelper ? (
            <Text style={styles.ctaHelperText}>{ctaHelper}</Text>
          ) : null}

          <Pressable
            onPress={handleBack}
            style={styles.cancelButton}
            accessibilityRole="button"
            accessibilityLabel="Annuler"
          >
            <Text style={styles.cancelButtonText}>Annuler</Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
    </ImageBackground>
  );
}
