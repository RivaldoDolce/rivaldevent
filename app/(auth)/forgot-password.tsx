/**
 * Mot de passe oublie — flow Clerk en 3 etapes.
 *
 * 1. Email : envoi du code de reinitialisation (resetPasswordEmailCode)
 * 2. Code : saisie du code recu par email
 * 3. Nouveau mot de passe : reinitialisation + session active
 *
 * Design « Noir & Or » aligne sur login.tsx :
 * - Fond noir profond + halo doré, logo medaillon or en haut
 * - Cartes verre fumé par etape, retour pastille verre
 *
 * Logique (inchangée) : useAuthService (Clerk Core 3), 3 formulaires
 * react-hook-form + zod.
 */

import { useCallback, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  ImageBackground,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ChevronLeft, Mail, KeyRound, Lock, Check } from 'lucide-react-native';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Logo } from '@/components/icons/Logo';
import { colors, typography, spacing, radius, shadows } from '@/lib/constants';
import { authBackgrounds } from '@/lib/images';
import { useHaptics } from '@/hooks/useHaptics';
import { useAuthService } from '@/services/auth.service';
import {
  forgotPasswordSchema,
  forgotPasswordCodeSchema,
  newPasswordSchema,
  type ForgotPasswordInput,
  type ForgotPasswordCodeInput,
  type NewPasswordInput,
} from '@/lib/validation';

