/**
 * Mot de passe oublie — envoi de l'email de reinitialisation.
 *
 * Design aligne sur login.tsx :
 * - Fond sand, logo en haut, titre serif
 * - Champs email + bouton "Envoyer le lien"
 * - Etat de succes "Email envoye" avec retour a la connexion
 *
 * Donnees : authService.resetPassword (Supabase a terme).
 * Conventions : couleurs depuis lib/constants.ts, pas d'emojis.
 */

import { useCallback, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Image } from 'expo-image';
import { ChevronLeft, Mail, MailCheck } from 'lucide-react-native';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { colors, typography, spacing, radius } from '@/lib/constants';
import { useHaptics } from '@/hooks/useHaptics';
import { authService } from '@/services/auth.service';
import {
  forgotPasswordSchema,
  type ForgotPasswordInput,
} from '@/lib/validation';

const LOGO_SOURCE = require('@/assets/images/logo.png');

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { impact, notification } = useHaptics();

  const [isLoading, setIsLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [sentEmail, setSentEmail] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm<ForgotPasswordInput>({
    mode: 'onChange',
    reValidateMode: 'onChange',
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  });

  const handleBack = useCallback(() => {
    impact('light');
    router.back();
  }, [impact, router]);

  const goToLogin = useCallback(() => {
    impact('light');
    router.back();
  }, [impact, router]);

  const onSubmit = useCallback(
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
        setSentEmail(data.email);
      }

      setIsLoading(false);
    },
    [impact, notification]
  );

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <ScrollView
        style={styles.screen}
        contentContainerStyle={{
          flexGrow: 1,
          paddingTop: insets.top + spacing.md,
          paddingBottom: insets.bottom + spacing.lg,
          paddingHorizontal: spacing.lg,
        }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Bouton retour */}
        <Pressable
          onPress={handleBack}
          hitSlop={12}
          style={styles.backButton}
          accessibilityRole="button"
          accessibilityLabel="Retour"
        >
          <ChevronLeft size={24} color={colors.onyx} strokeWidth={1.75} />
        </Pressable>

        {/* Logo */}
        <View style={styles.logoWrap}>
          <Image
            source={LOGO_SOURCE}
            style={styles.logo}
            contentFit="contain"
            transition={200}
          />
        </View>

        {/* Titre */}
        <Text style={styles.title}>Mot de passe oublie</Text>
        <Text style={styles.subtitle}>
          Indiquez votre adresse email et nous vous enverrons un lien
          pour reinitialiser votre mot de passe.
        </Text>

        {sentEmail ? (
          /* ============ ETAT SUCCES ============ */
          <View style={styles.successCard}>
            <View style={styles.successIcon}>
              <MailCheck size={28} color={colors.forest} strokeWidth={1.75} />
            </View>
            <Text style={styles.successTitle}>Email envoye</Text>
            <Text style={styles.successText}>
              Si un compte existe pour {sentEmail}, un lien de
              reinitialisation vient de lui etre envoye. Verifiez votre
              boite de reception (et vos spams).
            </Text>
            <View style={styles.successButtonWrap}>
              <Button
                variant="primary"
                size="lg"
                fullWidth
                onPress={goToLogin}
              >
                Retour a la connexion
              </Button>
            </View>
          </View>
        ) : (
          /* ============ FORMULAIRE ============ */
          <View style={styles.formCard}>
            {authError ? (
              <View style={styles.errorBanner}>
                <Text style={styles.errorText}>{authError}</Text>
              </View>
            ) : null}

            <Controller
              control={control}
              name="email"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Adresse email"
                  placeholder="rivaldocabrel@email.com"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.email?.message}
                  isValid={!errors.email?.message && value.length > 3}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  iconLeft={<Mail color={colors.stone} size={20} strokeWidth={1.5} />}
                  helperText="Le lien expirera apres 30 minutes"
                />
              )}
            />

            <View style={styles.submitWrap}>
              <Button
                variant="primary"
                size="lg"
                fullWidth
                loading={isLoading}
                disabled={!isValid}
                onPress={handleSubmit(onSubmit)}
              >
                {isLoading ? 'Envoi...' : 'Envoyer le lien'}
              </Button>
            </View>

            <Pressable
              onPress={handleBack}
              hitSlop={8}
              style={styles.backLink}
              accessibilityRole="button"
              accessibilityLabel="Revenir a la connexion"
            >
              <Text style={styles.backLinkText}>Retour a la connexion</Text>
            </Pressable>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.sand,
  },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: radius.full,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: `${colors.border}60`,
  },
  logoWrap: {
    alignItems: 'center',
    marginTop: spacing.xl,
    marginBottom: spacing.md,
  },
  logo: {
    width: 110,
    height: 110,
  },
  title: {
    ...typography.h2,
    color: colors.onyx,
    textAlign: 'center',
  },
  subtitle: {
    ...typography.body,
    color: colors.stone,
    textAlign: 'center',
    marginTop: spacing.xs,
    marginBottom: spacing.lg,
    maxWidth: 320,
    alignSelf: 'center',
  },
  formCard: {
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: `${colors.border}60`,
    padding: spacing.lg,
    gap: 2,
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
  submitWrap: {
    marginTop: spacing.md,
  },
  backLink: {
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  backLinkText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    lineHeight: 20,
    color: colors.stone,
  },
  successCard: {
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: `${colors.border}60`,
    padding: spacing.xl,
    alignItems: 'center',
  },
  successIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: `${colors.forest}12`,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  successTitle: {
    fontFamily: 'PlayfairDisplay-SemiBold',
    fontSize: 19,
    lineHeight: 26,
    color: colors.onyx,
  },
  successText: {
    ...typography.body,
    color: colors.stone,
    textAlign: 'center',
    marginTop: spacing.xs,
    marginBottom: spacing.lg,
  },
  successButtonWrap: {
    alignSelf: 'stretch',
  },
});