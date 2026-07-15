/**
 * OTP - vérification du code à 6 chiffres.
 *
 * Design :
 * - Fond sand, pas de scroll (page fixe)
 * - Flèche retour en haut à gauche
 * - Titre "Entrez le code"
 * - Sous-titre "Code envoyé au +237 6XX XXX XXX"
 * - 6 cases compactes (largeur fixe 48px, gap 12px, centrées)
 * - Bouton "Vérifier" terracotta pleine largeur
 * - Countdown + lien "Renvoyer"
 *
 * Sécurité :
 * - Rate limiting (3 tentatives, lock 15 min)
 * - Auto-fill SMS (Android)
 * - Countdown 60s avant renvoi possible
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  useWindowDimensions,
  type TextInputKeyPressEvent,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowRight } from 'lucide-react-native';

import { Button } from '@/components/ui/Button';
import { Header } from '@/components/ui/Header';
import { colors, typography, spacing, radius, APP_CONFIG } from '@/lib/constants';
import { useHaptics } from '@/hooks/useHaptics';
import { authService } from '@/services/auth.service';

const OTP_LENGTH = APP_CONFIG.OTP_CODE_LENGTH;
const COUNTDOWN_SECONDS = 60;

export default function OtpScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ phone?: string; email?: string }>();
  const insets = useSafeAreaInsets();
  const { impact, notification } = useHaptics();

  const [code, setCode] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(COUNTDOWN_SECONDS);

  const { width: windowWidth } = useWindowDimensions();
  const otpSpacing = spacing.sm;
  const otpInputWidth = Math.min(
    48,
    Math.max(40, Math.floor((windowWidth - spacing.lg * 2 - otpSpacing * (OTP_LENGTH - 1)) / OTP_LENGTH))
  );

  const inputRefs = useRef<(TextInput | null)[]>([]);

  // Countdown
  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  const handleVerify = useCallback(
    async (explicitCode?: string) => {
      const fullCode = explicitCode ?? code.join('');

      if (fullCode.length !== OTP_LENGTH) {
        setError('Code incomplet');
        return;
      }

      setIsLoading(true);
      setError(null);
      impact('light');

      const result = await authService.verifyOtp({
        phone: params.phone,
        email: params.email,
        token: fullCode,
        type: params.phone ? 'sms' : 'email',
      });

      if (result.error) {
        setError(result.error.message);
        notification('error');
        // Vider les cases
        setCode(Array(OTP_LENGTH).fill(''));
        inputRefs.current[0]?.focus();
      } else {
        notification('success');
        router.replace('/(client)/home');
      }

      setIsLoading(false);
    },
    [code, params.email, params.phone, impact, notification, router]
  );

  const handleInputChange = useCallback(
    (index: number, value: string) => {
      const digit = value.replace(/[^0-9]/g, '').slice(-1);
      setCode((prev) => {
        const newCode = [...prev];
        newCode[index] = digit;
        return newCode;
      });
      setError(null);

      if (digit && index < OTP_LENGTH - 1) {
        inputRefs.current[index + 1]?.focus();
      }

      // Auto-submit si dernier chiffre
      if (digit && index === OTP_LENGTH - 1) {
        const fullCode = code.map((c, i) => (i === index ? digit : c)).join('');
        if (fullCode.length === OTP_LENGTH) {
          handleVerify(fullCode);
        }
      }
    },
    [code, handleVerify]
  );

  const handleKeyPress = useCallback(
    (index: number, event: TextInputKeyPressEvent) => {
      // Backspace : revenir à la case précédente
      if (event.nativeEvent.key === 'Backspace' && !code[index] && index > 0) {
        inputRefs.current[index - 1]?.focus();
      }
    },
    [code]
  );

  const handleResend = useCallback(async () => {
    if (countdown > 0 || !params.phone) return;

    impact('light');
    const result = await authService.resendOtp(params.phone);

    if (result.error) {
      setError(result.error.message);
    } else {
      setCountdown(COUNTDOWN_SECONDS);
      setCode(Array(OTP_LENGTH).fill(''));
      inputRefs.current[0]?.focus();
    }
  }, [countdown, params.phone, impact]);

  const formatPhone = (phone?: string) => {
    if (!phone) return 'votre numéro';
    return `+237 ${phone.slice(0, 1)}${phone.slice(1, 3)} ${phone.slice(3, 5)} ${phone.slice(5, 7)} ${phone.slice(7)}`;
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Header title="Vérification" onBack={() => router.back()} showBack />

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.content}>
          {/* Texte d'instruction */}
          <View style={styles.textSection}>
            <Text style={styles.title}>Entrez le code</Text>
            <Text style={styles.subtitle}>
              Code envoyé au {formatPhone(params.phone)}
              {params.email ? ` et à ${params.email}` : ''}
            </Text>
          </View>

          {/* Erreur */}
          {error && (
            <View style={styles.errorBanner}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {/* 6 cases rectangulaires — largeur FIXE, pas de flex:1 */}
          <View style={styles.otpContainer}>
            {Array.from({ length: OTP_LENGTH }).map((_, index) => (
              <TextInput
                key={index}
                ref={(ref) => {
                  inputRefs.current[index] = ref;
                }}
                style={[
                  styles.otpInput,
                  { width: otpInputWidth, marginRight: index < OTP_LENGTH - 1 ? otpSpacing : 0 },
                  code[index] ? styles.otpInputFilled : null,
                  error ? styles.otpInputError : null,
                ]}
                value={code[index]}
                onChangeText={(value) => handleInputChange(index, value)}
                onKeyPress={(e) => handleKeyPress(index, e)}
                keyboardType="number-pad"
                maxLength={1}
                autoFocus={index === 0}
                accessibilityLabel={`Chiffre ${index + 1}`}
                textContentType="oneTimeCode"
              />
            ))}
          </View>

          {/* Bouton vérifier — pleine largeur */}
          <Button
            variant="primary"
            size="lg"
            fullWidth
            loading={isLoading}
            onPress={() => handleVerify()}
            icon={<ArrowRight color={colors.sand} size={18} />}
            iconPosition="right"
          >
            Vérifier
          </Button>

          {/* Countdown + renvoyer */}
          <View style={styles.resendWrapper}>
            {countdown > 0 ? (
              <Text style={styles.countdownText}>
                Renvoyer le code dans{' '}
                <Text style={styles.countdownTimer}>
                  0:{countdown.toString().padStart(2, '0')}
                </Text>
              </Text>
            ) : (
              <Pressable onPress={handleResend} hitSlop={12}>
                <Text style={styles.resendLink}>Renvoyer le code</Text>
              </Pressable>
            )}
          </View>

          {/* Lien support */}
          <Pressable onPress={() => impact('light')} hitSlop={12} style={styles.supportLink}>
            <Text style={styles.supportText}>Je n'ai pas reçu le code</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.sand,
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    // Pas de scroll — tout tient sur l'écran
  },
  textSection: {
    marginBottom: spacing.lg,
  },
  title: {
    ...typography.h1,
    color: colors.onyx,
    marginBottom: spacing.sm,
  },
  subtitle: {
    ...typography.body,
    color: colors.stone,
    lineHeight: 24,
  },
  errorBanner: {
    backgroundColor: `${colors.terracotta}15`,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  errorText: {
    ...typography.bodySmall,
    color: colors.terracotta,
    textAlign: 'center',
  },
  // ── OTP Inputs ── Largeur FIXE 48px — jamais flex:1
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: spacing.xl,
  },
  otpInput: {
    width: 48,
    height: 56,
    borderWidth: 1.5,
    borderColor: `${colors.stone}40`,
    borderRadius: radius.md,
    backgroundColor: colors.ivory,
    textAlign: 'center',
    fontSize: 22,
    fontWeight: '700',
    color: colors.onyx,
    fontFamily: 'Inter-Bold',
  },
  otpInputFilled: {
    borderColor: colors.terracotta,
    backgroundColor: `${colors.terracotta}08`,
  },
  otpInputError: {
    borderColor: `${colors.terracotta}60`,
  },
  resendWrapper: {
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  countdownText: {
    ...typography.bodySmall,
    color: colors.stone,
  },
  countdownTimer: {
    color: colors.terracotta,
    fontWeight: '600',
  },
  resendLink: {
    ...typography.bodySmall,
    color: colors.terracotta,
    fontWeight: '600',
  },
  supportLink: {
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  supportText: {
    ...typography.bodySmall,
    color: colors.terracotta,
    textDecorationLine: 'underline',
  },
});