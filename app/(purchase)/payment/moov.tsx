/**
 * Page paiement Moov Money - Tunnel d'achat.
 *
 * Design ultra-premium inspire de Revolut, Apple Pay et des
 * ecrans USSD de Moov Money :
 * - Hero sombre en degrade avec logo, montant en or et numero de debit
 * - Panneau USSD focal avec code en gros, sur fond clair contraste
 * - Timeline d'etapes numerotees avec trait de liaison
 * - CTA terracotta pleine largeur + etat de verification
 * - Bouton "Annuler" discret en lien fantome
 *
 * Navigation :
 * - Recoit { transactionId } en parametres
 * - Confirmation -> vers ROUTES.TICKETS (liste billets)
 *
 * Conventions :
 * - Design tokens depuis lib/constants.ts
 * - Commentaires en francais
 */

import { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Alert,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  ChevronLeft,
  CircleCheck,
  Smartphone,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

import MoovLogo from '@/assets/icons/moov-logo.svg';

import { colors, spacing, radii, shadows, ROUTES } from '@/lib/constants';
import { useHaptics } from '@/hooks/useHaptics';
import { confirmPaymentAndCreateTickets } from '@/lib/payment-helper';
import { formatPrice } from '@/services/event.service';
import { usePurchaseFlowStore } from '@/stores/purchase-flow-store';

// ============================================================
// Constantes Moov
// ============================================================

const OPERATOR_NAME = 'Moov Money';
const USSD_CODE = '*155#';
const OPERATOR_COLOR = '#0099FF';

const PAYMENT_STEPS = [
  { step: 1, instruction: `Composez le code ${USSD_CODE} sur votre telephone` },
  { step: 2, instruction: 'Selectionnez "Transfert d\'argent"' },
  { step: 3, instruction: 'Entrez le numero marchand Rivald\'Event' },
  { step: 4, instruction: 'Confirmez le montant et validez avec votre code PIN' },
] as const;

// ============================================================
// Helper : afficher le numero formatte
// ============================================================

function formatPhoneDisplay(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 0) return '';
  return digits.replace(/(\d{2})(?=\d)/g, '$1 ');
}

