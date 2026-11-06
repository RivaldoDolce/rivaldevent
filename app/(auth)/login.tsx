/**
 * Login - connexion email/password + alternatives.
 *
 * Design « Noir & Or » :
 * - Fond noir profond + halo doré discret en haut
 * - Logo medaillon or centré, titre Playfair, sous-titre textMuted
 * - Champs Input dark, CTA primary or champagne pleine largeur
 * - Boutons sociaux en cartes verre fumé
 * - Lien inscription doré
 *
 * Logique :
 * - Email/password + Google : Supabase Auth (useAuthService)
 * - Apple uniquement : Clerk SSO (useSSO `oauth_apple`) via /oauth-callback
 * - Formulaire react-hook-form + zod
 */

import { useState, useCallback, useEffect } from 'react';
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
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
import { useSSO } from '@clerk/expo';
import { Eye, EyeOff, Mail, Lock, Phone, Check } from 'lucide-react-native';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Logo } from '@/components/icons/Logo';
import { SocialButtons, type SocialProvider } from '@/components/auth/SocialButtons';
import { colors, typography, spacing, radius, shadows, ROUTES } from '@/lib/constants';
import { authBackgrounds } from '@/lib/images';
import { useHaptics } from '@/hooks/useHaptics';
import { useAuth } from '@/hooks/useAuth';
import { useAuthService } from '@/services/auth.service';
import { loginSchema, type LoginInput } from '@/lib/validation';
import { logger } from '@/lib/logger';
import { useAppMode } from '@/stores/app-mode';

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
      if (result.data?.requiresEmailVerification) {
        rememberEmail(data.email);
        notification('success');
        router.push({ pathname: ROUTES.OTP, params: { email: data.email } });
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
      router.replace('/(client)/home');
      setIsLoading(false);
    },
    [impact, notification, router, authService, rememberEmail]
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

      if (provider === 'google') {
        const result = await authService.signInWithGoogle();
        if (result.error) {
          setAuthError(result.error.message);
          notification('error');
        } else if (result.data?.user?.id) {
          notification('success');
          router.replace(mode === 'seller' ? '/(seller)/home' : '/(client)/home');
        } else {
          setAuthError('Connexion annulée.');
          notification('error');
        }
        setSocialLoading(null);
        return;
      }

      try {
        if (Platform.OS === 'android') {
          try {
            await WebBrowser.warmUpAsync();
          } catch {}
        }
        const redirectUrl = AuthSession.makeRedirectUri({
          scheme: 'rivaldevent',
          path: '/oauth-callback',
        });
        const { createdSessionId, setActive, signIn, signUp } = await startSSOFlow({
          strategy: 'oauth_apple',
          redirectUrl,
        });

        if (createdSessionId && setActive) {
          await setActive({ session: createdSessionId });
          notification('success');
          router.replace(mode === 'seller' ? '/(seller)/home' : '/(client)/home');
          return;
        }
        // Compte existant / transfert ou 2e facteur : la session se finalise
        // via /oauth-callback qui redirige des qu'isAuthenticated devient vrai.
        if (signIn?.status === 'complete' || signUp?.status === 'complete') {
          router.push('/oauth-callback');
          return;
        }
        setAuthError('Connexion annulée.');
        notification('error');
      } catch (err) {
        logger.debug('Social login error:', err);
        setAuthError('Connexion impossible avec ce fournisseur. Réessayez.');
        notification('error');
      } finally {
        try {
          if (Platform.OS === 'android') await WebBrowser.coolDownAsync();
        } catch {}
        setSocialLoading(null);
      }
    },
    [socialLoading, startSSOFlow, impact, notification, router, mode, authService]
  );

  return (
    <ImageBackground
      source={authBackgrounds.login}
      style={styles.bgScreen}
      imageStyle={styles.bgImage}
      blurRadius={8}
      accessibilityIgnoresInvertColors
    >
      {/* Voile dégradé pour la lisibilité */}
      <LinearGradient
        colors={['rgba(10,9,8,0.48)', 'rgba(10,9,8,0.78)']}
        style={styles.bgScrim}
        pointerEvents="none"
      />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
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
        {/* Halo doré discret en haut */}
        <View pointerEvents="none" style={styles.glowTop} />
        <View pointerEvents="none" style={styles.ringDeco} />

        {/* Logo — medaillon or centré */}
        <View style={styles.logoWrapper}>
          <Logo size="xlg" withBackground />
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
                iconLeft={<Mail color={colors.goldMuted} size={20} strokeWidth={1.5} />}
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
                {rememberMe && <Check color={colors.onyx} size={14} strokeWidth={3} />}
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

        {/* Bouton principal CTA — or champagne, pleine largeur */}
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

        {/* Boutons sociaux — cartes verre fumé */}
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
            <Phone color={colors.goldBright} size={20} strokeWidth={1.75} />
          </View>
          <Text style={styles.alternativeText} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.85}>
            Utiliser mon numéro de téléphone
          </Text>
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
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  bgScreen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  bgImage: {
    ...StyleSheet.absoluteFillObject,
  },
  bgScrim: {
    ...StyleSheet.absoluteFillObject,
  },
  container: {
    flex: 1,
    backgroundColor: 'transparent',
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
    marginBottom: spacing.lg,
    ...shadows.goldGlowSoft,
  },
  title: {
    ...typography.h1,
    color: colors.text,
    textAlign: 'center',
  },
  subtitle: {
    ...typography.body,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.xs,
    marginBottom: spacing.lg,
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
    flexShrink: 1,
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
  },
  checkboxChecked: {
    backgroundColor: colors.gold,
    borderColor: colors.gold,
  },
  checkboxLabel: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginLeft: spacing.sm,
    flexShrink: 1,
  },
  forgotPasswordText: {
    ...typography.bodySmallMedium,
    color: colors.goldBright,
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
    backgroundColor: colors.divider,
  },
  separatorText: {
    ...typography.overline,
    color: colors.goldMuted,
    marginHorizontal: spacing.md,
    letterSpacing: 2,
  },
  alternativeButton: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
    borderRadius: radius.lg,
    minHeight: 52,
    backgroundColor: 'rgba(30,26,22,0.88)',
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
    ...typography.bodySmallMedium,
    fontSize: 15,
    color: colors.textSecondary,
    letterSpacing: 0.2,
    paddingLeft: spacing.xxl,
    paddingRight: spacing.md,
  },
  signUpWrapper: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: spacing.lg,
  },
  signUpText: {
    ...typography.bodySmall,
    color: colors.textMuted,
  },
  signUpLinkWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  signUpLink: {
    ...typography.bodySmallSemiBold,
    color: colors.goldBright,
    textDecorationLine: 'underline',
    letterSpacing: 0.2,
  },
});