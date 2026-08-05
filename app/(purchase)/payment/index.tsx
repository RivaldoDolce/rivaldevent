/**
 * Page selection operateur Mobile Money - Tunnel d'achat.
 *
 * Design ultra-premium inspire de Stripe Checkout et Apple Pay :
 * - Header elegant avec bouton retour
 * - Recapitulatif compact avec total en or
 * - Selecteur d'operateur avec logos SVG et branding colore
 * - Champ telephone premium avec prefixe +237, auto-format,
 *   validation temps reel, et clavier qui ne masque pas le champ
 * - Bouton "Confirmer le paiement" inline (pas de barre fixe)
 *   pour eviter les problemes de clavier
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
} from 'lucide-react-native';
import { Image } from 'expo-image';

import { colors, spacing, radii, shadows, ROUTES } from '@/lib/constants';
import { useHaptics } from '@/hooks/useHaptics';
import { useOffline } from '@/hooks/useOffline';
import { formatPrice } from '@/services/event.service';
import { usePurchaseFlowStore } from '@/stores/purchase-flow-store';
import type { PaymentMethod } from '@/types';

// ============================================================
// Types
// ============================================================

interface OperatorInfo {
  readonly id: PaymentMethod;
  readonly name: string;
  readonly subtitle: string;
  readonly logoSource: ReturnType<typeof require>;
  readonly accentColor: string;
}

// ============================================================
// Donnees operateurs
// ============================================================

const OPERATORS: readonly OperatorInfo[] = [
  {
    id: 'mtn',
    name: 'MTN MoMo',
    subtitle: 'Mobile Money',
    logoSource: require('@/assets/icons/mtn-logo.svg'),
    accentColor: '#FFC300',
  },
  {
    id: 'orange',
    name: 'Orange Money',
    subtitle: 'Paiement mobile',
    logoSource: require('@/assets/icons/orange-logo.svg'),
    accentColor: '#FF7900',
  },
  {
    id: 'moov',
    name: 'Moov Money',
    subtitle: 'Transfert mobile',
    logoSource: require('@/assets/icons/moov-logo.svg'),
    accentColor: '#0099FF',
  },
] as const;

// ============================================================
// Helper : valider numero camerounais
// ============================================================

function isValidCameroonPhone(phone: string): boolean {
  const cleaned = phone.replace(/\s/g, '');
  return /^6\d{8}$/.test(cleaned);
}

/**
 * Auto-formatage du numero : 6 XX XX XX XX
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
    paddingVertical: spacing.md,
  },
  headerBackButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.ivory,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  headerTitle: {
    fontFamily: 'PlayfairDisplay-Bold',
    fontSize: 22,
    lineHeight: 28,
    color: colors.onyx,
  },

  /* Contenu */
  content: {
    paddingHorizontal: spacing.lg,
  },

  /* Recapitulatif */
  recapCard: {
    backgroundColor: colors.white,
    borderRadius: radii.xl,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    ...shadows.eventCard,
  },
  recapHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  recapHeaderText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    lineHeight: 20,
    color: colors.onyx,
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
  recapTierPrice: {
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
  sectionTitle: {
    fontFamily: 'PlayfairDisplay-SemiBold',
    fontSize: 20,
    lineHeight: 26,
    color: colors.onyx,
    marginBottom: spacing.md,
  },

  /* Carte operateur premium */
  operatorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: radii.xl,
    padding: spacing.md + 2,
    borderWidth: 2,
    borderColor: 'transparent',
    marginBottom: spacing.md,
    overflow: 'hidden',
    ...shadows.card,
  },
  operatorCardSelected: {
    borderColor: colors.terracotta,
    backgroundColor: `${colors.terracotta}05`,
  },
  operatorLogoWrap: {
    width: 56,
    height: 56,
    borderRadius: radii.lg,
    backgroundColor: colors.ivory,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
    overflow: 'hidden',
  },
  operatorLogo: {
    width: 44,
    height: 44,
  },
  operatorInfo: {
    flex: 1,
  },
  operatorName: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    lineHeight: 22,
    color: colors.onyx,
    marginBottom: 2,
  },
  operatorNameSelected: {
    color: colors.terracotta,
  },
  operatorSubtitle: {
    fontFamily: 'Inter-Regular',
    fontSize: 13,
    lineHeight: 18,
    color: colors.stone,
  },
  operatorCheckCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: spacing.sm,
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
    borderWidth: 2,
    borderColor: colors.border,
    ...shadows.card,
  },
  phoneInputOuterFocused: {
    borderColor: colors.terracotta,
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

  /* Bouton confirmer premium */
  confirmButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.terracotta,
    borderRadius: radii.xl,
    paddingVertical: spacing.md + 4,
    paddingHorizontal: spacing.xl,
    gap: spacing.sm,
    marginBottom: spacing.md,
    ...shadows.eventCard,
  },
  confirmButtonDisabled: {
    opacity: 0.5,
  },
  confirmButtonText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 17,
    lineHeight: 24,
    color: colors.white,
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

  // -- Validation --
  const phoneDigits = phoneNumber.replace(/\s/g, '');
  const isPhoneValid = phoneDigits.length === 0 || isValidCameroonPhone(phoneDigits);
  const isPhoneComplete = isValidCameroonPhone(phoneDigits);

  const canProceed = useMemo(() => {
    return selectedOperator !== null
      && isPhoneComplete
      && !isOffline;
  }, [selectedOperator, isPhoneComplete, isOffline]);

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
          <Text style={styles.headerTitle}>Paiement</Text>
        </View>

        <View style={styles.content}>
          {/* =============================================
              RECAPITULATIF
              ============================================= */}
          <View style={styles.recapCard}>
            <View style={styles.recapHeader}>
              <Ticket size={18} color={colors.terracotta} strokeWidth={1.5} />
              <Text style={styles.recapHeaderText}>Votre commande</Text>
            </View>

            {parsedTiers.map((tier, index) => (
              <View key={tier.tierId ?? index} style={styles.recapRow}>
                <Text style={styles.recapTierName}>
                  {tier.quantity}x billet{tier.quantity > 1 ? 's' : ''}
                </Text>
                <Text style={styles.recapTierPrice}>
                  {tier.quantity} place{tier.quantity > 1 ? 's' : ''}
                </Text>
              </View>
            ))}

            <View style={styles.recapSeparator} />

            <View style={styles.recapTotalRow}>
              <Text style={styles.recapTotalLabel}>Total a payer</Text>
              <Text style={styles.recapTotalValue}>{formatPrice(totalAmount)}</Text>
            </View>
          </View>

          {/* Badge securise */}
          <View style={styles.securityRow}>
            <ShieldCheck size={18} color={colors.forest} strokeWidth={2} />
            <Text style={styles.securityText}>
              Paiement securise - Donnees chiffrees
            </Text>
          </View>

          {/* =============================================
              SELECTION OPERATEUR
              ============================================= */}
          <Text style={styles.sectionTitle}>Operateur Mobile Money</Text>

          {OPERATORS.map((op) => {
            const isSelected = selectedOperator === op.id;
            return (
              <Pressable
                key={op.id}
                onPress={() => handleOperatorSelect(op.id)}
                style={[
                  styles.operatorCard,
                  isSelected && styles.operatorCardSelected,
                ]}
                accessibilityRole="button"
                accessibilityLabel={op.name}
                accessibilityState={{ selected: isSelected }}
              >
                {/* Logo */}
                <View style={styles.operatorLogoWrap}>
                  <Image
                    source={op.logoSource}
                    style={styles.operatorLogo}
                    contentFit="contain"
                  />
                </View>

                {/* Info */}
                <View style={styles.operatorInfo}>
                  <Text style={[
                    styles.operatorName,
                    isSelected && styles.operatorNameSelected,
                  ]}>
                    {op.name}
                  </Text>
                  <Text style={styles.operatorSubtitle}>{op.subtitle}</Text>
                </View>

                {/* Indicateur selection */}
                <View style={[
                  styles.operatorCheckCircle,
                  { backgroundColor: isSelected ? colors.terracotta : colors.ivory },
                ]}>
                  {isSelected && (
                    <CircleCheck size={18} color={colors.white} strokeWidth={2.5} />
                  )}
                </View>
              </Pressable>
            );
          })}

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
                maxLength={12}
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
              BOUTON CONFIRMER
              ============================================= */}
          <Pressable
            onPress={handleConfirmPayment}
            style={[styles.confirmButton, !canProceed && styles.confirmButtonDisabled]}
            disabled={!canProceed}
            accessibilityRole="button"
            accessibilityLabel="Confirmer le paiement"
          >
            <Text style={styles.confirmButtonText}>Confirmer le paiement</Text>
            <ArrowRight size={20} color={colors.white} strokeWidth={2} />
          </Pressable>

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
