/**
 * Login - connexion email/password + alternatives.
 *
 * Design :
 * - Fond sand avec logo centré en haut
 * - Titre "Bienvenue" serif bold + sous-titre stone
 * - Formulaire : email + password (icone oeil pour reveal)
 * - Ligne : "Se souvenir de moi" + "Mot de passe oublié"
 * - Bouton "Se connecter" terracotta (CTA unique)
 * - Séparateur "OU"
 * - Boutons : Google (outline) + Téléphone (outline)
 * - Lien "Inscrivez-vous" en bas
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
import { Image } from 'expo-image';
import { Eye, EyeOff, Mail, Lock, Phone, Check } from 'lucide-react-native';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { GoogleLogo } from '@/components/icons/GoogleLogo';
import { colors, typography, spacing, radius } from '@/lib/constants';
import { useHaptics } from '@/hooks/useHaptics';
import { authService } from '@/services/auth.service';
import { loginSchema, type LoginInput } from '@/lib/validation';
import { logger } from '@/lib/logger';

const LOGO_SOURCE = require('@/assets/images/logo.png');

export default function LoginScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { impact, notification } = useHaptics();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    mode: 'onChange',
    reValidateMode: 'onChange',
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = useCallback(
    async (data: LoginInput) => {
      setIsLoading(true);
      setAuthError(null);
      impact('light');

      const result = await authService.signInWithEmail(data.email, data.password);

      if (result.error) {
        setAuthError(result.error.message);
        notification('error');
      } else {
        notification('success');
        router.replace('/(client)/home');
      }

      setIsLoading(false);
    },
    [impact, notification, router]
  );

  const goToRegister = useCallback(() => {
    impact('light');
    router.push('/(auth)/register');
  }, [impact, router]);

  const goToPhoneLogin = useCallback(() => {
    impact('light');
    router.push('/(auth)/otp');
  }, [impact, router]);

  const handleGoogleLogin = useCallback(() => {
    impact('light');
    logger.debug('Google login (TODO: implement OAuth)');
  }, [impact]);

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.sand }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <ScrollView
        style={styles.container}
        contentContainerStyle={[styles.content, { flexGrow: 1, paddingTop: insets.top + spacing.lg, paddingBottom: insets.bottom + spacing['2xl'] }]}
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
                label="Email ou Nom d'utilisateur"
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
            >
              <View style={[styles.checkbox, rememberMe && styles.checkboxChecked]}>
                {rememberMe && <Check color={colors.sand} size={14} strokeWidth={3} />}
              </View>
              <Text style={styles.checkboxLabel}>Se souvenir de moi</Text>
            </Pressable>

            <Pressable onPress={() => logger.debug('TODO: reset password')} hitSlop={8}>
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

        {/* Boutons alternatifs — outline */}
        <View style={styles.alternatives}>
          <Pressable
            style={styles.alternativeButton}
            onPress={handleGoogleLogin}
          >
            <GoogleLogo size="md" />
            <Text style={styles.alternativeText}>Se connecter avec Google</Text>
          </Pressable>

          <Pressable
            style={styles.alternativeButton}
            onPress={goToPhoneLogin}
          >
            <Phone color={colors.onyx} size={20} strokeWidth={1.5} />
            <Text style={styles.alternativeText}>Utiliser mon numéro</Text>
          </Pressable>
        </View>

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
    ...typography.h1,
    color: colors.onyx,
    textAlign: 'center',
  },
  subtitle: {
    ...typography.body,
    color: colors.stone,
    textAlign: 'center',
    marginTop: spacing.xs,
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
    ...typography.bodySmall,
    color: colors.onyx,
  },
  forgotPasswordText: {
    ...typography.bodySmall,
    color: colors.terracotta,
    fontWeight: '500',
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
  alternatives: {
    marginBottom: spacing.lg,
  },
  alternativeButton: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: `${colors.stone}30`,
    borderRadius: radius.lg,
    paddingVertical: 14,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
    backgroundColor: colors.sand,
    marginBottom: spacing.sm,
  },
  alternativeText: {
    ...typography.body,
    color: colors.onyx,
    fontWeight: '500',
  },
  signUpWrapper: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: spacing.sm,
  },
  signUpText: {
    ...typography.bodySmall,
    color: colors.stone,
  },
  signUpLinkWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  signUpLink: {
    ...typography.bodySmall,
    color: colors.terracotta,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
});