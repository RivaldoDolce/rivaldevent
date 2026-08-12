/**
 * Inscription - enregistrement email + mot de passe + métadonnées.
 *
 * Design « Noir & Or » :
 * - Fond noir profond + halo doré discret en haut
 * - Logo medaillon or centré, titre Playfair, sous-titre textMuted
 * - Champs Input dark, DateInput sombre
 * - Cases à cocher or (CGV) et forest (organisateur)
 * - CTA primary or champagne pleine largeur, boutons sociaux verre fumé
 *
 * Logique (inchangée) : react-hook-form + zod, signUpWithEmail,
 * OAuth useSSO experimental via la route /oauth-callback.
 */

import { useState, useCallback } from 'react';
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
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { useSSO } from '@clerk/expo/experimental';
import { Mail, Lock, User, ArrowRight, Check, Eye, EyeOff } from 'lucide-react-native';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { DateInput } from '@/components/ui/DateInput';
import { Logo } from '@/components/icons/Logo';
import { SocialButtons, type SocialProvider } from '@/components/auth/SocialButtons';
import { colors, typography, spacing, radius, shadows, ROUTES } from '@/lib/constants';
import { useHaptics } from '@/hooks/useHaptics';
import { useAuthService } from '@/services/auth.service';
import { registerSchema, type RegisterInput } from '@/lib/validation';
import { useAppMode } from '@/stores/app-mode';
import { logger } from '@/lib/logger';

WebBrowser.maybeCompleteAuthSession();

