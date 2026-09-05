/**
 * OTP - verification du code.
 *
 * Design « Noir & Or » (mis a jour) :
 * - Fond noir profond + halo doré discret en haut
 * - Fleche retour pastille verre en haut a gauche
 * - Logo medaillon or centré
 * - Titre « Verification » Playfair, sous-titre textMuted
 * - Cases de code carrees sombres (surfaceAlt, filet or au remplissage,
 *   texte Playfair or champagne)
 * - Bouton « Valider » or champagne pleine largeur
 * - Minuteur en overline, lien « Renvoyer le code » doré
 *
 * Securite (inchangée) :
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
  ImageBackground,
  Platform,
  useWindowDimensions,
  type TextInputKeyPressEvent,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowRight, ChevronLeft } from 'lucide-react-native';

import { Button } from '@/components/ui/Button';
import { Logo } from '@/components/icons/Logo';
import { colors, radius, spacing, typography, APP_CONFIG } from '@/lib/constants';
import { authBackgrounds } from '@/lib/images';
import { useHaptics } from '@/hooks/useHaptics';
import { useAuthService } from '@/services/auth.service';

const OTP_LENGTH = APP_CONFIG.OTP_CODE_LENGTH;
const COUNTDOWN_SECONDS = 60;

export default function OtpScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ phone?: string; email?: string; migrate?: string }>();
  const insets = useSafeAreaInsets();
  const { impact, notification } = useHaptics();
  const authService = useAuthService();

  const isMigration = params.migrate === '1';
  const [code, setCode] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(COUNTDOWN_SECONDS);

  const { width: windowWidth } = useWindowDimensions();
  const otpSpacing = 10;
  const otpInputSize = Math.min(
    56,
    Math.floor((windowWidth - spacing.lg * 2 - otpSpacing * (OTP_LENGTH - 1)) / OTP_LENGTH),
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
      setInfo(null);
      impact('light');

      let result;
      try {
        result = await authService.verifyOtp({
          phone: params.phone,
          email: params.email,
          token: fullCode,
          type: params.phone ? 'sms' : 'email',
        });
      } catch {
        setError('Une erreur est survenue. Veuillez réessayer.');
        notification('error');
        setIsLoading(false);
        return;
      }

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
      const cleaned = value.replace(/[^0-9]/g, '');
      if (cleaned.length > 1) {
        const digits = cleaned.slice(0, OTP_LENGTH).split('');
        setCode((prev) => {
          const next = [...prev];
          digits.forEach((d, i) => {
            const pos = index + i;
            if (pos < OTP_LENGTH) next[pos] = d;
          });
          return next;
        });
        setError(null);
        const full = cleaned.slice(0, OTP_LENGTH);
        if (full.length === OTP_LENGTH) handleVerify(full);
        else inputRefs.current[Math.min(index + digits.length, OTP_LENGTH - 1)]?.focus();
        return;
      }
      const digit = cleaned.slice(-1);
      setCode((prev) => {
        const newCode = [...prev];
        newCode[index] = digit;
        return newCode;
      });
      setError(null);

      if (digit && index < OTP_LENGTH - 1) {
        inputRefs.current[index + 1]?.focus();
      }

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
    if (countdown > 0) return;

    impact('light');
    setError(null);
    setInfo(null);
    let result;
    try {
      result = await authService.resendOtp(params.phone, params.email);
    } catch {
      setError('Renvoi impossible. Vérifiez votre connexion puis réessayez.');
      return;
    }

    if (result.error) {
      setError(result.error.message);
    } else {
      setCountdown(COUNTDOWN_SECONDS);
      setCode(Array(OTP_LENGTH).fill(''));
      setInfo(params.email ? `Un nouveau code a été envoyé à ${params.email}.` : 'Un nouveau code a été envoyé.');
      inputRefs.current[0]?.focus();
    }
  }, [countdown, params.phone, params.email, impact, authService]);

  const formatPhone = (phone?: string) => {
    if (!phone) return 'votre numero';
    return `+237 ${phone.slice(0, 1)}${phone.slice(1, 3)} ${phone.slice(3, 5)} ${phone.slice(5, 7)} ${phone.slice(7)}`;
  };

  const recipientText = params.phone
    ? `envoye au ${formatPhone(params.phone)}`
    : params.email
      ? `envoye a ${params.email}`
      : 'envoye a votre numero';

  return (
    <ImageBackground
      source={authBackgrounds.otp}
      style={styles.container}
      imageStyle={styles.bgImage}
      blurRadius={8}
      accessibilityIgnoresInvertColors
    >
      {/* Voile dégradé pour la lisibilité */}
      <LinearGradient
        colors={['rgba(10,9,8,0.52)', 'rgba(10,9,8,0.84)']}
        style={styles.bgScrim}
        pointerEvents="none"
      />

      {/* Halo doré discret en haut */}
      <View pointerEvents="none" style={styles.glowTop} />
      <View pointerEvents="none" style={styles.ringDeco} />

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
          <ChevronLeft size={22} color={colors.goldBright} strokeWidth={1.75} />
        </Pressable>
      </View>

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.content}>
          {/* Logo — medaillon or centré */}
          <View style={styles.logoWrapper}>
            <Logo size="md" withBackground />
          </View>

          {/* Titre */}
          <Text style={styles.title}>Verification</Text>

          {/* Sous-titre */}
          <Text style={styles.subtitle}>
            Veuillez saisir le code a{' '}
            <Text style={styles.subtitleHighlight}>{OTP_LENGTH} chiffres</Text>
            {' '}{recipientText}
          </Text>

          {/* Banniere migration (ancien compte Supabase) */}
          {isMigration && (
            <View style={styles.migrationBanner}>
              <Text style={styles.migrationTitle}>Ancien compte détecté</Text>
              <Text style={styles.migrationText}>
                Votre compte de l'ancienne version est en cours de migration.
                Vérifiez votre boîte mail pour finaliser. Si besoin, utilisez
                « Mot de passe oublié » à la prochaine connexion.
              </Text>
            </View>
          )}

          {/* Erreur */}
          {error && (
            <View style={styles.errorBanner}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {/* Confirmation renvoi */}
          {info && !error && (
            <View style={styles.infoBanner}>
              <Text style={styles.infoText}>{info}</Text>
            </View>
          )}

          {/* Cases OTP - carrees sombres */}
          <View style={styles.otpContainer}>
            {Array.from({ length: OTP_LENGTH }).map((_, index) => (
              <TextInput
                key={index}
                ref={(ref) => {
                  inputRefs.current[index] = ref;
                }}
                style={[
                  styles.otpInput,
                  { width: otpInputSize, height: otpInputSize },
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

          {/* Bouton Valider - or champagne pleine largeur */}
          <Button
            variant="primary"
            size="lg"
            fullWidth
            loading={isLoading}
            onPress={() => handleVerify()}
            icon={<ArrowRight color={colors.onyx} size={18} />}
            iconPosition="right"
          >
            Valider
          </Button>

          {/* Lien renvoyer premium */}
          <View style={styles.resendWrapper}>
            {countdown > 0 ? (
              <View style={styles.countdownCapsule}>
                <Text style={styles.countdownText}>
                  Renvoyer dans 0:{countdown.toString().padStart(2, '0')}
                </Text>
              </View>
            ) : (
              <Pressable onPress={handleResend} hitSlop={12} style={styles.resendCapsule}>
                <Text style={styles.resendLink}>
                  Vous n&apos;avez pas recu le code ? <Text style={styles.resendLinkBold}>Renvoyer</Text>
                </Text>
              </Pressable>
            )}
          </View>
        </View>

        <View style={[styles.bottomSection, { paddingBottom: insets.bottom + spacing.xl }]}>
          {/* Barre decorative alternee */}
          <View style={styles.accentBar}>
            <View style={[styles.accentSegment, { backgroundColor: colors.background }]} />
            <View style={[styles.accentSegment, { backgroundColor: colors.gold }]} />
            <View style={[styles.accentSegment, { backgroundColor: colors.background }]} />
            <View style={[styles.accentSegment, { backgroundColor: colors.gold }]} />
            <View style={[styles.accentSegment, { backgroundColor: colors.background }]} />
            <View style={[styles.accentSegment, { backgroundColor: colors.gold }]} />
            <View style={[styles.accentSegment, { backgroundColor: colors.background }]} />
            <View style={[styles.accentSegment, { backgroundColor: colors.gold }]} />
          </View>
        </View>
      </KeyboardAvoidingView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    overflow: 'hidden',
  },
  bgImage: {
    ...StyleSheet.absoluteFillObject,
  },
  bgScrim: {
    ...StyleSheet.absoluteFillObject,
  },
  glowTop: {
    position: 'absolute',
    top: -140,
    right: -80,
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: 'rgba(216,180,90,0.08)',
  },
  ringDeco: {
    position: 'absolute',
    top: 40,
    right: -40,
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 1.5,
    borderColor: 'rgba(216,180,90,0.14)',
  },

  // Barre du haut
  topBar: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: radius.full,
    backgroundColor: colors.glass,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },

  keyboardView: {
    flex: 1,
  },

  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },

  logoWrapper: {
    alignItems: 'center',
    marginBottom: spacing.lg,
    shadowColor: 'rgba(216,180,90,0.25)',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 18,
    elevation: 6,
  },

  // Titre
  title: {
    ...typography.h2,
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },

  // Sous-titre
  subtitle: {
    ...typography.body,
    color: colors.textMuted,
    textAlign: 'center',
    marginBottom: spacing.xl,
    paddingHorizontal: spacing.md,
  },
  subtitleHighlight: {
    ...typography.bodySemiBold,
    color: colors.goldBright,
  },

  // Banniere migration
  migrationBanner: {
    backgroundColor: colors.glassGold,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.borderGold,
    padding: spacing.md,
    marginBottom: spacing.md,
    marginHorizontal: spacing.sm,
  },
  migrationTitle: {
    ...typography.bodySmallSemiBold,
    color: colors.goldBright,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  migrationText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    textAlign: 'center',
  },

  // Erreur
  errorBanner: {
    backgroundColor: colors.glass,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: `${colors.danger}40`,
    padding: spacing.md,
    marginBottom: spacing.md,
    marginHorizontal: spacing.sm,
  },
  errorText: {
    ...typography.bodySmallMedium,
    color: colors.danger,
    textAlign: 'center',
  },

  // Confirmation (code renvoye)
  infoBanner: {
    backgroundColor: colors.glass,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: `${colors.gold}40`,
    padding: spacing.md,
    marginBottom: spacing.md,
    marginHorizontal: spacing.sm,
  },
  infoText: {
    ...typography.bodySmallMedium,
    color: colors.goldBright,
    textAlign: 'center',
  },

  // Cases OTP
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xl,
    gap: 10,
    paddingHorizontal: spacing.xs,
  },
  otpInput: {
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 14,
    backgroundColor: 'rgba(30,26,22,0.92)',
    textAlign: 'center',
    fontFamily: 'PlayfairDisplay_600SemiBold',
    fontSize: 22,
    lineHeight: 26,
    color: colors.text,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 3,
    paddingVertical: 0,
    includeFontPadding: false,
  },
  otpInputFilled: {
    borderColor: colors.gold,
    backgroundColor: 'rgba(216,180,90,0.14)',
    color: colors.goldBright,
    textShadowColor: 'rgba(216,180,90,0.30)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  otpInputError: {
    borderColor: `${colors.danger}60`,
  },

  // Lien renvoyer premium
  resendWrapper: {
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  countdownCapsule: {
    backgroundColor: colors.glass,
    borderWidth: 1,
    borderColor: `${colors.gold}26`,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: radius.full,
  },
  resendCapsule: {
    backgroundColor: 'rgba(216,180,90,0.12)',
    borderWidth: 1,
    borderColor: `${colors.gold}40`,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
  },
  countdownText: {
    ...typography.overline,
    color: colors.goldMuted,
    textAlign: 'center',
    letterSpacing: 1.4,
  },
  resendLink: {
    ...typography.bodySmall,
    color: colors.textMuted,
    textAlign: 'center',
  },
  resendLinkBold: {
    ...typography.bodySmallSemiBold,
    color: colors.goldBright,
    textDecorationLine: 'underline',
  },

  // Section bas : barre decorative
  bottomSection: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
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