// ============================================================
// Styles
// ============================================================

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.sand },

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
    backgroundColor: colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
    ...shadows.search,
  },
  headerTitle: {
    fontFamily: 'PlayfairDisplay-SemiBold',
    fontSize: 20,
    lineHeight: 26,
    color: colors.onyx,
  },

  content: { paddingHorizontal: spacing.lg },

  /* =============================================
     Hero operateur - carte sombre en degrade
     ============================================= */
  heroCard: {
    borderRadius: radii.xxl,
    overflow: 'hidden',
    marginBottom: spacing.lg,
    ...shadows.eventCard,
  },
  heroAccentBar: {
    height: 4,
    width: '100%',
    backgroundColor: OPERATOR_COLOR,
  },
  heroInner: {
    padding: spacing.lg,
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  heroLogoWrap: {
    width: 56,
    height: 56,
    borderRadius: radii.lg,
    backgroundColor: colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  heroLogo: {
    width: 44,
    height: 44,
  },
  heroTitleArea: {
    flex: 1,
  },
  heroName: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 18,
    lineHeight: 24,
    color: colors.white,
  },
  heroTag: {
    fontFamily: 'Inter-Medium',
    fontSize: 12,
    lineHeight: 16,
    color: `${colors.white}99`,
  },
  heroAmountLabel: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    lineHeight: 16,
    color: `${colors.white}99`,
    marginBottom: 2,
  },
  heroAmount: {
    fontFamily: 'PlayfairDisplay-Bold',
    fontSize: 30,
    lineHeight: 38,
    color: colors.gold,
    letterSpacing: -0.3,
  },
  heroDivider: {
    height: 1,
    backgroundColor: `${colors.white}22`,
    marginVertical: spacing.md,
  },
  heroPhoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  heroPhoneLabel: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    lineHeight: 16,
    color: `${colors.white}80`,
  },
  heroPhoneValue: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 13,
    lineHeight: 18,
    color: colors.white,
  },

  /* =============================================
     Panneau USSD focal
     ============================================= */
  ussdCard: {
    backgroundColor: colors.white,
    borderRadius: radii.xl,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
    marginBottom: spacing.lg,
    ...shadows.card,
  },
  ussdLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  ussdLabel: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 12,
    lineHeight: 16,
    color: colors.stone,
    letterSpacing: 0.8,
  },
  ussdCode: {
    fontFamily: 'Inter-Bold',
    fontSize: 34,
    lineHeight: 42,
    color: colors.onyx,
    letterSpacing: 2,
  },
  ussdHint: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    lineHeight: 16,
    color: colors.stone,
    textAlign: 'center',
    marginTop: spacing.xs,
  },

  /* Section titre */
  sectionTitle: {
    fontFamily: 'PlayfairDisplay-SemiBold',
    fontSize: 18,
    lineHeight: 24,
    color: colors.onyx,
    marginBottom: spacing.md,
  },

  /* Timeline des etapes */
  stepContainer: {
    backgroundColor: colors.white,
    borderRadius: radii.xl,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    ...shadows.card,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  stepIndicatorColumn: {
    alignItems: 'center',
    width: 32,
    marginRight: spacing.md,
  },
  stepIndicator: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: `${OPERATOR_COLOR}22`,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepIndicatorCompleted: {
    backgroundColor: `${colors.forest}15`,
  },
  stepNumber: {
    fontFamily: 'Inter-Bold',
    fontSize: 14,
    lineHeight: 18,
    color: OPERATOR_COLOR,
  },
  stepConnector: {
    width: 2,
    flex: 1,
    backgroundColor: `${OPERATOR_COLOR}30`,
    marginVertical: spacing.xs,
    minHeight: 24,
  },
  stepInstruction: {
    fontFamily: 'Inter-Regular',
    fontSize: 15,
    lineHeight: 22,
    color: colors.text,
    flex: 1,
    paddingTop: 5,
    paddingBottom: spacing.md,
  },

  /* Boutons */
  confirmButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.terracotta,
    borderRadius: radii.xl,
    paddingVertical: spacing.md + 4,
    gap: spacing.sm,
    marginBottom: spacing.sm,
    ...shadows.eventCard,
  },
  confirmButtonText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    lineHeight: 24,
    color: colors.white,
  },
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
// Composant
// ============================================================

