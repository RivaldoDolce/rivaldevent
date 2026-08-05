/**
 * Page paiement Moov Money - Tunnel d'achat.
 *
 * Structure identique a MTN/Orange avec branding Moov :
 * - Logo Moov + couleur operateur #0099FF
 * - Code USSD *155#
 * - Meme flux : etapes USSD -> confirmer -> annuler
 *
 * Conventions : commentaires en francais, design tokens, imports @/
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
} from 'lucide-react-native';
import { Image } from 'expo-image';

import { colors, spacing, radii, shadows, ROUTES } from '@/lib/constants';
import { useHaptics } from '@/hooks/useHaptics';
import { confirmPaymentAndCreateTickets } from '@/lib/payment-helper';

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
// Styles
// ============================================================

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.sand },
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: spacing.lg, paddingVertical: spacing.md,
  },
  headerBackButton: {
    width: 40, height: 40, borderRadius: radii.full,
    backgroundColor: colors.ivory, justifyContent: 'center', alignItems: 'center',
    marginRight: spacing.md,
  },
  headerTitle: {
    fontFamily: 'PlayfairDisplay-SemiBold', fontSize: 20, lineHeight: 26, color: colors.onyx,
  },
  content: { paddingHorizontal: spacing.lg },
  operatorCard: {
    backgroundColor: colors.white, borderRadius: radii.xl, padding: spacing.lg,
    alignItems: 'center', marginBottom: spacing.lg, overflow: 'hidden', ...shadows.eventCard,
  },
  operatorTopBar: {
    position: 'absolute', top: 0, left: 0, right: 0, height: 4,
    backgroundColor: OPERATOR_COLOR,
  },
  operatorLogo: { width: 64, height: 64, marginBottom: spacing.md },
  operatorName: {
    fontFamily: 'Inter-SemiBold', fontSize: 18, lineHeight: 24,
    color: colors.onyx, marginBottom: spacing.xs,
  },
  operatorHint: {
    fontFamily: 'Inter-Regular', fontSize: 13, lineHeight: 18,
    color: colors.stone, textAlign: 'center',
  },
  sectionTitle: {
    fontFamily: 'PlayfairDisplay-SemiBold', fontSize: 18, lineHeight: 24,
    color: colors.onyx, marginBottom: spacing.lg,
  },
  stepContainer: {
    backgroundColor: colors.white, borderRadius: radii.lg, padding: spacing.lg,
    marginBottom: spacing.lg, ...shadows.card,
  },
  stepRow: {
    flexDirection: 'row', alignItems: 'flex-start', marginBottom: spacing.md,
  },
  stepIndicator: {
    width: 28, height: 28, borderRadius: 14, backgroundColor: colors.ivory,
    justifyContent: 'center', alignItems: 'center', marginRight: spacing.md, marginTop: 2,
  },
  stepIndicatorCompleted: { backgroundColor: `${colors.forest}15` },
  stepNumber: {
    fontFamily: 'Inter-Bold', fontSize: 13, lineHeight: 18, color: colors.stone,
  },
  stepInstruction: {
    fontFamily: 'Inter-Regular', fontSize: 15, lineHeight: 22, color: colors.text, flex: 1,
  },
  ussdCard: {
    backgroundColor: `${colors.forest}08`, borderRadius: radii.lg,
    padding: spacing.lg, alignItems: 'center', marginBottom: spacing.lg,
  },
  ussdLabel: {
    fontFamily: 'Inter-SemiBold', fontSize: 13, lineHeight: 18,
    color: colors.forest, marginBottom: spacing.xs,
  },
  ussdCode: {
    fontFamily: 'Inter-Bold', fontSize: 28, lineHeight: 36,
    color: colors.onyx, letterSpacing: 1,
  },
  confirmButton: {
    backgroundColor: colors.terracotta, borderRadius: radii.lg,
    paddingVertical: spacing.md + 4, alignItems: 'center', marginBottom: spacing.md, ...shadows.card,
  },
  confirmButtonText: {
    fontFamily: 'Inter-SemiBold', fontSize: 16, lineHeight: 24, color: colors.white,
  },
  cancelButton: {
    backgroundColor: colors.ivory, borderRadius: radii.lg,
    paddingVertical: spacing.md, alignItems: 'center', marginBottom: spacing.lg,
  },
  cancelButtonText: {
    fontFamily: 'Inter-SemiBold', fontSize: 14, lineHeight: 20, color: colors.stone,
  },
});

// ============================================================
// Composant
// ============================================================

export default function MoovPayment() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { impact } = useHaptics();

  const [isProcessing, setIsProcessing] = useState(false);
  const [completedSteps] = useState(0);

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
        contentContainerStyle={{ paddingTop: insets.top, paddingBottom: insets.bottom + spacing.xl }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Pressable onPress={handleBack} style={styles.headerBackButton} hitSlop={12}>
            <ChevronLeft size={22} color={colors.onyx} strokeWidth={2} />
          </Pressable>
          <Text style={styles.headerTitle}>Paiement Moov</Text>
        </View>

        <View style={styles.content}>
          <View style={styles.operatorCard}>
            <View style={styles.operatorTopBar} />
            <Image source={require('@/assets/icons/moov-logo.svg')} style={styles.operatorLogo} contentFit="contain" />
            <Text style={styles.operatorName}>{OPERATOR_NAME}</Text>
            <Text style={styles.operatorHint}>
              Composez le code USSD sur votre telephone pour effectuer le paiement
            </Text>
          </View>

          <View style={styles.ussdCard}>
            <Text style={styles.ussdLabel}>Code USSD a composer</Text>
            <Text style={styles.ussdCode}>{USSD_CODE}</Text>
          </View>

          <Text style={styles.sectionTitle}>Etapes a suivre</Text>

          <View style={styles.stepContainer}>
            {PAYMENT_STEPS.map((step) => {
              const isCompleted = step.step <= completedSteps;
              return (
                <View key={step.step} style={styles.stepRow}>
                  <View style={[styles.stepIndicator, isCompleted && styles.stepIndicatorCompleted]}>
                    {isCompleted ? (
                      <CircleCheck size={16} color={colors.forest} strokeWidth={2} />
                    ) : (
                      <Text style={styles.stepNumber}>{step.step}</Text>
                    )}
                  </View>
                  <Text style={styles.stepInstruction}>{step.instruction}</Text>
                </View>
              );
            })}
          </View>

          <Pressable onPress={handleConfirmPayment} style={styles.confirmButton} disabled={isProcessing}>
            <Text style={styles.confirmButtonText}>
              {isProcessing ? 'Verification en cours...' : 'J\'ai effectue le paiement'}
            </Text>
          </Pressable>

          <Pressable onPress={handleCancel} style={styles.cancelButton}>
            <Text style={styles.cancelButtonText}>Annuler</Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}
