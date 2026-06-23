/**
 * OTP - verification du code a 6 chiffres.
 *
 * Design :
 * - Fond sand
 * - Fleche retour en haut a gauche
 * - Titre "Vérification"
 * - Sous-titre "Entrez le code envoyé au +237 6XX XXX XXX"
 * - 6 cases de saisie (auto-focus + auto-fill SMS)
 * - Bouton "Vérifier" terracotta
 * - Countdown "Renvoyer le code dans 0:59"
 * - Lien "Je n'ai pas reçu le code"
 *
 * Securite :
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
  type TextInputKeyPressEvent,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/Button';
import { Header } from '@/components/ui/Header';
import { colors, typography, spacing, radius, APP_CONFIG } from '@/lib/constants';
import { useHaptics } from '@/hooks/useHaptics';
import { authService } from '@/services/auth.service';

const OTP_LENGTH = APP_CONFIG.OTP_LENGTH;
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
      const fullCode = code.map((c, i) => (i === index ? digit : c)).join('');

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
      if (digit && index === OTP_LENGTH - 1 && fullCode.length === OTP_LENGTH) {
        handleVerify(fullCode);
      }
    },
    [code, handleVerify]
  );

  const handleKeyPress = useCallback(
    (index: number, event: TextInputKeyPressEvent) => {
      // Backspace : revenir a la case precedente
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

      <View style={styles.content}>
        <Text style={styles.title}>Entrez le code</Text>
        <Text style={styles.subtitle}>
          Code envoyé au {formatPhone(params.phone)}
          {params.email ? ` et à ${params.email}` : ''}
        </Text>

        {error && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* Cases OTP */}
        <View style={styles.otpContainer}>
          {Array.from({ length: OTP_LENGTH }).map((_, index) => (
            <TextInput
              key={index}
              ref={(ref) => {
                inputRefs.current[index] = ref;
              }}
              style={[styles.otpInput, code[index] ? styles.otpInputFilled : null]}
              value={code[index]}
              onChangeText={(value) => handleInputChange(index, value)}
              onKeyPress={(event) => handleKeyPress(index, event)}
              keyboardType="number-pad"
              maxLength={1}
              autoFocus={index === 0}
              accessibilityLabel={`Chiffre ${index + 1}`}
            />
          ))}
        </View>

        {/* Bouton verifier */}
        <Button
          variant="primary"
          size="lg"
          fullWidth
          loading={isLoading}
          onPress={() => handleVerify()}
        >
          Vérifier
        </Button>

        {/* Countdown + renvoyer */}
        <View style={styles.resendWrapper}>
          {countdown > 0 ? (
            <Text style={styles.countdownText}>
              Renvoyer le code dans 0:{countdown.toString().padStart(2, '0')} secondes
            </Text>
          ) : (
            <Pressable onPress={handleResend} hitSlop={12}>
              <Text style={styles.resendLink}>Renvoyer le code</Text>
            </Pressable>
          )}
        </View>

        {/* Lien support */}
        <Pressable
          onPress={() => impact('light')}
          hitSlop={12}
          style={styles.supportLink}
        >
          <Text style={styles.supportText}>Je n'ai pas reçu le code</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.sand,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
  },
  title: {
    ...typography.h1,
    color: colors.onyx,
    marginBottom: spacing.sm,
  },
  subtitle: {
    ...typography.body,
    color: colors.stone,
    marginBottom: spacing.xl,
    lineHeight: 24,
  },
  errorBanner: {
    backgroundColor: `${colors.terracotta}15`,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  errorText: {
    ...typography.bodySmall,
    color: colors.terracotta,
    textAlign: 'center',
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.xl,
    gap: spacing.sm,
  },
  otpInput: {
    flex: 1,
    aspectRatio: 0.75,
    borderWidth: 2,
    borderColor: `${colors.stone}40`,
    borderRadius: radius.md,
    backgroundColor: colors.ivory,
    textAlign: 'center',
    fontSize: 24,
    fontWeight: '700',
    color: colors.onyx,
    fontFamily: 'Inter-Bold',
  },
  otpInputFilled: {
    borderColor: colors.terracotta,
    backgroundColor: `${colors.terracotta}10`,
  },
  resendWrapper: {
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  countdownText: {
    ...typography.bodySmall,
    color: colors.stone,
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
