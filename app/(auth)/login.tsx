/**
 * Login - connexion email/password + alternatives.
 *
 * Design :
 * - Fond sand avec logo centré en haut
 * - Titre "Bienvenue" serif bold + sous-titre stone
 * - Formulaire : email + password (icone oeil pour reveal)
 * - Ligne : "Se souvenir de moi" (persiste l'email) + "Mot de passe oublié"
 * - Bouton "Se connecter" terracotta (CTA unique)
 * - Séparateur "OU"
 * - Boutons sociaux Google + Apple (logos séparés des libellés)
 * - Bouton téléphone (OTP SMS) séparé
 * - Lien "Inscrivez-vous" en bas
 *
 * OAuth (Google / Apple) : useSSO experimental (@clerk/expo/experimental)
 * qui active automatiquement la session ; le retour navigateur passe par
 * la route /oauth-callback qui redirige vers l'accueil.
 *
 * Migration : si l'email n'existe pas chez Clerk, on tente la connexion sur
 * l'ancien projet Supabase ; si elle réussit, le compte est recréé chez
 * Clerk et l'utilisateur finalise via un code email (écran OTP).
 */

import { useState, useCallback, useEffect } from 'react';
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
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Image } from 'expo-image';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { useSSO } from '@clerk/expo/experimental';
import { Eye, EyeOff, Mail, Lock, Phone, Check } from 'lucide-react-native';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { SocialButtons, type SocialProvider } from '@/components/auth/SocialButtons';
import { colors, typography, spacing, radius, ROUTES } from '@/lib/constants';
import { useHaptics } from '@/hooks/useHaptics';
import { useAuth } from '@/hooks/useAuth';
import { useAuthService } from '@/services/auth.service';
import { loginSchema, type LoginInput } from '@/lib/validation';
import { logger } from '@/lib/logger';
import { useAppMode } from '@/stores/app-mode';

const LOGO_SOURCE = require('@/assets/images/logo.png');
const REMEMBER_EMAIL_KEY = 'rivaldevent.remember_email';

WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { impact, notification } = useHaptics();
  const authService = useAuthService();
  const { isAuthenticated: isAuth } = useAuth();
  const { startSSOFlow } = useSSO();
  const mode = useAppMode((state: { mode: string }) => state.mode);
  const initializeFromProfile = useAppMode((state: { initializeFromProfile: (v: boolean) => void }) => state.initializeFromProfile);
  const [isLoading, setIsLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState<SocialProvider | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<LoginInput>({
    mode: 'onChange',
    reValidateMode: 'onChange',
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  // Pre-remplir l'email memorise au montage
  useEffect(() => {
    AsyncStorage.getItem(REMEMBER_EMAIL_KEY)
      .then((email) => {
        if (email) {
          setRememberMe(true);
          setValue('email', email);
        }
      })
      .catch(() => logger.debug('remember email read failed'));
  }, [setValue]);

  // Si la session s'active pendant qu'on est sur cet ecran
  // (retour OAuth notamment), rediriger immediatement vers l'accueil.
  useEffect(() => {
    if (isAuth) {
      router.replace(mode === 'seller' ? '/(seller)/home' : '/(client)/home');
    }
  }, [isAuth, mode, router]);

  const rememberEmail = useCallback(async (email: string) => {
    try {
      if (rememberMe) {
        await AsyncStorage.setItem(REMEMBER_EMAIL_KEY, email);
      } else {
        await AsyncStorage.removeItem(REMEMBER_EMAIL_KEY);
      }
    } catch {
      logger.debug('remember email save failed');
    }
  }, [rememberMe]);

  const onSubmit = useCallback(
    async (data: LoginInput) => {
      setIsLoading(true);
      setAuthError(null);
      impact('light');

      const result = await authService.signInWithEmail(data.email, data.password);

      if (result.error) {
        setAuthError(result.error.message);
        notification('error');
        setIsLoading(false);
        return;
      }

      // Migration d'ancien compte : verification email requise
      if (result.data?.requiresEmailVerification) {
        rememberEmail(data.email);
        notification('success');
        router.push({
          pathname: ROUTES.OTP,
          params: { email: data.email, migrate: '1' },
        });
        setIsLoading(false);
        return;
      }

      if (!result.data?.user?.id) {
        setAuthError('Une erreur est survenue. Veuillez reessayer.');
        notification('error');
        setIsLoading(false);
        return;
      }

      rememberEmail(data.email);
      notification('success');
      const mode = await authService.getUserMode(result.data.user.id);
      const isSeller = mode?.isSeller ?? false;
      initializeFromProfile(isSeller);
      router.replace(isSeller ? '/(seller)/home' : '/(client)/home');
      setIsLoading(false);
    },
    [impact, notification, router, initializeFromProfile, authService, rememberEmail]
  );

  const goToRegister = useCallback(() => {
    impact('light');
    router.push(ROUTES.REGISTER);
  }, [impact, router]);

  const goToPhoneLogin = useCallback(() => {
    impact('light');
    router.push(ROUTES.PHONE_LOGIN);
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
          setAuthError('Connexion annulée.');
          notification('error');
        }
        // Session active automatiquement : la route /oauth-callback
        // redirige vers l'accueil (acheteur ou vendeur).
      } catch (err) {
        logger.debug('Social login error:', err);
        setAuthError('Connexion impossible avec ce fournisseur. Réessayez.');
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
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
    >
      <ScrollView
        style={styles.container}
        contentContainerStyle={[styles.content, { flexGrow: 1, paddingTop: insets.top + spacing.xl, paddingBottom: insets.bottom + spacing.xxl }]}
        keyboardShouldPersistTaps="handled"
        nestedScrollEnabled
        showsVerticalScrollIndicator={false}
      >
        {/* Logo — centré, taille raisonnable */}
        <View style={styles.logoWrapper}>
          <View style={styles.logoCircle}>
            <Image source={LOGO_SOURCE} style={styles.logo} contentFit="contain" transition={300} />
          </View>
        </View>

        {/* Titre */}
        <Text style={styles.title}>Bienvenue</Text>
        <Text style={styles.subtitle}>
          L'élégance de vos événements commence ici.
        </Text>

        {/* Erreur globale */}
        {authError && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>{authError}</Text>
          </View>
        )}

        {/* Formulaire */}
        <View style={styles.form}>
          <Controller
            control={control}
            name="email"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="Email"
                placeholder="Ex: rivaldocabrel@email.com"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.email?.message}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                iconLeft={<Mail color={colors.stone} size={20} strokeWidth={1.5} />}
              />
            )}
          />

          <Controller
            control={control}
            name="password"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="Mot de passe"
                placeholder="••••••••"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.password?.message}
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

          {/* Se souvenir de moi + Mot de passe oublié */}
          <View style={styles.optionsRow}>
            <Pressable
              style={styles.checkboxWrapper}
              onPress={() => {
                impact('light');
                setRememberMe(!rememberMe);
              }}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: rememberMe }}
            >
              <View style={[styles.checkbox, rememberMe && styles.checkboxChecked]}>
                {rememberMe && <Check color={colors.sand} size={14} strokeWidth={3} />}
              </View>
              <Text style={styles.checkboxLabel}>Se souvenir de moi</Text>
            </Pressable>

            <Pressable
              onPress={() => {
                impact('light');
                router.push(ROUTES.FORGOT_PASSWORD);
              }}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="Mot de passe oublie"
            >
              <Text style={styles.forgotPasswordText}>Mot de passe oublié ?</Text>
            </Pressable>
          </View>
        </View>

        {/* Bouton principal CTA — terracotta, pleine largeur */}
        <Button
          variant="primary"
          size="lg"
          fullWidth
          loading={isLoading}
          onPress={handleSubmit(onSubmit)}
        >
          Se connecter
        </Button>

        {/* Séparateur "OU" */}
        <View style={styles.separator}>
          <View style={styles.separatorLine} />
          <Text style={styles.separatorText}>OU</Text>
          <View style={styles.separatorLine} />
        </View>

        {/* Boutons sociaux — logo et libelle separes */}
        <SocialButtons
          googleLabel="Se connecter avec Google"
          appleLabel="Se connecter avec Apple"
          loading={socialLoading}
          onGoogle={() => handleSocial('google')}
          onApple={() => handleSocial('apple')}
        />

        {/* Bouton téléphone — OTP SMS */}
        <Pressable
          style={styles.alternativeButton}
          onPress={goToPhoneLogin}
          disabled={socialLoading !== null}
          accessibilityRole="button"
        >
          <View style={styles.iconSlot} pointerEvents="none">
            <Phone color={colors.onyx} size={20} strokeWidth={1.8} />
          </View>
          <Text style={styles.alternativeText}>Utiliser mon numéro de téléphone</Text>
        </Pressable>

        {/* Lien inscription */}
        <View style={styles.signUpWrapper}>
          <Text style={styles.signUpText}>Vous n'avez pas de compte ? </Text>
          <Pressable onPress={goToRegister} hitSlop={12} style={styles.signUpLinkWrapper}>
            <Text style={styles.signUpLink}>Inscrivez-vous</Text>
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
  logoWrapper: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: `${colors.gold}15`,
    borderWidth: 1.5,
    borderColor: `${colors.gold}40`,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  logo: {
    width: 56,
    height: 56,
  },
  title: {
    fontFamily: 'PlayfairDisplay-Bold',
    fontSize: 32,
    lineHeight: 40,
    color: colors.onyx,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontFamily: 'Inter-Regular',
    fontSize: 15,
    lineHeight: 22,
    color: colors.stone,
    textAlign: 'center',
    marginTop: spacing.xs,
    marginBottom: spacing.xl,
    letterSpacing: 0.2,
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
  },
  optionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  checkboxWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: spacing.sm,
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
  },
  checkboxChecked: {
    backgroundColor: colors.terracotta,
    borderColor: colors.terracotta,
  },
  checkboxLabel: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    lineHeight: 20,
    color: colors.onyx,
  },
  forgotPasswordText: {
    fontFamily: 'Inter-Medium',
    fontSize: 13,
    lineHeight: 18,
    color: colors.terracotta,
    letterSpacing: 0.1,
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
    fontFamily: 'Inter-Medium',
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 1.5,
    color: colors.stone,
    textTransform: 'uppercase',
  },
  alternativeButton: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: `${colors.stone}30`,
    borderRadius: radius.lg,
    minHeight: 52,
    backgroundColor: colors.sand,
    marginTop: spacing.sm,
    alignItems: 'center',
    position: 'relative',
  },
  iconSlot: {
    position: 'absolute',
    left: spacing.md,
    top: 0,
    bottom: 0,
    width: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  alternativeText: {
    flex: 1,
    textAlign: 'center',
    fontFamily: 'Inter-Medium',
    fontSize: 15,
    lineHeight: 22,
    color: colors.onyx,
    letterSpacing: 0.2,
    paddingHorizontal: spacing.xl,
  },
  signUpWrapper: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: spacing.lg,
  },
  signUpText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    lineHeight: 20,
    color: colors.stone,
  },
  signUpLinkWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  signUpLink: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    lineHeight: 20,
    color: colors.terracotta,
    textDecorationLine: 'underline',
    letterSpacing: 0.2,
  },
});
