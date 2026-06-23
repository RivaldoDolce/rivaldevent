/**
 * Login - connexion email/password + alternatives.
 *
 * Design :
 * - Fond sand
 * - Logo gold centre en haut
 * - Titre "Bienvenue" + sous-titre "L'élégance de vos événements commence ici"
 * - Formulaire : email + password (avec icone oeil pour reveal)
 * - Lien "Mot de passe oublié ?" a droite
 * - Bouton "Se connecter" terracotta (pleine largeur)
 * - Separateur "OU"
 * - Boutons : Google (outline) + Telephone (outline)
 * - Lien "Inscrivez-vous" en bas
 *
 * Form : React Hook Form + Zod
 */

import { useState, useCallback } from 'react';
import { View, Text, Pressable, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Logo } from '@/components/icons/Logo';
import { colors, typography, spacing } from '@/lib/constants';
import { useHaptics } from '@/hooks/useHaptics';
import { authService } from '@/services/auth.service';
import { loginSchema, type LoginInput } from '@/lib/validation';
import { logger } from '@/lib/logger';

export default function LoginScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { impact, notification } = useHaptics();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
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
    // TODO: implementer OAuth Google
  }, [impact]);

  return (
    <View style={[styles.container, { paddingTop: insets.top + spacing.xl }]}>
      {/* Logo */}
      <View style={styles.logoWrapper}>
        <Logo size="md" />
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
              iconRight={
                <Pressable onPress={() => setShowPassword(!showPassword)} hitSlop={12}>
                  <Text style={styles.eyeIcon}>{showPassword ? '🙈' : '👁'}</Text>
                </Pressable>
              }
            />
          )}
        />

        <Pressable onPress={() => logger.debug('TODO: reset password')} hitSlop={12} style={styles.forgotPassword}>
          <Text style={styles.forgotPasswordText}>Mot de passe oublié ?</Text>
        </Pressable>
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
          <Text style={styles.alternativeText}>Se connecter avec Google</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.alternativeButton} onPress={goToPhoneLogin} activeOpacity={0.7}>
          <Text style={styles.alternativeText}>Utiliser mon numéro</Text>
        </TouchableOpacity>
      </View>

      {/* Lien inscription */}
      <View style={[styles.signUpWrapper, { paddingBottom: insets.bottom + spacing.lg }]}>
        <Text style={styles.signUpText}>Vous n'avez pas de compte ? </Text>
        <Pressable onPress={goToRegister} hitSlop={12}>
          <Text style={styles.signUpLink}>Inscrivez-vous</Text>
        </Pressable>
      </View>
    </View>
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
  forgotPassword: {
    alignSelf: 'flex-end',
    marginTop: -spacing.xs,
    marginBottom: spacing.lg,
  },
  forgotPasswordText: {
    ...typography.bodySmall,
    color: colors.terracotta,
    fontWeight: '500',
  },
  eyeIcon: {
    fontSize: 18,
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
    borderWidth: 1,
    borderColor: `${colors.stone}40`,
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    minHeight: 48,
    justifyContent: 'center',
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
    marginTop: 'auto',
    paddingTop: spacing.lg,
  },
  signUpText: {
    ...typography.body,
    color: colors.stone,
  },
  signUpLink: {
    ...typography.body,
    color: colors.terracotta,
    fontWeight: '600',
  },
});