/**
 * Flux de paiement Orange Money.
 *
 * Route : /(purchase)/payment/orange
 * Params : eventId, operator, phone, totalAmount, tiers
 *
 * Meme structure que MTN mais avec branding Orange :
 * - Accent orange (#FF6600)
 * - Label "Orange Money"
 *
 * Conventions :
 * - Design tokens depuis lib/constants.ts
 * - Commentaires en francais
 */

import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import {
  View,
  Text,
  Pressable,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  ChevronLeft,
  CheckCircle2,
  XCircle,
} from 'lucide-react-native';

import { colors, spacing, radii, shadows } from '@/lib/constants';
import { useHaptics } from '@/hooks/useHaptics';
import { formatPrice } from '@/services/event.service';
import {
  paymentService,
  formatPhoneNumber,
  type PaymentStepStatus,
} from '@/services/payment.service';

// ============================================================
// Constantes
// ============================================================

const ORANGE_ACCENT = '#FF6600';
const ORANGE_BG = '#FF660015';

const STEPS = [
  { key: 'initiating' as PaymentStepStatus, label: 'Initiation', description: 'Preparation du paiement...' },
  { key: 'ussd_sent' as PaymentStepStatus, label: 'Validation', description: 'Validez sur votre telephone Orange' },
  { key: 'confirming' as PaymentStepStatus, label: 'Confirmation', description: 'Verification en cours...' },
  { key: 'completed' as PaymentStepStatus, label: 'Termine', description: 'Paiement confirme !' },
];

const POLL_INTERVAL = 3000;
const MAX_POLL_ATTEMPTS = 10;

// ============================================================
// Composant
// ============================================================

