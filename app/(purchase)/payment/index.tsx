/**
 * Page selection operateur Mobile Money - Tunnel d'achat.
 *
 * Design ultra-premium inspire de Stripe Checkout, Apple Pay et Revolut :
 * - Header elegant avec retour et sous-titre
 * - Recapitulatif style "ticket stub" sur carte onyx avec liseret
 *   perfore, montant en or, et badges qualite SVG (VIP/Premium/Standard)
 * - Selecteur d'operateur avec logos SVG, couleur de marque,
 *   badge "Populaire" et etat de selection affirmatif
 * - Champ telephone premium avec prefixe +237, auto-format sur 9 chiffres
 *   (maxLength corrige), validation temps reel et clavier non masquant
 * - Bouton "Confirmer le paiement" inline pour eviter les problemes de clavier
 * - Badge de securite discret
 *
 * Navigation :
 * - Recoit { eventId, tiers, totalAmount } en parametres
 * - CTA navigue vers la page de paiement specifique (mtn/orange/moov)
 *
 * Conventions :
 * - Design tokens depuis lib/constants.ts
 * - Pas de type any (sauf router.push as never), pas d'emojis
 * - Imports @/
 * - Commentaires en francais
 */

import { useState, useCallback, useMemo, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  ChevronLeft,
  ShieldCheck,
  Phone,
  ArrowRight,
  Ticket,
  CircleCheck,
  AlertCircle,
  Info,
  CalendarDays,
  MapPin,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

import MtnLogo from '@/assets/icons/mtn-logo.svg';
import OrangeLogo from '@/assets/icons/orange-logo.svg';
import MoovLogo from '@/assets/icons/moov-logo.svg';
import QualityPremiumIcon from '@/assets/icons/quality-premium.svg';
import QualityVipIcon from '@/assets/icons/quality-VIP.svg';
import QualityStandardIcon from '@/assets/icons/quality-standart.svg';

import { colors, spacing, radii, shadows, ROUTES } from '@/lib/constants';
import { useHaptics } from '@/hooks/useHaptics';
import { useOffline } from '@/hooks/useOffline';
import { formatPrice, formatDate } from '@/services/event.service';
import { usePurchaseFlowStore } from '@/stores/purchase-flow-store';
import type { SelectedTierInfo } from '@/stores/purchase-flow-store';
import type { PaymentMethod } from '@/types';

// ============================================================
// Types
// ============================================================

interface OperatorInfo {
  readonly id: PaymentMethod;
  readonly name: string;
  readonly subtitle: string;
  readonly logoSource: React.ComponentType<{ width?: number; height?: number }>;
  readonly gradient: readonly [string, string];
  readonly textColor: string;
  readonly badge?: string;
}

interface QualityInfo {
  readonly source: React.ComponentType<{ width?: number; height?: number }>;
  readonly label: string;
  readonly accent: string;
}

interface RecapRow {
  readonly key: string;
  readonly tierName: string;
  readonly quantity: number;
  readonly subtotal: number | null;
  readonly quality: QualityInfo;
}

// ============================================================
// Donnees operateurs
// ============================================================

const OPERATORS: readonly OperatorInfo[] = [
  {
    id: 'mtn',
    name: 'MTN MoMo',
    subtitle: 'Mobile Money',
    logoSource: MtnLogo,
    gradient: ['#FFD24A', '#E7A400'],
    textColor: colors.onyx,
    badge: 'Populaire',
  },
  {
    id: 'orange',
    name: 'Orange Money',
    subtitle: 'Paiement mobile',
    logoSource: OrangeLogo,
    gradient: ['#FF8A21', '#E05200'],
    textColor: colors.white,
  },
  {
    id: 'moov',
    name: 'Moov Money',
    subtitle: 'Transfert mobile',
    logoSource: MoovLogo,
    gradient: ['#2EAAFF', '#0068D6'],
    textColor: colors.white,
  },
] as const;

// ============================================================
// Helper : badge qualite selon le nom du tier
// ============================================================

function getQualityForTier(name: string): QualityInfo {
  const lower = name.toLowerCase();
  if (lower.includes('premium') || lower.includes('vvip')) {
    return { source: QualityPremiumIcon, label: 'PREMIUM', accent: colors.gold };
  }
  if (lower.includes('vip')) {
    return { source: QualityVipIcon, label: 'VIP', accent: colors.mango };
  }
  return { source: QualityStandardIcon, label: 'STANDARD', accent: colors.ivory };
}

// ============================================================
// Helper : valider numero camerounais
// ============================================================

function isValidCameroonPhone(phone: string): boolean {
  const cleaned = phone.replace(/\s/g, '');
  return /^6\d{8}$/.test(cleaned);
}

/**
 * Auto-formatage du numero : 6 XX XX XX XX (13 caracteres max)
 */
function formatPhoneNumber(input: string): string {
  // Ne garder que les chiffres
  const digits = input.replace(/\D/g, '').slice(0, 9);
  if (digits.length === 0) return '';
  if (digits.length <= 1) return digits;
  if (digits.length <= 3) return `${digits.slice(0, 1)} ${digits.slice(1)}`;
  if (digits.length <= 5) return `${digits.slice(0, 1)} ${digits.slice(1, 3)} ${digits.slice(3)}`;
  if (digits.length <= 7) return `${digits.slice(0, 1)} ${digits.slice(1, 3)} ${digits.slice(3, 5)} ${digits.slice(5)}`;
  return `${digits.slice(0, 1)} ${digits.slice(1, 3)} ${digits.slice(3, 5)} ${digits.slice(5, 7)} ${digits.slice(7)}`;
}

// ============================================================
// Styles
// ============================================================

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.sand,
  },

  /* Header premium */
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  headerBackButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
    ...shadows.search,
  },
  headerTitleArea: {
    flex: 1,
  },
  headerTitle: {
    fontFamily: 'PlayfairDisplay-Bold',
    fontSize: 24,
    lineHeight: 30,
    color: colors.onyx,
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontFamily: 'Inter-Regular',
    fontSize: 13,
    lineHeight: 18,
    color: colors.stone,
    marginTop: 2,
  },

  /* Contenu */
  content: {
    paddingHorizontal: spacing.lg,
  },

  /* =====================================================
     Recapitulatif "ticket stub" - carte onyx premium
     ===================================================== */
  recapCard: {
    borderRadius: radii.xxl,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    marginTop: spacing.sm,
    overflow: 'hidden',
    ...shadows.eventCard,
  },
  recapTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  recapOverline: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 11,
    lineHeight: 15,
    letterSpacing: 1.5,
    color: colors.gold,
  },
  recapEventTitle: {
    fontFamily: 'PlayfairDisplay-Bold',
    fontSize: 19,
    lineHeight: 26,
    color: colors.white,
    marginBottom: spacing.md,
    letterSpacing: -0.2,
  },
  /* Meta date / lieu sur le stub */
  recapMetaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  recapMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: `${colors.white}10`,
    borderRadius: radii.full,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 5,
  },
  recapMetaText: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    lineHeight: 16,
    color: `${colors.white}99`,
  },
  recapTierRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  recapQualityTile: {
    width: 38,
    height: 38,
    borderRadius: radii.md,
    backgroundColor: `${colors.white}14`,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  recapTierInfo: {
    flex: 1,
  },
  recapTierName: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    lineHeight: 20,
    color: colors.white,
  },
  recapTierQuantity: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    lineHeight: 16,
    color: `${colors.white}99`,
  },
  recapTierSubtotal: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    lineHeight: 20,
    color: colors.white,
  },

  /* Liseret perfore */
  recapDividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing.md,
    position: 'relative',
  },
  dashedLine: {
    flex: 1,
    height: 1,
    borderTopWidth: 1,
    borderStyle: 'dashed',
    borderColor: `${colors.white}30`,
  },
  dividerDiamond: {
    width: 8,
    height: 8,
    backgroundColor: colors.gold,
    transform: [{ rotate: '45deg' }],
    marginHorizontal: spacing.sm,
  },
  /* Encoches perforees - moities de cercles qui "mordent" les bords */
  notchLeft: {
    position: 'absolute',
    left: -40,
    top: 0,
    marginTop: -16,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.sand,
  },
  notchRight: {
    position: 'absolute',
    right: -40,
    top: 0,
    marginTop: -16,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.sand,
  },

  /* Total */
  recapTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  recapTotalLabelArea: {
    flex: 1,
  },
  recapTotalLabel: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    lineHeight: 16,
    color: `${colors.white}99`,
  },
  recapTotalCaption: {
    fontFamily: 'Inter-Regular',
    fontSize: 11,
    lineHeight: 15,
    color: `${colors.white}66`,
    marginTop: 2,
  },
  recapTotalValue: {
    fontFamily: 'PlayfairDisplay-Bold',
    fontSize: 26,
    lineHeight: 32,
    color: colors.gold,
  },

  /* Securite badge */
  securityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${colors.forest}08`,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  securityText: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    lineHeight: 16,
    color: colors.forest,
  },

  /* Section titre */
  sectionOverline: {
    fontFamily: 'Inter-Bold',
    fontSize: 11,
    lineHeight: 15,
    letterSpacing: 2,
    color: colors.gold,
    marginBottom: spacing.xs,
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
    marginTop: 2,
    marginBottom: spacing.md,
  },

  /* Carte operateur premium - degrade marque */
  operatorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radii.xl,
    padding: spacing.md + 2,
    borderWidth: 2,
    borderColor: 'transparent',
    marginBottom: spacing.md,
    overflow: 'hidden',
  },
  operatorCardSelected: {
    borderColor: colors.white,
    ...shadows.eventCard,
  },
  operatorCardPressable: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  operatorLogoWrap: {
    width: 56,
    height: 56,
    borderRadius: radii.lg,
    backgroundColor: colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
    overflow: 'hidden',
    ...shadows.search,
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
    fontFamily: 'Inter-SemiBold',
    fontSize: 17,
    lineHeight: 23,
    color: colors.onyx,
    letterSpacing: -0.2,
  },
  operatorBadge: {
    borderRadius: radii.full,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 3,
    borderWidth: 1,
  },
  operatorBadgeText: {
    fontFamily: 'Inter-Bold',
    fontSize: 10,
    lineHeight: 13,
    letterSpacing: 0.8,
  },
  operatorSubtitle: {
    fontFamily: 'Inter-Regular',
    fontSize: 13,
    lineHeight: 18,
    color: colors.stone,
  },
  operatorCheckOuter: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: `${colors.white}B3`,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: spacing.sm,
  },
  operatorCheckOuterSelected: {
    borderColor: colors.white,
    backgroundColor: colors.white,
  },

  /* Indication dynamique sous la liste */
  operatorHintRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.search,
  },
  operatorHintText: {
    flex: 1,
    fontFamily: 'Inter-Regular',
    fontSize: 13,
    lineHeight: 18,
    color: colors.text,
  },
  operatorHintTextSelected: {
    color: colors.terracotta,
    fontFamily: 'Inter-SemiBold',
  },

  /* Champ telephone premium */
  phoneSection: {
    marginTop: spacing.lg,
    marginBottom: spacing.xl,
  },
  phoneLabel: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 15,
    lineHeight: 20,
    color: colors.onyx,
    marginBottom: spacing.sm,
  },
  phoneInputOuter: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: radii.xl,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    ...shadows.card,
  },
  phoneInputOuterFocused: {
    borderColor: colors.terracotta,
    ...shadows.eventCard,
  },
  phoneInputOuterError: {
    borderColor: colors.danger,
  },
  phoneInputOuterValid: {
    borderColor: colors.forest,
  },
  phonePrefixBadge: {
    backgroundColor: colors.ivory,
    borderRadius: radii.md,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.xs + 1,
    marginRight: spacing.md,
  },
  phonePrefixText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    lineHeight: 22,
    color: colors.onyx,
  },
  phoneInput: {
    flex: 1,
    fontFamily: 'Inter-Regular',
    fontSize: 18,
    lineHeight: 24,
    color: colors.onyx,
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
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    lineHeight: 16,
    color: colors.stone,
  },
  phoneErrorText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 12,
    lineHeight: 16,
    color: colors.danger,
  },

  /* Bouton confirmer premium - pilule degrade or */
  confirmButton: {
    borderRadius: radii.xl,
    marginBottom: spacing.sm,
    shadowColor: colors.gold,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 6,
  },
  confirmButtonDisabled: {
    shadowOpacity: 0,
    elevation: 0,
  },
  confirmGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md + 4,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.xl,
  },
  confirmButtonText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 17,
    lineHeight: 24,
    color: colors.onyx,
  },
  confirmButtonTextDisabled: {
    color: colors.stone,
  },
  ctaHelperText: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    lineHeight: 16,
    color: colors.stone,
    textAlign: 'center',
    marginBottom: spacing.md,
  },

  /* Bouton annuler */
  cancelButton: {
    alignItems: 'center',
    paddingVertical: spacing.md,
    marginBottom: spacing.lg,
  },
  cancelButtonText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    lineHeight: 20,
    color: colors.stone,
  },
});

// ============================================================
// Composant principal
// ============================================================

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

  // -- Refs --
  const phoneInputRef = useRef<TextInput>(null);

  // -- State --
  const [selectedOperator, setSelectedOperator] = useState<PaymentMethod | null>(null);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [phoneFocused, setPhoneFocused] = useState(false);

  // -- Parse params --
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

  // -- Lignes du recapitulatif : privilegie le store (riches),
  //    sinon repli sur les parametres de navigation --
  const recapRows: RecapRow[] = useMemo(() => {
    if (flow.selectedTiers.length > 0) {
      return flow.selectedTiers
        .filter((tier: SelectedTierInfo) => tier.quantity > 0)
        .map((tier: SelectedTierInfo) => ({
          key: tier.tierId,
          tierName: tier.tierName,
          quantity: tier.quantity,
          subtotal: tier.quantity * tier.unitPrice,
          quality: getQualityForTier(tier.tierName),
        }));
    }
    return parsedTiers.map((tier) => ({
      key: tier.tierId ?? `${tier.quantity}`,
      tierName: 'Billet',
      quantity: tier.quantity,
      subtotal: null,
      quality: getQualityForTier('standard'),
    }));
  }, [flow.selectedTiers, parsedTiers]);

  const displayTotal = flow.totalAmount > 0 ? flow.totalAmount : totalAmount;
  const displayEventTitle = flow.eventTitle ?? 'Votre commande';
  const displayEventDate = flow.eventStartDate ? formatDate(flow.eventStartDate) : '';
  const displayEventCity = flow.eventCity ?? '';

  // -- Validation --
  const phoneDigits = phoneNumber.replace(/\s/g, '');
  const isPhoneValid = phoneDigits.length === 0 || isValidCameroonPhone(phoneDigits);
  const isPhoneComplete = isValidCameroonPhone(phoneDigits);

  const canProceed = useMemo(() => {
    return selectedOperator !== null
      && isPhoneComplete
      && !isOffline;
  }, [selectedOperator, isPhoneComplete, isOffline]);

  // -- Aide contextuelle sous le bouton --
  const ctaHelper = useMemo(() => {
    if (isOffline) return 'Hors ligne - verifiez votre connexion';
    if (!selectedOperator) return 'Selectionnez un operateur pour continuer';
    if (!isPhoneComplete) return 'Entrez votre numero (9 chiffres) pour continuer';
    return '';
  }, [isOffline, selectedOperator, isPhoneComplete]);

  // -- Handlers --
  const handleBack = useCallback(() => {
    impact('light');
    router.back();
  }, [impact, router]);

  const handleOperatorSelect = useCallback((operator: PaymentMethod) => {
    impact('medium');
    setSelectedOperator(operator);
    // Auto-focus le champ telephone apres selection
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

    // Mettre a jour le purchase-flow-store avec l'operateur et le numero
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

  // ============================================================
  // Rendu
  // ============================================================

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={insets.top}
    >
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingTop: insets.top,
          paddingBottom: insets.bottom + spacing.xxl,
        }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      >
        {/* Header */}
        <View style={styles.header}>
          <Pressable
            onPress={handleBack}
            style={styles.headerBackButton}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel="Retour"
          >
            <ChevronLeft size={22} color={colors.onyx} strokeWidth={2} />
          </Pressable>
          <View style={styles.headerTitleArea}>
            <Text style={styles.headerTitle}>Paiement</Text>
            <Text style={styles.headerSubtitle}>
              Choisissez votre operateur Mobile Money
            </Text>
          </View>
        </View>

        <View style={styles.content}>
          {/* =============================================
              RECAPITULATIF - ticket stub onyx premium
              ============================================= */}
          <LinearGradient
            colors={['#26221E', colors.onyx]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.recapCard}
          >
            <View style={styles.recapTopRow}>
              <Text style={styles.recapOverline}>VOTRE COMMANDE</Text>
              <Ticket size={18} color={colors.gold} strokeWidth={1.5} />
            </View>

            <Text style={styles.recapEventTitle} numberOfLines={2}>
              {displayEventTitle}
            </Text>

            {(displayEventDate || displayEventCity) && (
              <View style={styles.recapMetaRow}>
                {displayEventDate ? (
                  <View style={styles.recapMetaItem}>
                    <CalendarDays size={13} color={`${colors.white}88`} strokeWidth={1.75} />
                    <Text style={styles.recapMetaText} numberOfLines={1}>
                      {displayEventDate}
                    </Text>
                  </View>
                ) : null}
                {displayEventCity ? (
                  <View style={styles.recapMetaItem}>
                    <MapPin size={13} color={`${colors.white}88`} strokeWidth={1.75} />
                    <Text style={styles.recapMetaText} numberOfLines={1}>
                      {displayEventCity}
                    </Text>
                  </View>
                ) : null}
              </View>
            )}

            {recapRows.map((row) => (
              <View key={row.key} style={styles.recapTierRow}>
                <View style={styles.recapQualityTile}>
                  {(() => {
                    const QualityIcon = row.quality.source;
                    return <QualityIcon width={26} height={26} />;
                  })()}
                </View>
                <View style={styles.recapTierInfo}>
                  <Text style={styles.recapTierName} numberOfLines={1}>
                    {row.tierName}
                  </Text>
                  <Text style={styles.recapTierQuantity}>
                    {row.quantity} billet{row.quantity > 1 ? 's' : ''} - {row.quality.label}
                  </Text>
                </View>
                <Text style={styles.recapTierSubtotal}>
                  {row.subtotal !== null ? formatPrice(row.subtotal) : `${row.quantity}x`}
                </Text>
              </View>
            ))}

            {/* Liseret perfore avec losange or + encoches */}
            <View style={styles.recapDividerRow}>
              <View style={styles.dashedLine} />
              <View style={styles.dividerDiamond} />
              <View style={styles.dashedLine} />
              <View style={styles.notchLeft} pointerEvents="none" />
              <View style={styles.notchRight} pointerEvents="none" />
            </View>

            <View style={styles.recapTotalRow}>
              <View style={styles.recapTotalLabelArea}>
                <Text style={styles.recapTotalLabel}>Total a payer</Text>
                <Text style={styles.recapTotalCaption}>Paiement en un versement</Text>
              </View>
              <Text style={styles.recapTotalValue}>{formatPrice(displayTotal)}</Text>
            </View>
          </LinearGradient>

          {/* Badge securise */}
          <View style={styles.securityRow}>
            <ShieldCheck size={18} color={colors.forest} strokeWidth={2} />
            <Text style={styles.securityText}>
              Paiement securise - Donnees chiffrees
            </Text>
          </View>

          {/* =============================================
              SELECTION OPERATEUR - cartes degrade marque
              ============================================= */}
          <Text style={styles.sectionOverline}>PAIEMENT MOBILE</Text>
          <Text style={styles.sectionTitle}>Operateur Mobile Money</Text>
          <Text style={styles.sectionSubtitle}>
            Selectionnez votre reseau de paiement
          </Text>

          {OPERATORS.map((op) => {
            const isSelected = selectedOperator === op.id;
            const textColor = op.textColor;
            return (
              <LinearGradient
                key={op.id}
                colors={op.gradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[
                  styles.operatorCard,
                  isSelected && styles.operatorCardSelected,
                ]}
              >
                <Pressable
                  onPress={() => handleOperatorSelect(op.id)}
                  style={({ pressed }) => [
                    styles.operatorCardPressable,
                    pressed && { opacity: 0.92, transform: [{ scale: 0.99 }] },
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel={op.name}
                  accessibilityState={{ selected: isSelected }}
                >
                  {/* Logo */}
                  <View style={styles.operatorLogoWrap}>
                    {(() => {
                      const OperatorLogo = op.logoSource;
                      return <OperatorLogo width={42} height={42} />;
                    })()}
                  </View>

                  {/* Info */}
                  <View style={styles.operatorInfo}>
                    <View style={styles.operatorNameRow}>
                      <Text style={[styles.operatorName, { color: textColor }]}>
                        {op.name}
                      </Text>
                      {op.badge && (
                        <View style={[
                          styles.operatorBadge,
                          {
                            backgroundColor: `${textColor}1F`,
                            borderColor: `${textColor}40`,
                          },
                        ]}>
                          <Text style={[styles.operatorBadgeText, { color: textColor }]}>
                            {op.badge}
                          </Text>
                        </View>
                      )}
                    </View>
                    <Text style={[styles.operatorSubtitle, { color: `${textColor}B3` }]}>
                      {op.subtitle}
                    </Text>
                  </View>

                  {/* Indicateur selection */}
                  <View style={[
                    styles.operatorCheckOuter,
                    isSelected && styles.operatorCheckOuterSelected,
                  ]}>
                    {isSelected && (
                      <CircleCheck size={18} color={colors.onyx} strokeWidth={2.5} />
                    )}
                  </View>
                </Pressable>
              </LinearGradient>
            );
          })}

          {/* Indication contextuelle */}
          <View style={styles.operatorHintRow}>
            {selectedOperator ? (
              <>
                <ArrowRight size={16} color={colors.terracotta} strokeWidth={2} />
                <Text style={[styles.operatorHintText, styles.operatorHintTextSelected]}>
                  Redirection vers {OPERATORS.find((op) => op.id === selectedOperator)?.name}
                </Text>
              </>
            ) : (
              <>
                <Info size={16} color={colors.stone} strokeWidth={1.75} />
                <Text style={styles.operatorHintText}>
                  Choisissez un operateur, puis entrez votre numero
                </Text>
              </>
            )}
          </View>

          {/* =============================================
              NUMERO DE TELEPHONE
              ============================================= */}
          <View style={styles.phoneSection}>
            <Text style={styles.phoneLabel}>Numero de telephone</Text>

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
                placeholderTextColor={colors.stone}
                keyboardType="phone-pad"
                maxLength={13}
                autoComplete="tel"
                textContentType="telephoneNumber"
                accessibilityLabel="Numero de telephone"
              />
              <View style={styles.phoneIcon}>
                {isPhoneComplete ? (
                  <CircleCheck size={22} color={colors.forest} strokeWidth={2} />
                ) : (
                  <Phone size={22} color={colors.stone} strokeWidth={1.5} />
                )}
              </View>
            </Pressable>

            {/* Hint / Error */}
            <View style={styles.phoneHint}>
              {!isPhoneValid && phoneDigits.length > 0 ? (
                <>
                  <AlertCircle size={14} color={colors.danger} strokeWidth={2} />
                  <Text style={styles.phoneErrorText}>
                    Numero invalide. Format : 6 XX XX XX XX
                  </Text>
                </>
              ) : (
                <Text style={styles.phoneHintText}>
                  {isPhoneComplete
                    ? 'Numero valide'
                    : 'Entrez votre numero Mobile Money (9 chiffres)'}
                </Text>
              )}
            </View>
          </View>

          {/* =============================================
              BOUTON CONFIRMER - degrade or dynamique
              ============================================= */}
          <Pressable
            onPress={handleConfirmPayment}
            style={({ pressed }) => [
              styles.confirmButton,
              !canProceed && styles.confirmButtonDisabled,
              pressed && canProceed && { opacity: 0.92, transform: [{ scale: 0.99 }] },
            ]}
            disabled={!canProceed}
            accessibilityRole="button"
            accessibilityLabel="Confirmer le paiement"
            accessibilityState={{ disabled: !canProceed }}
          >
            <LinearGradient
              colors={canProceed ? ['#F0CD77', '#C9A84C'] : ['#EBE5DA', '#D8CFBE']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.confirmGradient}
            >
              <Text style={[
                styles.confirmButtonText,
                !canProceed && styles.confirmButtonTextDisabled,
              ]}>
                {canProceed ? `Confirmer ${formatPrice(displayTotal)}` : 'Confirmer'}
              </Text>
              <ArrowRight
                size={20}
                color={canProceed ? colors.onyx : colors.stone}
                strokeWidth={2.25}
              />
            </LinearGradient>
          </Pressable>

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
  );
}