export default function MoovPayment() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { impact } = useHaptics();
  const flow = usePurchaseFlowStore();

  const [isProcessing, setIsProcessing] = useState(false);
  const [completedSteps] = useState(0);

  const displayAmount = flow.totalAmount;
  const displayPhone = flow.phoneNumber
    ? formatPhoneDisplay(flow.phoneNumber)
    : '';

  const handleBack = useCallback(() => {
    impact('light');
    router.back();
  }, [impact, router]);

  const handleConfirmPayment = useCallback(() => {
    if (isProcessing) return;
    impact('medium');
    setIsProcessing(true);

    setTimeout(() => {
      setIsProcessing(false);
      const ticketsCreated = confirmPaymentAndCreateTickets();
      Alert.alert(
        'Paiement confirme',
        ticketsCreated > 0
          ? `${ticketsCreated} billet${ticketsCreated > 1 ? 's' : ''} achete${ticketsCreated > 1 ? 's' : ''} avec succes.`
          : 'Votre paiement Moov Money a ete enregistre.',
        [
          { text: 'Voir mes billets', onPress: () => { router.push(ROUTES.TICKETS as never); } },
        ],
      );
    }, 2000);
  }, [isProcessing, impact, router]);

  const handleCancel = useCallback(() => {
    impact('light');
    Alert.alert(
      'Annuler le paiement ?',
      'Votre reservation ne sera pas conservee.',
      [
        { text: 'Continuer', style: 'cancel' },
        { text: 'Annuler', style: 'destructive', onPress: () => { router.push(ROUTES.TICKETS as never); } },
      ],
    );
  }, [impact, router]);

  return (
    <View style={styles.root}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingTop: insets.top,
          paddingBottom: insets.bottom + spacing.xl,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={handleBack} style={styles.headerBackButton} hitSlop={12}>
            <ChevronLeft size={22} color={colors.onyx} strokeWidth={2} />
          </Pressable>
          <Text style={styles.headerTitle}>Paiement Moov</Text>
        </View>

        <View style={styles.content}>
          {/* Hero operateur */}
          <LinearGradient
            colors={['#26221E', colors.onyx]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.heroCard}
          >
            <View style={styles.heroAccentBar} />
            <View style={styles.heroInner}>
              <View style={styles.heroTopRow}>
                <View style={styles.heroLogoWrap}>
                  <MoovLogo width={44} height={44} />
                </View>
                <View style={styles.heroTitleArea}>
                  <Text style={styles.heroName}>{OPERATOR_NAME}</Text>
                  <Text style={styles.heroTag}>Paiement USSD</Text>
                </View>
              </View>

              <Text style={styles.heroAmountLabel}>Montant a payer</Text>
              <Text style={styles.heroAmount}>
                {displayAmount > 0 ? formatPrice(displayAmount) : '0 FCFA'}
              </Text>

              <View style={styles.heroDivider} />

              {displayPhone.length > 0 && (
                <View style={styles.heroPhoneRow}>
                  <Smartphone size={14} color={`${colors.white}80`} strokeWidth={1.5} />
                  <Text style={styles.heroPhoneLabel}>Numero de debit</Text>
                  <Text style={styles.heroPhoneValue}>+237 {displayPhone}</Text>
                </View>
              )}
            </View>
          </LinearGradient>

          {/* Code USSD focal */}
          <View style={styles.ussdCard}>
            <View style={styles.ussdLabelRow}>
              <View
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: 3,
                  backgroundColor: colors.gold,
                }}
              />
              <Text style={styles.ussdLabel}>CODE USSD A COMPOSER</Text>
            </View>
            <Text style={styles.ussdCode}>{USSD_CODE}</Text>
            <Text style={styles.ussdHint}>
              Ouvrez le composeur de votre telephone puis saisissez ce code
            </Text>
          </View>

          {/* Etapes */}
          <Text style={styles.sectionTitle}>Etapes a suivre</Text>

          <View style={styles.stepContainer}>
            {PAYMENT_STEPS.map((step, index) => {
              const isCompleted = step.step <= completedSteps;
              const isLast = index === PAYMENT_STEPS.length - 1;
              return (
                <View key={step.step} style={styles.stepRow}>
                  <View style={styles.stepIndicatorColumn}>
                    <View style={[
                      styles.stepIndicator,
                      isCompleted && styles.stepIndicatorCompleted,
                    ]}>
                      {isCompleted ? (
                        <CircleCheck size={16} color={colors.forest} strokeWidth={2} />
                      ) : (
                        <Text style={styles.stepNumber}>{step.step}</Text>
                      )}
                    </View>
                    {!isLast && <View style={styles.stepConnector} />}
                  </View>
                  <Text style={styles.stepInstruction}>{step.instruction}</Text>
                </View>
              );
            })}
          </View>

          {/* Bouton confirmation */}
          <Pressable
            onPress={handleConfirmPayment}
            style={[styles.confirmButton, isProcessing && { opacity: 0.7 }]}
            disabled={isProcessing}
            accessibilityRole="button"
            accessibilityLabel="Confirmer le paiement"
          >
            {isProcessing ? (
              <>
                <ActivityIndicator size="small" color={colors.white} />
                <Text style={styles.confirmButtonText}>Verification en cours...</Text>
              </>
            ) : (
              <Text style={styles.confirmButtonText}>J'ai effectue le paiement</Text>
            )}
          </Pressable>

          <Pressable
            onPress={handleCancel}
            style={styles.cancelButton}
            accessibilityRole="button"
            accessibilityLabel="Annuler le paiement"
          >
            <Text style={styles.cancelButtonText}>Annuler</Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}