export default function OrangePayment() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { impact, notification } = useHaptics();
  const pollCountRef = useRef(0);

  const params = useLocalSearchParams<{
    eventId: string;
    operator: string;
    phone: string;
    totalAmount: string;
    tiers: string;
  }>();

  const phone = params.phone ?? '';
  const totalAmount = parseInt(params.totalAmount ?? '0', 10) || 0;
  const formattedPhone = useMemo(() => formatPhoneNumber(phone), [phone]);

  const [status, setStatus] = useState<PaymentStepStatus>('idle');
  const [transactionId, setTransactionId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const currentStepIndex = useMemo(() => {
    return STEPS.findIndex((s) => s.key === status);
  }, [status]);

  // -- Initiation automatique --
  useEffect(() => {
    if (status !== 'idle') return;
    const initiate = async () => {
      setStatus('initiating');
      try {
        const tiers = JSON.parse(params.tiers ?? '[]');
        const result = await paymentService.initiatePayment('orange', phone, totalAmount, params.eventId ?? '', tiers);
        setTransactionId(result.transactionId);
        setStatus(result.status);
      } catch (err) {
        setErrorMessage(err instanceof Error ? err.message : 'Erreur inattendue');
        setStatus('failed');
      }
    };
    initiate();
  }, [status, phone, totalAmount, params]);

  // -- Polling --
  useEffect(() => {
    if (status !== 'ussd_sent' && status !== 'confirming') return;
    if (!transactionId) return;
    if (pollCountRef.current >= MAX_POLL_ATTEMPTS) {
      setStatus('expired');
      setErrorMessage('Le paiement a expire. Veuillez reessayer.');
      return;
    }
    setStatus('confirming');
    const interval = setInterval(async () => {
      pollCountRef.current += 1;
      try {
        const result = await paymentService.checkPaymentStatus(transactionId);
        if (result.status === 'completed') {
          setStatus('completed');
          notification('success');
          clearInterval(interval);
        } else if (result.status === 'failed') {
          setStatus('failed');
          setErrorMessage(result.message ?? 'Le paiement a echoue.');
          notification('error');
          clearInterval(interval);
        }
      } catch { /* continue polling */ }
    }, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [status, transactionId, notification]);

  const handleBack = useCallback(() => {
    impact('light');
    if (status === 'idle' || status === 'failed' || status === 'expired') {
      if (router.canGoBack()) router.back();
    }
  }, [impact, status, router]);

  const handleCancel = useCallback(async () => {
    impact('medium');
    if (transactionId) await paymentService.cancelPayment(transactionId);
    if (router.canGoBack()) router.back();
  }, [impact, transactionId, router]);

  const handleRetry = useCallback(() => {
    impact('medium');
    setStatus('idle');
    setTransactionId(null);
    setErrorMessage(null);
    pollCountRef.current = 0;
  }, [impact]);

  return (
    <View style={styles.root}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <Pressable onPress={handleBack} style={styles.backButton} hitSlop={8}>
          <ChevronLeft size={22} color={colors.onyx} strokeWidth={2} />
        </Pressable>
        <Text style={styles.headerTitle}>Orange Money</Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.content}>
        {/* Carte operateur Orange */}
        <View style={styles.operatorCard}>
          <View style={[styles.operatorBadge, { backgroundColor: ORANGE_ACCENT }]}>
            <Text style={styles.operatorBadgeText}>O</Text>
          </View>
          <Text style={styles.operatorName}>Orange Money</Text>
          <Text style={styles.operatorPhone}>+237 {formattedPhone}</Text>
        </View>

        {/* Montant */}
        <View style={styles.amountCard}>
          <Text style={styles.amountLabel}>Montant a payer</Text>
          <Text style={styles.amountValue}>{formatPrice(totalAmount)}</Text>
        </View>

        {/* Stepper */}
        {status !== 'failed' && status !== 'expired' && (
          <View style={styles.stepperContainer}>
            {STEPS.map((step, index) => {
              const isCompleted = currentStepIndex > index;
              const isCurrent = currentStepIndex === index;
              return (
                <View key={step.key} style={styles.stepRow}>
                  <View style={styles.stepIndicatorContainer}>
                    {isCompleted ? (
                      <View style={[styles.stepCircle, { backgroundColor: ORANGE_ACCENT }]}>
                        <CheckCircle2 size={16} color={colors.white} strokeWidth={2} />
                      </View>
                    ) : isCurrent ? (
                      <View style={[styles.stepCircle, styles.stepCircleCurrent, { borderColor: ORANGE_ACCENT }]}>
                        <ActivityIndicator size="small" color={ORANGE_ACCENT} />
                      </View>
                    ) : (
                      <View style={styles.stepCircle}>
                        <Text style={styles.stepNumber}>{index + 1}</Text>
                      </View>
                    )}
                  </View>
                  <View style={styles.stepTextContainer}>
                    <Text style={[styles.stepLabel, isCurrent && styles.stepLabelActive]}>{step.label}</Text>
                    <Text style={[styles.stepDescription, isCurrent && styles.stepDescriptionActive]}>{step.description}</Text>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* Erreur */}
        {(status === 'failed' || status === 'expired') && (
          <View style={styles.errorCard}>
            <XCircle size={32} color={colors.danger} strokeWidth={1.5} />
            <Text style={styles.errorTitle}>{status === 'expired' ? 'Paiement expire' : 'Paiement echoue'}</Text>
            {errorMessage && <Text style={styles.errorMessage}>{errorMessage}</Text>}
            <Pressable style={styles.retryButton} onPress={handleRetry}>
              <Text style={styles.retryButtonText}>Reessayer</Text>
            </Pressable>
          </View>
        )}

        {/* Succes */}
        {status === 'completed' && (
          <View style={styles.successCard}>
            <CheckCircle2 size={48} color={colors.forest} strokeWidth={1.5} />
            <Text style={styles.successTitle}>Paiement reussi !</Text>
            <Text style={styles.successMessage}>
              Vos billets ont ete reserves. Vous les retrouverez dans l'onglet "Mes billets".
            </Text>
          </View>
        )}
      </View>

      {(status === 'initiating' || status === 'ussd_sent' || status === 'confirming') && (
        <View style={[styles.bottomBar, { paddingBottom: insets.bottom + spacing.md }]}>
          <Pressable style={styles.cancelButton} onPress={handleCancel}>
            <Text style={styles.cancelButtonText}>Annuler le paiement</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

// Styles identiques a MTN avec ORANGE_ACCENT a la place
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.sand },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.lg, paddingBottom: spacing.md },
  backButton: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.ivory, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { flex: 1, fontFamily: 'PlayfairDisplay-Bold', fontSize: 22, lineHeight: 28, color: colors.onyx, letterSpacing: -0.3, textAlign: 'center' },
  headerSpacer: { width: 36 },
  content: { flex: 1, paddingHorizontal: spacing.lg },
  operatorCard: { backgroundColor: colors.white, borderRadius: radii.lg, padding: spacing.lg, alignItems: 'center', marginBottom: spacing.lg, ...shadows.card },
  operatorBadge: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.sm },
  operatorBadgeText: { fontFamily: 'Inter-Bold', fontSize: 24, lineHeight: 30, color: colors.white },
  operatorName: { fontFamily: 'Inter-SemiBold', fontSize: 16, lineHeight: 22, color: colors.onyx, marginBottom: spacing.xs },
  operatorPhone: { fontFamily: 'Inter-Regular', fontSize: 14, lineHeight: 20, color: colors.stone },
  amountCard: { backgroundColor: ORANGE_BG, borderRadius: radii.lg, padding: spacing.md, alignItems: 'center', marginBottom: spacing.xl, borderWidth: 1, borderColor: `${ORANGE_ACCENT}30` },
  amountLabel: { fontFamily: 'Inter-Regular', fontSize: 12, lineHeight: 16, color: colors.stone, marginBottom: spacing.xs },
  amountValue: { fontFamily: 'PlayfairDisplay-Bold', fontSize: 28, lineHeight: 36, color: colors.onyx, letterSpacing: -0.3 },
  stepperContainer: { gap: spacing.lg },
  stepRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
  stepIndicatorContainer: { width: 32, alignItems: 'center' },
  stepCircle: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.ivory },
  stepCircleCurrent: { backgroundColor: colors.white, borderWidth: 2 },
  stepNumber: { fontFamily: 'Inter-SemiBold', fontSize: 14, lineHeight: 20, color: colors.stone },
  stepTextContainer: { flex: 1, paddingTop: 4 },
  stepLabel: { fontFamily: 'Inter-SemiBold', fontSize: 14, lineHeight: 20, color: colors.stone, marginBottom: 2 },
  stepLabelActive: { color: colors.onyx },
  stepDescription: { fontFamily: 'Inter-Regular', fontSize: 12, lineHeight: 16, color: colors.stone },
  stepDescriptionActive: { color: colors.onyx },
  errorCard: { backgroundColor: colors.white, borderRadius: radii.lg, padding: spacing.xl, alignItems: 'center', borderWidth: 1, borderColor: `${colors.danger}20` },
  errorTitle: { fontFamily: 'PlayfairDisplay-SemiBold', fontSize: 18, lineHeight: 24, color: colors.danger, marginTop: spacing.md, marginBottom: spacing.sm, textAlign: 'center' },
  errorMessage: { fontFamily: 'Inter-Regular', fontSize: 14, lineHeight: 20, color: colors.stone, textAlign: 'center', marginBottom: spacing.lg },
  retryButton: { backgroundColor: colors.terracotta, borderRadius: radii.lg, paddingHorizontal: spacing.xl, paddingVertical: spacing.md },
  retryButtonText: { fontFamily: 'Inter-SemiBold', fontSize: 16, lineHeight: 24, color: colors.white },
  successCard: { backgroundColor: colors.white, borderRadius: radii.lg, padding: spacing.xl, alignItems: 'center', borderWidth: 1, borderColor: `${colors.forest}20` },
  successTitle: { fontFamily: 'PlayfairDisplay-SemiBold', fontSize: 20, lineHeight: 26, color: colors.forest, marginTop: spacing.md, marginBottom: spacing.sm },
  successMessage: { fontFamily: 'Inter-Regular', fontSize: 14, lineHeight: 20, color: colors.stone, textAlign: 'center' },
  bottomBar: { backgroundColor: colors.white, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border, paddingTop: spacing.md, paddingHorizontal: spacing.lg },
  cancelButton: { alignItems: 'center', paddingVertical: spacing.md },
  cancelButtonText: { fontFamily: 'Inter-SemiBold', fontSize: 14, lineHeight: 20, color: colors.stone },
});
