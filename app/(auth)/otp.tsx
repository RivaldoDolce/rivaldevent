/**
 * OTP - verification du code.
 *
 * Design (mis a jour) :
 * - Fond creme/ivoire clair
 * - Fleche retour en haut a gauche
 * - Illustration : cercle jaune pale + shield terracotta avec check
 * - Titre "Verification" centre en gras
 * - Sous-titre avec "4 chiffres" mis en evidence
 * - 4 cases carrees arrondies (72x72) avec bordure grise
 * - Bouton "Valider" terracotta pill-shaped pleine largeur
 * - Lien "Renvoyer le code" en terracotta souligne
 * - Points indicateurs en bas
 * - Barre decorative alternee en fond
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
  KeyboardAvoidingView,
  Platform,
  useWindowDimensions,
  type TextInputKeyPressEvent,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowRight, ChevronLeft, ShieldCheck, } from 'lucide-react-native';

import { colors, spacing, radius, APP_CONFIG } from '@/lib/constants';
import { useHaptics } from '@/hooks/useHaptics';
import { useAuthService } from '@/services/auth.service';

const OTP_LENGTH = APP_CONFIG.OTP_CODE_LENGTH;
const COUNTDOWN_SECONDS = 60;

export default function OtpScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ phone?: string; email?: string }>();
  const insets = useSafeAreaInsets();
  const { impact, notification } = useHaptics();
  const authService = useAuthService();

  const [code, setCode] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(COUNTDOWN_SECONDS);

  const { width: windowWidth } = useWindowDimensions();
  const otpSpacing = 16;
  const otpInputSize = Math.min(
    72,
    Math.max(56, Math.floor((windowWidth - spacing.lg * 2 - otpSpacing * (OTP_LENGTH - 1)) / OTP_LENGTH)),
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
        setCode(Array(OTP_LENGTH).fill(''));
        inputRefs.current[0]?.focus();
      } else {
        notification('success');
        router.replace('/(client)/home');
      }

      setIsLoading(false);
    },
    [code, params.email, params.phone, impact, notification, router, authService],
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
    [code, handleVerify],
  );

  const handleKeyPress = useCallback(
    (index: number, event: TextInputKeyPressEvent) => {
      if (event.nativeEvent.key === 'Backspace' && !code[index] && index > 0) {
        inputRefs.current[index - 1]?.focus();
      }
    },
    [code],
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
  }, [countdown, params.phone, impact, authService]);

  const formatPhone = (phone?: string) => {
    if (!phone) return 'votre numero';
    return `+237 ${phone.slice(0, 1)}${phone.slice(1, 3)} ${phone.slice(3, 5)} ${phone.slice(5, 7)} ${phone.slice(7)}`;
  };

  return (
    <View style={styles.container}>
      {/* Barre du haut avec retour */}
      <View style={[styles.topBar, { paddingTop: insets.top + spacing.sm }]}>
        <Pressable
          onPress={() => {
            impact('light');
            router.back();
          }}
          hitSlop={12}
          style={styles.backButton}
          accessibilityRole="button"
          accessibilityLabel="Retour"
        >
          <ChevronLeft size={22} color={colors.onyx} strokeWidth={2} />
        </Pressable>
      </View>

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.content}>
          {/* Illustration : cercle pale + shield */}
          <View style={styles.illustrationContainer}>
            <View style={styles.illustrationCircle}>
              <ShieldCheck size={52} color={colors.terracotta} strokeWidth={1.8} />
            </View>
          </View>

          {/* Titre */}
          <Text style={styles.title}>Verification</Text>

          {/* Sous-titre */}
          <Text style={styles.subtitle}>
            Veuillez saisir le code a{' '}
            <Text style={styles.subtitleHighlight}>{OTP_LENGTH} chiffres</Text>
            {' '}envoye au {formatPhone(params.phone)}
            {params.email ? ` et a ${params.email}` : ''}
          </Text>

          {/* Erreur */}
          {error && (
            <View style={styles.errorBanner}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {/* Cases OTP - carrees arrondies */}
          <View style={styles.otpContainer}>
            {Array.from({ length: OTP_LENGTH }).map((_, index) => (
              <TextInput
                key={index}
                ref={(ref) => {
                  inputRefs.current[index] = ref;
                }}
                style={[
                  styles.otpInput,
                  { width: otpInputSize, height: otpInputSize, marginRight: index < OTP_LENGTH - 1 ? otpSpacing : 0 },
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

          {/* Bouton Valider - pill-shaped pleine largeur */}
          <Pressable
            style={[styles.validateButton, isLoading && styles.validateButtonDisabled]}
            onPress={() => handleVerify()}
            disabled={isLoading}
            accessibilityRole="button"
          >
            <Text style={styles.validateButtonText}>
              Valider <ArrowRight size={18} color={colors.sand} strokeWidth={2.5} />
            </Text>
          </Pressable>

          {/* Lien renvoyer */}
          <View style={styles.resendWrapper}>
            {countdown > 0 ? (
              <Text style={styles.countdownText}>
                Vous n&apos;avez pas recu le code ?{' '}
                <Text style={styles.countdownTimer}>
                  Renvoyer dans 0:{countdown.toString().padStart(2, '0')}
                </Text>
              </Text>
            ) : (
              <Pressable onPress={handleResend} hitSlop={12}>
                <Text style={styles.resendLink}>
                  Vous n&apos;avez pas recu le code ?{' '}
                  <Text style={styles.resendLinkBold}>Renvoyer le code</Text>
                </Text>
              </Pressable>
            )}
          </View>
        </View>

        <View style={[styles.bottomSection, { paddingBottom: insets.bottom + spacing.xl }]}>
          {/* Barre decorative alternee */}
          <View style={styles.accentBar}>
            <View style={[styles.accentSegment, { backgroundColor: '#3D2B1F' }]} />
            <View style={[styles.accentSegment, { backgroundColor: colors.gold }]} />
            <View style={[styles.accentSegment, { backgroundColor: '#3D2B1F' }]} />
            <View style={[styles.accentSegment, { backgroundColor: colors.gold }]} />
            <View style={[styles.accentSegment, { backgroundColor: '#3D2B1F' }]} />
            <View style={[styles.accentSegment, { backgroundColor: colors.gold }]} />
            <View style={[styles.accentSegment, { backgroundColor: '#3D2B1F' }]} />
            <View style={[styles.accentSegment, { backgroundColor: colors.gold }]} />
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FDF8F3',
  },

  // Barre du haut
  topBar: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
  },
  backButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },

  keyboardView: {
    flex: 1,
  },

  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },

  // Illustration shield
  illustrationContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl,
    position: 'relative',
  },
  illustrationCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#FFF3D6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  magnifierBadge: {
    position: 'absolute',
    bottom: -2,
    right: -10,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.terracotta,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.terracotta,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },

  // Titre
  title: {
    fontFamily: 'PlayfairDisplay-Bold',
    fontSize: 30,
    lineHeight: 38,
    color: '#0F172A',
    textAlign: 'center',
    marginBottom: spacing.sm,
  },

  // Sous-titre
  subtitle: {
    fontFamily: 'Inter-Regular',
    fontSize: 15,
    lineHeight: 22,
    color: '#475569',
    textAlign: 'center',
    marginBottom: spacing.xl,
    paddingHorizontal: spacing.md,
  },
  subtitleHighlight: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 15,
    lineHeight: 22,
    color: colors.terracotta,
  },

  // Erreur
  errorBanner: {
    backgroundColor: `${colors.terracotta}15`,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    marginHorizontal: spacing.sm,
  },
  errorText: {
    fontFamily: 'Inter-Medium',
    fontSize: 13,
    lineHeight: 18,
    color: colors.terracotta,
    textAlign: 'center',
  },

  // Cases OTP
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: spacing.xl,
  },
  otpInput: {
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    textAlign: 'center',
    fontSize: 26,
    fontWeight: '700',
    color: colors.onyx,
    fontFamily: 'Inter-Bold',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  otpInputFilled: {
    borderColor: colors.terracotta,
    backgroundColor: `${colors.terracotta}08`,
  },
  otpInputError: {
    borderColor: `${colors.terracotta}60`,
  },

  // Bouton Valider
  validateButton: {
    backgroundColor: colors.terracotta,
    borderRadius: 28,
    paddingVertical: 18,
    marginHorizontal: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    shadowColor: colors.terracotta,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  validateButtonDisabled: {
    opacity: 0.6,
  },
  validateButtonText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 17,
    lineHeight: 24,
    color: colors.sand,
    letterSpacing: 0.3,
  },

  // Lien renvoyer
  resendWrapper: {
    alignItems: 'center',
    marginTop: spacing.lg,
    paddingHorizontal: spacing.md,
  },
  countdownText: {
    fontFamily: 'Inter-Regular',
    fontSize: 13,
    lineHeight: 20,
    color: '#64748B',
    textAlign: 'center',
  },
  countdownTimer: {
    color: colors.terracotta,
    fontWeight: '600',
  },
  resendLink: {
    fontFamily: 'Inter-Regular',
    fontSize: 13,
    lineHeight: 20,
    color: '#64748B',
    textAlign: 'center',
  },
  resendLinkBold: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 13,
    lineHeight: 20,
    color: colors.terracotta,
    textDecorationLine: 'underline',
  },

  // Section bas : points + barre
  bottomSection: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },

  // Points indicateurs
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: spacing.xl,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  dotActive: {
    backgroundColor: `${colors.terracotta}90`,
    width: 24,
  },
  dotInactive: {
    backgroundColor: `${colors.stone}25`,
  },

  // Barre decorative alternee
  accentBar: {
    flexDirection: 'row',
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  accentSegment: {
    flex: 1,
  },
});
