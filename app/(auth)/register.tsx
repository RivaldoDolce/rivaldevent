/**
 * Inscription - enregistrement email + mot de passe + métadonnées.
 *
 * Design :
 * - Fond sable
 * - Titre "Créer un compte"
 * - Sous-titre "Rejoignez l'élégance de vos événements"
 * - Prénom | Nom en ligne
 * - Email
 * - Date de naissance
 * - Mot de passe (politique Clerk : 15 caractères min)
 * - Confirmer le mot de passe
 * - Case à cocher CGV + case "Je veux vendre"
 * - Bouton "S'inscrire"
 * - OU
 * - S'inscrire avec Google / Apple (logos séparés des libellés)
 * - Déjà un compte ? Se connecter
 *
 * OAuth : useSSO experimental (@clerk/expo/experimental), retour
 * navigateur via la route /oauth-callback.
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
import { SocialButtons, type SocialProvider } from '@/components/auth/SocialButtons';
import { colors, typography, spacing, radius, ROUTES } from '@/lib/constants';
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
      style={{ flex: 1, backgroundColor: colors.sand }}
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
                    iconLeft={<User color={colors.stone} size={20} strokeWidth={1.5} />}
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
                iconLeft={<Mail color={colors.stone} size={20} strokeWidth={1.5} />}
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
                iconLeft={<Lock color={colors.stone} size={20} strokeWidth={1.5} />}
                iconRight={
                  <Pressable onPress={() => setShowPassword(!showPassword)} hitSlop={12}>
                    {showPassword ? (
                      <EyeOff color={colors.stone} size={20} strokeWidth={1.5} />
                    ) : (
                      <Eye color={colors.stone} size={20} strokeWidth={1.5} />
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
                iconLeft={<Lock color={colors.stone} size={20} strokeWidth={1.5} />}
                iconRight={
                  <Pressable onPress={() => setShowConfirm(!showConfirm)} hitSlop={12}>
                    {showConfirm ? (
                      <EyeOff color={colors.stone} size={20} strokeWidth={1.5} />
                    ) : (
                      <Eye color={colors.stone} size={20} strokeWidth={1.5} />
                    )}
                  </Pressable>
                }
              />
            )}
          />

          <Text style={styles.passwordHint}>
            Minimum 15 caractères, une majuscule, un chiffre et un caractère spécial.
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
            {acceptTerms && <Check color={colors.sand} size={14} strokeWidth={3} />}
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
            {isOrganizer && <Check color={colors.sand} size={14} strokeWidth={3} />}
          </View>
          <Text style={styles.checkboxLabel}>
            Je souhaite creer et vendre{'\n'}des evenements sur Rivald'event
          </Text>
        </Pressable>

        {/* Bouton S'inscrire */}
        <Button
          variant="primary"
          size="lg"
          fullWidth
          loading={isLoading}
          onPress={handleSubmit(onSubmit)}
          icon={<ArrowRight color={colors.sand} size={18} />}
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

        {/* Boutons sociaux — logo et libelle separes */}
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
            <ArrowRight color={colors.terracotta} size={14} style={{ marginLeft: 2 }} />
          </Pressable>
        </View>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.sand,
  },
  content: {
    paddingHorizontal: spacing.lg,
  },
  title: {
    fontFamily: 'PlayfairDisplay-Bold',
    fontSize: 28,
    lineHeight: 36,
    color: colors.onyx,
    letterSpacing: -0.5,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontFamily: 'Inter-Regular',
    fontSize: 15,
    lineHeight: 22,
    color: colors.stone,
    letterSpacing: 0.2,
    marginBottom: spacing.xl,
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
  form: {
    marginBottom: spacing.lg,
    gap: spacing.md,
  },
  row: {
    flexDirection: 'row',
  },
  passwordHint: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    lineHeight: 18,
    color: colors.stone,
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
    borderColor: `${colors.stone}60`,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  checkboxChecked: {
    backgroundColor: colors.terracotta,
    borderColor: colors.terracotta,
  },
  checkboxOrganizerChecked: {
    backgroundColor: colors.forest,
    borderColor: colors.forest,
  },
  checkboxLabel: {
    fontFamily: 'Inter-Regular',
    fontSize: 13,
    lineHeight: 20,
    color: colors.onyx,
    flex: 1,
  },
  linkText: {
    color: colors.gold,
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
    backgroundColor: `${colors.stone}30`,
  },
  separatorText: {
    ...typography.caption,
    color: colors.stone,
  },
  loginWrapper: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    lineHeight: 20,
    color: colors.onyx,
  },
  loginLinkWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  loginLink: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    lineHeight: 20,
    color: colors.terracotta,
    textDecorationLine: 'underline',
    letterSpacing: 0.2,
  },
});
