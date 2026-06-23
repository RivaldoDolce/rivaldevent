/**
 * Register - inscription email + password + metadonnees.
 *
 * Design :
 * - Fond sand
 * - Logo gold + titre "Créer un compte"
 * - Sous-titre "Rejoignez l'élégance de vos événements"
 * - Champs : full_name, email, phone, password, confirm_password
 * - Bouton "S'inscrire" terracotta
 * - Lien "Se connecter" en bas
 *
 * Form : React Hook Form + Zod (registerSchema)
 */

import { useState, useCallback } from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Logo } from '@/components/icons/Logo';
import { Header } from '@/components/ui/Header';
import { colors, typography, spacing } from '@/lib/constants';
import { useHaptics } from '@/hooks/useHaptics';
import { authService } from '@/services/auth.service';
import { registerSchema, type RegisterInput } from '@/lib/validation';

export default function RegisterScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { impact, notification } = useHaptics();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      full_name: '',
      email: '',
      phone: '',
      password: '',
      confirm_password: '',
    },
  });

  const onSubmit = useCallback(
    async (data: RegisterInput) => {
      setIsLoading(true);
      setAuthError(null);
      impact('light');

      const result = await authService.signUpWithEmail({
        email: data.email,
        password: data.password,
        phone: data.phone,
        full_name: data.full_name,
      });

      if (result.error) {
        setAuthError(result.error.message);
        notification('error');
      } else {
        notification('success');
        // Rediriger vers OTP pour verification email/phone
        router.push({
          pathname: '/(auth)/otp',
          params: { email: data.email, phone: data.phone },
        });
      }

      setIsLoading(false);
    },
    [impact, notification, router]
  );

  const goToLogin = useCallback(() => {
    impact('light');
    router.back();
  }, [impact, router]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Header title="Créer un compte" onBack={goToLogin} showBack />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={{ paddingBottom: insets.bottom + 120 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Logo + sous-titre */}
        <View style={styles.brandWrapper}>
          <Logo size="md" />
          <Text style={styles.subtitle}>Rejoignez l'élégance de vos événements</Text>
        </View>

        {authError && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>{authError}</Text>
          </View>
        )}

        {/* Formulaire */}
        <View style={styles.form}>
          <Controller
            control={control}
            name="full_name"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="Nom complet"
                placeholder="Ex: Amadou Rivald"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.full_name?.message}
                autoCapitalize="words"
              />
            )}
          />

          <Controller
            control={control}
            name="email"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="Email"
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
            name="phone"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="Numéro de téléphone"
                placeholder="Ex: 6XXXXXXXX"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.phone?.message}
                keyboardType="phone-pad"
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

          <Controller
            control={control}
            name="confirm_password"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="Confirmer le mot de passe"
                placeholder="••••••••"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.confirm_password?.message}
                secureTextEntry={!showConfirm}
                iconRight={
                  <Pressable onPress={() => setShowConfirm(!showConfirm)} hitSlop={12}>
                    <Text style={styles.eyeIcon}>{showConfirm ? '🙈' : '👁'}</Text>
                  </Pressable>
                }
              />
            )}
          />
        </View>
      </ScrollView>

      {/* Bouton flottant en bas */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.md }]}>
        <Button variant="primary" size="lg" fullWidth loading={isLoading} onPress={handleSubmit(onSubmit)}>
          S'inscrire
        </Button>

        <View style={styles.loginWrapper}>
          <Text style={styles.loginText}>Vous avez déjà un compte ? </Text>
          <Pressable onPress={goToLogin} hitSlop={12}>
            <Text style={styles.loginLink}>Se connecter</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.sand,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
  brandWrapper: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    gap: spacing.md,
  },
  subtitle: {
    ...typography.body,
    color: colors.stone,
    textAlign: 'center',
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
  },
  eyeIcon: {
    fontSize: 18,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.sand,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: `${colors.stone}20`,
    gap: spacing.md,
  },
  loginWrapper: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginText: {
    ...typography.body,
    color: colors.stone,
  },
  loginLink: {
    ...typography.body,
    color: colors.terracotta,
    fontWeight: '600',
  },
});