type Step = 'email' | 'code' | 'password' | 'success';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { impact, notification } = useHaptics();
  const authService = useAuthService();

  const [step, setStep] = useState<Step>('email');
  const [isLoading, setIsLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [email, setEmail] = useState('');

  const emailForm = useForm<ForgotPasswordInput>({
    mode: 'onChange',
    reValidateMode: 'onChange',
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  });

  const codeForm = useForm<ForgotPasswordCodeInput>({
    mode: 'onChange',
    reValidateMode: 'onChange',
    resolver: zodResolver(forgotPasswordCodeSchema),
    defaultValues: { code: '' },
  });

  const passwordForm = useForm<NewPasswordInput>({
    mode: 'onChange',
    reValidateMode: 'onChange',
    resolver: zodResolver(newPasswordSchema),
    defaultValues: { password: '', confirm_password: '' },
  });

  const handleBack = useCallback(() => {
    impact('light');
    if (step === 'email' || step === 'success') {
      router.back();
      return;
    }
    setAuthError(null);
    setStep(step === 'password' ? 'code' : 'email');
  }, [impact, router, step]);

  const sendCode = useCallback(
    async (data: ForgotPasswordInput) => {
      setIsLoading(true);
      setAuthError(null);
      impact('light');

      const result = await authService.resetPassword(data.email);

      if (result.error) {
        setAuthError(result.error.message);
        notification('error');
      } else {
        notification('success');
        setEmail(data.email);
        setStep('code');
      }

      setIsLoading(false);
    },
    [impact, notification, authService]
  );

  const verifyCode = useCallback(
    async (data: ForgotPasswordCodeInput) => {
      setIsLoading(true);
      setAuthError(null);
      impact('light');

      const result = await authService.resetPasswordVerify(data.code);

      if (result.error) {
        setAuthError(result.error.message);
        notification('error');
      } else {
        setStep('password');
      }

      setIsLoading(false);
    },
    [impact, notification, authService]
  );

  const submitNewPassword = useCallback(
    async (data: NewPasswordInput) => {
      setIsLoading(true);
      setAuthError(null);
      impact('light');
      const result = await authService.resetPasswordSubmit(data.password);
      if (result.error) {
        setAuthError(result.error.message);
        notification('error');
      } else {
        notification('success');
        router.replace('/(client)/home');
      }
      setIsLoading(false);
    },
    [impact, notification, authService, router]
  );

  const renderStepTitle = () => {
    switch (step) {
      case 'code':
        return {
          title: 'Verification',
          subtitle: `Saisissez le code a 6 chiffres envoye a ${email || 'votre adresse email'}.`,
        };
      case 'password':
        return {
          title: 'Nouveau mot de passe',
          subtitle: 'Choisissez un mot de passe robuste et inutilise sur vos autres comptes.',
        };
      default:
        return {
          title: 'Mot de passe oublie',
          subtitle:
            'Indiquez votre adresse email et nous vous enverrons un code de verification.',
        };
    }
  };

  const { title, subtitle } = renderStepTitle();

  return (
    <ImageBackground
      source={authBackgrounds.forgot}
      style={styles.screen}
      imageStyle={styles.bgImage}
      accessibilityIgnoresInvertColors
    >
      {/* Voile dégradé pour la lisibilité */}
      <LinearGradient
        colors={['rgba(10,9,8,0.55)', 'rgba(10,9,8,0.86)']}
        style={styles.bgScrim}
        pointerEvents="none"
      />
<KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView
          style={styles.body}
        contentContainerStyle={{
          flexGrow: 1,
          paddingTop: insets.top + spacing.md,
          paddingBottom: insets.bottom + spacing.lg,
          paddingHorizontal: spacing.lg,
        }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Halo doré discret en haut */}
        <View pointerEvents="none" style={styles.glowTop} />
        <View pointerEvents="none" style={styles.ringDeco} />

        {/* Bouton retour */}
        <Pressable
          onPress={handleBack}
          hitSlop={12}
          style={styles.backButton}
          accessibilityRole="button"
          accessibilityLabel="Retour"
        >
          <ChevronLeft size={22} color={colors.goldBright} strokeWidth={1.75} />
        </Pressable>

        {/* Logo — medaillon or centré */}
        <View style={styles.logoWrap}>
          <Logo size="md" withBackground />
        </View>

        {/* Titre */}
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>

        {step === 'email' && (
          <View style={styles.formCard}>
            {authError ? (
              <View style={styles.errorBanner}>
                <Text style={styles.errorText}>{authError}</Text>
              </View>
            ) : null}

            <Controller
              control={emailForm.control}
              name="email"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Adresse email"
                  placeholder="rivaldocabrel@email.com"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={emailForm.formState.errors.email?.message}
                  isValid={!emailForm.formState.errors.email?.message && value.length > 3}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  iconLeft={<Mail color={colors.goldMuted} size={20} strokeWidth={1.5} />}
                  helperText="Le code expirera apres 10 minutes"
                />
              )}
            />

            <View style={styles.submitWrap}>
              <Button
                variant="primary"
                size="lg"
                fullWidth
                loading={isLoading}
                disabled={!emailForm.formState.isValid}
                onPress={emailForm.handleSubmit(sendCode)}
              >
                {isLoading ? 'Envoi...' : 'Envoyer le code'}
              </Button>
            </View>
          </View>
        )}

        {step === 'code' && (
          <View style={styles.formCard}>
            {authError ? (
              <View style={styles.errorBanner}>
                <Text style={styles.errorText}>{authError}</Text>
              </View>
            ) : null}

            <Controller
              control={codeForm.control}
              name="code"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Code de verification"
                  placeholder="123456"
                  value={value}
                  onChangeText={(text) => onChange(text.replace(/\D/g, ''))}
                  onBlur={onBlur}
                  error={codeForm.formState.errors.code?.message}
                  isValid={!codeForm.formState.errors.code?.message && value.length === 6}
                  keyboardType="numeric"
                  autoCapitalize="none"
                  maxLength={6}
                  iconLeft={<KeyRound color={colors.goldMuted} size={20} strokeWidth={1.5} />}
                  helperText="Verifiez votre boite de reception (et vos spams)"
                />
              )}
            />

            <View style={styles.submitWrap}>
              <Button
                variant="primary"
                size="lg"
                fullWidth
                loading={isLoading}
                disabled={!codeForm.formState.isValid}
                onPress={codeForm.handleSubmit(verifyCode)}
              >
                {isLoading ? 'Verification...' : 'Verifier le code'}
              </Button>
            </View>

            <Pressable
              onPress={() => {
                impact('light');
                setAuthError(null);
                setStep('email');
              }}
              hitSlop={8}
              style={styles.backLink}
              accessibilityRole="button"
              accessibilityLabel="Changer d'adresse email"
            >
              <Text style={styles.backLinkText}>Utiliser une autre adresse</Text>
            </Pressable>
          </View>
        )}

        {step === 'password' && (
          <View style={styles.formCard}>
            {authError ? (
              <View style={styles.errorBanner}>
                <Text style={styles.errorText}>{authError}</Text>
              </View>
            ) : null}

            <Controller
              control={passwordForm.control}
              name="password"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Nouveau mot de passe"
                  placeholder="••••••••"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={passwordForm.formState.errors.password?.message}
                  secureTextEntry
                  iconLeft={<Lock color={colors.goldMuted} size={20} strokeWidth={1.5} />}
                />
              )}
            />

            <Controller
              control={passwordForm.control}
              name="confirm_password"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Confirmer le mot de passe"
                  placeholder="••••••••"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={passwordForm.formState.errors.confirm_password?.message}
                  isValid={
                    !passwordForm.formState.errors.confirm_password?.message &&
                    value.length > 0 &&
                    value === passwordForm.watch('password')
                  }
                  secureTextEntry
                  iconLeft={<Check color={colors.goldMuted} size={20} strokeWidth={1.5} />}
                />
              )}
            />

            <View style={styles.submitWrap}>
              <Button
                variant="primary"
                size="lg"
                fullWidth
                loading={isLoading}
                disabled={!passwordForm.formState.isValid}
                onPress={passwordForm.handleSubmit(submitNewPassword)}
              >
                {isLoading ? 'Reinitialisation...' : 'Reinitialiser le mot de passe'}
              </Button>
            </View>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  bgImage: {
    ...StyleSheet.absoluteFillObject,
  },
  bgScrim: {
    ...StyleSheet.absoluteFillObject,
  },
  body: {
    flex: 1,
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
  backButton: {
    width: 44,
    height: 44,
    borderRadius: radius.full,
    backgroundColor: colors.glass,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  logoWrap: {
    alignItems: 'center',
    marginTop: spacing.xl,
    marginBottom: spacing.lg,
    ...shadows.goldGlowSoft,
  },
  title: {
    ...typography.h2,
    color: colors.text,
    textAlign: 'center',
  },
  subtitle: {
    ...typography.body,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.xs,
    marginBottom: spacing.lg,
    maxWidth: 320,
    alignSelf: 'center',
  },
  formCard: {
    backgroundColor: colors.glass,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: 2,
    ...shadows.card,
  },
  errorBanner: {
    backgroundColor: colors.glass,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: `${colors.danger}40`,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  errorText: {
    ...typography.bodySmall,
    color: colors.danger,
    textAlign: 'center',
  },
  submitWrap: {
    marginTop: spacing.md,
  },
  backLink: {
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  backLinkText: {
    ...typography.bodySmallMedium,
    color: colors.goldBright,
    textDecorationLine: 'underline',
  },
});