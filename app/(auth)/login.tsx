/**
 * Login - connexion email/password + alternatives.
 *
 * Design :
 * - Fond sand
 * - Logo utilisateur en haut
 * - Titre "Bienvenue" + sous-titre
 * - Formulaire : email + password (icone oeil pour reveal)
 * - Ligne : "Se souvenir de moi" + "Mot de passe oublie"
 * - Bouton "Se connecter" terracotta
 * - Separateur "OU"
 * - Boutons : Google (outline) + Telephone (outline)
 * - Lien "Inscrivez-vous" en bas
 */

import { useState, useCallback } from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Image } from 'expo-image';
import { Eye, EyeOff, Mail, Lock, Phone, ArrowRight, Check } from 'lucide-react-native';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { GoogleLogo } from '@/components/icons/GoogleLogo';
import { colors, typography, spacing } from '@/lib/constants';
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
    <ScrollView
      style={[styles.container, { paddingTop: insets.top + spacing.xl }]}
      contentContainerStyle={{ paddingBottom: insets.bottom + spacing.xl }}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      {/* Logo */}
      <View style={styles.logoWrapper}>
        <Image source={LOGO_SOURCE} style={styles.logo} contentFit="contain" transition={300} />
      </View>

      {/* Titre */}
      <Text style={styles.title}>Bienvenue</Text>
      <Text style={styles.subtitle}>L'élégance de vos événements commence ici.</Text>

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
              label="Email ou nom d'utilisateur"
              placeholder="Ex: amadou.rivald@email.com"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={errors.email?.message}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              iconLeft={<Mail color={colors.stone} size={20} />}
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
              iconLeft={<Lock color={colors.stone} size={20} />}
              iconRight={
                <Pressable onPress={() => setShowPassword(!showPassword)} hitSlop={12}>
                  {showPassword ? (
                    <EyeOff color={colors.stone} size={20} />
                  ) : (
                    <Eye color={colors.stone} size={20} />
                  )}
                </Pressable>
              }
            />
          )}
        />

        {/* Se souvenir de moi + Mot de passe oublie */}
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

      {/* Bouton principal */}
      <Button variant="primary" size="lg" fullWidth loading={isLoading} onPress={handleSubmit(onSubmit)}>
        Se connecter
      </Button>

      {/* Separateur */}
      <View style={styles.separator}>
        <View style={styles.separatorLine} />
        <Text style={styles.separatorText}>OU</Text>
        <View style={styles.separatorLine} />
      </View>

      {/* Boutons alternatifs */}
      <View style={styles.alternatives}>
        <TouchableOpacity style={styles.alternativeButton} onPress={handleGoogleLogin} activeOpacity={0.7}>
          <GoogleLogo size="md" />
          <Text style={styles.alternativeText}>Se connecter avec Google</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.alternativeButton} onPress={goToPhoneLogin} activeOpacity={0.7}>
          <Phone color={colors.onyx} size={20} />
          <Text style={styles.alternativeText}>Utiliser mon numéro</Text>
        </TouchableOpacity>
      </View>

      {/* Lien inscription */}
      <View style={styles.signUpWrapper}>
        <Text style={styles.signUpText}>Vous n'avez pas de compte ? </Text>
        <Pressable onPress={goToRegister} hitSlop={12} style={styles.signUpLinkWrapper}>
          <Text style={styles.signUpLink}>Inscrivez-vous</Text>
          <ArrowRight color={colors.terracotta} size={14} style={styles.signUpArrow} />
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.sand,
    paddingHorizontal: spacing.lg,
  },
  logoWrapper: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  logo: {
    width: 80,
    height: 80,
  },
  title: {
    ...typography.h1,
    color: colors.onyx,
    textAlign: 'center',
    fontWeight: '700',
  },
  subtitle: {
    ...typography.body,
    color: colors.onyx,
    opacity: 0.7,
    textAlign: 'center',
    marginTop: spacing.xs,
    marginBottom: spacing.xl,
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
  form: {
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  optionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: -spacing.xs,
  },
  checkboxWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: colors.stone,
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
    gap: spacing.md,
  },
  separatorLine: {
    flex: 1,
    height: 1,
    backgroundColor: `${colors.stone}30`,
  },
  separatorText: {
    ...typography.caption,
    color: colors.stone,
    fontWeight: '600',
  },
  alternatives: {
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  alternativeButton: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: `${colors.stone}40`,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    minHeight: 48,
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
    paddingTop: spacing.lg,
  },
  signUpText: {
    ...typography.body,
    color: colors.stone,
  },
  signUpLinkWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  signUpLink: {
    ...typography.body,
    color: colors.terracotta,
    fontWeight: '600',
  },
  signUpArrow: {
    marginLeft: spacing.xs,
    marginTop: 2,
  },
});