export default function RegisterScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { impact, notification } = useHaptics();
  const authService = useAuthService();
  const { startSSOFlow } = useSSO();
  const initializeFromProfile = useAppMode((state: { initializeFromProfile: (v: boolean) => void }) => state.initializeFromProfile);

  const [isLoading, setIsLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState<SocialProvider | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [isOrganizer, setIsOrganizer] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterInput>({
    mode: 'onChange',
    reValidateMode: 'onChange',
    resolver: zodResolver(registerSchema),
    defaultValues: {
      full_name: '',
      email: '',
      phone: '600000000',
      birth_date: '',
      password: '',
      confirm_password: '',
    },
  });

  const onSubmit = useCallback(
    async (data: RegisterInput) => {
      if (!acceptTerms) {
        setAuthError('Vous devez accepter les conditions générales.');
        return;
      }

      const { birth_date: _birth_date, ...payload } = data;

      setIsLoading(true);
      setAuthError(null);
      impact('light');

      const result = await authService.signUpWithEmail({ ...payload, is_seller: isOrganizer });

      if (result.error) {
        setAuthError(result.error.message);
        notification('error');
      } else if (result.data && 'access_token' in result.data) {
        // Session obtenue directement (confirm email desactive)
        notification('success');
        initializeFromProfile(isOrganizer);
        router.replace(isOrganizer ? '/(seller)/home' : '/(client)/home');
      } else {
        // Pas de session (confirm email active) → OTP
        notification('success');
        router.push({
          pathname: ROUTES.OTP,
          params: { email: data.email },
        });
      }

      setIsLoading(false);
    },
    [acceptTerms, impact, notification, router, isOrganizer, initializeFromProfile, authService]
  );

  const goToLogin = useCallback(() => {
    impact('light');
    router.back();
  }, [impact, router]);

  const handleSocial = useCallback(
    async (provider: SocialProvider) => {
      if (socialLoading) return;
      impact('light');
      setAuthError(null);
      setSocialLoading(provider);

      try {
        const { createdSessionId } = await startSSOFlow({
          strategy: provider === 'google' ? 'oauth_google' : 'oauth_apple',
          redirectUrl: Linking.createURL('/oauth-callback'),
        });

        if (!createdSessionId) {
          setAuthError('Inscription annulée.');
          notification('error');
        }
        // Session active automatiquement : la route /oauth-callback
        // redirige vers l'accueil.
      } catch (err) {
        logger.debug('Social signup error:', err);
        setAuthError('Inscription impossible avec ce fournisseur. Réessayez.');
        notification('error');
      } finally {
        setSocialLoading(null);
      }
    },
    [socialLoading, startSSOFlow, impact, notification]
  );

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <ScrollView
        style={styles.container}
        contentContainerStyle={[styles.content, { flexGrow: 1, paddingTop: insets.top + spacing.xl, paddingBottom: insets.bottom + spacing.xl }]}
        keyboardShouldPersistTaps="handled"
        nestedScrollEnabled
        showsVerticalScrollIndicator={false}
      >
        {/* Halo doré discret en haut */}
        <View pointerEvents="none" style={styles.glowTop} />
        <View pointerEvents="none" style={styles.ringDeco} />

        {/* Logo — medaillon or centré */}
        <View style={styles.logoWrapper}>
          <Logo size="md" withBackground />
        </View>

        {/* En-tête */}
        <Text style={styles.title}>Créer un compte</Text>
        <Text style={styles.subtitle}>Rejoignez l'élégance de vos événements</Text>

        {authError && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>{authError}</Text>
          </View>
        )}

        {/* Formulaire */}
        <View style={styles.form}>
          <View style={styles.row}>
            <View style={{ flex: 1, minWidth: 0, marginRight: spacing.sm }}>
              <Controller
                control={control}
                name="full_name"
                render={({ field: { onChange, onBlur, value } }) => (
                  <Input
                    placeholder="Prénom"
                    value={value.split(' ')[0] || ''}
                    onChangeText={(text) => {
                      const parts = value.split(' ');
                      onChange(`${text} ${parts[1] || ''}`.trim());
                    }}
                    onBlur={onBlur}
                    error={errors.full_name?.message}
                    isValid={!errors.full_name?.message && value.trim().length > 0}
                    autoCapitalize="words"
                    iconLeft={<User color={colors.goldMuted} size={20} strokeWidth={1.5} />}
                  />
                )}
              />
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Controller
                control={control}
                name="full_name"
                render={({ field: { onChange, onBlur, value } }) => (
                  <Input
                    placeholder="Nom"
                    value={value.split(' ')[1] || ''}
                    onChangeText={(text) => {
                      const parts = value.split(' ');
                      onChange(`${parts[0] || ''} ${text}`.trim());
                    }}
                    onBlur={onBlur}
                    error={errors.full_name?.message}
                    isValid={!errors.full_name?.message && value.trim().length > 0}
                    autoCapitalize="words"
                  />
                )}
              />
            </View>
          </View>

          <Controller
            control={control}
            name="email"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                placeholder="Email"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.email?.message}
                isValid={!errors.email?.message && value.length > 0}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                iconLeft={<Mail color={colors.goldMuted} size={20} strokeWidth={1.5} />}
              />
            )}
          />

          <Controller
            control={control}
            name="birth_date"
            render={({ field: { value, onChange } }) => (
              <DateInput
                label="Date de naissance"
                value={value}
                onDateChange={onChange}
                error={errors.birth_date?.message}
              />
            )}
          />

          <Controller
            control={control}
            name="password"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                placeholder="Mot de passe"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.password?.message}
                isValid={!errors.password?.message && value.length > 0}
                secureTextEntry={!showPassword}
                iconLeft={<Lock color={colors.goldMuted} size={20} strokeWidth={1.5} />}
                iconRight={
                  <Pressable onPress={() => setShowPassword(!showPassword)} hitSlop={12}>
                    {showPassword ? (
                      <EyeOff color={colors.goldMuted} size={20} strokeWidth={1.5} />
                    ) : (
                      <Eye color={colors.goldMuted} size={20} strokeWidth={1.5} />
                    )}
                  </Pressable>
                }
              />
            )}
          />

          <Controller
            control={control}
            name="confirm_password"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                placeholder="Confirmer le mot de passe"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.confirm_password?.message}
                isValid={!errors.confirm_password?.message && value.length > 0}
                secureTextEntry={!showConfirm}
                iconLeft={<Lock color={colors.goldMuted} size={20} strokeWidth={1.5} />}
                iconRight={
                  <Pressable onPress={() => setShowConfirm(!showConfirm)} hitSlop={12}>
                    {showConfirm ? (
                      <EyeOff color={colors.goldMuted} size={20} strokeWidth={1.5} />
                    ) : (
                      <Eye color={colors.goldMuted} size={20} strokeWidth={1.5} />
                    )}
                  </Pressable>
                }
              />
            )}
          />

          <Text style={styles.passwordHint}>
            Minimum 8 caractères.
          </Text>
        </View>

        {/* CGV Checkbox */}
        <Pressable
          style={styles.checkboxWrapper}
          onPress={() => {
            impact('light');
            setAcceptTerms(!acceptTerms);
          }}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: acceptTerms }}
        >
          <View style={[styles.checkbox, acceptTerms && styles.checkboxChecked]}>
            {acceptTerms && <Check color={colors.onyx} size={14} strokeWidth={3} />}
          </View>
          <Text style={styles.checkboxLabel}>
            J'accepte les conditions générales{'\n'}et la <Text style={styles.linkText}>politique de confidentialité</Text>
          </Text>
        </Pressable>

        {/* Checkbox organisateur */}
        <Pressable
          style={styles.checkboxWrapper}
          onPress={() => {
            impact('light');
            setIsOrganizer(!isOrganizer);
          }}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: isOrganizer }}
        >
          <View style={[styles.checkbox, isOrganizer && styles.checkboxOrganizerChecked]}>
            {isOrganizer && <Check color={colors.onyx} size={14} strokeWidth={3} />}
          </View>
          <Text style={styles.checkboxLabel}>
            Je souhaite creer et vendre{'\n'}des evenements sur Rivald'event
          </Text>
        </Pressable>

        {/* Bouton S'inscrire — or champagne, pleine largeur */}
        <Button
          variant="primary"
          size="lg"
          fullWidth
          loading={isLoading}
          onPress={handleSubmit(onSubmit)}
          icon={<ArrowRight color={colors.onyx} size={18} />}
          iconPosition="right"
        >
          S'inscrire
        </Button>

        {/* Séparateur */}
        <View style={styles.separator}>
          <View style={styles.separatorLine} />
          <Text style={styles.separatorText}>OU</Text>
          <View style={styles.separatorLine} />
        </View>

        {/* Boutons sociaux — cartes verre fumé */}
        <SocialButtons
          googleLabel="S'inscrire avec Google"
          appleLabel="S'inscrire avec Apple"
          loading={socialLoading}
          onGoogle={() => handleSocial('google')}
          onApple={() => handleSocial('apple')}
        />

        {/* Lien Se connecter */}
        <View style={styles.loginWrapper}>
          <Text style={styles.loginText}>Vous avez déjà un compte ? </Text>
          <Pressable onPress={goToLogin} hitSlop={12} style={styles.loginLinkWrapper}>
            <Text style={styles.loginLink}>Se connecter</Text>
            <ArrowRight color={colors.goldBright} size={14} style={{ marginLeft: 2 }} />
          </Pressable>
        </View>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingHorizontal: spacing.lg,
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
  logoWrapper: {
    alignItems: 'center',
    marginBottom: spacing.xl,
    ...shadows.goldGlowSoft,
  },
  title: {
    ...typography.h2,
    color: colors.text,
    letterSpacing: -0.5,
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...typography.body,
    color: colors.textMuted,
    letterSpacing: 0.2,
    marginBottom: spacing.xl,
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
  form: {
    marginBottom: spacing.lg,
    gap: spacing.md,
  },
  row: {
    flexDirection: 'row',
  },
  passwordHint: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: -spacing.xs,
  },
  checkboxWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.xl,
    paddingRight: spacing.md,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: colors.borderStrong,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
    marginRight: spacing.md,
  },
  checkboxChecked: {
    backgroundColor: colors.gold,
    borderColor: colors.gold,
  },
  checkboxOrganizerChecked: {
    backgroundColor: colors.forest,
    borderColor: colors.forest,
  },
  checkboxLabel: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    flex: 1,
  },
  linkText: {
    color: colors.goldBright,
    fontWeight: '500',
    textDecorationLine: 'underline',
  },
  separator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing.lg,
  },
  separatorLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.divider,
  },
  separatorText: {
    ...typography.overline,
    color: colors.goldMuted,
    marginHorizontal: spacing.md,
    letterSpacing: 2,
  },
  loginWrapper: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginText: {
    ...typography.bodySmall,
    color: colors.textMuted,
  },
  loginLinkWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  loginLink: {
    ...typography.bodySmallSemiBold,
    color: colors.goldBright,
    textDecorationLine: 'underline',
    letterSpacing: 0.2,
  },
});