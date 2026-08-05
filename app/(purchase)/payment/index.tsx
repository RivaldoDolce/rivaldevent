/**
 * Page selection de l'operateur Mobile Money.
 *
 * Route : /(purchase)/payment
 * Params : eventId, tiers (JSON), totalAmount
 *
 * Design "Minimalisme Africain Camerounais" :
 * - Recapitulatif de la commande (total, nb billets)
 * - Selecteur d'operateur (MTN, Orange, Moov)
 * - Champ numero de telephone avec validation
 * - Indication des prefixes compatibles
 * - CTA "Continuer" qui navigue vers le flux de l'operateur
 * - Bouton retour
 *
 * Conventions :
 * - Design tokens depuis lib/constants.ts
 * - lucide-react-native pour les icones
 * - Pas de type any, pas d'emojis
 * - Imports @/
 * - Commentaires en francais
 */

import { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  ChevronLeft,
  Phone,
  AlertCircle,
  Ticket,
  ArrowRight,
  Info,
} from 'lucide-react-native';

import { colors, spacing, radii, ROUTES } from '@/lib/constants';
import { useHaptics } from '@/hooks/useHaptics';
import { formatPrice } from '@/services/event.service';
import {
  validateCameroonPhone,
  isPhoneCompatibleWithOperator,
  formatPhoneNumber,
  paymentService,
} from '@/services/payment.service';
import type { PaymentMethod } from '@/types';
import OperatorSelector from '@/components/payment/OperatorSelector';

// ============================================================
// Types
// ============================================================

interface TierParam {
  readonly tierId: string;
  readonly quantity: number;
}

// ============================================================
// Constantes
// ============================================================

/** Mapping operateur -> route de paiement */
const OPERATOR_ROUTES: Record<PaymentMethod, string> = {
  mtn: ROUTES.PAYMENT_MTN,
  orange: ROUTES.PAYMENT_ORANGE,
  moov: ROUTES.PAYMENT_MOOV,
};

/** Mapping operateur -> nom complet */
const OPERATOR_NAMES: Record<PaymentMethod, string> = {
  mtn: 'MTN Mobile Money',
  orange: 'Orange Money',
  moov: 'Moov Money',
};

// ============================================================
// Composant
// ============================================================

