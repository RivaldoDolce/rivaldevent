/**
 * Connexion par telephone (SMS OTP).
 *
 * Design « Noir & Or » :
 * - Fond noir profond + halo doré discret en haut
 * - Bouton retour pastille verre + chevron or
 * - Logo medaillon or centré, titre Playfair, sous-titre textMuted
 * - Champ telephone avec badge pays "+237", CTA or champagne pleine largeur
 * - Notes d'information en texte tamisé
 *
 * Logique (inchangée) : envoi du code via signInWithPhone puis bascule OTP.
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
import { ChevronLeft } from 'lucide-react-native';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Logo } from '@/components/icons/Logo';
import { colors, radius, spacing, typography, shadows, ROUTES } from '@/lib/constants';
import { useHaptics } from '@/hooks/useHaptics';
import { useAuthService } from '@/services/auth.service';
import { phoneLoginSchema, type PhoneLoginInput } from '@/lib/validation';

export default function PhoneLoginScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { impact, notification } = useHaptics();
  const authService = useAuthService();

  const [isLoading, setIsLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<PhoneLoginInput>({
    mode: 'onChange',
    reValidateMode: 'onChange',
    resolver: zodResolver(phoneLoginSchema),
    defaultValues: { phone: '' },
  });

  const goBack = useCallback(() => {
    impact('light');
    router.back();
  }, [impact, router]);

  const onSubmit = useCallback(
    async (data: PhoneLoginInput) => {
      setIsLoading(true);
      setAuthError(null);
      impact('light');

      const result = await authService.signInWithPhone(data.phone);

      if (result.error) {
        setAuthError(result.error.message);
        notification('error');
        setIsLoading(false);
        return;
      }

      notification('success');
      router.push({
        pathname: ROUTES.OTP,
        params: { phone: data.phone },
      });
      setIsLoading(false);
    },
    [impact, notification, router, authService]
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
    >
      {/* Halo doré discret en haut */}
      <View pointerEvents="none" style={styles.glowTop} />
      <View pointerEvents="none" style={styles.ringDeco} />

      <View style={[styles.topBar, { paddingTop: insets.top + spacing.sm }]}>
        <Pressable
          onPress={goBack}
          hitSlop={12}
          style={styles.backButton}
          accessibilityRole="button"
          accessibilityLabel="Retour"
        >
          <ChevronLeft size={22} color={colors.goldBright} strokeWidth={1.75} />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing.xxl }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Logo — medaillon or centré */}
        <View style={styles.logoWrapper}>
          <Logo size="md" withBackground />
        </View>

        <Text style={styles.title}>Connexion par téléphone</Text>
        <Text style={styles.subtitle}>
          Saisissez votre numéro pour recevoir un code de vérification par SMS.
        </Text>

        {authError && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>{authError}</Text>
          </View>
        )}

        <Controller
          control={control}
          name="phone"
          render={({ field: { onChange, onBlur, value } }) => (
            <Input
              label="Numéro de téléphone"
              placeholder="6XX XX XX XX"
              value={value}
              onChangeText={(text) => onChange(text.replace(/[^0-9]/g, '').slice(0, 9))}
              onBlur={onBlur}
              error={errors.phone?.message}
              isValid={!errors.phone?.message && value.length === 9}
              keyboardType="phone-pad"
              maxLength={9}
              iconLeft={
                <View style={styles.prefixBadge}>
                  <Text style={styles.prefixText}>+237</Text>
                </View>
              }
            />
          )}
        />

        <Button
          variant="primary"
          size="lg"
          fullWidth
          loading={isLoading}
          onPress={handleSubmit(onSubmit)}
        >
          Recevoir le code
        </Button>

        <Text style={styles.note}>
          Un SMS contenant votre code de vérification sera envoyé à votre numéro.
          Des frais de SMS peuvent s'appliquer selon votre opérateur (MTN, Orange, Moov).
        </Text>

        <Text style={styles.note}>
          Vous n'avez pas de compte ?{' '}
          <Text style={styles.noteLink} onPress={() => router.push(ROUTES.REGISTER)}>
            Créez-en un gratuitement.
          </Text>
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    overflow: 'hidden',
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
  topBar: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: radius.full,
    backgroundColor: colors.glass,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  logoWrapper: {
    alignItems: 'center',
    marginBottom: spacing.xl,
    ...shadows.goldGlowSoft,
  },
  title: {
    ...typography.h2,
    color: colors.text,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  subtitle: {
    ...typography.body,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.xs,
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
    ...typography.bodySmallMedium,
    color: colors.danger,
    textAlign: 'center',
  },
  prefixBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: spacing.sm,
    borderRightWidth: 1,
    borderRightColor: colors.divider,
    marginRight: spacing.xs,
    marginVertical: 6,
  },
  prefixText: {
    ...typography.bodySmallSemiBold,
    fontSize: 15,
    color: colors.goldBright,
    letterSpacing: 0.2,
  },
  note: {
    ...typography.bodySmall,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.lg,
    paddingHorizontal: spacing.sm,
    lineHeight: 21,
  },
  noteLink: {
    ...typography.bodySmallSemiBold,
    color: colors.goldBright,
    textDecorationLine: 'underline',
  },
});