/**
 * Page paiement Orange Money - Tunnel d'achat.
 *
 * Design system « Noir & Or » premium :
 * - En-tete degrade sombre : retour pastille verre + logo operateur +
 *   titre Playfair + sous-titre
 * - Carte recapitulative (billet + montant or champagne)
 * - Numero de debit affiche en champ style Input (prefixe +237 pastille)
 * - Panneau USSD focal + timeline d'etapes numerotees
 * - Note de securite (shield-check) + CTA "Payer {montant}" or pleine
 *   largeur avec etat de traitement (spinner + message elegant)
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
  StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  ChevronLeft,
  CircleCheck,
  Smartphone,
  Ticket,
  ShieldCheck,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

import OrangeLogo from '@/assets/icons/orange-logo.svg';

import { Button } from '@/components/ui/Button';

import { colors, spacing, radius, shadows, ROUTES } from '@/lib/constants';
import { useHaptics } from '@/hooks/useHaptics';
import { confirmPaymentAndCreateTickets } from '@/lib/payment-helper';
import { formatPrice } from '@/services/event.service';
import { usePurchaseFlowStore } from '@/stores/purchase-flow-store';
import { ScreenBackground } from '@/components/ui/ScreenBackground';

// ============================================================
// Constantes Orange
// ============================================================

const OPERATOR_NAME = 'Orange Money';
const USSD_CODE = '*144#';
const OPERATOR_COLOR = '#FF7900';

const PAYMENT_STEPS = [
  { step: 1, instruction: `Composez le code ${USSD_CODE} sur votre telephone` },
  { step: 2, instruction: 'Selectionnez "Paiement marchand"' },
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
  root: {
    flex: 1,
    backgroundColor: 'transparent',
  },

  /* =============================================
     Header premium - degrade sombre + halo or
     ============================================= */
  header: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
    borderBottomLeftRadius: radius.xxl,
    borderBottomRightRadius: radius.xxl,
    overflow: 'hidden',
    borderBottomWidth: 1,
    borderBottomColor: `${colors.gold}26`,
  },
  headerGlow: {
    position: 'absolute',
    top: -90,
    right: -50,
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: 'rgba(216,180,90,0.09)',
  },
  headerRingLarge: {
    position: 'absolute',
    width: 130,
    height: 130,
    borderRadius: 65,
    borderWidth: 1.5,
    borderColor: `${colors.gold}2E`,
    top: -70,
    right: -40,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.md,
  },
  headerBackButton: {
    width: 44,
    height: 44,
    borderRadius: radius.full,
    backgroundColor: colors.glass,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  headerLogoWrap: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.glass,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  headerTitleArea: {
    flex: 1,
  },
  headerTitle: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 22,
    lineHeight: 28,
    color: colors.text,
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    lineHeight: 17,
    color: colors.textMuted,
    marginTop: 1,
  },

  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },

  /* =============================================
     Carte recapitulative - billet + montant
     ============================================= */
  recapCard: {
    backgroundColor: colors.elevated,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: `${colors.gold}1F`,
    padding: spacing.lg,
    marginBottom: spacing.md,
    ...shadows.card,
  },
  recapTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
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
    fontSize: 16,
    lineHeight: 22,
    color: colors.text,
    marginBottom: spacing.md,
    letterSpacing: -0.2,
  },
  recapDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: `${colors.gold}2E`,
    marginVertical: spacing.md,
  },
  amountLabel: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 11,
    lineHeight: 15,
    letterSpacing: 1.4,
    color: colors.goldMuted,
    marginBottom: 2,
  },
  amountValue: {
    fontFamily: 'Inter_700Bold',
    fontSize: 28,
    lineHeight: 36,
    color: colors.goldBright,
    letterSpacing: -0.4,
  },

  /* Numero de debit - champ style Input (lecture seule) */
  phoneField: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.glass,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: 52,
    paddingHorizontal: spacing.md,
    marginTop: spacing.md,
  },
  phonePrefixBadge: {
    backgroundColor: 'rgba(216,180,90,0.12)',
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.xs,
    marginRight: spacing.md,
    borderWidth: 1,
    borderColor: `${colors.gold}40`,
  },
  phonePrefixText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    lineHeight: 19,
    color: colors.goldBright,
  },
  phoneValueText: {
    flex: 1,
    fontFamily: 'Inter_400Regular',
    fontSize: 16,
    lineHeight: 22,
    color: colors.text,
  },

  /* =============================================
     Panneau USSD focal
     ============================================= */
  ussdCard: {
    backgroundColor: colors.elevated,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: `${colors.gold}1F`,
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
  ussdDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.gold,
  },
  ussdLabel: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 11,
    lineHeight: 15,
    color: colors.goldMuted,
    letterSpacing: 1.4,
  },
  ussdCode: {
    fontFamily: 'Inter_700Bold',
    fontSize: 34,
    lineHeight: 42,
    color: colors.goldBright,
    letterSpacing: 2,
  },
  ussdHint: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    lineHeight: 16,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.xs,
  },

  /* Section titre */
  sectionTitle: {
    fontFamily: 'PlayfairDisplay_600SemiBold',
    fontSize: 18,
    lineHeight: 24,
    color: colors.text,
    marginBottom: spacing.md,
  },

  /* Timeline des etapes */
  stepContainer: {
    backgroundColor: colors.glass,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    marginBottom: spacing.md,
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
    borderWidth: 1,
    borderColor: `${OPERATOR_COLOR}45`,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepIndicatorCompleted: {
    backgroundColor: 'rgba(91,196,139,0.14)',
    borderColor: 'rgba(91,196,139,0.45)',
  },
  stepNumber: {
    fontFamily: 'Inter_700Bold',
    fontSize: 14,
    lineHeight: 18,
    color: OPERATOR_COLOR,
  },
  stepConnector: {
    width: 1.5,
    flex: 1,
    backgroundColor: `${OPERATOR_COLOR}30`,
    marginVertical: spacing.xs,
    minHeight: 24,
  },
  stepInstruction: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    lineHeight: 20,
    color: colors.textSecondary,
    flex: 1,
    paddingTop: 6,
    paddingBottom: spacing.md,
  },

  /* Note de securite */
  securityNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  securityNoteText: {
    flex: 1,
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    lineHeight: 17,
    color: colors.textMuted,
  },

  /* Bouton annuler */
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
  payButtonRow: {
    marginTop: spacing.xs,
    gap: spacing.sm,
  },
});