export default function PaymentIndex() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { impact, notification } = useHaptics();

  // -- Params depuis la page de selection de billets --
  const params = useLocalSearchParams<{
    eventId: string;
    tiers: string;
    totalAmount: string;
  }>();

  const totalAmount = useMemo(() => {
    return parseInt(params.totalAmount ?? '0', 10) || 0;
  }, [params.totalAmount]);

  const tiers = useMemo((): TierParam[] => {
    try {
      return JSON.parse(params.tiers ?? '[]');
    } catch {
      return [];
    }
  }, [params.tiers]);

  const totalTickets = useMemo(() => {
    return tiers.reduce((sum, t) => sum + t.quantity, 0);
  }, [tiers]);

  // -- State --
  const [selectedOperator, setSelectedOperator] = useState<PaymentMethod | null>(null);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [phoneError, setPhoneError] = useState<string | null>(null);

  // -- Validation --
  const isPhoneValid = useMemo(() => {
    if (!phoneNumber || !selectedOperator) return false;
    const cleaned = phoneNumber.replace(/\s/g, '');
    return validateCameroonPhone(cleaned) && isPhoneCompatibleWithOperator(cleaned, selectedOperator);
  }, [phoneNumber, selectedOperator]);

  const canContinue = useMemo(() => {
    return selectedOperator !== null && isPhoneValid;
  }, [selectedOperator, isPhoneValid]);

  // -- Handlers --
  const handleOperatorSelect = useCallback((operator: PaymentMethod) => {
    impact('light');
    setSelectedOperator(operator);
    setPhoneError(null);
  }, [impact]);

  const handlePhoneChange = useCallback((text: string) => {
    // Nettoyer : uniquement chiffres, max 9
    const cleaned = text.replace(/[^0-9]/g, '').slice(0, 9);
    // Formater pour l'affichage
    setPhoneNumber(formatPhoneNumber(cleaned));
    setPhoneError(null);
  }, []);

  const handlePhoneBlur = useCallback(() => {
    if (!phoneNumber || !selectedOperator) return;

    const cleaned = phoneNumber.replace(/\s/g, '');
    if (!validateCameroonPhone(cleaned)) {
      setPhoneError('Numero invalide (9 chiffres commencant par 6)');
      return;
    }

    if (!isPhoneCompatibleWithOperator(cleaned, selectedOperator)) {
      const prefixes = paymentService.getOperatorPrefixes(selectedOperator);
      setPhoneError(`Prefixe incompatible. Prefixes ${OPERATOR_NAMES[selectedOperator]} : ${prefixes.join(', ')}`);
      return;
    }

    setPhoneError(null);
  }, [phoneNumber, selectedOperator]);

  const handleBack = useCallback(() => {
    impact('light');
    if (router.canGoBack()) {
      router.back();
    }
  }, [impact, router]);

  const handleContinue = useCallback(() => {
    if (!canContinue || !selectedOperator) {
      notification('warning');
      return;
    }

    impact('medium');
    const cleaned = phoneNumber.replace(/\s/g, '');

    // Navigation vers le flux de l'operateur selectionne
    router.push({
      pathname: OPERATOR_ROUTES[selectedOperator],
      params: {
        eventId: params.eventId ?? '',
        operator: selectedOperator,
        phone: cleaned,
        totalAmount: String(totalAmount),
        tiers: params.tiers ?? '[]',
      },
    } as never);
  }, [canContinue, selectedOperator, phoneNumber, impact, notification, router, params, totalAmount]);

  // -- Prefixes info --
  const prefixInfo = useMemo(() => {
    if (!selectedOperator) return '';
    const prefixes = paymentService.getOperatorPrefixes(selectedOperator);
    return `Prefixes ${OPERATOR_NAMES[selectedOperator]} : ${prefixes.join(', ')}`;
  }, [selectedOperator]);

  // ============================================================
  // Rendu
  // ============================================================

  return (
    <View style={styles.root}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <Pressable onPress={handleBack} style={styles.backButton} hitSlop={8}>
          <ChevronLeft size={22} color={colors.onyx} strokeWidth={2} />
        </Pressable>
        <Text style={styles.headerTitle}>Paiement</Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.content}>
        {/* Recapitulatif */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <View style={styles.summaryLeft}>
              <Ticket size={16} color={colors.terracotta} strokeWidth={1.5} />
              <Text style={styles.summaryLabel}>Billets</Text>
            </View>
            <Text style={styles.summaryValue}>
              {totalTickets} billet{totalTickets > 1 ? 's' : ''}
            </Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryRow}>
            <Text style={styles.summaryTotalLabel}>Total a payer</Text>
            <Text style={styles.summaryTotalValue}>
              {formatPrice(totalAmount)}
            </Text>
          </View>
        </View>

        {/* Selection operateur */}
        <Text style={styles.sectionTitle}>Choisir l'operateur</Text>
        <OperatorSelector
          selected={selectedOperator}
          onSelect={handleOperatorSelect}
        />

        {/* Numero de telephone */}
        {selectedOperator && (
          <View style={styles.phoneSection}>
            <Text style={styles.sectionTitle}>
              Numero {OPERATOR_NAMES[selectedOperator]}
            </Text>

            {/* Info prefixes */}
            <View style={styles.prefixInfo}>
              <Info size={14} color={colors.stone} strokeWidth={1.5} />
              <Text style={styles.prefixText}>{prefixInfo}</Text>
            </View>

            <View style={[styles.phoneInputContainer, phoneError && styles.phoneInputError]}>
              <Phone size={18} color={colors.stone} strokeWidth={1.5} />
              <TextInput
                style={styles.phoneInput}
                value={phoneNumber}
                onChangeText={handlePhoneChange}
                onBlur={handlePhoneBlur}
                placeholder="6XX XXX XX X"
                placeholderTextColor={colors.stone}
                keyboardType="phone-pad"
                maxLength={12} // 9 chiffres + 3 espaces
                autoComplete="tel"
                accessibilityLabel="Numero de telephone"
              />
              <Text style={styles.phonePrefix}>+237</Text>
            </View>

            {/* Erreur */}
            {phoneError && (
              <View style={styles.errorContainer}>
                <AlertCircle size={14} color={colors.danger} strokeWidth={1.5} />
                <Text style={styles.errorText}>{phoneError}</Text>
              </View>
            )}
          </View>
        )}
      </View>

      {/* CTA fixe en bas */}
      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + spacing.md }]}>
        <Pressable
          style={[styles.continueButton, !canContinue && styles.continueButtonDisabled]}
          onPress={handleContinue}
          disabled={!canContinue}
          accessibilityRole="button"
          accessibilityLabel="Continuer vers le paiement"
        >
          <Text style={styles.continueButtonText}>
            {selectedOperator ? 'Continuer' : 'Selectionnez un operateur'}
          </Text>
          {canContinue && (
            <ArrowRight size={18} color={colors.white} strokeWidth={2} />
          )}
        </Pressable>
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

  /* Header */
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.ivory,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    fontFamily: 'PlayfairDisplay-Bold',
    fontSize: 22,
    lineHeight: 28,
    color: colors.onyx,
    letterSpacing: -0.3,
    textAlign: 'center',
  },
  headerSpacer: {
    width: 36,
  },

  /* Contenu */
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },

  /* Recapitulatif */
  summaryCard: {
    backgroundColor: colors.ivory,
    borderRadius: radii.lg,
    padding: spacing.md,
    marginBottom: spacing.xl,
    borderWidth: 1,
    borderColor: `${colors.terracotta}15`,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  summaryLabel: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    lineHeight: 20,
    color: colors.stone,
  },
  summaryValue: {
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

  /* Section */
  sectionTitle: {
    fontFamily: 'PlayfairDisplay-SemiBold',
    fontSize: 18,
    lineHeight: 24,
    color: colors.onyx,
    letterSpacing: -0.3,
    marginBottom: spacing.md,
  },

  /* Telephone */
  phoneSection: {
    marginTop: spacing.xl,
  },
  prefixInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: `${colors.indigo}08`,
    borderRadius: radii.sm,
    padding: spacing.sm,
    marginBottom: spacing.md,
  },
  prefixText: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    lineHeight: 16,
    color: colors.stone,
    flex: 1,
  },
  phoneInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    borderWidth: 1.5,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
    minHeight: 52,
  },
  phoneInputError: {
    borderColor: colors.danger,
  },
  phoneInput: {
    flex: 1,
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    lineHeight: 22,
    color: colors.onyx,
    paddingVertical: spacing.md,
  },
  phonePrefix: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    lineHeight: 20,
    color: colors.stone,
  },

  /* Erreur */
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  errorText: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    lineHeight: 16,
    color: colors.danger,
    flex: 1,
  },

  /* Barre basse */
  bottomBar: {
    backgroundColor: colors.white,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    paddingTop: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  continueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.terracotta,
    borderRadius: radii.lg,
    paddingVertical: spacing.md,
    minHeight: 52,
  },
  continueButtonDisabled: {
    backgroundColor: colors.stone,
    opacity: 0.5,
  },
  continueButtonText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    lineHeight: 24,
    color: colors.white,
  },
});