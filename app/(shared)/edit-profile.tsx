/**
 * Modifier mon profil — edition du nom complet et du telephone.
 *
 * Ecran PARTAGE (hors groupes client/vendeur) afin que le retour
 * (router.back) ramene toujours a l'ecran d'origine avec son etat,
 * quel que soit le mode (acheteur ou organisateur).
 *
 * Design :
 * - Header partage (derivee foret) via components/profile/ScreenHeader
 * - Carte identite : avatar + nom courant
 * - Formulaire react-hook-form + zod (nom, telephone +237, email verrouille)
 * - Bouton enregistrer desactive si formulaire inchange ou invalide
 *
 * Donnees :
 * - Valeurs initiales depuis useAuth (profil Supabase)
 * - Enregistrement via authService.updateProfile + refreshProfile
 *
 * Conventions :
 * - Toutes les couleurs viennent de lib/constants.ts
 * - Pas de type any, pas d'emojis, imports @/
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
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { User, Mail, Lock, ShieldCheck } from 'lucide-react-native';

import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ScreenHeader } from '@/components/profile/ScreenHeader';
import { colors, typography, spacing, radius } from '@/lib/constants';
import { profileSchema, type ProfileInput } from '@/lib/validation';
import { useHaptics } from '@/hooks/useHaptics';
import { useAuth } from '@/hooks/useAuth';
import { authService } from '@/services/auth.service';

export default function EditProfileScreen() {
  const router = useRouter();
  const { user, profile, refreshProfile } = useAuth();
  const { impact, notification } = useHaptics();

  const [isLoading, setIsLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const displayName = profile?.full_name || user?.user_metadata?.full_name || '';
  const displayEmail = user?.email || '';

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isDirty, isValid },
  } = useForm<ProfileInput>({
    mode: 'onChange',
    reValidateMode: 'onChange',
    resolver: zodResolver(profileSchema),
    defaultValues: {
      full_name: profile?.full_name ?? '',
      phone: profile?.phone ?? '',
    },
  });

  // Synchronise le formulaire si le profil charge apres le premier rendu
  useEffect(() => {
    if (!profile) return;
    reset({
      full_name: profile.full_name ?? '',
      phone: profile.phone ?? '',
    });
  }, [profile, reset]);

  const onSubmit = useCallback(
    async (data: ProfileInput) => {
      if (!user?.id) return;

      setIsLoading(true);
      setAuthError(null);
      impact('light');

      const result = await authService.updateProfile(user.id, {
        full_name: data.full_name,
        phone: data.phone,
      });

      if (result.error) {
        setAuthError(result.error.message);
        notification('error');
      } else {
        await refreshProfile();
        notification('success');
        router.back();
      }

      setIsLoading(false);
    },
    [user, refreshProfile, notification, router, impact]
  );

  const completion = [
    profile?.full_name,
    profile?.phone,
    profile?.avatar_url,
  ].filter(Boolean).length;

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <ScrollView
        style={styles.screen}
        contentContainerStyle={{
          paddingBottom: 120,
        }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <ScreenHeader
          title="Modifier mon profil"
          subtitle="Gardez vos informations a jour"
        />

        {/* ============================================
            Carte identite
            ============================================ */}
        <View style={styles.identityCard}>
          <Avatar
            source={profile?.avatar_url ?? null}
            fallback={displayName || 'U'}
            size="xl"
            border="highlight"
          />
          <Text style={styles.identityName} numberOfLines={1}>
            {displayName || 'Utilisateur'}
          </Text>
          <View style={styles.completionRow}>
            <ShieldCheck size={13} color={colors.gold} strokeWidth={1.75} />
            <Text style={styles.completionText}>
              {completion}/3 informations renseignees
            </Text>
          </View>
        </View>

        {/* ============================================
            Formulaire
            ============================================ */}
        <View style={styles.formCard}>
          {authError ? (
            <View style={styles.errorBanner}>
              <Text style={styles.errorText}>{authError}</Text>
            </View>
          ) : null}

          <Controller
            control={control}
            name="full_name"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="Nom complet"
                placeholder="Votre nom et prenom"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.full_name?.message}
                isValid={!errors.full_name?.message && value.trim().length > 1}
                autoCapitalize="words"
                autoCorrect={false}
                maxLength={80}
                iconLeft={<User color={colors.stone} size={20} strokeWidth={1.5} />}
              />
            )}
          />

          <Controller
            control={control}
            name="phone"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="Telephone"
                placeholder="600000000"
                value={value}
                onChangeText={(text) => onChange(text.replace(/\D/g, ''))}
                onBlur={onBlur}
                error={errors.phone?.message}
                isValid={!errors.phone?.message && value.length === 9}
                keyboardType="phone-pad"
                autoCapitalize="none"
                maxLength={9}
                iconLeft={
                  <Text style={styles.phonePrefix}>+237</Text>
                }
                helperText="Numero camerounais (9 chiffres, ex: 6XXXXXXXX)"
              />
            )}
          />

          <Input
            label="Email"
            value={displayEmail}
            editable={false}
            onChangeText={() => {
              // Email non modifiable
            }}
            iconLeft={<Mail color={colors.stone} size={20} strokeWidth={1.5} />}
            iconRight={<Lock color={colors.stone} size={16} strokeWidth={1.5} />}
            helperText="Non modifiable — gere par votre compte"
          />

          <Button
            variant="primary"
            size="lg"
            fullWidth
            loading={isLoading}
            disabled={!isDirty || !isValid}
            onPress={handleSubmit(onSubmit)}
          >
            {isLoading ? 'Enregistrement...' : 'Enregistrer les modifications'}
          </Button>

          <Pressable
            onPress={() => {
              impact('light');
              router.back();
            }}
            style={styles.cancelButton}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Annuler"
          >
            <Text style={styles.cancelText}>Annuler</Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.sand,
  },
  identityCard: {
    marginTop: -spacing.md,
    marginHorizontal: spacing.lg,
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: `${colors.border}60`,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
    shadowColor: colors.onyx,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  identityName: {
    marginTop: spacing.sm,
    fontFamily: 'PlayfairDisplay-SemiBold',
    fontSize: 18,
    lineHeight: 24,
    color: colors.onyx,
    letterSpacing: -0.2,
    maxWidth: '88%',
  },
  completionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  completionText: {
    fontFamily: 'Inter-Medium',
    fontSize: 12,
    lineHeight: 16,
    color: colors.stone,
    marginLeft: spacing.xs,
  },
  formCard: {
    marginTop: spacing.lg,
    marginHorizontal: spacing.lg,
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: `${colors.border}60`,
    padding: spacing.lg,
    gap: 2,
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
  phonePrefix: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    lineHeight: 22,
    color: colors.onyx,
    marginRight: spacing.xs,
  },
  cancelButton: {
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  cancelText: {
    fontFamily: 'Inter-Medium',
    fontSize: 15,
    lineHeight: 21,
    color: colors.stone,
  },
});