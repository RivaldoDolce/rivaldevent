/**
 * Connexion par telephone (SMS OTP).
 *
 * Meilleure utilisation du numero de telephone : le SMS reste le canal
 * le plus fiable pour une verification d'identite au Cameroun (couverture
 * mobile quasi totale vs email parfois ignore). L'ecran collecte le numero
 * (+237) puis envoie le code, avant de basculer sur l'ecran OTP.
 *
 * Design :
 * - Fond sable, fleche retour en haut a gauche
 * - Titre Playfair + sous-titre
 * - Champ telephone avec badge pays "+237" dans le champ
 * - CTA terracotta pleine largeur
 * - Note d'information sous le formulaire
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
import { ChevronLeft, MessageSquareText } from 'lucide-react-native';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { colors, spacing, radius, ROUTES } from '@/lib/constants';
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
      <View style={[styles.topBar, { paddingTop: insets.top + spacing.sm }]}>
        <Pressable
          onPress={goBack}
          hitSlop={12}
          style={styles.backButton}
          accessibilityRole="button"
          accessibilityLabel="Retour"
        >
          <ChevronLeft size={22} color={colors.onyx} strokeWidth={2} />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing.xxl }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Illustration */}
        <View style={styles.iconCircle}>
          <MessageSquareText size={30} color={colors.terracotta} strokeWidth={1.8} />
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
    backgroundColor: colors.sand,
  },
  topBar: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
  },
  backButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: `${colors.gold}15`,
    borderWidth: 1,
    borderColor: `${colors.gold}40`,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: spacing.lg,
  },
  title: {
    fontFamily: 'PlayfairDisplay-Bold',
    fontSize: 28,
    lineHeight: 36,
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
  },
  errorBanner: {
    backgroundColor: `${colors.terracotta}15`,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  errorText: {
    fontFamily: 'Inter-Medium',
    fontSize: 13,
    lineHeight: 18,
    color: colors.terracotta,
    textAlign: 'center',
  },
  prefixBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: spacing.sm,
    borderRightWidth: 1,
    borderRightColor: `${colors.stone}30`,
    marginRight: spacing.xs,
    marginVertical: 6,
  },
  prefixText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 15,
    lineHeight: 20,
    color: colors.onyx,
    letterSpacing: 0.2,
  },
  note: {
    fontFamily: 'Inter-Regular',
    fontSize: 13,
    lineHeight: 20,
    color: colors.stone,
    textAlign: 'center',
    marginTop: spacing.lg,
    paddingHorizontal: spacing.sm,
  },
  noteLink: {
    fontFamily: 'Inter-SemiBold',
    color: colors.terracotta,
    textDecorationLine: 'underline',
  },
});
