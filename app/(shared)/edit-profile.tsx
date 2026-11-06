import { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as ImagePicker from 'expo-image-picker';
import { User, Mail, Lock, ShieldCheck, Camera } from 'lucide-react-native';

import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ScreenHeader } from '@/components/profile/ScreenHeader';
import { ScreenBackground } from '@/components/ui/ScreenBackground';
import { colors, typography, spacing, radius, ROUTES } from '@/lib/constants';
import { clientBackgrounds } from '@/lib/images';
import { profileSchema, type ProfileInput } from '@/lib/validation';
import { useHaptics } from '@/hooks/useHaptics';
import { useAuth } from '@/hooks/useAuth';
import { useAvatarUrl } from '@/hooks/useAvatarUrl';
import { useAvatarStore } from '@/stores/avatar-store';
import { useAuthService } from '@/services/auth.service';

export default function EditProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, profile, refreshProfile } = useAuth();
  const authService = useAuthService();
  const { impact, notification } = useHaptics();
  const setAvatar = useAvatarStore((state: { setAvatar: (id: string, uri: string) => void }) => state.setAvatar);

  const [isLoading, setIsLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [pickedAvatar, setPickedAvatar] = useState<string | null>(null);

  const displayName = profile?.full_name || user?.user_metadata?.full_name || '';
  const displayEmail = user?.email || '';
  const avatarUrl = useAvatarUrl(user?.id, profile?.avatar_url);

  // Indique si l'avatar a été modifié localement
  const isAvatarDirty = pickedAvatar !== null;

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

  // Retour robuste : back si possible sinon replace vers le profil
  const goBackOrReplace = useCallback(() => {
    if (router.canGoBack()) router.back();
    else router.replace(ROUTES.PROFILE);
  }, [router]);

  const pickAvatar = useCallback(async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Autorisation requise', 'Accedez a vos photos pour changer votre photo de profil.');
      return;
    }
    impact('light');
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (result.canceled) return;
    const uri = result.assets[0]?.uri;
    if (uri) setPickedAvatar(uri);
  }, [impact]);

  const onSubmit = useCallback(
    async (data: ProfileInput) => {
      if (!user?.id) return false;

      setIsLoading(true);
      setAuthError(null);
      impact('light');

      try {
        const result = await authService.updateProfile(user.id, {
          full_name: data.full_name,
          phone: data.phone,
        });

        if (result.error) {
          setAuthError(result.error.message);
          notification('error');
          return false;
        }

        // Photo : stockage local immediat, puis upload serveur
        if (pickedAvatar) {
          setAvatar(user.id, pickedAvatar);
          await authService.uploadAvatar(user.id, pickedAvatar);
        }

        // Toujours rafraichir le profil apres succes, meme sans avatar
        await refreshProfile();

        notification('success');
        goBackOrReplace();
        return true;
      } finally {
        // Garantit le reset du loader meme en cas de succes
        setIsLoading(false);
      }
    },
    [user, pickedAvatar, setAvatar, refreshProfile, notification, goBackOrReplace, impact, authService]
  );

  const completion = [
    profile?.full_name,
    profile?.phone,
    pickedAvatar ?? avatarUrl,
  ].filter(Boolean).length;

  return (
    <ScreenBackground>
      <KeyboardAvoidingView
        style={styles.screen}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        {/* Header hors ScrollView pour eviter le scroll du header */}
        <ScreenHeader
          title="Modifier mon profil"
          subtitle="Gardez vos informations a jour"
          background={clientBackgrounds.fallback}
        />
        <ScrollView
          style={styles.screen}
          contentContainerStyle={{
            paddingBottom: 120 + insets.bottom,
          }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
        {/* ============================================
            Carte identite
            ============================================ */}
        <View style={styles.identityCard}>
          <Pressable
            onPress={pickAvatar}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Changer la photo de profil"
            style={styles.avatarWrapper}
          >
            <Avatar
              source={pickedAvatar ?? avatarUrl}
              fallback={displayName || 'U'}
              size="xl"
              border="highlight"
            />
            <View style={styles.cameraBadge}>
              <Camera color={colors.goldBright} size={14} strokeWidth={2} />
            </View>
          </Pressable>
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
            disabled={(!isDirty && !isAvatarDirty) || !isValid}
            onPress={handleSubmit(onSubmit)}
          >
            {isLoading ? 'Enregistrement...' : 'Enregistrer les modifications'}
          </Button>

          <Button
            variant="ghost"
            size="md"
            fullWidth
            onPress={() => {
              impact('light');
              goBackOrReplace();
            }}
          >
            Annuler
          </Button>
        </View>
      </ScrollView>
      </KeyboardAvoidingView>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  identityCard: {
    marginTop: spacing.md,
    marginHorizontal: spacing.lg,
    alignItems: 'center',
    backgroundColor: colors.elevated,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: `${colors.gold}1F`,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
    shadowColor: colors.onyx,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 8,
  },
  avatarWrapper: {
    position: 'relative',
  },
  cameraBadge: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.glass,
    borderWidth: 1.5,
    borderColor: `${colors.gold}40`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  identityName: {
    marginTop: spacing.sm,
    fontFamily: 'PlayfairDisplay_600SemiBold',
    fontSize: 18,
    lineHeight: 24,
    color: colors.text,
    letterSpacing: -0.2,
    maxWidth: '88%',
  },
  completionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  completionText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 12,
    lineHeight: 16,
    color: colors.textSecondary,
    marginLeft: spacing.xs,
  },
  formCard: {
    marginTop: spacing.lg,
    marginHorizontal: spacing.lg,
    backgroundColor: colors.elevated,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: `${colors.gold}1F`,
    padding: spacing.lg,
    gap: 2,
    shadowColor: colors.onyx,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 8,
  },
  errorBanner: {
    backgroundColor: 'rgba(255,107,94,0.10)',
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255,107,94,0.30)',
  },
  errorText: {
    ...typography.bodySmall,
    color: colors.danger,
    textAlign: 'center',
  },
  phonePrefix: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
    lineHeight: 22,
    color: colors.goldBright,
    marginRight: spacing.xs,
  },
});