// ============================================================
// Composant
// ============================================================

export default function OrangePayment() {
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
          : 'Votre paiement Orange Money a ete enregistre.',
        [
          { text: 'Voir mes billets', onPress: () => {
            router.dismissAll();
            router.push(ROUTES.TICKETS as never);
          } },
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
        { text: 'Annuler', style: 'destructive', onPress: () => {
          router.dismissAll();
          router.push(ROUTES.TICKETS as never);
        } },
      ],
    );
  }, [impact, router]);

  const payLabel = `Payer ${formatPrice(displayAmount)}`;

  return (
    <ScreenBackground><View style={[styles.root, { backgroundColor: 'transparent' }]}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingBottom: insets.bottom + spacing.xl,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <LinearGradient
          colors={['#26211B', colors.background]}
          start={{ x: 0.1, y: 0 }}
          end={{ x: 0.9, y: 1 }}
          style={[styles.header, { paddingTop: insets.top + spacing.sm }]}
        >
          <View pointerEvents="none" style={styles.headerGlow} />
          <View pointerEvents="none" style={styles.headerRingLarge} />

          <View style={styles.headerTopRow}>
            <Pressable
              onPress={handleBack}
              style={styles.headerBackButton}
              hitSlop={12}
              accessibilityRole="button"
              accessibilityLabel="Retour"
            >
              <ChevronLeft size={22} color={colors.goldBright} strokeWidth={1.75} />
            </Pressable>

            <View style={styles.headerLogoWrap}>
              <OrangeLogo width={32} height={32} />
            </View>

            <View style={styles.headerTitleArea}>
              <Text style={styles.headerTitle}>Paiement Orange</Text>
              <Text style={styles.headerSubtitle}>{OPERATOR_NAME}</Text>
            </View>
          </View>
        </LinearGradient>

        <View style={styles.content}>
          {/* Carte recapitulative */}
          <View style={styles.recapCard}>
            <View style={styles.recapTopRow}>
              <Text style={styles.recapOverline}>VOTRE COMMANDE</Text>
              <Ticket size={18} color={colors.gold} strokeWidth={1.5} />
            </View>

            <Text style={styles.recapEventTitle} numberOfLines={2}>
              {flow.eventTitle || 'Votre commande'}
            </Text>

            <Text style={styles.amountLabel}>MONTANT A PAYER</Text>
            <Text style={styles.amountValue}>
              {displayAmount > 0 ? formatPrice(displayAmount) : '0 FCFA'}
            </Text>

            {displayPhone.length > 0 && (
              <>
                <View style={styles.recapDivider} />
                <View style={styles.phoneField}>
                  <View style={styles.phonePrefixBadge}>
                    <Text style={styles.phonePrefixText}>+237</Text>
                  </View>
                  <Text style={styles.phoneValueText}>{displayPhone}</Text>
                  <Smartphone size={18} color={colors.goldMuted} strokeWidth={1.5} />
                </View>
              </>
            )}
          </View>

          {/* Code USSD focal */}
          <View style={styles.ussdCard}>
            <View style={styles.ussdLabelRow}>
              <View style={styles.ussdDot} />
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
                        <CircleCheck size={16} color={colors.success} strokeWidth={2} />
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

          {/* Note de securite */}
          <View style={styles.securityNote}>
            <ShieldCheck size={16} color={colors.goldBright} strokeWidth={1.75} />
            <Text style={styles.securityNoteText}>
              Paiement securise - Confirmez le montant avec votre code PIN Orange
            </Text>
          </View>

          {/* Bouton confirmation - or pleine largeur */}
          <View style={styles.payButtonRow}>
            <Button
              variant="primary"
              size="lg"
              fullWidth
              loading={isProcessing}
              onPress={handleConfirmPayment}
            >
              {isProcessing ? 'Verification en cours...' : payLabel}
            </Button>
          </View>

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
    </View></ScreenBackground>
  );
}